import { ContentClient } from './content-client';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';

export default function ContentPage() {
    return <ContentClient />;
}