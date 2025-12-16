# Real-Time Communication & Collaboration Integration Guide

This guide explains how to integrate the new real-time communication and collaboration features into the Bayon CoAgent platform.

## 🚀 **What's Been Implemented**

### **1. WebSocket Service**

- **AWS API Gateway WebSocket API** for real-time connections
- **Connection management** with automatic reconnection
- **Authentication** via JWT tokens
- **Room-based communication** for team collaboration

### **2. Chat/Messaging Service**

- **Real-time messaging** between team members
- **Message history** with TTL-based cleanup
- **Typing indicators** and online status
- **File and image sharing** support
- **Message delivery confirmation**

### **3. Live Updates Service**

- **Real-time status updates** for content generation
- **Progress tracking** with percentage completion
- **Error notifications** and retry mechanisms
- **System-wide event broadcasting**

## 📁 **File Structure**

```
src/
├── lambda/realtime/                 # Lambda functions
│   ├── websocket-connect.ts         # WebSocket connection handler
│   ├── websocket-disconnect.ts      # WebSocket disconnection handler
│   ├── websocket-default.ts         # Default route handler
│   ├── chat-message.ts              # Chat message processing
│   ├── room-management.ts           # Room join/leave management
│   ├── live-updates.ts              # Live status updates
│   ├── notification-broadcast.ts    # Event broadcasting
│   ├── package.json                 # Lambda dependencies
│   └── tsconfig.json               # TypeScript configuration
├── hooks/                          # React hooks
│   ├── use-websocket.tsx           # WebSocket connection hook
│   ├── use-chat.tsx                # Chat functionality hook
│   └── use-live-updates.tsx        # Live updates hook
├── components/realtime/            # React components
│   ├── realtime-provider.tsx       # Context provider
│   ├── chat-widget.tsx             # Floating chat widget
│   ├── live-status-indicator.tsx   # Status indicator component
│   └── collaboration-panel.tsx     # Collaboration sidebar
├── realtime-services-stack.yaml    # SAM template
└── deploy-realtime-services.sh     # Deployment script
```

## 🛠 **Deployment Instructions**

### **Step 1: Deploy Infrastructure**

```bash
# Make deployment script executable
chmod +x deploy-realtime-services.sh

# Deploy to development environment
./deploy-realtime-services.sh development us-east-1

# Deploy to production environment
./deploy-realtime-services.sh production us-east-1
```

### **Step 2: Update Environment Variables**

Add these variables to your `.env.local` file:

```env
# Real-Time Services Configuration
NEXT_PUBLIC_WEBSOCKET_ENDPOINT=wss://your-api-id.execute-api.us-east-1.amazonaws.com/development
NEXT_PUBLIC_WEBSOCKET_API_ID=your-api-id
NEXT_PUBLIC_REALTIME_ENVIRONMENT=development
```

### **Step 3: Install Frontend Dependencies**

```bash
# Install required packages
npm install uuid @types/uuid
```

## 🔧 **Integration Steps**

### **1. Add Real-Time Provider to Layout**

Update `src/app/layout.tsx`:

```tsx
import { RealtimeProvider } from "@/components/realtime/realtime-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <RealtimeProvider>{children}</RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### **2. Add Chat Widget to Main Layout**

Update your main layout component:

```tsx
import { ChatWidget } from "@/components/realtime/chat-widget";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <ChatWidget defaultRoom="general" />
    </div>
  );
}
```

### **3. Add Live Status to Content Pages**

In content creation pages (Studio hub):

```tsx
import { LiveStatusIndicator } from "@/components/realtime/live-status-indicator";
import { useRealtime } from "@/components/realtime/realtime-provider";

export function ContentCreationPage() {
  const { liveUpdates } = useRealtime();
  const [contentId, setContentId] = useState<string | null>(null);

  const handleContentGeneration = async () => {
    const newContentId = `content-${Date.now()}`;
    setContentId(newContentId);

    // Update status when generation starts
    liveUpdates.updateContentStatus(newContentId, "generating", 0, {
      stage: "Initializing",
    });

    // Your existing content generation logic...
  };

  return (
    <div className="space-y-6">
      {contentId && (
        <LiveStatusIndicator contentId={contentId} showProgress={true} />
      )}

      {/* Your existing content creation UI */}
    </div>
  );
}
```

### **4. Add Collaboration Panel to Content Editor**

```tsx
import { CollaborationPanel } from "@/components/realtime/collaboration-panel";

export function ContentEditor({ contentId }: { contentId: string }) {
  return (
    <div className="flex gap-6">
      <div className="flex-1">{/* Your content editor */}</div>

      <CollaborationPanel contentId={contentId} contentType="blog-post" />
    </div>
  );
}
```

## 🎯 **Usage Examples**

### **Real-Time Chat**

```tsx
import { useRealtime } from "@/components/realtime/realtime-provider";

