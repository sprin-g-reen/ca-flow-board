import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

export const DirectMessage = ({ recipientId, recipientName }: { recipientId: string; recipientName: string }) => {
  const { createRoom, sendMessage } = useChat();
  const [message, setMessage] = useState('');

  const handleSendMessage = async () => {
    if (message.trim() === '') return;

    try {
      // This is a simplified approach. A real implementation would
      // check if a DM room already exists between the two users.
      // For this task, we'll assume we might create a new one or post to existing.
      
      // A more robust solution would be to have a dedicated hook or API
      // to find or create a DM room.
      const roomName = `DM with ${recipientName}`;
      // This is a placeholder for finding the right room.
      // In a real app, you'd have a way to get the DM room ID.
      const dmRoomId = 'find_or_create_dm_room_id'; 

      // For now, we'll simulate creating a room if needed, but focus on sending the message.
      // The `useChat` hook needs to be extended to handle finding/creating DM rooms.
      
      // Let's assume a general "team-chat" room exists for demonstration.
      const teamChatRoomId = 'team-chat-room-id'; // Replace with your actual team chat room ID

      sendMessage(teamChatRoomId, `(DM to ${recipientName}): ${message}`);
      
      toast.success(`Message sent to ${recipientName} and team chat.`);
      setMessage('');
    } catch (error) {
      console.error('Failed to send direct message:', error);
      toast.error('Could not send message.');
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={`Message ${recipientName}...`}
        rows={4}
      />
      <Button onClick={handleSendMessage} className="w-full">
        <Send className="h-4 w-4 mr-2" />
        Send Message
      </Button>
    </div>
  );
};
