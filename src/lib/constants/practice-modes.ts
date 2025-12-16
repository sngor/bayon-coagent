import { MessageSquare, Mic, Lightbulb } from 'lucide-react';

export type PracticeMode = 'text' | 'voice' | 'coaching';

export const PRACTICE_MODE_CONFIG = {
    text: {
        icon: MessageSquare,
        description: 'Practice through text-based conversation',
        label: 'Text',
        color: 'blue'
    },
    voice: {
        icon: Mic,
        description: 'Have a real-time voice conversation with the AI client',
        label: 'Voice',
        color: 'green'
    },
    coaching: {
        icon: Lightbulb,
        description: 'Voice practice with real-time coaching feedback and technique recognition',
        label: 'Coaching',
        color: 'purple'
    }
} as const satisfies Record<PracticeMode, {
    icon: any;
    description: string;
    label: string;
    color: string;
}>;

export function getPracticeModeConfig(mode: PracticeMode) {
    return PRACTICE_MODE_CONFIG[mode];
}