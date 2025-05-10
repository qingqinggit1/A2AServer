import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendTaskStreaming, sendTaskNonStreaming, getTaskResult } from '../services/a2aApiService';

function ChatInterface({ agentCard }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const currentStreamingMessageIdRef = useRef(null);
  const abortStreamingRef = useRef(null);
  const [sessionId, setSessionId] = useState('');
  const [thinkingMessages, setThinkingMessages] = useState({});
  const [isThinkingCollapsed, setIsThinkingCollapsed] = useState({});

  useEffect(() => {
    setSessionId(uuidv4());
    setMessages([]);
    setThinkingMessages({});
    setIsThinkingCollapsed({});
  }, [agentCard]);

  const toggleThinkingCollapse = (messageId) => {
    setIsThinkingCollapsed(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || !agentCard || !sessionId) return;

    const userMessage = { id: uuidv4(), type: 'user', text: prompt };
    const agentMessage = { id: uuidv4(), type: 'agent', text: '', isStreaming: true, thinking: [] };
    setMessages(prev => [...prev, userMessage, agentMessage]);
    setThinkingMessages(prev => ({ ...prev, [agentMessage.id]: [] }));
    setIsThinkingCollapsed(prev => ({ ...prev, [agentMessage.id]: false }));
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
      currentStreamingMessageIdRef.current = agentMessage.id;

      abortStreamingRef.current = sendTaskStreaming(
        agentEndpointUrl,
        payload,
        (streamEvent) => {
          console.log("接收到流事件：", streamEvent);
          if (streamEvent.result?.status?.state === "working" && streamEvent.result?.status?.message) {
            streamEvent.result.status.message.parts.forEach(part => {
              if (part.type === "text" && part.text) {
                setThinkingMessages(prev => ({
                  ...prev,
                  [agentMessage.id]: [...(prev[agentMessage.id] || []), part.text]
                }));
              }
            });
          } else if (streamEvent.result?.status?.state === "completed" && streamEvent.result?.status?.message) {
            let finalText = "";
            streamEvent.result.status.message.parts.forEach(part => {
              if (part.type === "text" && part.text) {
                finalText += part.text;
              }
            });
            setMessages(prev => prev.map(msg =>
              msg.id === agentMessage.id ? { ...msg, text: finalText, isStreaming: false } : msg
            ));
          }

          if (streamEvent.result?.final) {
            setMessages(prev => prev.map(msg =>
              msg.id === agentMessage.id ? { ...msg, isStreaming: false } : msg
            ));
            setIsSending(false);
          }
        },
        (streamError) => {
          console.error("流式传输错误：", streamError);
          setError(`流式传输错误：${streamError.message}`);
          setMessages(prev => prev.map(msg =>
            msg.id === agentMessage.id
              ? { ...msg, text: `[错误：${streamError.message}]`, isStreaming: false }
              : msg
          ));
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
              setMessages(prev => prev.map(msg =>
                msg.id === currentStreamingMessageIdRef.current
                  ? { ...msg, text: finalText, isStreaming: false }
                  : msg
              ));
            } else if (finalTaskResponse.error) {
              throw new Error(`最终任务出错：${finalTaskResponse.error.message}`);
            }
          } catch (finalTaskError) {
            console.error("拉取最终任务出错：", finalTaskError);
            setError(`拉取最终结果出错：${finalTaskError.message}`);
            setMessages(prev => prev.map(msg =>
              msg.id === currentStreamingMessageIdRef.current
                ? { ...msg, text: `[拉取错误：${finalTaskError.message}]`, isStreaming: false }
                : msg
            ));
          } finally {
            setIsSending(false);
            currentStreamingMessageIdRef.current = null;
            abortStreamingRef.current = null;
          }
        }
      );
    } else {
      try {
        const initialResponse = await sendTaskNonStreaming(agentEndpointUrl, payload);
        let agentResponseText = "处理中...";

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

        setMessages(prev => prev.map(msg =>
          msg.id === agentMessage.id ? { ...msg, text: agentResponseText, isStreaming: false } : msg
        ));
      } catch (err) {
        console.error("非流式错误：", err);
        setError(`错误：${err.message}`);
        setMessages(prev => prev.map(msg =>
          msg.id === agentMessage.id ? { ...msg, text: `[错误：${err.message}]`, isStreaming: false } : msg
        ));
      } finally {
        setIsSending(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (abortStreamingRef.current) {
        abortStreamingRef.current();
      }
    };
  }, []);

  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinkingMessages]);

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
              {msg.type === 'agent' && thinkingMessages[msg.id]?.length > 0 && (
                <div className="mb-2">
                  <button
                    onClick={() => toggleThinkingCollapse(msg.id)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    {isThinkingCollapsed[msg.id] ? '展开思考过程' : '收起思考过程'}
                    <svg className={`w-4 h-4 ml-1 transform ${isThinkingCollapsed[msg.id] ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {!isThinkingCollapsed[msg.id] && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-600">
                      {thinkingMessages[msg.id].map((thought, index) => (
                        <p key={index} className="whitespace-pre-wrap">{thought}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className="whitespace-pre-wrap">
                {msg.text || (msg.isStreaming && !msg.text ? '思考中...' : '')}
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