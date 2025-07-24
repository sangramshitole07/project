'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2, LogOut, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Message from './Message';
import FileUpload from './FileUpload';

interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatInterface() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    getUserDetails();
  }, []);

  const getUserDetails = async () => {
    try {
      const res = await axios.get('/api/users/me');
      setUser(res.data.data);
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const logout = async () => {
    try {
      await axios.get('/api/users/logout');
      toast.success('Logout successful');
      router.push('/login');
    } catch (error: any) {
      console.log(error.message);
      toast.error(error.message);
    }
  };
  const addMessage = (message: string, isUser: boolean) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      message,
      isUser,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleUploadSuccess = (message: string) => {
    addMessage(message, false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage(userMessage, true);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
        body: JSON.stringify({ query: userMessage }),
      });

      const result = await response.json();

      if (response.ok) {
        addMessage(result.response, false);
      } else {
        addMessage(result.error || 'Sorry, I encountered an error processing your request.', false);
      }
    } catch (error) {
      addMessage('Sorry, I encountered an error. Please try again.', false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span>CSV Data Chatbot</span>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Welcome, {user.username}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Upload a CSV file and ask questions about your data
          </p>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4">
          <FileUpload onUploadSuccess={handleUploadSuccess} />
          
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg min-h-[300px]">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Upload a CSV file and start chatting about your data!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <Message
                  key={msg.id}
                  message={msg.message}
                  isUser={msg.isUser}
                  timestamp={msg.timestamp}
                />
              ))
            )}
            {loading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your CSV data..."
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={loading || !input.trim()}
              size="icon"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}