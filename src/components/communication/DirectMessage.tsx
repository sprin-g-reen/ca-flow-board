import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

export const DirectMessage = ({ recipientId, recipientName }: { recipientId: string; recipientName: string }) => {
  const { rooms, createRoomAsync, sendMessageAsync } = useChat();
  const [message, setMessage] = useState('');

  const handleSendMessage = async () => {
    if (message.trim() === '') return;

    try {
      // Try to find an existing direct room with the recipient
      let room = (rooms || []).find((r: any) => r.type === 'direct' &&
        Array.isArray(r.participants) && r.participants.some((p: any) => (p.user?._id || p.user) === recipientId)
      );

      // If not found, create a direct room
      if (!room) {
        const created = await createRoomAsync({ name: `DM with ${recipientName}`, type: 'direct', participants: [recipientId] });
        room = created;
      }

      const roomId = room._id || room.id;
      if (!roomId) throw new Error('Could not determine room id');

      await sendMessageAsync(roomId, message);
      toast.success(`Message sent to ${recipientName}.`);
      setMessage('');
    } catch (error) {
      console.error('Failed to send direct message:', error);
      toast.error('Could not send message.');
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Message ${recipientName}...`}
          rows={6}
          className="resize-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>
      <Button 
        onClick={handleSendMessage} 
        className="w-full h-11 text-base font-medium"
        disabled={message.trim() === ''}
      >
        <Send className="h-4 w-4 mr-2" />
        Send Message
      </Button>
    </div>
  );
};
