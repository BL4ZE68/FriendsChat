import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, members: string[]) => void;
}

export const CreateConversationModal: React.FC<CreateConversationModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [name, setName] = React.useState('');
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([]);

  const friendsList = [
    { id: '2', name: 'Alice', email: 'alice@example.com' },
    { id: '3', name: 'Bob', email: 'bob@example.com' },
    { id: '4', name: 'Charlie', email: 'charlie@example.com' },
    { id: '5', name: 'Diana', email: 'diana@example.com' }
  ];

  const handleCreate = () => {
    if (name.trim() && selectedMembers.length > 0) {
      onCreate(name, selectedMembers);
      setName('');
      setSelectedMembers([]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">New Conversation</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Conversation Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Beach Trip 2024"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Friends
            </label>
            <div className="space-y-2">
              {friendsList.map((friend) => (
                <motion.label
                  key={friend.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(friend.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers([...selectedMembers, friend.id]);
                      } else {
                        setSelectedMembers(
                          selectedMembers.filter((id) => id !== friend.id)
                        );
                      }
                    }}
                    className="w-5 h-5 text-purple-400 rounded"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{friend.name}</p>
                    <p className="text-xs text-gray-600">{friend.email}</p>
                  </div>
                </motion.label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreate}
              disabled={!name.trim() || selectedMembers.length === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Create
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
