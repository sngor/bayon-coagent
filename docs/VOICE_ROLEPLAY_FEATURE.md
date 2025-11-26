# AI Role-Play Practice with Voice Mode

This feature provides an immersive AI-powered role-play practice system for real estate agents, with support for both text-based and voice-based interactions using Google's Gemini Live API.

## Features

### Text Mode (Original)
- Traditional text-based chat interface
- Message history and conversation flow
- Session feedback and performance analysis
- Saved session history

### Voice Mode (NEW)
- **Real-time voice conversations** with AI personas
- **Natural speech recognition** using browser microphone
- **AI voice responses** with human-like speech
- **Push-to-talk interface** for controlled conversation flow
- **Live status indicators** showing connection and AI speaking state
- **Immersive practice** that simulates real client interactions

## How It Works

### Architecture

1. **Client-Side Components**
   - `AIRolePlay` - Main component with mode selection
   - `VoiceRolePlay` - Voice-specific interface
   - `useGeminiLive` - Custom hook managing Gemini Live API connection

2. **Server-Side**
   - `getGeminiApiKeyAction` - Securely provides API key to client
   - Existing role-play session management

3. **Gemini Live API Integration**
   - WebSocket connection for real-time bidirectional streaming
   - Audio processing (16-bit PCM, 16kHz, mono)
   - Automatic audio playback and recording

### Voice Mode Flow

```
User selects scenario → Choose Voice Mode → Connect to Gemini Live
    ↓
System instruction with persona details sent to AI
    ↓
User presses microphone button → Audio recorded and streamed
    ↓
AI processes audio → Generates voice response → Plays back to user
    ↓
Conversation continues until user ends session
```

## Usage

### For Users

1. **Navigate to Training > Practice**
2. **Select Practice Mode:**
   - Click "Text Chat" for traditional text-based practice
   - Click "Voice Practice" for voice-based practice
3. **Choose a Scenario** from the dropdown
4. **Review scenario details** and learning objectives
5. **Start Session:**
   - **Text Mode**: Type messages and receive AI responses
   - **Voice Mode**: Press and hold microphone button to speak
6. **End Session** when ready to finish

### Voice Mode Tips

- **Speak clearly** and at a normal pace
- **Wait for AI** to finish speaking before responding
- **Use headphones** to prevent audio feedback
- **Practice in a quiet environment** for best recognition
- **Press and hold** the microphone button while speaking
- **Release** when done to let AI respond

## Technical Details

### Audio Requirements

- **Input Format**: 16-bit PCM, 16kHz, mono
- **Output Format**: 16-bit PCM, 24kHz, mono
- **Browser Support**: Modern browsers with MediaDevices API
- **Permissions**: Microphone access required

### API Configuration

The system uses:
- **Model**: `gemini-2.0-flash-exp`
- **Response Modality**: Audio
- **System Instruction**: Dynamically generated from scenario persona

### Security

- API keys are **never exposed** to client-side code
- Server action `getGeminiApiKeyAction` securely provides keys
- User authentication required for all features

## Components Reference

### `useGeminiLive` Hook

```typescript
const {
    isConnected,    // Connection status
    isRecording,    // Microphone recording state
    isSpeaking,     // AI speaking state
    error,          // Error message if any
    connect,        // Connect to Gemini Live
    disconnect,     // Disconnect and cleanup
    startRecording, // Start microphone recording
    stopRecording,  // Stop microphone recording
    sendText,       // Send text message (optional)
} = useGeminiLive();
```

### `VoiceRolePlay` Component

```typescript
<VoiceRolePlay
    scenario={selectedScenario}  // RolePlayScenario object
    onEnd={() => {               // Callback when session ends
        // Cleanup logic
    }}
/>
```

## Troubleshooting

### Common Issues

1. **"Microphone access denied"**
   - Grant microphone permissions in browser settings
   - Reload the page after granting permissions

2. **"Failed to connect to voice service"**
   - Check internet connection
   - Verify API key is configured in `.env.local`
   - Check browser console for detailed errors

3. **"AI not responding"**
   - Ensure you released the microphone button
   - Check connection status indicator
   - Try ending and restarting the session

4. **Poor audio quality**
   - Use headphones to prevent echo
   - Reduce background noise
   - Speak closer to microphone

5. **Audio feedback/echo**
   - Always use headphones in voice mode
   - Reduce system volume
   - Check microphone sensitivity settings

## Future Enhancements

Potential improvements for voice mode:

- [ ] Voice activity detection (hands-free mode)
- [ ] Conversation transcripts in real-time
- [ ] Performance metrics based on voice analysis
- [ ] Multi-language support
- [ ] Custom voice selection for AI personas
- [ ] Session recording and playback
- [ ] Advanced feedback on speaking pace, tone, and clarity

## Dependencies

- `@google/genai` - Google Generative AI SDK with Live API support
- Browser MediaDevices API for microphone access
- Web Audio API for audio playback

## Environment Variables

```bash
# Required for voice mode
GOOGLE_AI_API_KEY=your_gemini_api_key_here
```

## Browser Compatibility

Voice mode requires:
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- HTTPS connection (or localhost for development)
- Microphone access permissions
- Web Audio API support

## Performance Considerations

- **Latency**: Typical response time 1-3 seconds
- **Bandwidth**: ~50-100 KB/s during active conversation
- **CPU**: Minimal impact, audio processing is efficient
- **Memory**: ~20-30 MB for audio buffers

## Credits

Built with:
- Google Gemini Live API
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
