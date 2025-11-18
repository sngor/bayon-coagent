
'use client';

import { useState, useEffect, useCallback } from 'react';

// Define the structure of the AI object on the window
declare global {
  interface Window {
    ai?: {
      canCreateGenericSession: () => Promise<'readily' | 'after-user-activation' | 'no'>;
      createGenericSession: (options?: { temperature?: number, topK?: number }) => Promise<AIPromptSession>;
    };
  }
}

interface AIPromptSession {
  prompt: (prompt: string) => Promise<string>;
  destroy: () => void;
}

interface WebAIState {
  isWebAIAvailable: boolean;
  canCreateSession: 'readily' | 'after-user-activation' | 'no';
  session: AIPromptSession | null;
  error: Error | null;
}

export function useWebAI() {
  const [state, setState] = useState<WebAIState>({
    isWebAIAvailable: false,
    canCreateSession: 'no',
    session: null,
    error: null,
  });

  // Check for Web AI availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      // The 'ai' object might not be available immediately.
      // A simple delay can help, but a more robust solution might listen for a specific event.
      setTimeout(async () => {
        if (window.ai && typeof window.ai.canCreateGenericSession === 'function') {
            try {
                const sessionAvailability = await window.ai.canCreateGenericSession();
                setState(prevState => ({
                    ...prevState,
                    isWebAIAvailable: sessionAvailability !== 'no',
                    canCreateSession: sessionAvailability,
                }));
            } catch(e) {
                 console.error("Error checking Web AI availability:", e);
                 setState(prevState => ({ ...prevState, isWebAIAvailable: false, error: e as Error }));
            }
        }
      }, 100);
    };
    checkAvailability();
  }, []);
  
  // Function to create a session
  const createSession = useCallback(async () => {
      if (state.session || !window.ai || !window.ai.createGenericSession) return state.session;
      
      try {
          // Setting a lower temperature for more deterministic/professional output
          const newSession = await window.ai.createGenericSession({ temperature: 0.2 });
          setState(prevState => ({...prevState, session: newSession}));
          return newSession;
      } catch(e) {
          console.error("Failed to create Web AI session:", e);
          setState(prevState => ({...prevState, error: e as Error}));
          throw e;
      }
  }, [state.session]);

  // Generic run function for various tasks
  const run = useCallback(async (task: 'prompt' | 'rewrite', input: any): Promise<string> => {
    if (!window.ai) {
        throw new Error("Web AI is not available in this browser.");
    }
    
    // For now, we can implement 'rewrite' using a generic prompt session.
    // A dedicated 'createWriter' or 'createRewriter' API might be used if available.
    if (task === 'rewrite') {
        const activeSession = state.session || await createSession();
        if (!activeSession) throw new Error("Could not create Web AI session.");

        const { text, options } = input;
        const prompt = `Rewrite the following text to appeal to a "${options.persona}" persona:\n\n${text}`;
        
        try {
            return await activeSession.prompt(prompt);
        } catch (e) {
            console.error("Error running rewrite task:", e);
            throw e;
        }
    }
    
    if (task === 'prompt') {
        const activeSession = state.session || await createSession();
        if (!activeSession) throw new Error("Could not create Web AI session.");
        
        try {
            return await activeSession.prompt(input.prompt);
        } catch (e) {
            console.error("Error running prompt task:", e);
            throw e;
        }
    }

    throw new Error(`Unknown Web AI task: ${task}`);

  }, [state.session, createSession]);

  const runPrompt = useCallback(async (promptText: string): Promise<string> => {
    return run('prompt', { prompt: promptText });
  }, [run]);

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      if (state.session) {
        state.session.destroy();
      }
    };
  }, [state.session]);

  return {
    ...state,
    runPrompt,
    createSession,
    run,
  };
}
