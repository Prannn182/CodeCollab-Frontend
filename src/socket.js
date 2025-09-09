import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isInitializing = false;
    this._initSocket();
  }

  _initSocket() {
    if (this.socket || this.isInitializing) return;
    
    this.isInitializing = true;
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';
    console.log('[DEBUG] Initializing socket connection to:', serverUrl);
    
    try {
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 20000,
        forceNew: false,
        upgrade: true,
        rememberUpgrade: true
      });

      this.socket.on('connect', () => {
        console.log('[DEBUG] Socket connected:', this.socket.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.isInitializing = false;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[DEBUG] Socket disconnected:', reason);
        this.isConnected = false;
        this.isInitializing = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('[DEBUG] Socket connection error:', error);
        this.isInitializing = false;
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('[DEBUG] Socket reconnected after', attemptNumber, 'attempts');
        this.isConnected = true;
        this.isInitializing = false;
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('[DEBUG] Socket reconnection error:', error);
        this.isInitializing = false;
      });

      this.socket.on('reconnect_failed', () => {
        console.error('[DEBUG] Socket reconnection failed');
        this.isInitializing = false;
      });

      this.socket.on('error', (error) => {
        console.error('[DEBUG] Socket error:', error);
        this.isInitializing = false;
      });

    } catch (error) {
      console.error('[ERROR] Failed to initialize socket:', error);
      this.isInitializing = false;
    }
  }

  connect() {
    if (!this.socket || !this.socket.connected) {
      this._initSocket();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isInitializing = false;
    }
  }

  getSocket() {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }
    return this.socket;
  }

  // Room management
  joinRoom(roomId, username, language = 'javascript') {
    try {
      const socket = this.getSocket();
      if (!socket || !socket.connected) {
        throw new Error('Socket not connected');
      }
      console.log('[DEBUG] Sending join-room event:', { roomId, username, language });
      socket.emit('join-room', { roomId, username, language });
    } catch (error) {
      console.error('[ERROR] Failed to join room:', error);
      throw error;
    }
  }

  // Code editing
  sendCodeChange(code) {
    const socket = this.getSocket();
    socket.emit('code-change', { code });
  }

  // Cursor tracking
  sendCursorUpdate(cursor) {
    const socket = this.getSocket();
    socket.emit('cursor-update', { cursor });
  }

  // Typing indicators
  sendTypingStart() {
    const socket = this.getSocket();
    socket.emit('typing-start');
  }

  sendTypingStop() {
    const socket = this.getSocket();
    socket.emit('typing-stop');
  }

  // Chat messages
  sendChatMessage(message) {
    const socket = this.getSocket();
    socket.emit('chat-message', { message });
  }

  // Language changes
  sendLanguageChange(language) {
    const socket = this.getSocket();
    socket.emit('language-change', { language });
  }

  // Room info
  getRoomInfo() {
    const socket = this.getSocket();
    socket.emit('get-room-info');
  }

  // Event listeners
  on(event, callback) {
    const socket = this.getSocket();
    console.log(`[DEBUG] Setting up socket listener for event: ${event}`);
    socket.on(event, callback);
  }

  off(event, callback) {
    const socket = this.getSocket();
    socket.off(event, callback);
  }

  // Connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id,
      isInitializing: this.isInitializing
    };
  }

  // Force reconnection
  forceReconnect() {
    console.log('[DEBUG] Forcing reconnection...');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.isInitializing = false;
    this.reconnectAttempts = 0;
    this._initSocket();
  }

  // Check if connection is healthy
  isConnectionHealthy() {
    return this.socket && this.socket.connected && this.isConnected;
  }

  // Wait for connection
  waitForConnection(timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (this.isConnectionHealthy()) {
        resolve(this.socket);
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, timeout);

      const checkConnection = () => {
        if (this.isConnectionHealthy()) {
          clearTimeout(timer);
          resolve(this.socket);
        } else if (!this.isInitializing) {
          this._initSocket();
          setTimeout(checkConnection, 100);
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  // Run code
  sendRunCode(code, language) {
    const socket = this.getSocket();
    socket.emit('run-code', { code, language });
  }

  onCodeOutput(callback) {
    const socket = this.getSocket();
    socket.on('code-output', callback);
  }

  offCodeOutput(callback) {
    const socket = this.getSocket();
    socket.off('code-output', callback);
  }
}

// Create a singleton instance
const socketManager = new SocketManager();

export default socketManager; 