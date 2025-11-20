# AI Assistant

The Bayon AI Assistant is an intelligent conversational interface for real estate agents.

## Features

- **Chat Interface**: Ask questions about real estate, market trends, and property analysis
- **Agent Profile Integration**: Personalized responses based on your profile
- **Citations**: All factual statements include source citations
- **Safety Guardrails**: Domain-restricted to real estate topics
- **Streaming Responses**: Real-time response generation

## Usage

Navigate to `/assistant` in the application to access the AI Assistant.

### First Time Setup

1. Click the "Profile" tab
2. Set up your agent profile in Brand Center
3. Return to the "Chat" tab to start conversations

### Chat Features

- Type your question in the input field
- Press Enter to send (Shift+Enter for new line)
- View citations by hovering over source badges
- See key points extracted from responses

## Components

- **ChatInterface**: Main chat UI (`src/components/bayon-assistant/chat-interface.tsx`)
- **AgentProfilePreview**: Profile display (`src/components/bayon-assistant/agent-profile-preview.tsx`)

## Server Actions

- `handleChatQuery`: Process chat queries (`src/app/bayon-assistant-actions.ts`)
- `streamChatQuery`: Streaming responses
- `getConversation`: Retrieve conversation history
- `listConversations`: List all conversations
- `deleteConversation`: Delete a conversation

## Related

- Demo page: `/kiro-assistant-demo` (legacy)
- Profile management: `/brand-center/profile`
- Documentation: `.kiro/specs/kiro-ai-assistant/`
