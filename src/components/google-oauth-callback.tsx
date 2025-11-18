
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from '@/aws/auth';
import { storeOAuthTokens } from '@/aws/dynamodb';
import { exchangeGoogleTokenAction } from '@/app/actions';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type State = {
  message: string;
  data: any;
  errors: any;
}

export function GoogleOAuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setError(`OAuth Error: ${oauthError}`);
      setStatus('Failed.');
      toast({
        variant: "destructive",
        title: "OAuth Error",
        description: oauthError,
      });
      return;
    }

    if (code && user) {
      const processToken = async () => {
        try {
          const formData = new FormData();
          formData.append('code', code);
          const result: State = await exchangeGoogleTokenAction(null, formData);

          if (result.message === 'success' && result.data) {
            setStatus('Saving connection details...');

            const tokenData = {
              agentProfileId: user.id, // Using user's ID as the agent profile link
              accessToken: result.data.accessToken,
              refreshToken: result.data.refreshToken,
              expiryDate: result.data.expiryDate,
            };

            // Store tokens in DynamoDB
            await storeOAuthTokens(user.id, tokenData, 'GOOGLE_BUSINESS');

            toast({
              title: "Successfully Connected!",
              description: "Your Google Business Profile is now connected.",
            });

            setStatus('Redirecting...');
            router.push('/integrations');
          } else {
            setError(result.message);
            setStatus('Failed.');
            toast({
              variant: "destructive",
              title: "Connection Failed",
              description: result.message,
            });
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
          setError(errorMessage);
          setStatus('Failed.');
          toast({
            variant: "destructive",
            title: "Connection Failed",
            description: errorMessage,
          });
        }
      };

      processToken();
    }

  }, [searchParams, user, router]);

  return (
    <div className="mt-8 text-center flex items-center justify-center gap-4">
      {status !== 'Failed.' && <Loader2 className="animate-spin" />}
      <p className={error ? 'text-destructive' : 'text-muted-foreground'}>
        {error ? `Error: ${error}` : status}
      </p>
    </div>
  );
}
