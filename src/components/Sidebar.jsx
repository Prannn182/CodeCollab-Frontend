import React from 'react';

const Sidebar = ({ users }) => {
  const getStatusColor = (user) => {
    if (user.isTyping) return 'status-typing';
    return 'status-online';
  };

  const getStatusText = (user) => {
    if (user.isTyping) return 'typing...';
    return 'online';
  };

  const getStatusIcon = (user) => {
    if (user.isTyping) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    );
  };

  return (
    <div className="sidebar flex-shrink-0 border-b border-dark-600/50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold gradient-text">Online Users</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400 font-medium">{users.length}</span>
          </div>
        </div>
        
        {users.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-dark-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">No users online</p>
            <p className="text-gray-500 text-xs mt-1">Be the first to join!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user, index) => (
              <div
                key={user.id}
                className="group flex items-center space-x-4 p-4 rounded-xl hover:bg-dark-700/50 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* User avatar */}
                <div className="relative user-avatar">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-dark-800 ${getStatusColor(user)} flex items-center justify-center`}>
                    {getStatusIcon(user)}
                  </div>
                </div>
                
                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate group-hover:text-primary-300 transition-colors">
                    {user.username}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-gray-400 text-xs font-medium">
                      {getStatusText(user)}
                    </span>
                    {user.isTyping && (
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Connection indicator */}
                <div className="flex flex-col items-end space-y-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  {user.cursor && (
                    <div className="text-xs text-gray-500 font-mono">
                      Line {Math.floor(user.cursor.line / 80) + 1}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick stats */}
        {users.length > 0 && (
          <div className="mt-6 p-4 bg-dark-800/50 rounded-xl border border-dark-600/50">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-400">{users.length}</div>
                <div className="text-xs text-gray-400">Total Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">
                  {users.filter(u => u.isTyping).length}
                </div>
                <div className="text-xs text-gray-400">Typing</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 