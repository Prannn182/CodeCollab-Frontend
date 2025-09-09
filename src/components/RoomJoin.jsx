import React, { useState, useEffect } from 'react';

const generateRoomId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const RoomJoin = ({ onJoinRoom, error, connectionStatus }) => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isJoining, setIsJoining] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load username from localStorage if available
  useEffect(() => {
    const savedUsername = localStorage.getItem('codecollab-username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  // Reset isJoining state when there's an error
  useEffect(() => {
    if (error) {
      setIsJoining(false);
    }
  }, [error]);

  // Add timeout for joining room
  useEffect(() => {
    let timeoutId;
    if (isJoining) {
      timeoutId = setTimeout(() => {
        console.log('[DEBUG] Room joining timeout - resetting state');
        setIsJoining(false);
      }, 10000); // 10 second timeout
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isJoining]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomId.trim() || !username.trim()) {
      return;
    }
    setIsJoining(true);
    localStorage.setItem('codecollab-username', username.trim());
    
    // Pass a callback to handle completion
    onJoinRoom(roomId.trim(), username.trim(), language, (success) => {
      console.log('[DEBUG] Room join operation completed:', success);
      setIsJoining(false);
    });
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setRoomCreated(true);
    setCopied(false);
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const languages = [
    { value: 'javascript', label: 'JavaScript', icon: '\u26a1', color: 'from-yellow-400 to-orange-500' },
    { value: 'python', label: 'Python', icon: '\ud83d\udc0d', color: 'from-blue-400 to-cyan-500' },
    { value: 'html', label: 'HTML', icon: '\ud83c\udf10', color: 'from-orange-400 to-red-500' },
    { value: 'css', label: 'CSS', icon: '\ud83c\udfa8', color: 'from-blue-500 to-indigo-500' },
    { value: 'java', label: 'Java', icon: '\u2615', color: 'from-red-500 to-pink-500' },
    { value: 'cpp', label: 'C++', icon: '\u2699\ufe0f', color: 'from-purple-500 to-pink-500' }
  ];

  return (
    <div className="animate-scale-in">
      <div className="card p-8 backdrop-blur-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl mb-4 shadow-2xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">CodeCollab</h1>
          <p className="text-gray-400 text-lg">Real-time collaborative code editor</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room ID */}
          <div className="space-y-2">
            <label htmlFor="roomId" className="block text-sm font-semibold text-gray-300">
              Room ID
            </label>
            <div className="flex space-x-3">
              <div className="relative flex-1">
                <input
                  id="roomId"
                  type="text"
                  value={roomId}
                  onChange={(e) => { setRoomId(e.target.value); setRoomCreated(false); setCopied(false); }}
                  placeholder="Enter or generate a room ID"
                  className="input-field w-full pl-4 pr-12"
                  required
                  minLength={3}
                  maxLength={20}
                  readOnly={roomCreated}
                />
                {roomCreated && (
                  <button
                    type="button"
                    onClick={handleCopyRoomId}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary-400 hover:text-primary-300"
                    title="Copy Room ID"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-6 8h6a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h2" />
                    </svg>
                    <span className="ml-1 text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleCreateRoom}
                className="btn-secondary px-4 py-3 rounded-xl"
                title="Generate random room ID"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="ml-2">Create Room</span>
              </button>
            </div>
            {roomCreated && (
              <div className="text-xs text-primary-400 mt-2">Share this Room ID with others to collaborate!</div>
            )}
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-semibold text-gray-300">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="input-field w-full pl-12"
                required
                minLength={2}
                maxLength={20}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <label htmlFor="language" className="block text-sm font-semibold text-gray-300">
              Programming Language
            </label>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => setLanguage(lang.value)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                    language === lang.value
                      ? 'border-primary-500 bg-gradient-to-r from-primary-500/20 to-purple-500/20 shadow-lg'
                      : 'border-dark-600 bg-dark-800/50 hover:border-dark-500 hover:bg-dark-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 bg-gradient-to-r ${lang.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                      {lang.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-200">{lang.label}</span>
                  </div>
                  {language === lang.value && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-primary-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl border border-dark-600/50">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${connectionStatus.isConnected ? 'status-online' : 'bg-yellow-500'}`}></div>
              <span className="text-sm text-gray-300">
                {connectionStatus.isConnected ? 'Connected to server' : 'Attempting connection...'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {connectionStatus.socketId ? `ID: ${connectionStatus.socketId.slice(-6)}` : 'Connecting...'}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-gradient-to-r from-red-600/20 to-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl text-sm animate-fade-in-up">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Join Button */}
          <button
            type="submit"
            disabled={isJoining || !roomId.trim() || !username.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isJoining ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="loading-spinner"></div>
                <span>Joining Room...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>{roomCreated ? 'Enter Room' : 'Join Room'}</span>
              </div>
            )}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-8 text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Click <b>Create Room</b> to start a new session, then share the Room ID with others.</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Or join an existing session with a Room ID.</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Rooms are automatically cleaned up after 1 hour of inactivity.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomJoin; 