
'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CheckCircle2,
  Globe,
  Home,
  Building,
  Share2,
  Users,
  Workflow,
} from 'lucide-react';
import { useUser } from '@/aws/auth';
import { getOAuthTokens, type OAuthTokenData } from '@/aws/dynamodb';
import { connectGoogleBusinessProfileAction } from '@/app/actions';

/**
 * A page for managing connections to third-party platforms.
 * It allows users to connect their Google Business Profile and shows placeholders for future integrations.
 */
export default function IntegrationsPage() {
  const { user } = useUser();
  const [gbpData, setGbpData] = useState<OAuthTokenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOAuthTokens() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const tokens = await getOAuthTokens(user.id, 'GOOGLE_BUSINESS');
        setGbpData(tokens);
      } catch (error) {
        console.error('Failed to load OAuth tokens:', error);
        setGbpData(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadOAuthTokens();
  }, [user]);

  const isConnected = gbpData && gbpData.accessToken;

  return (
    <div className="animate-fade-in-up space-y-8">
      <PageHeader
        title="Integrations"
        description="Connect your essential platforms to automate workflows and unify your data."
      />
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Available Integrations</CardTitle>
          <CardDescription>
            Connect these platforms to pull in reviews, sync listings, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-6 md:grid-cols-2">
            <li className="flex items-center justify-between rounded-lg border p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <Globe className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Google Business Profile</h3>
                  <p className="text-sm text-muted-foreground">
                    Sync reviews and business information.
                  </p>
                </div>
              </div>
              {isConnected ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Connected</span>
                </div>
              ) : (
                <form action={connectGoogleBusinessProfileAction}>
                  <Button type="submit" disabled={isLoading} variant="ai">
                    {isLoading ? 'Checking...' : 'Connect'}
                  </Button>
                </form>
              )}
            </li>
            <li className="flex items-center justify-between rounded-lg border border-dashed p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <Home className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground">
                    Zillow Profile
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sync reviews and ratings.
                  </p>
                </div>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-dashed p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <Building className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground">
                    Realtor.com Profile
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Aggregate your client testimonials.
                  </p>
                </div>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-dashed p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <Share2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground">
                    Social Media
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Automate listing and review posts.
                  </p>
                </div>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-dashed p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground">CRM</h3>
                  <p className="text-sm text-muted-foreground">
                    Sync leads from your website.
                  </p>
                </div>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-dashed p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <Workflow className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground">
                    MCP Integration
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with your MCP for AI modes.
                  </p>
                </div>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
