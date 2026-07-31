import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface DirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (partnerId: string, partnerName?: string, partnerEmail?: string) => void;
}

export const DirectChatModal: React.FC<DirectChatModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [partnerId, setPartnerId] = React.useState('');
  const [partnerName, setPartnerName] = React.useState('');
  const [partnerEmail, setPartnerEmail] = React.useState('');

  const handleCreate = () => {
    if (!partnerId.trim()) return;
    onCreate(partnerId.trim(), partnerName.trim() || undefined, partnerEmail.trim() || undefined);
    setPartnerId('');
    setPartnerName('');
    setPartnerEmail('');
    onClose();
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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">New Direct Chat</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Partner ID</label>
            <input
              type="text"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              placeholder="Partner user id (uuid or string)"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Partner Name (optional)</label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="e.g., Alice"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Partner Email (optional)</label>
            <input
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder="alice@example.com"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
            />
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
              disabled={!partnerId.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Start Chat
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DirectChatModal;
