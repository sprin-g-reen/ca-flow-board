import { useState } from 'react';
import { AIChatbox } from './AIChatbox';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Global AI Chatbox that can be accessed from anywhere in the app
 * Only visible to authenticated users
 */
export const GlobalAIChatbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      <AIChatbox isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Floating AI Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg hover:scale-110 transition-transform z-50"
        title="Open AI Assistant"
      >
        <Bot className="h-8 w-8" />
      </Button>
    </>
  );
};
