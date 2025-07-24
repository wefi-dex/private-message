# Private Message App

A premium, privacy-first mobile messaging app for creators and fans. Built with React Native (Expo), featuring secure 1-on-1 chat, audio messaging, privacy tools, and a modern UI inspired by the provided sketch.

## Project Structure

```
/private-message
│
├── /assets
│   ├── /fonts
│   └── /images
│
├── /src
│   ├── /api           # API service calls (auth, chat, user, etc.)
│   ├── /components    # Reusable UI components (Avatar, ChatBubble, etc.)
│   ├── /constants     # Colors, fonts, config
│   ├── /hooks         # Custom React hooks (auth, chat, etc.)
│   ├── /navigation    # Navigation setup (tab, stack)
│   ├── /screens       # Main app screens (Home, Chat, Group, Profile, Settings)
│   ├── /store         # State management (context, reducers, or Zustand)
│   ├── /utils         # Utility functions (encryption, validation, etc.)
│   └── App.tsx        # Entry point
│
├── app.json           # Expo config
├── package.json
└── README.md
```

## Features
- Secure 1-on-1 chat (text, audio)
- Privacy tools (panic button, anti-screenshot, anonymous usernames)
- Modern, dark-themed UI
- Modular, scalable codebase

---

## Getting Started

1. Install dependencies: `npm install`
2. Start the app: `npx expo start`

---

## Next Steps
- Scaffold folder structure and navigation
- Implement Home screen UI
- Build Chat screen UI
- Add theming and reusable components
- Integrate with backend APIs
