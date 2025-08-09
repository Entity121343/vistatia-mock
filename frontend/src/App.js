import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { 
  MessageCircle, 
  Plus, 
  Settings, 
  LogOut, 
  Send, 
  Menu, 
  X, 
  FileText, 
  Gavel, 
  AlertTriangle, 
  FileCheck, 
  Book, 
  MessageSquare, 
  BarChart3, 
  Target, 
  ArrowRight, 
  Search, 
  Mic, 
  Users 
} from 'lucide-react';
import './App.css';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoerVoyM7X0Htjp1Gxkw01qxf1BHLulNw",
  authDomain: "vistatia-92a9a.firebaseapp.com",
  projectId: "vistatia-92a9a",
  storageBucket: "vistatia-92a9a.firebasestorage.app",
  messagingSenderId: "336432337590",
  appId: "1:336432337590:web:ac9a4b630de535dbdc0c17",
  measurementId: "G-Z8NS9TBVHM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// MUN Tasks with icons and descriptions - updated to match backend
const MUN_TASKS = [
  { 
    id: 'research', 
    name: 'Research', 
    icon: Search, 
    description: 'Background research on topics and positions',
    color: 'bg-blue-500'
  },
  { 
    id: 'amendments', 
    name: 'Amendments', 
    icon: FileText, 
    description: 'Draft and refine amendments to resolutions',
    color: 'bg-green-500'
  },
  { 
    id: 'assessment', 
    name: 'Situation Assessment', 
    icon: AlertTriangle, 
    description: 'Analyze current global situations',
    color: 'bg-orange-500'
  },
  { 
    id: 'directive', 
    name: 'Directive Generator', 
    icon: Gavel, 
    description: 'Create formal directives',
    color: 'bg-purple-500'
  },
  { 
    id: 'draft resolution', 
    name: 'Draft Resolution', 
    icon: FileCheck, 
    description: 'Draft comprehensive resolutions',
    color: 'bg-indigo-500'
  },
  { 
    id: 'background guide', 
    name: 'Background Guide', 
    icon: Book, 
    description: 'Country-specific background guides',
    color: 'bg-cyan-500'
  },
  { 
    id: 'poi/poo', 
    name: 'POI/POO/R2R', 
    icon: MessageSquare, 
    description: 'Points of Information, Order, and Right to Reply',
    color: 'bg-pink-500'
  },
  { 
    id: 'post assessment', 
    name: 'Post Assessment', 
    icon: BarChart3, 
    description: 'Evaluate committee performance',
    color: 'bg-emerald-500'
  },
  { 
    id: 'probable outcomes', 
    name: 'Probable Outcomes', 
    icon: Target, 
    description: 'Predict scenario outcomes',
    color: 'bg-amber-500'
  },
  { 
    id: 'rebuttal', 
    name: 'Rebuttal', 
    icon: ArrowRight, 
    description: 'Counter-arguments and rebuttals',
    color: 'bg-red-500'
  },
  { 
    id: 'speech', 
    name: 'Speech', 
    icon: Mic, 
    description: 'Formal speeches and opening statements',
    color: 'bg-teal-500'
  },
  { 
    id: 'strategy', 
    name: 'Strategy', 
    icon: Users, 
    description: 'Negotiation and committee strategy',
    color: 'bg-slate-500'
  }
];

