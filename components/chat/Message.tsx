'use client';

import { Card } from '@/components/ui/card';
import { User, Bot } from 'lucide-react';

interface MessageProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
}

export default function Message({ message, isUser, timestamp }: MessageProps) {
  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500' : 'bg-gray-600'
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>
      
      <Card className={`max-w-[80%] ${isUser ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
        <div className="p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
          {timestamp && (
            <p className="text-xs text-gray-500 mt-2">
              {timestamp.toLocaleTimeString()}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}