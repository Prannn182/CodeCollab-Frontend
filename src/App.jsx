import React, { useState, useEffect } from 'react';
import socketManager from './socket';
import audioManager from './components/AudioManager';
import RoomJoin from './components/RoomJoin';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false });
  const [notifications, setNotifications] = useState([]);
  const [runOutput, setRunOutput] = useState(null);

  useEffect(() => {
    console.log('[DEBUG] Setting up socket event listeners in App.jsx');
    // Initialize socket connection
    socketManager.connect();

    // Set up event listeners
    socketManager.on('room-joined', handleRoomJoined);
    socketManager.on('user-joined', handleUserJoined);
    socketManager.on('user-left', handleUserLeft);
    socketManager.on('code-updated', handleCodeUpdated);
    socketManager.on('chat-message', handleChatMessageReceived);
    socketManager.on('language-updated', handleLanguageUpdated);
    socketManager.on('cursor-updated', handleCursorUpdated);
    socketManager.on('user-typing', handleUserTyping);
    socketManager.on('error', handleError);
    socketManager.on('connect', () => {
      console.log('[DEBUG] Socket connected, updating status');
      setConnectionStatus(socketManager.getConnectionStatus());
    });
    socketManager.on('disconnect', () => {
      console.log('[DEBUG] Socket disconnected, updating status');
      setConnectionStatus(socketManager.getConnectionStatus());
    });
    socketManager.on('connect_error', () => {
      console.log('[DEBUG] Socket connection error, updating status');
      setConnectionStatus(socketManager.getConnectionStatus());
    });
    socketManager.onCodeOutput((data) => {
      setRunOutput(data);
    });

    // Check initial connection status
    const checkConnection = () => {
      const status = socketManager.getConnectionStatus();
      console.log('[DEBUG] Initial connection status:', status);
      setConnectionStatus(status);
    };

    // Check immediately and after a short delay
    checkConnection();
    const timeoutId = setTimeout(checkConnection, 1000);

    // Cleanup on unmount
    return () => {
      console.log('[DEBUG] Cleaning up socket event listeners in App.jsx');
      clearTimeout(timeoutId);
      socketManager.off('room-joined', handleRoomJoined);
      socketManager.off('user-joined', handleUserJoined);
      socketManager.off('user-left', handleUserLeft);
      socketManager.off('code-updated', handleCodeUpdated);
      socketManager.off('chat-message', handleChatMessageReceived);
      socketManager.off('language-updated', handleLanguageUpdated);
      socketManager.off('cursor-updated', handleCursorUpdated);
      socketManager.off('user-typing', handleUserTyping);
      socketManager.off('error', handleError);
      socketManager.off('connect');
      socketManager.off('disconnect');
      socketManager.off('connect_error');
      socketManager.offCodeOutput();
    };
  }, []);

  useEffect(() => {
    const socket = socketManager.getSocket();
    socket.onAny((event, ...args) => {
      console.log('[DEBUG] Received event:', event, args);
    });
    return () => {
      socket.offAny();
    };
  }, []);

  const handleRoomJoined = (data) => {
    console.log('[DEBUG] Received room-joined event:', data);
    if (!data || !data.roomId) {
      setError('Failed to join room: Invalid data received from server.');
      console.error('[ERROR] Invalid room-joined data:', data);
      return;
    }
    setCurrentRoom(data.roomId);
    setRoomData(data);
    // Set current user from the users array
    const currentUser = data.users.find(user => user.id === socketManager.getSocket().id);
    setCurrentUser(currentUser);
    setError(null);
    console.log('Joined room:', data);
    console.log('Current user:', currentUser);
    // Call the onComplete callback if it exists
    if (window.joinRoomCallback) {
      window.joinRoomCallback(true);
      window.joinRoomCallback = null;
    }
  };

  const handleUserJoined = (data) => {
    console.log('[DEBUG] User joined:', data.user.username);
    
    // Play join sound (but not for the current user)
    if (data.user.id !== socketManager.getSocket().id) {
      audioManager.playUserJoin();
      
      // Add notification
      const notification = {
        id: Date.now(),
        type: 'user-join',
        message: `${data.user.username} joined the room`,
        user: data.user
      };
      setNotifications(prev => [...prev, notification]);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 3000);
    }
    
    setRoomData(prev => ({
      ...prev,
      users: [...prev.users, data.user],
      userCount: data.userCount
    }));
  };

  const handleUserLeft = (data) => {
    setRoomData(prev => ({
      ...prev,
      users: prev.users.filter(user => user.id !== data.userId),
      userCount: prev.userCount - 1
    }));
  };

  const handleCodeUpdated = (data) => {
    console.log('[DEBUG] Code updated from server:', data);
    setRoomData(prev => ({
      ...prev,
      code: data.code
    }));
  };

  const handleChatMessageReceived = (message) => {
    console.log('[DEBUG] Chat message received:', message);
    
    // Play message sound (but not for messages from current user)
    if (message.userId !== socketManager.getSocket().id) {
      audioManager.playMessage();
    }
    
    setRoomData(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
  };

  const handleLanguageUpdated = (data) => {
    console.log('[DEBUG] Language updated from server:', data);
    setRoomData(prev => ({
      ...prev,
      language: data.language,
      code: data.code
    }));
  };

  const handleCursorUpdated = (data) => {
    console.log('[DEBUG] Cursor updated from server:', data);
    setRoomData(prev => ({
      ...prev,
      users: prev.users.map(user => 
        user.id === data.userId 
          ? { ...user, cursor: data.cursor }
          : user
      )
    }));
  };

  const handleUserTyping = (data) => {
    console.log('[DEBUG] User typing status updated:', data);
    setRoomData(prev => ({
      ...prev,
      users: prev.users.map(user => 
        user.id === data.userId 
          ? { ...user, isTyping: data.isTyping }
          : user
      )
    }));
  };

  const handleError = (error) => {
    setError(error.message);
    console.error('Socket error:', error);
    // Call the onComplete callback if it exists
    if (window.joinRoomCallback) {
      window.joinRoomCallback(false);
      window.joinRoomCallback = null;
    }
  };

  const handleJoinRoom = (roomId, username, language, onComplete) => {
    console.log('[DEBUG] Attempting to join room:', { roomId, username, language });
    setError(null);
    
    // Store callback for later use
    if (onComplete) {
      window.joinRoomCallback = onComplete;
    }
    
    try {
      // Ensure socket is connected and wait for connection
      socketManager.connect();
      
      // Wait for connection to be established
      socketManager.waitForConnection(10000)
        .then(() => {
          console.log('[DEBUG] Socket connected, joining room...');
          socketManager.joinRoom(roomId, username, language);
        })
        .catch((error) => {
          console.error('[ERROR] Failed to establish connection:', error);
          setError('Failed to establish connection. Please try again.');
          if (onComplete) onComplete(false);
        });
        
    } catch (error) {
      console.error('[ERROR] Failed to send join room request:', error);
      setError('Failed to send join room request. Please try again.');
      if (onComplete) onComplete(false);
    }
  };

  const handleForceReconnect = () => {
    console.log('[DEBUG] Force reconnecting...');
    socketManager.forceReconnect();
    setError(null);
  };

  const handleLeaveRoom = () => {
    socketManager.disconnect();
    setCurrentRoom(null);
    setCurrentUser(null);
    setRoomData(null);
    setError(null);
    // Reconnect for future use
    socketManager.connect();
  };

  const handleCodeChange = (code) => {
    socketManager.sendCodeChange(code);
  };

  const handleCursorUpdate = (cursor) => {
    socketManager.sendCursorUpdate(cursor);
  };

  const handleTypingStart = () => {
    socketManager.sendTypingStart();
  };

  const handleTypingStop = () => {
    socketManager.sendTypingStop();
  };

  const handleChatMessage = (message) => {
    socketManager.sendChatMessage(message);
  };

  const handleLanguageChange = (language) => {
    socketManager.sendLanguageChange(language);
  };

  const handleRunCode = (code, language) => {
    setRunOutput({ output: '', error: '' }); // Clear previous output
    socketManager.sendRunCode(code, language);
  };

  // If not in a room, show join form
  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-600 to-purple-600 rounded-3xl mb-6 shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold gradient-text mb-4">CodeCollab</h1>
            <p className="text-gray-400 text-xl">Real-time collaborative code editor</p>
            <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Real-time collaboration</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Live chat</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Multiple languages</span>
              </div>
            </div>
          </div>
          
          <RoomJoin 
            onJoinRoom={handleJoinRoom}
            error={error}
            connectionStatus={connectionStatus}
          />
        </div>
      </div>
    );
  }

  // Show collaborative editor
  return (
    <div className="h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-dark-800/95 to-dark-700/95 backdrop-blur-sm border-b border-dark-600/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold gradient-text">CodeCollab</h1>
            </div>

            {/* Room Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-300">Room:</span>
                <div className="bg-dark-700/80 backdrop-blur-sm border border-dark-600/50 px-3 py-1 rounded-lg">
                  <span className="text-white font-mono text-sm font-bold">
                    {currentRoom}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-300">Users:</span>
                <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-3 py-1 rounded-lg">
                  <span className="text-white text-sm font-bold">
                    {roomData?.users?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Connection Status and Actions */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connectionStatus.isConnected ? 'status-online' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-300 font-medium">
                  {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {connectionStatus.socketId && (
                <div className="text-xs text-gray-500 font-mono">
                  ID: {connectionStatus.socketId.slice(-6)}
                </div>
              )}
            </div>
            
            {/* Reconnect Button */}
            {!connectionStatus.isConnected && (
              <button
                onClick={handleForceReconnect}
                className="btn-primary text-sm px-3 py-1"
                title="Reconnect to server"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Reconnect</span>
                </div>
              </button>
            )}
            
            {/* Sound Toggle Button */}
            <button
              onClick={() => audioManager.toggleSound()}
              className={`p-2 rounded-lg transition-all duration-300 ${
                audioManager.isSoundEnabled() 
                  ? 'bg-primary-600/20 text-primary-400 hover:bg-primary-600/30' 
                  : 'bg-dark-600/50 text-gray-400 hover:bg-dark-600/70'
              }`}
              title={audioManager.isSoundEnabled() ? 'Disable sounds' : 'Enable sounds'}
            >
              {audioManager.isSoundEnabled() ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>
            
            <button
              onClick={handleLeaveRoom}
              className="btn-secondary text-sm"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Leave Room</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col min-h-0">
          <Editor
            code={roomData?.code || ''}
            language={roomData?.language || 'javascript'}
            onCodeChange={handleCodeChange}
            onCursorUpdate={handleCursorUpdate}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            onLanguageChange={handleLanguageChange}
            users={roomData?.users || []}
            onRunCode={handleRunCode}
            runOutput={runOutput}
          />
        </div>

        {/* Sidebar */}
        <div className="w-96 flex flex-col min-h-0">
          <Sidebar users={roomData?.users || []} />
          <Chat
            messages={roomData?.messages || []}
            onSendMessage={handleChatMessage}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            users={roomData?.users || []}
          />
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-red-600/90 to-red-500/90 backdrop-blur-sm text-white px-6 py-4 rounded-2xl shadow-2xl animate-fade-in-up border border-red-500/50 max-w-md">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold">Error</h4>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Join Notifications */}
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="fixed top-6 right-6 bg-gradient-to-r from-green-600/90 to-emerald-500/90 backdrop-blur-sm text-white px-6 py-4 rounded-2xl shadow-2xl animate-fade-in-up border border-green-500/50 max-w-md z-50"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {notification.user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-semibold text-sm">User Joined</h4>
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App; 