// Login Component
const LoginPage = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user);
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gavel className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Vistatia</h1>
          <p className="text-gray-300">Your AI-powered diplomatic intelligence platform</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <div className="mt-6 text-center text-sm text-gray-400">
          Access all diplomatic tools and intelligence features with your Google account
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [chatSessions, setChatSessions] = useState({});
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [amendmentText, setAmendmentText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  // Auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat sessions for selected task
  useEffect(() => {
    if (user && selectedTask) {
      loadChatSessions(selectedTask.id);
      // Reset amendment text when switching tasks
      if (selectedTask.id !== 'amendments') {
        setAmendmentText('');
      }
    }
  }, [user, selectedTask]);

  const loadChatSessions = async (taskId) => {
    try {
      const response = await axios.get(`${API}/chat/sessions/${user.uid}/${taskId}`);
      setChatSessions(prev => ({
        ...prev,
        [taskId]: response.data
      }));
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  };

  const createNewSession = async (taskId) => {
    try {
      const response = await axios.post(
        `${API}/chat/sessions?userId=${user.uid}&task=${taskId}&title=New Chat`
      );
      
      // Update sessions list
      await loadChatSessions(taskId);
      
      // Set as current session
      setCurrentSession(response.data);
      setMessages([]);
      
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const selectSession = async (session) => {
    setCurrentSession(session);
    setMessages(session.messages || []);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedTask || !currentSession) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Prepare request data for your backend
      const requestData = {
        userId: user.uid,
        task: selectedTask.id,
        prompt: inputMessage.trim()
      };

      // Add amendmentPrompt for amendments task
      if (selectedTask.id === 'amendments' && amendmentText) {
        requestData.amendmentPrompt = amendmentText;
      }

      // Send to your real backend
      const response = await axios.post('https://vistatia-backend.onrender.com/generate', requestData);

      const assistantMessage = {
        id: Date.now().toString() + '_ai',
        type: 'assistant',
        content: response.data.result || response.data.response || response.data.message || response.data,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update session in local database (optional - for chat history)
      try {
        await axios.post(`${API}/chat/sessions/${currentSession.id}/messages`, userMessage);
        await axios.post(`${API}/chat/sessions/${currentSession.id}/messages`, assistantMessage);
      } catch (dbError) {
        console.log('Chat history save failed:', dbError);
        // Continue even if local storage fails
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      let errorContent = 'Sorry, I encountered an error. Please try again.';
      
      if (error.response?.data?.message) {
        errorContent = `Error: ${error.response.data.message}`;
      } else if (error.response?.data) {
        errorContent = `Error: ${error.response.data}`;
      } else if (error.message) {
        errorContent = `Connection error: ${error.message}`;
      }

      const errorMessage = {
        id: Date.now().toString() + '_error',
        type: 'assistant',
        content: errorContent,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setSelectedTask(null);
      setChatSessions({});
      setCurrentSession(null);
      setMessages([]);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading MUN Assistant...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <div className="h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">MUN Assistant</h1>
              <p className="text-gray-400 text-sm">Welcome, {user.displayName}</p>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-gray-300 font-medium mb-3">MUN Tasks</h2>
          <div className="space-y-2">
            {MUN_TASKS.map((task) => {
              const Icon = task.icon;
              const sessions = chatSessions[task.id] || [];
              
              return (
                <div key={task.id}>
                  <div
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTask?.id === task.id
                        ? 'bg-blue-600/20 border border-blue-500/30'
                        : 'bg-slate-700/30 hover:bg-slate-700/50'
                    }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${task.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-sm font-medium truncate">{task.name}</h3>
                        <p className="text-gray-400 text-xs truncate">{task.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sessions for selected task */}
                  {selectedTask?.id === task.id && (
                    <div className="ml-4 mt-2 space-y-1">
                      <button
                        onClick={() => createNewSession(task.id)}
                        className="w-full p-2 text-left text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        New Chat
                      </button>
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-2 rounded cursor-pointer text-sm truncate ${
                            currentSession?.id === session.id
                              ? 'bg-blue-600/20 text-blue-300'
                              : 'text-gray-400 hover:text-gray-300 hover:bg-slate-700/30'
                          }`}
                          onClick={() => selectSession(session)}
                        >
                          <MessageCircle className="w-3 h-3 inline mr-2" />
                          {session.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <button className="w-full p-2 text-gray-400 hover:text-gray-300 flex items-center gap-3 text-sm">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full p-2 text-gray-400 hover:text-red-400 flex items-center gap-3 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-gray-300 rounded-lg hover:bg-slate-700/30"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {selectedTask && (
              <>
                <div className={`w-8 h-8 ${selectedTask.color} rounded-lg flex items-center justify-center`}>
                  {React.createElement(selectedTask.icon, { className: "w-4 h-4 text-white" })}
                </div>
                <div>
                  <h2 className="text-white font-medium">{selectedTask.name}</h2>
                  {currentSession && (
                    <p className="text-gray-400 text-sm">{currentSession.title}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedTask ? (
          currentSession ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 mt-16">
                    <div className={`w-16 h-16 ${selectedTask.color} rounded-full flex items-center justify-center mx-auto mb-4 opacity-50`}>
                      {React.createElement(selectedTask.icon, { className: "w-8 h-8 text-white" })}
                    </div>
                    <h3 className="text-lg font-medium mb-2">Start your {selectedTask.name} session</h3>
                    <p className="text-sm">{selectedTask.description}</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white ml-12'
                        : 'bg-slate-700/50 text-gray-100 mr-12'
                    }`}>
                      {message.type === 'assistant' ? (
                        <div className="prose prose-invert max-w-none">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      <div className={`text-xs mt-2 opacity-70 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700/50 text-gray-100 p-4 rounded-2xl mr-12">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-700 p-4">
                {/* Amendment Input for amendments task */}
                {selectedTask.id === 'amendments' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amendment Text (Optional)
                    </label>
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <textarea
                        value={amendmentText}
                        onChange={(e) => setAmendmentText(e.target.value)}
                        placeholder="Paste the original text you want to amend here..."
                        className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none"
                        rows="3"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 items-end">
                  <div className="flex-1 bg-slate-700/50 rounded-2xl p-3">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Ask about ${selectedTask.name.toLowerCase()}...`}
                      className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none"
                      rows="1"
                      style={{ minHeight: '24px', maxHeight: '120px' }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white p-3 rounded-xl transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <h3 className="text-lg font-medium mb-2">Select or create a chat session</h3>
                <p className="text-sm">Choose an existing session or create a new one to get started</p>
              </div>
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Gavel className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Welcome to MUN Assistant</h3>
              <p className="text-sm">Select a task from the sidebar to begin your MUN preparation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;