import React, { useState, useEffect } from 'react';
import { AuthPage } from './components/AuthPage';
import { ConversationList } from './components/ConversationList';
import { ChatWindow } from './components/ChatWindow';
import { CreateConversationModal } from './components/CreateConversationModal';
import { useAuthStore, useChatStore, User, Message } from './store';

function App() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { conversations, addConversation, setActiveConversation } = useChatStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && conversations.length === 0) {
      const mockUser: User = {
        id: '2',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
        status: 'online'
      };

      const mockConversation = {
        id: '1',
        name: '🌍 Around the World Crew',
        members: [mockUser],
        messages: [
          {
            id: '1',
            conversationId: '1',
            senderId: '2',
            senderName: 'Alice',
            senderAvatar: mockUser.avatar,
            content: 'Hey! How are you doing? 👋',
            timestamp: new Date(Date.now() - 60000),
            isRead: true
          },
          {
            id: '2',
            conversationId: '1',
            senderId: user?.id || '1',
            senderName: user?.name || 'You',
            senderAvatar: user?.avatar || '',
            content: 'I am doing great! Just excited to stay connected! 😊',
            timestamp: new Date(Date.now() - 30000),
            isRead: true
          },
          {
            id: '3',
            conversationId: '1',
            senderId: '2',
            senderName: 'Alice',
            senderAvatar: mockUser.avatar,
            content: 'Same here! Let\'s plan a trip together soon! ✈️',
            timestamp: new Date(),
            isRead: false
          }
        ] as Message[],
        avatar: '🌍',
        isGroup: true
      };

      addConversation(mockConversation);
      setActiveConversation('1');
    }
  }, [isAuthenticated]);

  const handleCreateConversation = (name: string, memberIds: string[]) => {
    const mockConversation = {
      id: Math.random().toString(),
      name,
      members: memberIds.map((id) => ({
        id,
        name: `Friend ${id}`,
        email: `friend${id}@example.com`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
        status: 'online' as const
      })),
      messages: [] as Message[],
      isGroup: memberIds.length > 1
    };

    addConversation(mockConversation);
    setActiveConversation(mockConversation.id);
  };

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-200/30 via-pink-200/30 to-red-200/30">
      <ConversationList onLogout={() => logout()} />
      <div className="flex-1 flex flex-col">
        <ChatWindow />
      </div>
      <CreateConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateConversation}
      />
    </div>
  );
}

export default App;
