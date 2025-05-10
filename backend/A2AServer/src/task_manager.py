import json
import os
from typing import AsyncIterable
from common.A2Atypes import (
    SendTaskRequest,
    TaskSendParams,
    Message,
    TaskStatus,
    Artifact,
    TaskStatusUpdateEvent,
    TaskArtifactUpdateEvent,
    TextPart,
    TaskState,
    Task,
    SendTaskResponse,
    InternalError,
    JSONRPCResponse,
    SendTaskStreamingRequest,
    SendTaskStreamingResponse,
    TaskArtifactUpdateEvent,
    TaskStatusUpdateEvent
)
from common.server.task_manager import InMemoryTaskManager
from agent import BasicAgent
import common.server.utils as utils
import asyncio
import logging
import traceback

logger = logging.getLogger(__name__)

def decode_tool_calls_to_string(raw_str: str) -> str:
    # 去掉前缀
    if raw_str.startswith("Tool:CALL:"):
        raw_str = raw_str[len("Tool:CALL:"):]

    # 解析 JSON
    tool_calls = json.loads(raw_str)

    # 解码每个 tool_call 的 arguments
    for call in tool_calls:
        args_str = call.get("function", {}).get("arguments", "")
        try:
            call["function"]["arguments"] = json.loads(args_str)
        except json.JSONDecodeError:
            pass  # 如果解析失败就跳过

    # 返回格式化的 JSON 字符串（ensure_ascii=False 让中文显示正常）
    return json.dumps(tool_calls, ensure_ascii=False, indent=2)
def decode_sequential_tool_calls_to_string(raw_str: str) -> str:
    # 去掉前缀
    if raw_str.startswith("Tool:CALL:"):
        raw_str = raw_str[len("Tool:CALL:"):]

    # 解析 JSON
    tool_calls = json.loads(raw_str)
    thought = ""
    # 解码每个 tool_call 的 arguments
    for call in tool_calls:
        args_str = call.get("function", {}).get("arguments", "")
        try:
            tool_name = call["function"]["name"]
            if tool_name == os.environ.get("SEQUETINAL_TOOL_NAME"):
                arguments = json.loads(args_str)
                thought = arguments.get("thought", "")
        except json.JSONDecodeError:
            pass  # 如果解析失败就跳过

    # 返回格式化的 JSON 字符串（ensure_ascii=False 让中文显示正常）
    return thought

def decode_tool_call_result_to_string(raw_str: str) -> str:
    # 去掉前缀
    if raw_str.startswith("Tool:RESULT:"):
        raw_str = raw_str[len("Tool:RESULT:"):]
    load_json = json.loads(raw_str)
    # tool执行的结果
    content = load_json.get("content", "")
    if content:
        content_data = json.loads(content)
        print("content_data:", content_data)
        nest_contents = content_data["content"]
        for content_item in nest_contents:
            if "text" in content_item:
                content_json_text = content_item["text"]
                try:
                    # 函数的返回的结果有可能是数组或者字符串，如果是数组，那么尝试加载它
                    content_text = json.loads(content_json_text)
                except Exception as e:
                    # 说明工具运行的结果不是数组，不需要处理了，直接使用
                    content_text = content_json_text
                content_data["content"] = content_text
    load_json["content"] = content_data
    # 变成中文的返回
    json_data = json.dumps(load_json, ensure_ascii=False, indent=2)
    return json_data

