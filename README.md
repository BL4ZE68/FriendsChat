# FriendsChat 🌍💬

A modern, creative, and animated chat platform designed for friends who are geographically distant. Stay connected with beautiful animations, real-time messaging, and an intuitive user experience.

## ✨ Features

- **Real-time Messaging**: Instant chat with friends
- **Group Conversations**: Create group chats for multiple friends
- **Creative Design**: Beautiful gradient backgrounds and smooth animations
- **User Profiles**: Customize your avatar and status
- **Responsive Design**: Works on desktop and mobile devices
- **Online Status**: See who's online at a glance
- **Animated UI**: Smooth transitions and micro-interactions

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Build Tool**: Vite
- **Icons**: Lucide React

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup

```bash
# Navigate to project directory
cd FriendsChat

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app will open at `http://localhost:3000`

## 🎯 Usage

1. **Sign Up or Log In**: Create an account or log in with demo credentials
2. **Create Conversations**: Click the `+` button to start a new conversation
3. **Select Friends**: Choose which friends to include
4. **Chat**: Send messages in real-time with beautiful animations
5. **View Status**: See who's online and available

### Demo Credentials
- Email: `demo@example.com`
- Password: `demo123`

## 📱 Future Enhancements

- [ ] Video/Audio calling
- [ ] File sharing
- [ ] Message reactions
- [ ] Voice messages
- [ ] Message search
- [ ] User presence (typing indicators)
- [ ] Message encryption
- [ ] Dark mode
- [ ] React Native mobile app
- [ ] Backend API integration
- [ ] Database persistence

## 🎨 Design Features

- **Glassmorphism**: Modern frosted glass effects
- **Gradient Backgrounds**: Vibrant purple, pink, and red gradients
- **Smooth Animations**: Framer Motion for delightful interactions
- **Custom Scrollbar**: Styled scrollbars throughout the app
- **Responsive Layout**: Adapts to all screen sizes

## 📂 Project Structure

```
FriendsChat/
├── src/
│   ├── components/
│   │   ├── AuthPage.tsx          # Login/Signup page
│   │   ├── ChatWindow.tsx        # Main chat interface
│   │   ├── ConversationList.tsx  # Sidebar with conversations
│   │   └── CreateConversationModal.tsx  # Modal to create new chats
│   ├── store.ts                  # Zustand state management
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── index.html                    # HTML template
├── package.json                  # Dependencies
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js            # Tailwind CSS config
└── README.md                     # This file
```

## 🔧 Configuration

### Tailwind CSS
Customizable theme with:
- Primary color: Purple (#a855f7)
- Secondary color: Pink (#ec4899)
- Extended animations and utilities

### Vite
Optimized build configuration with:
- Hot Module Replacement (HMR)
- Fast refresh for React
- Optimized production builds

## 📝 License

This project is open source and available under the MIT License.

## 👥 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 🤝 Support

For support, email support@friendschat.com or open an issue on GitHub.

---

## 🔗 Supabase integration (Auth, persistence, storage)

This project includes optional Supabase integration for authentication, message persistence and file uploads. To enable it:

1. Create a Supabase project at https://app.supabase.com
2. In the project settings, copy the Project URL and anon/public API key.
3. Create a storage bucket named `uploads` (for file attachments).
4. Open `supabase/init.sql` in the Supabase SQL editor and run it to create `conversations` and `messages` tables (and example seed). Adjust RLS policies to fit your security model.
5. Copy `.env.example` to `.env.local` and fill values:

   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

6. Install dependencies and run the app:

```bash
npm install
npm run dev
```

Notes:
- The app falls back to local/mock auth and in-memory messages if Supabase is not configured.
- Uploaded files are stored in the `uploads` bucket and messages with `message_type = 'file'` include the public URL.

## 🔁 GitHub / CI

A basic GitHub Actions workflow was added at `.github/workflows/ci.yml` that installs dependencies, lints (if configured) and builds the project on pushes and PRs to main/master.

---

**Made with ❤️ for friends around the world**
