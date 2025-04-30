'use client';

import React, { useEffect, useRef, useState } from 'react';
import ChatBubble from '../../components/ChatBubble';
import axios from 'axios';
import { PaperAirplaneIcon, ArrowPathIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { MicrophoneIcon, PaperClipIcon, PlusIcon } from '@heroicons/react/24/solid';
import Sidebar from '../../components/ChatSidebar';

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
  preview?: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<{ sender: string; message: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editMessageRef = useRef<HTMLDivElement>(null);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [scrollLockIndex, setScrollLockIndex] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chats, setChats] = useState<Array<{ id: string; title: string }>>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Create a new chat
  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId,
      title: `New Chat`,
    };
  
    setChats([...chats, newChat]);
    setCurrentChatId(newChatId);
    setMessages([]);
    setUserInput('');
    setUploadedFiles([]);
  };
  

  // Load chat history
  const loadChatHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/chatMessages/getmessages');
      const messages = response.data;
      
      // Group messages by chat session
      const chatSessions = messages.reduce((acc: Record<string, { id: string; title: string }>, message: any) => {
        if (!acc[message.chatId]) {
          acc[message.chatId] = {
            id: message.chatId,
            title: message.chatTitle || `Chat ${Object.keys(acc).length + 1}`,
          };
        }
        return acc;
      }, {});
      
      setChats(Object.values(chatSessions));
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Load a specific chat
// Load a specific chat
const loadChat = async (chatId: string) => {
  try {
    const response = await axios.get(`http://localhost:8000/api/v1/chatMessages/getmessages?chatId=${chatId}`);
    
    // Transform the API response into the expected message format
    const formattedMessages = response.data.map((msg: any) => ({
      sender: msg.sender, // or msg.role depending on your API response
      message: msg.content // or msg.text depending on your API response
    }));
    
    setMessages(formattedMessages);
    setCurrentChatId(chatId);
  } catch (error) {
    console.error('Error loading chat:', error);
  }
};

  useEffect(() => {
    loadChatHistory();
    
    // Create initial chat if no chats exist
    if (chats.length === 0) {
      const newChatId = Date.now().toString();
      setChats([{ id: newChatId, title: 'New Chat' }]);
      setCurrentChatId(newChatId);
    }
  }, []); // Remove chats from dependency array to prevent infinite loops

  useEffect(() => {
    if (editMessageRef.current) {
      editMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      editMessageRef.current = null;
    } else if (scrollLockIndex === null) {
      scrollToBottom(); 
    }
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (container) {
      const atBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
      setShowScrollButton(!atBottom);
    }
  };

  const sendMessage = async (messageToSend: string, insertAfterIndex?: number) => {
    if (!currentChatId) return;
  
    const userMessage = { sender: 'user', message: messageToSend };
    const newMessages = [...messages];
    
    let editScrollIndex = null;
  
    if (insertAfterIndex !== undefined) {
      newMessages.splice(insertAfterIndex + 1, 0, userMessage);
      setScrollLockIndex(insertAfterIndex + 1);
      editScrollIndex = insertAfterIndex + 1;
    } else {
      newMessages.push(userMessage);
      setScrollLockIndex(null);
    }    
  
    setMessages(newMessages);
  
    // 👇💬 [ADD THIS PART] Rename chat if title is still "New Chat"
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === currentChatId && chat.title === 'New Chat'
          ? { ...chat, title: messageToSend.trim().slice(0, 20) + '...' }
          : chat
      )
    );
  
    try {
      // Save user message to backend
      const userResponse = await axios.post('http://localhost:8000/api/v1/chatMessages/messages', {
        sender: 'user',
        content: messageToSend,
        chatId: currentChatId,
      });
      console.log('User message saved:', userResponse.data);
  
      setIsLoading(true);
      
      // Get AI response
      const aiResponse = await axios.post('http://localhost:8000/api/v1/chatbot/chat', {
        message: messageToSend,
        chatId: currentChatId, // Add chatId to the AI request if needed
      });
  
      const aiReply = aiResponse.data.message;
      const aiMessage = { sender: 'ai', message: aiReply };
  
      setMessages(prev => {
        const updated = [...prev];
        if (insertAfterIndex !== undefined) {
          updated.splice(insertAfterIndex + 2, 0, aiMessage);
        } else {
          updated.push(aiMessage);
        }
        return updated;
      });
  
      // Save AI response to backend
      const aiSaveResponse = await axios.post('http://localhost:8000/api/v1/chatMessages/messages', {
        sender: 'ai',
        content: aiReply,
        chatId: currentChatId,
      });
      console.log('AI message saved:', aiSaveResponse.data);
  
      setTimeout(() => {
        if (editScrollIndex !== null) {
          const bubble = document.getElementById(`msg-${editScrollIndex}`);
          if (bubble) bubble.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } catch (err) {
      console.error('API error:', err);
      if (axios.isAxiosError(err)) {
        console.error('Response data:', err.response?.data);
        console.error('Response status:', err.response?.status);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = (text: string, index: number) => {
    editMessageRef.current = document.getElementById(`msg-${index + 2}`) as HTMLDivElement | null;
    sendMessage(text, index + 1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(userInput);
      setUserInput('');
    }
  };

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 180);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = newHeight >= 180 ? 'auto' : 'hidden';
    }
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [userInput]);

  const refreshChat = () => {
    setMessages([]);
  };

  const startRecordingTimer = () => {
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setRecordingTime(0);
  };

  const handleVoiceInput = () => {
    if (isVoiceInputActive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsVoiceInputActive(false);
      stopRecordingTimer();
      return;
    }
  
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in your browser');
      return;
    }
  
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
  
    recognitionRef.current.onstart = () => {
      setIsVoiceInputActive(true);
      startRecordingTimer();
    };
  
    recognitionRef.current.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      setUserInput(transcript);
    };
  
    recognitionRef.current.onerror = (event: any) => {
      setIsVoiceInputActive(false);
      stopRecordingTimer();
    };
  
    recognitionRef.current.onend = () => {
      setIsVoiceInputActive(false);
      stopRecordingTimer();
    };
  
    recognitionRef.current.start();
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const extractTextFromFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await axios.post(
        'http://localhost:8000/api/v1/chatbot/extract-text',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.text;
    } catch (error) {
      console.error('Text extraction error:', error);
      return null;
    }
  };
  

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
  
    setIsLoading(true);
    
    try {
      for (const file of Array.from(files)) {
        // For images and files that need text extraction
        if (file.type.startsWith('image/') || 
            file.type === 'application/pdf' || 
            file.type.includes('word') || 
            file.type === 'text/plain') {
          const extractedText = await extractTextFromFile(file);
          if (extractedText) {
            setUserInput(prev => `${prev}\n\n[From ${file.name}]:\n${extractedText}`);
          }
        } else {
          // For other files, just upload them as attachments
          const fileType = file.type.startsWith('image/') ? 'image' : 'file';
          const fileId = Date.now().toString() + Math.random().toString(36).substring(2);
          const fileUrl = URL.createObjectURL(file);
          
          setUploadedFiles(prev => [...prev, {
            id: fileId,
            name: file.name,
            type: fileType,
            url: fileUrl,
            preview: fileType === 'image' ? fileUrl : undefined
          }]);
        }
      }
    } catch (error) {
      console.error('File processing error:', error);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };
  
  const handleSendWithFiles = () => {
    if (isVoiceInputActive && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  
    // Create a message that includes both text and files
    const messageContent = {
      text: userInput,
      files: uploadedFiles
    };
  
    sendMessage(JSON.stringify(messageContent));
    setUserInput('');
    setUploadedFiles([]);
  };

  const deleteChat = async (chatId: string) => {
    if (!window.confirm('Are you sure you want to delete this chat?')) {
      return;
    }
    try {
      await axios.delete(`http://localhost:8000/api/v1/chatMessages/${chatId}`);
      
      // Refresh chat list
      loadChatHistory();
      
      // If we're currently viewing the deleted chat, create a new one
      if (currentChatId === chatId) {
        createNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      // Optionally show error to user
    }
  };

  const renameChat = async (chatId: string, newTitle: string) => {
    try {
      await axios.patch(`http://localhost:8000/api/v1/chatMessages/${chatId}`, {
        chatTitle: newTitle
      });
      
      // Update local state
      setChats(chats.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  return (
    <>
    {/* Sidebar */}
    <Sidebar
      isOpen={isSidebarOpen}
      toggleSidebar={toggleSidebar}
      chats={chats}
      currentChatId={currentChatId}
      onNewChat={createNewChat}
      onSelectChat={loadChat}
      isLoading={isLoading}
      onDeleteChat={deleteChat}
      onRenameChat={renameChat}
    />

    {/* Main content */}  
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Toggle Sidebar Button (when closed) */}
        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-40 p-2 rounded-md bg-white shadow-md text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

      <div className="flex flex-col h-screen bg-gray-50">

        {/* Chat messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-6"
          ref={chatContainerRef}
          onScroll={handleScroll}
        >
          <div className="max-w-3xl mx-auto w-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center text-gray-500">
                <div className="w-16 h-16 mb-4 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <PaperAirplaneIcon className="w-8 h-8 text-blue-500 transform rotate-45" />
                </div>
                <h3 className="text-lg font-medium mb-1">How can I help you today?</h3>
                <p className="text-sm max-w-md">Ask me anything or share your thoughts. I'm here to assist you.</p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} id={`msg-${i}`}>
                    <ChatBubble
                      sender={msg.sender as 'user' | 'ai'}
                      message={msg.message}
                      onEdit={msg.sender === 'user' ? (text) => handleEditMessage(text, i) : undefined}
                    />
                  </div>
                ))}
                {isLoading && (
                  <ChatBubble
                    sender="ai"
                    message={
                      <div className="flex space-x-1 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      </div>
                    }
                  />
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          {showScrollButton && (
            <button
              className="fixed bottom-28 right-6 bg-white border border-gray-300 rounded-full shadow-md p-2 hover:bg-blue-50 transition"
              onClick={scrollToBottom}
            >
              <ChevronDownIcon className="w-5 h-5 text-blue-600" />
            </button>
          )}
        </div>

        {/* User input */}
        <div className="p-4 ">
          <div className="max-w-3xl mx-auto w-full">
            <div className="mb-2">
              {uploadedFiles.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="relative group">
                        {file.type === 'image' ? (
                          <div className="w-20 h-20 rounded-md overflow-hidden border border-gray-200">
                            <img 
                              src={file.preview} 
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <span className="text-white text-xs text-center p-1 break-all">{file.name}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-40 p-2 bg-white rounded-md border border-gray-200 flex items-center">
                            <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center mr-2">
                              <PaperClipIcon className="w-3 h-3 text-gray-500" />
                            </div>
                            <span className="text-xs truncate">{file.name}</span>
                          </div>
                        )}
                        <button
                          onClick={() => removeFile(file.id)}
                          className="absolute -top-2 -right-2 bg-gray-200 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="w-3 h-3 text-gray-700" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <textarea
                ref={textareaRef}
                rows={1}
                className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ maxHeight: '180px', minHeight: '44px', overflowY: 'hidden' }}
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
              />

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-200 relative"
                title="Text extraction only. Upload files and more (Max 50, 100MB each)"
                disabled={isLoading}
              >
                {isLoading ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin " />
                ) : (
                  <PlusIcon className="w-5 h-5 " />
                )}
              </button>
              </div>
              
              <div className="flex items-center space-x-2">
                {isVoiceInputActive && (
                  <div className="flex items-center text-sm text-red-500">
                    <span className="mr-2">{formatTime(recordingTime)}</span>
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  </div>
                )}
                <button
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-full ${
                    isVoiceInputActive 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                  title={isVoiceInputActive ? 'Stop recording' : 'Start recording'}
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSendWithFiles}
                  disabled={isLoading || (!userInput.trim() && uploadedFiles.length === 0)}
                  className={`p-2 rounded-full ${
                    isLoading || (!userInput.trim() && uploadedFiles.length === 0)
                      ? 'border border-gray-200 bg-white text-gray-400'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
              
            <p className="text-xs text-gray-500 mt-2 text-center">
              AI Assistant may produce inaccurate information. Consider verifying important info.
            </p>
          </div>
        </div>
      </div>  
    </div>
    </>
  );

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
};

export default Chat;//chatbot/page.tsx........//tessreact-old		