class AgentTaskManager(InMemoryTaskManager):
    """Task manager for AG2 MCP agent."""
    
    def __init__(self, agent: BasicAgent):
        super().__init__()
        self.agent = agent

    async def on_send_task(self, request: SendTaskRequest) -> SendTaskResponse:
        """
        Handle synchronous task requests.
        
        This method processes one-time task requests and returns a complete response.
        Unlike streaming tasks, this waits for the full agent response before returning.
        """
        validation_error = self._validate_request(request)
        if validation_error:
            return SendTaskResponse(id=request.id, error=validation_error.error)
        
        await self.upsert_task(request.params)
        # Update task store to WORKING state (return value not used)
        await self.update_store(
            request.params.id, TaskStatus(state=TaskState.WORKING), None
        )

        task_send_params: TaskSendParams = request.params
        query = self._get_user_query(task_send_params)
        
        try:
            agent_response = self.agent.invoke(query, task_send_params.sessionId)
            return await self._handle_send_task(request, agent_response)
        except Exception as e:
            logger.error(f"Error invoking agent: {e}")
            return SendTaskResponse(
                id=request.id, 
                error=InternalError(message=f"Error during on_send_task: {str(e)}")
            )

    async def on_send_task_subscribe(
        self, request: SendTaskStreamingRequest
    ) -> AsyncIterable[SendTaskStreamingResponse] | JSONRPCResponse:
        """
        Handle streaming task requests with SSE subscription.
        处理流式任务请求， 用户请求先到这里
        This method initiates a streaming task and returns incremental updates
        to the client as they become available. It uses Server-Sent Events (SSE)
        to push updates to the client as the agent generates them.
        """
        error = self._validate_request(request)
        if error:
            return error
        await self.upsert_task(request.params)
        return self._stream_generator(request)

    # -------------------------------------------------------------
    # Agent response handlers
    # -------------------------------------------------------------

    async def _handle_send_task(
        self, request: SendTaskRequest, agent_response: dict
    ) -> SendTaskResponse:
        """
        Handle the 'tasks/send' JSON-RPC method by processing agent response.
        
        This method processes the synchronous (one-time) response from the agent,
        transforms it into the appropriate task status and artifacts, and 
        returns a complete SendTaskResponse.
        """
        task_send_params: TaskSendParams = request.params
        task_id = task_send_params.id
        history_length = task_send_params.historyLength
        task_status = None

        parts = [TextPart(type="text", text=agent_response["content"])]
        artifact = None
        if agent_response["require_user_input"]:
            task_status = TaskStatus(
                state=TaskState.INPUT_REQUIRED,
                message=Message(role="agent", parts=parts),
            )
        else:
            task_status = TaskStatus(state=TaskState.COMPLETED)
            artifact = Artifact(parts=parts)
        # Update task store and get result for response
        updated_task = await self.update_store(
            task_id, task_status, None if artifact is None else [artifact]
        )
        # Use the updated task to create a response with correct history
        task_result = self.append_task_history(updated_task, history_length)
        return SendTaskResponse(id=request.id, result=task_result)

    async def _stream_generator(
        self, request: SendTaskStreamingRequest
    ) -> AsyncIterable[SendTaskStreamingResponse] | JSONRPCResponse:
        """
        Handle the 'tasks/sendSubscribe' JSON-RPC method for streaming responses.
        """
        task_send_params: TaskSendParams = request.params
        query = self._get_user_query(task_send_params)
        print(f"发送过来的请求是 {query}, 参数是 {task_send_params}")
        try:
          async for item in self.agent.stream(query, task_send_params.sessionId):
            print("返回的item: ", item)
            if item.get("is_tool"):
                # 带工具返回
                if os.environ.get("ONLY_SEQUENTIAL_THINKING") == "true":
                    if ':CALL:' in item["content"]:
                        content = decode_sequential_tool_calls_to_string(item["content"])
                        print(f"Sequential thinking CALL的执行参数: {content}")
                        parts = [{"type": "text", "text": content}]
                        message = Message(role="agent", parts=parts)
                        task_status = TaskStatus(state=task_state, message=message)
                    else:
                        # 其它的情况，返回空的即可
                        task_status = TaskStatus(
                            state=TaskState.WORKING,
                        )
                else:
                    if ':CALL:' in item["content"]:
                        content = decode_tool_calls_to_string(item["content"])
                        print(f"CALL的工具的解析结果: {content}")
                    elif ':RESULT:' in item["content"]:
                        content = decode_tool_call_result_to_string(item["content"])
                        print(f"RESULT的工具的解析结果: {content}")
                    else:
                        content = item["content"]
                        print(f"正常的回答的解析结果: {content}")
                    parts = [{"type": "text", "text": content}]
                    message = Message(role="agent", parts=parts)
                    task_status = TaskStatus(state=task_state, message=message)
            else:
                # 不带工具返回
                task_status = TaskStatus(
                      state=TaskState.WORKING,
                  )
            task_update_event = TaskStatusUpdateEvent(
                id=task_send_params.id,
                status=task_status,
                final=False,
            )
            print("发送的item的更新消息是: ", task_update_event)
            yield SendTaskStreamingResponse(id=request.id, result=task_update_event)
            is_task_complete = item["is_task_complete"]
            artifacts = None
            if not is_task_complete:
              task_state = TaskState.WORKING
              parts = [{"type": "text", "text": item.get("updates","Processing")}]
            else:
              if isinstance(item["content"], dict):
                if ("response" in item["content"]
                    and "result" in item["content"]["response"]):
                  data = json.loads(item["content"]["response"]["result"])
                  task_state = TaskState.INPUT_REQUIRED
                else:
                  data = item["content"]
                  task_state = TaskState.COMPLETED
                parts = [{"type": "data", "data": data}]
              else:
                task_state = TaskState.COMPLETED
                parts = [{"type": "text", "text": item["content"]}]
              artifacts = [Artifact(parts=parts, index=0, append=False)]
          message = Message(role="agent", parts=parts)
          task_status = TaskStatus(state=task_state, message=message)
          await self.update_store(task_send_params.id, task_status, artifacts)
          task_update_event = TaskStatusUpdateEvent(
                id=task_send_params.id,
                status=task_status,
                final=False,
            )
          yield SendTaskStreamingResponse(id=request.id, result=task_update_event)
          # Now yield Artifacts too
          if artifacts:
            for artifact in artifacts:
              print(f"发送的artifact是: ", artifact)
              yield SendTaskStreamingResponse(
                  id=request.id,
                  result=TaskArtifactUpdateEvent(
                      id=task_send_params.id,
                      artifact=artifact,
                  )
              )
          if is_task_complete:
            print(f"发送的任务完成消息")
            yield SendTaskStreamingResponse(
              id=request.id,
              result=TaskStatusUpdateEvent(
                  id=task_send_params.id,
                  status=TaskStatus(
                      state=task_status.state,
                  ),
                  final=True
              )
            )
        except Exception as e:
            logger.error(f"An error occurred while streaming the response: {e}")
            yield JSONRPCResponse(
                id=request.id,
                error=InternalError(
                    message="An error occurred while streaming the response"
                ),
            )

    def _validate_request(
        self, request: SendTaskRequest | SendTaskStreamingRequest
    ) -> JSONRPCResponse | None:
        """
        Validate task request parameters for compatibility with agent capabilities.
        
        Ensures that the client's requested output modalities are compatible with
        what the agent can provide.
        
        Returns:
            JSONRPCResponse with an error if validation fails, None otherwise.
        """
        task_send_params: TaskSendParams = request.params
        if not utils.are_modalities_compatible(
            task_send_params.acceptedOutputModes, BasicAgent.SUPPORTED_CONTENT_TYPES
        ):
            logger.warning(
                "Unsupported output mode. Received %s, Support %s",
                task_send_params.acceptedOutputModes,
                BasicAgent.SUPPORTED_CONTENT_TYPES,
            )
            return utils.new_incompatible_types_error(request.id)
        return None
        
    def _get_user_query(self, task_send_params: TaskSendParams) -> str:
        """
        Extract the user's text query from the task parameters.
        
        Extracts and returns the text content from the first part of the user's message.
        Currently only supports text parts.
        
        Args:
            task_send_params: The parameters of the task containing the user's message.
            
        Returns:
            str: The extracted text query.
            
        Raises:
            ValueError: If the message part is not a TextPart.
        """
        part = task_send_params.message.parts[0]
        if not isinstance(part, TextPart):
            raise ValueError("Only text parts are supported")
        return part.text