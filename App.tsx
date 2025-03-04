import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Users, Menu, X } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import UserList from './components/UserList';
import { Message, User as UserType } from './types';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [users] = useState<UserType[]>([
    { id: '1', name: 'John Doe', online: true },
    { id: '2', name: 'Jane Smith', online: true },
    { id: '3', name: 'Bob Johnson', online: false },
  ]);
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to WebSocket server
  useEffect(() => {
    if (isUsernameSet && !ws.current) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
      const wsUrl = `${protocol}//${host}`;
      
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('Connected to WebSocket server');
        setIsConnected(true);
      };
      
      ws.current.onclose = () => {
        console.log('Disconnected from WebSocket server');
        setIsConnected(false);
      };
      
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'history') {
          setMessages(data.data);
        } else if (data.type === 'message') {
          setMessages(prev => [...prev, data.data]);
        }
      };
    }
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [isUsernameSet]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !isConnected || !ws.current) return;
    
    const message = {
      id: crypto.randomUUID(),
      sender: username,
      content: messageInput.trim(),
    };
    
    ws.current.send(JSON.stringify(message));
    setMessageInput('');
  };

  const handleSetUsername = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) return;
    
    setIsUsernameSet(true);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile menu button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-20 bg-indigo-600 text-white p-2 rounded-full shadow-lg"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        {showSidebar ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      {/* Sidebar */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 fixed md:static z-10 w-64 h-full bg-indigo-800 text-white shadow-lg`}>
        <div className="p-4">
          <h1 className="text-xl font-bold flex items-center">
            <Users className="mr-2" /> Real-time Chat
          </h1>
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Online Users</h2>
            <UserList users={users} />
          </div>
        </div>
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {!isUsernameSet ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">Join the Chat</h2>
              <form onSubmit={handleSetUsername} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Choose a username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 py-2 px-3 border"
                      placeholder="Your name"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Join Chat
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b p-4 shadow-sm">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold text-gray-800">Chat Room</h2>
                <div className="ml-auto text-sm text-gray-500">
                  Logged in as <span className="font-semibold text-indigo-600">{username}</span>
                </div>
              </div>
            </div>
            
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender === username}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message input */}
            <div className="bg-white border-t p-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Type a message..."
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  disabled={!isConnected}
                >
                  <Send size={20} />
                </button>
              </form>
              {!isConnected && (
                <div className="text-red-500 text-sm mt-2">
                  Disconnected from server. Please refresh the page.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;