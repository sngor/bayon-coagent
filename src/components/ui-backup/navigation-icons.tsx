// Extract filled icon variants to separate file for better maintainability
import { LucideProps } from 'lucide-react';

export const FilledNavigationIcons = {
    HouseIcon: (props: LucideProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M3 12l9-9 9 9" />
            <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
            <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
        </svg>
    ),
    MessageSquare: (props: LucideProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    Target: (props: LucideProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" fill="rgba(255,255,255,0.3)" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
    ),
} as const;

export type FilledIconName = keyof typeof FilledNavigationIcons;