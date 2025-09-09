import React, { useState, useRef, useEffect } from 'react';

const Chat = ({ messages, onSendMessage, onTypingStart, onTypingStop, users }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicators
  useEffect(() => {
    if (isTyping) {
      onTypingStart();
    } else {
      onTypingStop();
    }
  }, [isTyping, onTypingStart, onTypingStop]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    onSendMessage(message.trim());
    setMessage('');
    setIsTyping(false);
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Handle typing indicators
    if (!isTyping) {
      setIsTyping(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get users who are currently typing
  const typingUsers = users.filter(user => user.isTyping);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-dark-800/95 to-dark-700/95 backdrop-blur-sm border-b border-dark-600/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold gradient-text">Chat</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400 font-medium">{messages.length}</span>
          </div>
        </div>
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-400 mt-2 animate-fade-in-up">
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
            <span>
              {typingUsers.map(user => user.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-dark-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-300 mb-2">No messages yet</h4>
            <p className="text-gray-400 text-sm">Start the conversation with your team!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={msg.id} 
              className="flex space-x-4 animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* User avatar */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {msg.username.charAt(0).toUpperCase()}
                </div>
              </div>
              
              {/* Message content */}
              <div className="flex-1 min-w-0">
                <div className="message-bubble">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-white font-semibold text-sm">
                      {msg.username}
                    </span>
                    <span className="text-gray-500 text-xs font-mono">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="text-gray-200 text-sm leading-relaxed break-words">
                    {msg.message}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-dark-600/50 p-6 bg-gradient-to-r from-dark-800/95 to-dark-700/95 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex space-x-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={message}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="input-field w-full pr-12"
                maxLength={500}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <div className="text-xs text-gray-500 font-mono">
                  {message.length}/500
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={!message.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none px-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          {/* Quick actions */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Press Enter to send</span>
              <span>•</span>
              <span>Messages are saved for 1 hour</span>
            </div>
            <div className="flex items-center space-x-2">
              {isTyping && (
                <div className="flex items-center space-x-1">
                  <span>You are typing</span>
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat; 