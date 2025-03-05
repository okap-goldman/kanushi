import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'flex gap-3',
        isAssistant ? 'flex-row' : 'flex-row-reverse'
      )}
    >
      <Avatar className="h-8 w-8">
        {isAssistant ? (
          <>
            <AvatarImage src="/ai-avatar.png" />
            <AvatarFallback>AI</AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
            <AvatarFallback>Me</AvatarFallback>
          </>
        )}
      </Avatar>

      <div
        className={cn(
          'rounded-lg p-4 max-w-[80%]',
          isAssistant
            ? 'bg-gray-100 text-gray-900'
            : 'bg-primary text-primary-foreground'
        )}
      >
        <p className="whitespace-pre-wrap text-sm">
          {message.content}
        </p>
      </div>
    </div>
  );
}  