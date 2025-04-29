import React, { useEffect, useState } from 'react';
import { FiCopy, FiCheck, FiEdit3 } from 'react-icons/fi';
import { PropsWithChildren } from 'react';
import { PaperClipIcon } from '@heroicons/react/24/solid';

interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
  preview?: string;
}

interface ChatBubbleProps {
  sender: 'user' | 'ai';
  message: React.ReactNode;
  timestamp?: Date;
  showHeader?: boolean;
  onEdit?: (text: string) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  sender,
  message,
  timestamp,
  showHeader = true,
  onEdit,
}) => {
  const isUser = sender === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(
    typeof message === 'string' ? message : ''
  );
  const [messageLines, setMessageLines] = useState(1);

  useEffect(() => {
    if (isEditing) {
      setEditedMessage(typeof message === 'string' ? message : '');
      setMessageLines(getLineCount(typeof message === 'string' ? message : ''));
    }
  }, [isEditing, message]);

  const getLineCount = (text: string) => {
    const lines = text.split('\n');
    return lines.length;
  };

  const copyMessage = async () => {
    try {
      let text = '';
      if (typeof message === 'string') text = message;
      else if (React.isValidElement(message)) {
        text = extractTextFromReactNode(message);
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const extractTextFromReactNode = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractTextFromReactNode).join('');
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<PropsWithChildren<{}>>;
      return extractTextFromReactNode(element.props.children);
    }
    return '';
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancelEdit = () => {
    setEditedMessage(typeof message === 'string' ? message : '');
    setIsEditing(false);
  };
  const handleSaveEdit = () => {
    if (editedMessage.trim()) {
      onEdit?.(editedMessage);
      setIsEditing(false);
    }
  };

  const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  };

  const defaultHeight = Math.min(messageLines, 7) * 20;

  const renderMessageContent = () => {
    if (typeof message !== 'string') {
      return message;
    }

    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.text || parsedMessage.files) {
        return (
          <div>
            {parsedMessage.text && <div className="mb-2">{parsedMessage.text}</div>}
            {parsedMessage.files?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {parsedMessage.files.map((file: UploadedFile) => (
                  <div key={file.id} className="max-w-xs">
                    {file.type === 'image' ? (
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="max-h-40 rounded-md border border-gray-200"
                      />
                    ) : (
                      <a 
                        href={file.url} 
                        download={file.name}
                        className="flex items-center p-2 bg-white/20 rounded-md border border-white/30 hover:bg-white/30"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <PaperClipIcon className="w-4 h-4 mr-2" />
                        <span className="text-xs truncate">{file.name}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      return message;
    } catch {
      return message;
    }
  };

  return (
    <>
      <div className={`flex mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}>
          {showHeader && (
            <div className="flex items-center space-x-2 text-xs mb-1 text-gray-400">
              {timestamp && <span>{formatTime(timestamp)}</span>}
              {isUser && !isEditing && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1 px-2 py-1 border border-gray-300 bg-white text-gray-600 rounded-md text-xs hover:bg-gray-100 transition-all duration-150 shadow-sm"
                >
                  <FiEdit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
              <button
                onClick={copyMessage}
                className="flex items-center gap-1 px-2 py-1 border border-gray-300 bg-white text-gray-600 rounded-md text-xs hover:bg-gray-100 transition-all duration-150 shadow-sm"
              >
                {copied ? (
                  <>
                    <FiCheck className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-500">Copied</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div
            className={`relative p-4 text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere rounded-2xl shadow-sm max-w-[85%] ${
              isUser
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none self-end'
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none self-start'
            }`}
          >
            {renderMessageContent()}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="w-full px-4 py-3">
          <textarea
            value={editedMessage}
            onChange={(e) => {
              setEditedMessage(e.target.value);
              autoResizeTextarea(e);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onEdit?.(editedMessage);
                setIsEditing(false);
              }
            }}            
            className="w-full text-sm text-black p-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            rows={1}
            autoFocus
            placeholder="Edit your message..."
            style={{
              minHeight: `${defaultHeight}px`,
              maxHeight: '180px',
              overflowY: 'auto',
            }}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={handleCancelEdit}
              className="text-sm bg-gray-100 text-gray-700 px-4 py-1 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="text-sm bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBubble;//chatbubble......//tessreact-old