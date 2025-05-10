import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendTaskStreaming, sendTaskNonStreaming, getTaskResult } from '../services/a2aApiService';
import { dictToBase64 } from '../utils/encoding';

// 默认会话数据结构
const DEFAULT_SESSION_DATA = {
  knowledge_base_id: [193],
  file_id: ['326', '325'],
  business_source: "知识库管理",
  qa_type: "公域和私域结合",
  history: [],
  is_extend_questions: false,
  is_source_documents: true,
  is_deepseek: false,
};

function ChatInterface({ agentCard }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]); // 聊天消息列表
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const currentStreamingMessageIdRef = useRef(null);
  const abortStreamingRef = useRef(null);
  const [sessionId, setSessionId] = useState('');

  // 当组件挂载或 agentCard 更换时，生成新的 sessionId
  useEffect(() => {
    const base64SessionData = dictToBase64(DEFAULT_SESSION_DATA);
    setSessionId(base64SessionData);
    setMessages([]); // 切换 agent 时清空历史消息
  }, [agentCard]);

  // 发送消息处理逻辑
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || !agentCard || !sessionId) return;

    const userMessage = { id: uuidv4(), type: 'user', text: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsSending(true);
    setError(null);

    const taskId = uuidv4();
    const agentEndpointUrl = agentCard.agentEndpointUrl;

    const payload = {
      id: taskId,
      sessionId,
      acceptedOutputModes: ["text"],
      message: {
        role: "user",
        parts: [{ type: "text", text: prompt }],
      },
    };

    if (agentCard.capabilities.streaming) {
      // 流式响应
      const agentStreamingMessage = { id: uuidv4(), type: 'agent', text: '', isStreaming: true };
      currentStreamingMessageIdRef.current = agentStreamingMessage.id;
      setMessages(prev => [...prev, agentStreamingMessage]);

      abortStreamingRef.current = sendTaskStreaming(
        agentEndpointUrl,
        payload,
        (streamEvent) => {
          console.log("接收到流事件：", streamEvent);
          if (streamEvent.result?.status?.message) {
            streamEvent.result.status.message.parts.forEach(part => {
              if (part.type === "text" && part.text) {
                setMessages(prev => prev.map(msg => (
                  { ...msg, text: msg.text + part.text }
                )));
              }
            });
          }

          if (streamEvent.result?.final) {
            setMessages(prev => prev.map(msg => (
              { ...msg, isStreaming: false }
            )));
            setIsSending(false);
          }
        },
        (streamError) => {
          console.error("流式传输错误：", streamError);
          setError(`流式传输错误：${streamError.message}`);
          setMessages(prev => prev.map(msg => (
            { ...msg, text: msg.text + `\n[错误：${streamError.message}]`, isStreaming: false }
          )));
          setIsSending(false);
        },
        async () => {
          console.log("SSE 连接关闭，拉取最终结果。");
          setMessages(prev => prev.map(msg =>
            msg.id === currentStreamingMessageIdRef.current ? { ...msg, isStreaming: false } : msg
          ));
          try {
            const finalTaskResponse = await getTaskResult(agentEndpointUrl, taskId);
            console.log("最终任务结果：", finalTaskResponse);

            if (finalTaskResponse.result?.status?.message) {
              let finalText = "";
              finalTaskResponse.result.status.message.parts.forEach(part => {
                if (part.type === "text" && part.text) {
                  finalText += part.text;
                }
              });
              setMessages(prev => prev.map(msg => (
                { ...msg, text: msg.text + "\n\n" + finalText, isStreaming: false }
              )));
            } else if (finalTaskResponse.error) {
              throw new Error(`最终任务出错：${finalTaskResponse.error.message}`);
            }
          } catch (finalTaskError) {
            console.error("拉取最终任务出错：", finalTaskError);
            setError(`拉取最终结果出错：${finalTaskError.message}`);
            setMessages(prev => prev.map(msg => (
              { ...msg, text: msg.text + `\n[拉取错误：${finalTaskError.message}]`, isStreaming: false }
            )));
          } finally {
            setIsSending(false);
            currentStreamingMessageIdRef.current = null;
            abortStreamingRef.current = null;
          }
        }
      );
    } else {
      // 非流式响应
      try {
        const initialResponse = await sendTaskNonStreaming(agentEndpointUrl, payload);
        let agentResponseText = "处理中...";
        const agentMessageId = uuidv4();

        if (initialResponse.error) {
          throw new Error(`Agent 错误：${initialResponse.error.message}`);
        }

        if (initialResponse.result?.status?.state === "completed") {
          agentResponseText = initialResponse.result.status.message?.parts.find(p => p.type === 'text')?.text || "无文本内容。";
        } else {
          const finalTaskResponse = await getTaskResult(agentEndpointUrl, taskId);
          if (finalTaskResponse.result?.status?.message) {
            agentResponseText = finalTaskResponse.result.status.message.parts.find(p => p.type === 'text')?.text || "最终结果无文本。";
          } else if (finalTaskResponse.error) {
            throw new Error(`拉取任务失败：${finalTaskResponse.error.message}`);
          }
        }

        setMessages(prev => [...prev, { id: agentMessageId, type: 'agent', text: agentResponseText, isStreaming: false }]);
      } catch (err) {
        console.error("非流式错误：", err);
        setError(`错误：${err.message}`);
        setMessages(prev => [...prev, { id: uuidv4(), type: 'agent', text: `[错误：${err.message}]`, isStreaming: false }]);
      } finally {
        setIsSending(false);
      }
    }
  };

  // 卸载时清理流式连接
  useEffect(() => {
    return () => {
      if (abortStreamingRef.current) {
        abortStreamingRef.current();
      }
    };
  }, []);

  // 自动滚动到底部
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!agentCard) {
    return <div className="text-center p-4 text-gray-500">请先选择一个智能体以开始聊天。</div>;
  }

  if (!sessionId) {
    return <div className="text-center p-4 text-gray-500">正在生成会话 ID...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] max-h-[700px] border rounded-lg shadow-md bg-white">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">与 {agentCard.name} 聊天</h2>
        <p className="text-xs text-gray-500">会话 ID（Base64）：<code className="bg-gray-100 p-0.5 rounded">{sessionId.substring(0, 30)}...</code></p>
      </div>

      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl lg:max-w-2xl px-4 py-2 rounded-lg shadow ${msg.type === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              <p className="whitespace-pre-wrap">
                {msg.text}
                {msg.isStreaming && <span className="animate-pulse">▍</span>}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="p-3 border-t bg-red-50 text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center space-x-2 bg-gray-50">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="请输入你的问题..."
          className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={isSending || !agentCard}
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={isSending || !prompt.trim() || !agentCard}
        >
          {isSending ? '发送中...' : '发送'}
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
