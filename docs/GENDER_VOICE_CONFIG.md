# Gender-Based Voice Configuration

## Overview

The voice role-play and coaching mode features now support **gender-appropriate voice selection** to make practice sessions more realistic and immersive. The AI automatically selects a voice that matches the persona's gender.

## How It Works

### Voice Selection

Based on the persona's gender field, the system automatically selects an appropriate voice:

**Female Personas** → **Aoede** voice
- Warm, professional female voice
- Natural conversational tone
- Clear articulation

**Male Personas** → **Puck** voice  
- Professional male voice
- Confident delivery
- Natural speech patterns

### Supported Voices

The Gemini Live API supports multiple voice options:

**Female Voices:**
- Aoede (default for female personas)
- Kore (alternative)

**Male Voices:**
- Puck (default for male personas)
- Charon (alternative)
- Fenrir (alternative)

## Persona Gender Assignments

All role-play scenarios have been configured with appropriate genders:

### Female Personas
- **Sarah Chen** - First-Time Buyer (Beginner)
- **Maria Rodriguez** - Real Estate Investor (Advanced)
- **Jennifer Walsh** - Divorce Sale (Advanced)
- **Amanda Foster** - Price Objection (Beginner)
- **Linda Patterson** - Timing Objection (Intermediate)

### Male Personas
- **Robert Wellington** - Luxury Seller (Advanced)
- **Frank and Betty Morrison** - Downsizing Couple (Intermediate)
- **David Kim** - Competitive Market Buyer (Intermediate)
- **Tom Bradley** - Commission Objection (Intermediate)
- **Michael Torres** - Already Working with Agent (Advanced)

## Technical Implementation

### Data Structure

Each persona now includes a `gender` field:

```typescript
persona: {
  name: string;
  gender: 'male' | 'female';
  background: string;
  personality: string;
  goals: string[];
  concerns: string[];
  communicationStyle: string;
}
```

### Voice Selection Function

```typescript
function getVoiceForGender(gender: 'male' | 'female'): string {
    return gender === 'female' ? 'Aoede' : 'Puck';
}
```

### Configuration

The voice is set when connecting to Gemini Live:

```typescript
await connect(apiKey, {
    model: 'gemini-2.0-flash-exp',
    systemInstruction,
    responseModalities: [Modality.AUDIO],
    voiceName: getVoiceForGender(scenario.persona.gender),
});
```

## Benefits

### Enhanced Realism
- Voice matches the character's identity
- More immersive practice experience
- Better preparation for real-world interactions

### Improved Learning
- Easier to visualize the client
- More engaging practice sessions
- Better retention of techniques

### Professional Development
- Practice with diverse client types
- Build comfort with different communication styles
- Develop adaptability skills

## Customization

### Future Enhancements

Potential improvements for voice configuration:

1. **Voice Selection Menu**
   - Allow users to choose from available voices
   - Preview voices before starting session
   - Save voice preferences per persona

2. **Additional Voice Options**
   - Expand to include more voice varieties
   - Age-appropriate voice selection
   - Accent/regional variations

3. **Voice Characteristics**
   - Adjust speaking rate
   - Modify pitch and tone
   - Configure emotional expression

4. **Custom Personas**
   - Allow users to create custom personas
   - Select voice for custom characters
   - Save persona configurations

## Usage

No additional steps required! The gender-based voice selection happens automatically:

1. Select a scenario
2. Choose Voice Practice or Coaching Mode
3. Start the session
4. The AI will speak with the appropriate voice for that persona

## Examples

### Female Voice (Aoede)
When practicing with **Sarah Chen** (First-Time Buyer):
- Voice: Aoede (female)
- Tone: Cautious, thoughtful
- Style: Asks detailed questions

### Male Voice (Puck)
When practicing with **Robert Wellington** (Luxury Seller):
- Voice: Puck (male)
- Tone: Confident, business-like
- Style: Direct, expects data

## Troubleshooting

### Voice Doesn't Match Expected Gender
- Check that the scenario has the correct gender assigned
- Verify internet connection for voice synthesis
- Try restarting the session

### Voice Quality Issues
- Ensure stable internet connection
- Check system audio settings
- Use headphones for best quality

### No Voice Output
- Verify microphone permissions are granted
- Check that voice mode is enabled
- Ensure API key is configured

## Technical Notes

### API Configuration

The voice is configured via the `speechConfig` parameter:

```typescript
config: {
    responseModalities: [Modality.AUDIO],
    systemInstruction: '...',
    speechConfig: {
        voiceName: 'Aoede' // or 'Puck'
    }
}
```

### Voice Synthesis

- Voices are synthesized in real-time by Gemini Live API
- Audio format: 24kHz, 16-bit PCM, mono
- Low latency for natural conversation flow

## Best Practices

1. **Use Headphones**
   - Prevents echo and feedback
   - Better audio quality
   - More immersive experience

2. **Quiet Environment**
   - Reduces background noise
   - Improves voice recognition
   - Better practice quality

3. **Natural Speech**
   - Speak at normal pace
   - Use natural intonation
   - Don't over-enunciate

4. **Active Listening**
   - Pay attention to voice tone
   - Notice emotional cues
   - Respond appropriately

## Conclusion

Gender-based voice configuration adds a new level of realism to role-play practice, making it easier to immerse yourself in the scenario and practice your skills in a more authentic environment. The automatic voice selection ensures every practice session feels natural and professional.
