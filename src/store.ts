import { create } from 'zustand';
import { supabase, SUPABASE_ENABLED } from './supabaseClient';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  bio?: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface Conversation {
  id: string;
  name: string;
  members: User[];
  messages: Message[];
  lastMessage?: Message;
  avatar?: string;
  isGroup: boolean;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  selectedConversation: Conversation | null;
  addConversation: (conversation: Conversation) => void;
  setActiveConversation: (id: string) => void;
  addMessage: (message: Message) => void; // local-only; sending should use supabase insert when enabled
  updateUserStatus: (userId: string, status: 'online' | 'offline' | 'away') => void;
}

// small helper to map supabase user metadata to our User shape
const mapSupabaseUser = (u: any): User => ({
  id: u.id,
  name: (u.user_metadata && u.user_metadata.name) || u.email?.split('@')[0] || 'Unknown',
  email: u.email || '',
  avatar: (u.user_metadata && u.user_metadata.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
  status: 'online'
});

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email: string, password: string) => {
    if (SUPABASE_ENABLED) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert(error.message);
        return;
      }
      if (data.user) {
        set({ user: mapSupabaseUser(data.user), isAuthenticated: true });
      }
      return;
    }

    // fallback mock
    const mockUser: User = {
      id: '1',
      name: email.split('@')[0],
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      status: 'online',
      bio: 'Happy to connect with friends!'
    };
    set({ user: mockUser, isAuthenticated: true });
  },
  signup: async (name: string, email: string, password: string) => {
    if (SUPABASE_ENABLED) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) {
        alert(error.message);
        return;
      }
      if (data.user) {
        set({ user: mapSupabaseUser(data.user), isAuthenticated: true });
      } else {
        // signUp might require email confirmation; set a temporary user object
        const tempUser: User = {
          id: Math.random().toString(),
          name,
          email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          status: 'online'
        };
        set({ user: tempUser, isAuthenticated: true });
      }
      return;
    }

    // fallback mock
    const mockUser: User = {
      id: Math.random().toString(),
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      status: 'online',
      bio: 'New friend!'
    };
    set({ user: mockUser, isAuthenticated: true });
  },
  logout: async () => {
    if (SUPABASE_ENABLED) {
      await supabase.auth.signOut();
    }
    set({ user: null, isAuthenticated: false });
  }
}));

// Listen for supabase auth changes and update store accordingly
if (SUPABASE_ENABLED) {
  // get current user
  supabase.auth.getUser().then(({ data: { user } }: any) => {
    if (user) {
      useAuthStore.setState({ user: mapSupabaseUser(user), isAuthenticated: true });
    }
  });

  supabase.auth.onAuthStateChange((_event: any, session: any) => {
    if (session?.user) {
      useAuthStore.setState({ user: mapSupabaseUser(session.user), isAuthenticated: true });
    } else {
      useAuthStore.setState({ user: null, isAuthenticated: false });
    }
  });
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  activeConversationId: null,
  selectedConversation: null,
  addConversation: (conversation: Conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations]
    })),
  setActiveConversation: (id: string) =>
    set((state) => ({
      activeConversationId: id,
      selectedConversation: state.conversations.find((c) => c.id === id) || null
    })),
  addMessage: (message: Message) =>
    set((state) => {
      const updatedConversations = state.conversations.map((conv) =>
        conv.id === message.conversationId
          ? {
              ...conv,
              messages: [...conv.messages, message],
              lastMessage: message
            }
          : conv
      );
      return { conversations: updatedConversations };
    }),
  updateUserStatus: (userId: string, status: 'online' | 'offline' | 'away') =>
    set((state) => ({
      conversations: state.conversations.map((conv) => ({
        ...conv,
        members: conv.members.map((member) =>
          member.id === userId ? { ...member, status } : member
        )
      }))
    }))
}));

export type { User, Message, Conversation };
