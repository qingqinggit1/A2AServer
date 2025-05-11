import React, { useState, useEffect, useRef } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { currentConversationIdState, messagesState } from '../store/recoilState';
import ChatBubble from './ChatBubble';
import FormRenderer from './FormRenderer';
import * as api from '../api/api';
import { v4 as uuidv4 } from 'uuid';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const Conversation = () => {
    const conversationId = useRecoilValue(currentConversationIdState);
    const [messages, setMessages] = useRecoilState(messagesState);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [pollingIntervalId, setPollingIntervalId] = useState(null);
    const processedEventIds = useRef(new Set());
    const maxPollingTime = 30000; // 30秒最大轮询时间
    const pollingStartTime = useRef(null);

    console.log("当前会话 ID:", conversationId);
    // 组件卸载或conversationId变化时清理轮询
    useEffect(() => {
        return () => {
            if (pollingIntervalId) {
                clearInterval(pollingIntervalId);
            }
        };
    }, [pollingIntervalId]);

    const formatEventToMessage = (event, currentConversationId) => {
        let contentParts = [];
        if (event.content && event.content.parts) {
            contentParts = event.content.parts.map(part => {
                if (part.type === 'text') {
                    return [part.text !== null && typeof part.text !== 'undefined' ? part.text : "", 'text/plain'];
                } else if (part.type === 'data') {
                    return [part.data, 'application/json'];
                }
                return [part.text || JSON.stringify(part.data) || "", 'text/plain'];
            });
        }

        return {
            message_id: event.content?.metadata?.message_id || event.id,
            role: event.actor === 'user' ? 'user' : (event.content?.role || 'agent'),
            content: contentParts,
            metadata: { conversation_id: event.content?.metadata?.conversation_id || currentConversationId },
            timestamp: event.timestamp,
            actor: event.actor,
        };
    };

    const startPolling = (trackedMessageId) => {
        if (!conversationId) return;

        if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
        }

        pollingStartTime.current = Date.now();

        const intervalId = setInterval(async () => {
            const elapsedTime = Date.now() - pollingStartTime.current;
            if (elapsedTime > maxPollingTime) {
                console.log(`[${(elapsedTime / 1000).toFixed(1)}s] 轮询超时（超过 ${maxPollingTime / 1000} 秒），停止轮询`);
                clearInterval(intervalId);
                setPollingIntervalId(null);
                setIsSending(false);
                return;
            }
            /// 检查消息处理状态
            let activeTrackedIdIsStillPending = false;
            try {
                // 1. 检查 /message/pending
                const pendingResponse = await api.getProcessingMessages();
                console.log("pendingResponse:", pendingResponse);
                if (pendingResponse) {
                    activeTrackedIdIsStillPending = pendingResponse.some(
                        item => item.includes(trackedMessageId)
                    );
                    console.log(`[${(elapsedTime / 1000).toFixed(1)}s] 轮询: Tracked ID ${trackedMessageId} 是否仍在处理中: ${activeTrackedIdIsStillPending}`);
                } else {
                    console.log(`[${(elapsedTime / 1000).toFixed(1)}s] 轮询: 无法确定 ${trackedMessageId} 的处理状态，应该是已完成`);
                }

                // 2. 获取 /events/get
                const eventsResponse = await api.getEvents();
                console.log("eventsResponse:", eventsResponse);
                if (eventsResponse) {
                    const newMessagesFromEvents = [];
                    const sortedEvents = [...eventsResponse].sort((a, b) => a.timestamp - b.timestamp);

                    for (const event of sortedEvents) {
                        if (event.id &&
                            (event.content?.metadata?.conversation_id === conversationId) &&
                            !processedEventIds.current.has(event.id)) {

                            processedEventIds.current.add(event.id);
                            const formattedMessage = formatEventToMessage(event, conversationId);

                            const hasContent = formattedMessage.content.some(part =>
                                (typeof part[0] === 'string' && part[0].trim() !== "") ||
                                (typeof part[0] === 'object' && part[0] !== null)
                            );
                            if (hasContent) {
                                newMessagesFromEvents.push(formattedMessage);
                            }
                        }
                    }
                    console.log("newMessagesFromEvents: ", newMessagesFromEvents)

                    if (newMessagesFromEvents.length > 0) {
                        console.log(`[${(elapsedTime / 1000).toFixed(1)}s] 获取到 ${newMessagesFromEvents.length} 条新消息`);
                        setMessages(prevMessages => {
                            const currentMessageIds = new Set(prevMessages.map(m => m.message_id));
                            let newMessages = [...prevMessages]; // 创建数组的浅拷贝

                            for (const nm of newMessagesFromEvents) {
                                if (currentMessageIds.has(nm.message_id)) continue;

                                const lastMsg = newMessages[newMessages.length - 1];

                                const nmText = nm.content?.map(p => p[0]).join('\n').trim();
                                const lastText = lastMsg?.content?.map(p => p[0]).join('\n').trim();

                                if (lastMsg && nm.role === lastMsg.role && nmText === lastText) {
                                    // 创建 lastMsg 的副本并更新 dupCount
                                    const updatedLastMsg = { ...lastMsg, dupCount: (lastMsg.dupCount || 1) + 1 };
                                    // 替换 newMessages 中的最后一个消息
                                    newMessages = [
                                        ...newMessages.slice(0, -1), // 保留除最后一个消息外的所有消息
                                        updatedLastMsg // 添加更新后的最后一个消息
                                    ];
                                } else {
                                    // 新消息，正常添加
                                    newMessages = [...newMessages, { ...nm, dupCount: 1 }];
                                }
                            }

                            // 收到新消息时，重置轮询开始时间，延长最大轮询时间
                            pollingStartTime.current = Date.now();
                            return newMessages;
                        });
                    }
                }

                if (!activeTrackedIdIsStillPending) {
                    console.log(`[${(elapsedTime / 1000).toFixed(1)}s] Tracked ID ${trackedMessageId} 已完成处理，停止轮询`);
                    clearInterval(intervalId);
                    setPollingIntervalId(null);
                    setIsSending(false);
                }

            } catch (error) {
                console.error(`[${(elapsedTime / 1000).toFixed(1)}s] 轮询出错:`, error);
            }
        }, 500); // 每0.5秒轮询一次

        setPollingIntervalId(intervalId);
    };

    const handleSendMessage = async () => {
        if (!conversationId || !inputText.trim()) {
            return;
        }

        setIsSending(true);
        const optimisticLocalId = `optimistic-${uuidv4()}`;
        const messageContentToSend = inputText;
        setInputText('');

        const userMessage = {
            message_id: optimisticLocalId,
            role: 'user',
            content: [[messageContentToSend, 'text/plain']],
            metadata: { conversation_id: conversationId },
            timestamp: Date.now() / 1000,
            dupCount: 1, // 重复次数, 默认为1，和上一条重复
        };
        setMessages((prevMessages) => [...prevMessages, userMessage]);

        try {
            const sendMessageResponse = await api.sendMessage({
                role: 'user',
                parts: [{ type: 'text', text: messageContentToSend }],
                metadata: { conversation_id: conversationId },
            });

            if (sendMessageResponse && sendMessageResponse.message_id) {
                const serverConfirmedMessageId = sendMessageResponse.message_id;
                console.log('消息发送成功，Server Message ID:', serverConfirmedMessageId);

                setMessages((prevMessages) => prevMessages.filter(msg => msg.message_id !== optimisticLocalId));
                startPolling(serverConfirmedMessageId);
            } else {
                console.error('发送消息失败: 响应中无 message_id');
                setMessages((prevMessages) => prevMessages.filter(msg => msg.message_id !== optimisticLocalId));
                setIsSending(false);
            }
        } catch (error) {
            console.error('发送消息出错:', error);
            setMessages((prevMessages) => prevMessages.filter(msg => msg.message_id !== optimisticLocalId));
            setIsSending(false);
        }
    };

    const handleInputChange = (event) => {
        setInputText(event.target.value);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey && !isSending) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full p-4 space-y-2">
            <div className="flex-grow overflow-y-auto space-y-2 pb-4">
                {messages.map((message) => (
                    <div key={message.message_id || uuidv4()}>
                        {message.content.some(part => part[1] === 'form') ? (
                            <FormRenderer message={message} />
                        ) : (
                            <ChatBubble message={message} />
                        )}
                    </div>
                ))}
                {isSending && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                        <CircularProgress size={24} sx={{ marginRight: 1 }} />
                        <span>正在处理...</span>
                    </Box>
                )}
            </div>
            <div className="mt-auto flex items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <TextField
                    fullWidth
                    label="发送消息"
                    variant="outlined"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={isSending || !conversationId}
                    InputProps={{
                        endAdornment: (
                            isSending && messages.length > 0 ? <CircularProgress color="inherit" size={20} sx={{ marginRight: '8px' }} /> : null
                        )
                    }}
                />
                <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={isSending || !inputText.trim() || !conversationId}
                    sx={{ marginLeft: '8px' }}
                >
                    <SendIcon />
                </IconButton>
            </div>
        </div>
    );
};

export default Conversation;