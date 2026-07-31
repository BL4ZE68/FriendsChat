import { useState, useEffect } from 'react';
import { AuthPage } from './components/AuthPage';
import { ConversationList } from './components/ConversationList';
import { ChatWindow } from './components/ChatWindow';
import { CreateConversationModal } from './components/CreateConversationModal';
import DirectChatModal from './components/DirectChatModal';
import { useAuthStore, useChatStore, User, Message, loadConversationsForUser, subscribeToMessages, fetchMessagesForConversation, createConversationWithUser } from './store';

function App() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { conversations, addConversation, setActiveConversation, activeConversationId } = useChatStore() as any;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirectOpen, setIsDirectOpen] = useState(false);

  // Load conversations and subscribe to realtime when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversationsForUser(user.id).catch((err) => console.error(err));
      subscribeToMessages();
    }
  }, [isAuthenticated, user]);

  // When active conversation changes, fetch its messages
  useEffect(() => {
    if (activeConversationId) {
      fetchMessagesForConversation(activeConversationId).catch((err) => console.error(err));
    }
  }, [activeConversationId]);

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
        avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=world-crew',
        isGroup: true
      };

      addConversation(mockConversation);
      setActiveConversation('1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleDirectCreate = async (partnerId: string, partnerName?: string, partnerEmail?: string) => {
    if (!user) return;
    await createConversationWithUser({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userAvatar: user.avatar,
      partnerId,
      partnerName,
      partnerEmail,
      name: partnerName || 'Direct Chat'
    });
    setIsDirectOpen(false);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-200/30 via-pink-200/30 to-red-200/30">
      <ConversationList onLogout={() => logout()} onNewConversation={() => setIsModalOpen(true)} onDirectStart={() => setIsDirectOpen(true)} />
      <div className="flex-1 flex flex-col">
        <ChatWindow />
      </div>
      <CreateConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateConversation}
      />
      <DirectChatModal isOpen={isDirectOpen} onClose={() => setIsDirectOpen(false)} onCreate={handleDirectCreate} />
    </div>
  );
}

export default App;
