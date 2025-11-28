
'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Loader2 } from 'lucide-react';
import { GoogleOAuthCallback } from '@/components/google-oauth-callback';

function CallbackSuspenseFallback() {
  return (
    <div className="mt-8 text-center flex items-center justify-center gap-4">
      <Loader2 className="animate-spin" />
      <p className="text-muted-foreground">
        Processing...
      </p>
    </div>
  )
}

export default function GoogleOAuthCallbackPage() {
  return (
    <div className="container mx-auto py-10 animate-fade-in-up">
      <PageHeader
        title="Connecting to Google"
        description="Please wait while we securely connect your Google Business Profile..."
      />
      <Suspense fallback={<CallbackSuspenseFallback />}>
        <GoogleOAuthCallback />
      </Suspense>
    </div>
  );
}
