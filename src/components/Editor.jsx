import React, { useEffect, useRef, useState } from 'react';

const Editor = ({ 
  code, 
  language, 
  onCodeChange, 
  onCursorUpdate, 
  onTypingStart, 
  onTypingStop,
  onLanguageChange,
  users,
  onRunCode,
  runOutput
}) => {
  const textareaRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Handle text changes
  const handleTextChange = (e) => {
    const newCode = e.target.value;
    onCodeChange(newCode);
    
    // Handle typing indicators
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart();
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop();
    }, 1000);
  };

  // Handle cursor updates
  const handleCursorUpdate = (e) => {
    const textarea = e.target;
    const cursorPosition = textarea.selectionStart;
    onCursorUpdate({
      line: cursorPosition,
      ch: cursorPosition
    });
  };

  // Update code when it changes from server
  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== code) {
      console.log('[DEBUG] Updating editor code from server:', code);
      textareaRef.current.value = code || '';
    }
  }, [code]);

  // Update language when it changes
  useEffect(() => {
    console.log('[DEBUG] Language changed to:', language);
    // For now, we'll just log the language change
    // Language-specific syntax highlighting can be added later
  }, [language]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const languages = [
    { value: 'javascript', label: 'JavaScript', icon: '⚡', color: 'from-yellow-400 to-orange-500' },
    { value: 'python', label: 'Python', icon: '🐍', color: 'from-blue-400 to-cyan-500' },
    { value: 'html', label: 'HTML', icon: '🌐', color: 'from-orange-400 to-red-500' },
    { value: 'css', label: 'CSS', icon: '🎨', color: 'from-blue-500 to-indigo-500' },
    { value: 'java', label: 'Java', icon: '☕', color: 'from-red-500 to-pink-500' },
    { value: 'cpp', label: 'C++', icon: '⚙️', color: 'from-purple-500 to-pink-500' }
  ];

  const currentLanguage = languages.find(lang => lang.value === language);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Editor Toolbar */}
      <div className="bg-gradient-to-r from-dark-800/95 to-dark-700/95 backdrop-blur-sm border-b border-dark-600/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Language Selector */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-semibold text-gray-300">Language:</span>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value)}
                  className="appearance-none bg-dark-700/80 backdrop-blur-sm border border-dark-600/50 text-gray-200 text-sm rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-300 cursor-pointer"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.icon} {lang.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Current Language Badge */}
            {currentLanguage && (
              <div className={`flex items-center space-x-2 px-3 py-1 bg-gradient-to-r ${currentLanguage.color} rounded-lg text-white text-sm font-medium`}>
                <span>{currentLanguage.icon}</span>
                <span>{currentLanguage.label}</span>
              </div>
            )}
            {/* Run Button */}
            <button
              className="ml-6 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow transition-all duration-200"
              onClick={() => onRunCode(code, language)}
              title="Run code"
            >
              ▶ Run
            </button>
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2 text-sm text-gray-400 animate-fade-in-up">
                <span>You are typing...</span>
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
          </div>

          {/* User Stats */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium">{users.length} users online</span>
            </div>
            
            {/* Active Users */}
            <div className="flex -space-x-2">
              {users.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className="w-8 h-8 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-dark-800 shadow-lg"
                  title={user.username}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
              ))}
              {users.length > 3 && (
                <div className="w-8 h-8 bg-dark-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-dark-800">
                  +{users.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simple Text Editor */}
      <div className="flex-1 relative p-4 min-h-0">
        <div className="h-full w-full rounded-xl overflow-hidden shadow-2xl bg-dark-800 border border-dark-600">
                      <textarea
              ref={textareaRef}
              defaultValue={code || '// Welcome to CodeCollab!\n// Start coding with your team...'}
              onChange={handleTextChange}
              onSelect={handleCursorUpdate}
              onKeyUp={handleCursorUpdate}
              className="w-full h-full bg-transparent text-gray-200 p-4 resize-none outline-none overflow-auto"
              placeholder="// Welcome to CodeCollab!&#10;// Start coding with your team..."
              style={{ 
                fontSize: '14px', 
                fontFamily: 'monospace',
                lineHeight: '1.5'
              }}
            />
        </div>
        
        {/* User cursors overlay */}
        <div className="absolute inset-4 pointer-events-none">
          {users.map((user) => {
            if (!user.cursor) return null;
            
            // Calculate cursor position (simplified)
            const line = Math.floor(user.cursor.line / 80); // Approximate
            const ch = user.cursor.ch % 80;
            
            return (
              <div
                key={user.id}
                className="absolute w-0.5 h-5 cursor-pulse"
                style={{
                  left: `${ch * 8}px`,
                  top: `${line * 20}px`,
                  zIndex: 10
                }}
                title={`${user.username}'s cursor`}
              >
                <div className="absolute -top-8 left-0 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg font-medium">
                  {user.username}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Output Panel */}
      {runOutput && (
        <div className="bg-dark-900 border-t border-dark-600 p-4 text-sm font-mono text-gray-200 min-h-[60px] max-h-48 overflow-auto">
          <div className="font-bold text-primary-400 mb-1">Output:</div>
          {runOutput.error ? (
            <div className="text-red-400 whitespace-pre-wrap">{runOutput.error}</div>
          ) : (
            <div className="whitespace-pre-wrap">{runOutput.output}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Editor; 