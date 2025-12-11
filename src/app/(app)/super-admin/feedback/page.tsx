import { FeedbackClient } from './feedback-client';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';

export default function AdminFeedbackPage() {
    return <FeedbackClient />;
}