import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, Phone, Video, Info } from 'lucide-react';
import { useChatStore, useAuthStore, Message } from '../store';
import { supabase, SUPABASE_ENABLED } from '../supabaseClient';

export const ChatWindow: React.FC = () => {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { selectedConversation, addMessage } = useChatStore();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages.length]);

  const handleSend = async () => {
    if (!message.trim() || !selectedConversation || !user) return;

    if (SUPABASE_ENABLED) {
      try {
        await supabase.from('messages').insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          sender_name: user.name,
          sender_avatar: user.avatar,
          content: message,
          is_read: true
        });
        // rely on realtime to append the message locally
        setMessage('');
      } catch (err) {
        console.error('send error', err);
        alert('Failed to send message');
      }
    } else {
      const newMessage: Message = {
        id: crypto.randomUUID(),
        conversationId: selectedConversation.id,
        senderId: user.id,
        senderName: user.name,
        senderAvatar: user.avatar,
        content: message,
        timestamp: new Date(),
        isRead: true
      };

      addMessage(newMessage);
      setMessage('');
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation || !user) return;

    if (!SUPABASE_ENABLED) {
      alert('File upload requires Supabase configuration (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)');
      return;
    }

    const filePath = `${selectedConversation.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('upload err', uploadError);
      alert('Upload failed');
      return;
    }

    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    await supabase.from('messages').insert({
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      sender_name: user.name,
      sender_avatar: user.avatar,
      content: publicUrl,
      message_type: 'file',
      file_name: file.name,
      is_read: true
    });

    // realtime will sync the message into the UI
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!selectedConversation) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/20 p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <img
            src={selectedConversation.avatar || selectedConversation.members[0]?.avatar || 'https://api.dicebear.com/7.x/shapes/svg?seed=chat'}
            alt={selectedConversation.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h2 className="font-bold text-gray-800">{selectedConversation.name}</h2>
            <p className="text-xs text-gray-600">
              {selectedConversation.members.length} members
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-white/30 rounded-lg transition"
          >
            <Phone size={20} className="text-gray-700" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-white/30 rounded-lg transition"
          >
            <Video size={20} className="text-gray-700" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-white/30 rounded-lg transition"
          >
            <Info size={20} className="text-gray-700" />
          </motion.button>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {selectedConversation.messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex gap-2 ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              {msg.senderId !== user?.id && (
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  msg.senderId === user?.id
                    ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-br-none'
                    : 'bg-white/60 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="text-sm">
                  {msg.content}
                </p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-t border-white/20 p-4 bg-white/30"
      >
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFileClick}
            className="p-2 hover:bg-white/30 rounded-lg transition"
          >
            <Paperclip size={20} className="text-gray-700" />
          </motion.button>
          <input ref={fileInputRef} onChange={handleFileChange} type="file" className="hidden" />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-white/60 border border-white/30 rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white/80 transition"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-white/30 rounded-lg transition"
          >
            <Smile size={20} className="text-gray-700" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full font-bold hover:shadow-lg transition flex items-center gap-2"
          >
            <Send size={18} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