function TeamChatExample() {
  const { chat } = useRealtime();

  useEffect(() => {
    // Join team room
    chat.joinRoom("team-general", "team");

    return () => {
      chat.leaveRoom();
    };
  }, []);

  const sendMessage = () => {
    chat.sendMessage("Hello team!", "text");
  };

  return (
    <div>
      <div className="messages">
        {chat.messages.map((message) => (
          <div key={message.messageId}>{message.message}</div>
        ))}
      </div>

      <button onClick={sendMessage}>Send Message</button>
    </div>
  );
}
```

### **Live Status Updates**

```tsx
import { useRealtime } from "@/components/realtime/realtime-provider";

function ContentGenerationExample() {
  const { liveUpdates } = useRealtime();

  const generateContent = async () => {
    const contentId = "blog-post-123";

    // Update status throughout the process
    liveUpdates.updateContentStatus(contentId, "generating", 10, {
      stage: "Analyzing topic",
    });

    // Simulate progress updates
    setTimeout(() => {
      liveUpdates.updateContentStatus(contentId, "generating", 50, {
        stage: "Writing content",
      });
    }, 2000);

    setTimeout(() => {
      liveUpdates.updateContentStatus(contentId, "completed", 100, {
        stage: "Finished",
      });
    }, 5000);
  };

  return <button onClick={generateContent}>Generate Content</button>;
}
```

## 🔒 **Security Considerations**

### **Authentication**

- WebSocket connections require valid JWT tokens
- User identity is verified on connection
- Room access is controlled by user permissions

### **Data Privacy**

- Messages have TTL-based expiration
- Connection data is automatically cleaned up
- No sensitive data is stored in WebSocket messages

### **Rate Limiting**

- API Gateway throttling is configured
- Connection limits per user
- Message rate limiting per room

## 📊 **Monitoring & Debugging**

### **CloudWatch Logs**

```bash
# Monitor WebSocket connections
aws logs tail /aws/lambda/bayon-coagent-websocket-connect-development --follow

# Monitor chat messages
aws logs tail /aws/lambda/bayon-coagent-chat-message-development --follow

# Monitor live updates
aws logs tail /aws/lambda/bayon-coagent-live-updates-development --follow
```

### **Testing WebSocket Connection**

```bash
# Install wscat for testing
npm install -g wscat

# Test connection
wscat -c "wss://your-api-id.execute-api.us-east-1.amazonaws.com/development?userId=test-user&token=test-token"

# Send test message
{"action": "sendMessage", "roomId": "test-room", "message": "Hello World!"}
```

### **DynamoDB Tables**

- `BayonCoAgent-RealtimeConnections-{environment}`: Active WebSocket connections
- `BayonCoAgent-ChatMessages-{environment}`: Chat message history
- `BayonCoAgent-LiveStatus-{environment}`: Live status updates

## 🚀 **Next Steps**

### **Phase 2 Enhancements**

1. **Voice/Video Calling**: Add WebRTC for voice/video collaboration
2. **Screen Sharing**: Real-time screen sharing for content review
3. **Advanced Notifications**: Push notifications for mobile apps
4. **Analytics Dashboard**: Real-time collaboration analytics

### **Integration with Existing Features**

1. **Content Generation**: Add real-time progress for all AI flows
2. **Team Management**: Integrate with user roles and permissions
3. **Notification System**: Connect with existing notification preferences
4. **Mobile App**: Extend real-time features to mobile applications

## 🆘 **Troubleshooting**

### **Common Issues**

**WebSocket Connection Fails**

- Check JWT token validity
- Verify API Gateway endpoint URL
- Check CloudWatch logs for connection errors

**Messages Not Delivered**

- Verify room membership
- Check connection status
- Review DynamoDB table permissions

**Live Updates Not Working**

- Confirm Lambda function permissions
- Check DynamoDB streams configuration
- Verify API Gateway routes

### **Support**

For technical support or questions about the real-time features, check:

1. CloudWatch logs for error details
2. DynamoDB tables for data consistency
3. API Gateway metrics for connection issues

## 🎉 **Conclusion**

The real-time communication and collaboration features are now ready for integration! This implementation provides:

- ✅ **Scalable WebSocket infrastructure**
- ✅ **Real-time chat and messaging**
- ✅ **Live status updates and progress tracking**
- ✅ **Team collaboration features**
- ✅ **Comprehensive monitoring and logging**

The system is designed to handle thousands of concurrent connections and can be easily extended with additional real-time features as needed.
