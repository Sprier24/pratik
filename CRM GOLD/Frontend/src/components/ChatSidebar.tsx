import React, { useState, useRef, useEffect } from 'react';
import { ArrowPathIcon, PlusIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { format, isToday, isYesterday, subDays, isAfter } from 'date-fns';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  chats: Array<{ id: string; title: string }>;
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  isLoading: boolean;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  isLoading,
  onDeleteChat,
  onRenameChat
}) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpen && menuRefs.current[menuOpen] && !menuRefs.current[menuOpen]?.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpen]);   

  // Focus input when editing starts
  useEffect(() => {
    if (editingChatId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingChatId]);

  const handleRenameStart = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
    setMenuOpen(null);
  };

  const handleRenameSubmit = (chatId: string) => {
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(chatId);
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
    }
  };

  const toggleMenu = (chatId: string) => {
    setMenuOpen(prev => prev === chatId ? null : chatId);
  };

  const groupChatsByDate = (chats: { id: string; title: string; createdAt: string }[]) => {
    const groups: Record<string, typeof chats> = {};
  
    chats.forEach(chat => {
      const date = new Date(chat.createdAt);
  
      let label = '';
      if (isToday(date)) {
        label = 'Today';
      } else if (isYesterday(date)) {
        label = 'Yesterday';
      } else if (isAfter(date, subDays(new Date(), 7))) {
        label = 'Previous 7 Days';
      } else if (isAfter(date, subDays(new Date(), 30))) {
        label = 'Previous 30 Days';
      } else {
        label = format(date, 'yyyy-MM');
      }
  
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(chat);
    });
  
    return groups;
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-50 flex flex-col`}
    >
      <div className="flex flex-col h-full p-4 overflow-hidden">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
              <Image src="/logo.png" alt="" width={150} height={50} className="w-full h-auto max-w-[150px]" />
            </div>
            <h1 className="text-lg font-semibold text-gray-800">AI Assistant</h1>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          disabled={isLoading}
          className="flex items-center justify-center w-full px-4 py-2 mb-4 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Chat
        </button>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto">
          <h2 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Chat History
          </h2>
          <div className="space-y-1 pr-1">
            {[...chats].reverse().map((chat) => (
              <div 
                key={chat.id} 
                className={`flex items-center justify-between group rounded-md ${
                  currentChatId === chat.id ? 'bg-blue-50' : 'hover:bg-gray-100'
                }`}
                onMouseEnter={() => setHoveredChatId(chat.id)}
                onMouseLeave={() => setHoveredChatId(null)}
              >
                {editingChatId === chat.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleRenameSubmit(chat.id)}
                    onKeyDown={(e) => handleKeyDown(e, chat.id)}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className={`flex-1 text-left px-3 py-2 text-sm rounded-md truncate ${
                      currentChatId === chat.id ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {chat.title}
                  </button>
                )}
                
                <div 
                  className="relative"
                  ref={el => {
                    menuRefs.current[chat.id] = el;
                  }}
                >
                  {(hoveredChatId === chat.id || currentChatId === chat.id || menuOpen === chat.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(chat.id);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <EllipsisHorizontalIcon className="w-5 h-5" />
                    </button>
                  )}
                  
                  {menuOpen === chat.id && (
                    <div className="absolute right-0 z-10 w-40 mt-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameStart(chat.id, chat.title);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <PencilSquareIcon className="w-4 h-4 mr-2" />
                          Rename
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                            setMenuOpen(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <TrashIcon className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status and Refresh */}
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {isLoading ? 'Typing...' : 'Online'}
          </p>
          <button
            onClick={onNewChat}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Refresh"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;