import { create } from 'zustand';
import { supabase, SUPABASE_ENABLED } from './supabaseClient';

// Minimal Supabase auth user shape — avoids relying on SDK type re-exports
interface SupabaseAuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

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
const mapSupabaseUser = (u: SupabaseAuthUser): User => ({
  id: u.id,
  name: u.user_metadata?.name || u.email?.split('@')[0] || 'Unknown',
  email: u.email || '',
  avatar: u.user_metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
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
          id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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
  supabase.auth.getUser().then((response: { data: { user: SupabaseAuthUser | null } }) => {
    if (response.data.user) {
      useAuthStore.setState({ user: mapSupabaseUser(response.data.user), isAuthenticated: true });
    }
  });

  supabase.auth.onAuthStateChange((_event: string, session: { user: SupabaseAuthUser } | null) => {
    if (session?.user) {
      useAuthStore.setState({ user: mapSupabaseUser(session.user), isAuthenticated: true });
    } else {
      useAuthStore.setState({ user: null, isAuthenticated: false });
    }
  });

  // Realtime subscription — sync new messages from other clients
  supabase
    .channel('public:messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload: { new: Record<string, any> }) => {
        const row = payload.new;
        const msg: Message = {
          id: row.id,
          conversationId: row.conversation_id,
          senderId: row.sender_id,
          senderName: row.sender_name,
          senderAvatar: row.sender_avatar,
          content: row.content,
          timestamp: new Date(row.inserted_at),
          isRead: Boolean(row.is_read),
        };
        useChatStore.getState().addMessage(msg);
      },
    )
    .subscribe();
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  activeConversationId: null,
  selectedConversation: null,
  addConversation: (conversation: Conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations]
    })),
  // Create a new conversation in Supabase (and locally)
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
      return {
        conversations: updatedConversations,
        selectedConversation:
          state.activeConversationId === message.conversationId
            ? updatedConversations.find((c) => c.id === state.activeConversationId) || null
            : state.selectedConversation,
      };
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

// Higher-level helpers (not part of the Zustand API) for Supabase-backed operations

