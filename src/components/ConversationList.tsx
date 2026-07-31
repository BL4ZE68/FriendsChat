import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Plus, LogOut } from 'lucide-react';
import { useChatStore, useAuthStore } from '../store';

interface ConversationListProps {
  onLogout: () => void;
  onNewConversation: () => void;
  onDirectStart?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ onLogout, onNewConversation, onDirectStart }) => {
  const { conversations, activeConversationId, setActiveConversation } = useChatStore();
  const { user } = useAuthStore();

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-full md:w-80 bg-gradient-to-b from-purple-500/10 to-pink-500/10 border-r border-white/20 flex flex-col md:h-full h-48"
    >
      {/* Header */}
      <motion.div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">FriendsChat</h1>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onNewConversation}
              title="Create conversation"
              className="p-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg"
            >
              <Plus size={20} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onDirectStart}
              title="New direct chat"
              className="p-2 bg-white/10 text-white rounded-lg border border-white/20"
            >
              <MessageCircle size={18} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* User Profile */}
      <motion.div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-10 h-10 rounded-full border-2 border-purple-400"
            />
            <div>
              <p className="font-bold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Online
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onLogout}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <LogOut size={18} className="text-gray-700" />
          </motion.button>
        </div>
      </motion.div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center text-gray-500"
          >
            <MessageCircle size={40} className="mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs">Create a new conversation to get started!</p>
          </motion.div>
        ) : (
          conversations.map((conv, idx) => (
            <motion.button
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveConversation(conv.id)}
              className={`w-full p-3 rounded-2xl text-left transition ${
                activeConversationId === conv.id
                  ? 'bg-gradient-to-r from-purple-400/40 to-pink-400/40 border border-purple-300/50'
                  : 'hover:bg-white/20 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={conv.avatar || conv.members[0]?.avatar || 'https://api.dicebear.com/7.x/shapes/svg?seed=default'}
                    alt={conv.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {conv.members[0]?.status === 'online' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{conv.name}</p>
                  <p className="text-xs text-gray-600 truncate">
                    {conv.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
                {conv.members.length > 1 && (
                  <span className="text-xs bg-purple-400/30 text-purple-700 px-2 py-1 rounded-full">
                    {conv.members.length}
                  </span>
                )}
              </div>
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
  );
};