export async function loadConversationsForUser(userId: string) {
  if (!SUPABASE_ENABLED) return;

  // fetch conversations where the user is a member
  const { data, error } = await supabase
    .from('conversation_members')
    .select('conversation_id, user_id, user_name, user_email, user_avatar, conversation:conversations (id, name, avatar, is_group)')
    .eq('user_id', userId);

  if (error) {
    console.error('loadConversations error', error);
    return;
  }

  const convMap: Record<string, any> = {};
  data?.forEach((row: any) => {
    const c = row.conversation;
    if (!c) return;
    if (!convMap[c.id]) {
      convMap[c.id] = {
        id: c.id,
        name: c.name || 'Chat',
        avatar: c.avatar || undefined,
        isGroup: c.is_group,
        members: [] as any[],
        messages: [] as any[],
        lastMessage: undefined
      };
    }

    convMap[c.id].members.push({
      id: row.user_id || Math.random().toString(),
      name: row.user_name || row.user_email || 'Friend',
      email: row.user_email || '',
      avatar: row.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.user_id}`,
      status: 'online'
    });
  });

  const conversations = Object.values(convMap);

  // fetch last message for each conversation
  for (const conv of conversations) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('inserted_at', { ascending: false })
      .limit(1);
    if (msgs && msgs.length) {
      conv.lastMessage = {
        id: msgs[0].id,
        conversationId: conv.id,
        senderId: msgs[0].sender_id,
        senderName: msgs[0].sender_name,
        senderAvatar: msgs[0].sender_avatar,
        content: msgs[0].content,
        timestamp: new Date(msgs[0].inserted_at),
        isRead: msgs[0].is_read
      };
    }
  }

  useChatStore.setState({ conversations });
}

export async function createConversationWithUser(opts: { userId: string; userName?: string; userEmail?: string; userAvatar?: string; partnerId: string; partnerName?: string; partnerEmail?: string; partnerAvatar?: string; name?: string; }) {
  if (!SUPABASE_ENABLED) {
    // fallback: create local conversation
    const conv = {
      id: Math.random().toString(),
      name: opts.name || opts.partnerName || 'Chat',
      members: [
        { id: opts.userId, name: opts.userName || 'You', email: opts.userEmail || '', avatar: opts.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opts.userId}`, status: 'online' },
        { id: opts.partnerId, name: opts.partnerName || 'Friend', email: opts.partnerEmail || '', avatar: opts.partnerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opts.partnerId}`, status: 'online' }
      ],
      messages: [],
      isGroup: false
    };
    useChatStore.getState().addConversation(conv as any);
    useChatStore.getState().setActiveConversation(conv.id);
    return conv;
  }

  // create conversation record
  const { data: convData, error: convErr } = await supabase
    .from('conversations')
    .insert([{ name: opts.name || null, avatar: null, is_group: false }])
    .select('id')
    .single();

  if (convErr) {
    console.error('create conversation error', convErr);
    return;
  }

  const conversationId = convData.id;

  // insert members snapshot
  const membersToInsert = [
    {
      conversation_id: conversationId,
      user_id: opts.userId,
      user_name: opts.userName || null,
      user_email: opts.userEmail || null,
      user_avatar: opts.userAvatar || null
    },
    {
      conversation_id: conversationId,
      user_id: opts.partnerId,
      user_name: opts.partnerName || null,
      user_email: opts.partnerEmail || null,
      user_avatar: opts.partnerAvatar || null
    }
  ];

  const { error: memErr } = await supabase.from('conversation_members').insert(membersToInsert);
  if (memErr) {
    console.error('insert members err', memErr);
  }

  // Build local conversation object and add
  const conv = {
    id: conversationId,
    name: opts.name || opts.partnerName || 'Chat',
    members: [
      { id: opts.userId, name: opts.userName || 'You', email: opts.userEmail || '', avatar: opts.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opts.userId}`, status: 'online' },
      { id: opts.partnerId, name: opts.partnerName || 'Friend', email: opts.partnerEmail || '', avatar: opts.partnerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opts.partnerId}`, status: 'online' }
    ],
    messages: [],
    isGroup: false
  } as Conversation;

  useChatStore.getState().addConversation(conv);
  useChatStore.getState().setActiveConversation(conv.id);

  return conv;
}

export async function fetchMessagesForConversation(conversationId: string) {
  if (!SUPABASE_ENABLED) return;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('inserted_at', { ascending: true });

  if (error) {
    console.error('fetchMessages err', error);
    return;
  }

  const msgs = (data || []).map((m: any) => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    senderName: m.sender_name,
    senderAvatar: m.sender_avatar,
    content: m.content,
    timestamp: new Date(m.inserted_at),
    isRead: m.is_read
  }));

  // set messages on the conversation
  useChatStore.setState((s) => ({
    conversations: s.conversations.map((c) =>
      c.id === conversationId ? { ...c, messages: msgs } : c
    ),
    selectedConversation: s.conversations.find((c) => c.id === conversationId) || null
  }));
}

// Realtime subscription for new messages — app-wide
let _messagesSubscription: any = null;
export function subscribeToMessages() {
  if (!SUPABASE_ENABLED) return;
  if (_messagesSubscription) return; // already subscribed

  _messagesSubscription = supabase
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      const m = payload.new;
      const message: Message = {
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderAvatar: m.sender_avatar,
        content: m.content,
        timestamp: new Date(m.inserted_at),
        isRead: m.is_read
      };

      // append to local conversation if present
      useChatStore.setState((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === message.conversationId
            ? { ...c, messages: [...c.messages, message], lastMessage: message }
            : c
        )
      }));
    })
    .subscribe();
}


export type { User, Message, Conversation };
