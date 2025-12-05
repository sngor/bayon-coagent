
'use client';

// import { InvestmentOpportunityIdentificationForm } from '@/components/investment-opportunity-identification/investment-opportunity-identification-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { getAlertsAction } from '@/app/actions';
import { LifeEventAlert } from '@/lib/alerts/types';
import { Users, MapPin, Calendar, TrendingUp, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { FavoritesButton } from '@/components/favorites-button';
import { getPageMetadata } from '@/lib/page-metadata';

export default function InvestmentOpportunityIdentificationPage() {
  const [highIntentLeads, setHighIntentLeads] = useState<LifeEventAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pageMetadata = getPageMetadata('/intelligence/opportunities');

  useEffect(() => {
    const fetchHighIntentLeads = async () => {
      try {
        const result = await getAlertsAction({
          types: ['life-event-lead'],
          status: ['unread', 'read'],
        });

        if (result.message === 'Alerts retrieved successfully' && result.data) {
          // Filter for high-intent leads (score > 70)
          const leads = result.data.alerts
            .filter((alert: any): alert is LifeEventAlert =>
              alert.type === 'life-event-lead' && alert.data.leadScore > 70
            )
            .slice(0, 5); // Show top 5 leads

          setHighIntentLeads(leads);
        }
      } catch (error) {
        console.error('Error fetching high-intent leads:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load high-intent leads.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHighIntentLeads();
  }, []);

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'marriage': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'divorce': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'job-change': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'retirement': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'birth': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'death': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-8">
      {/* High-Intent Leads Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                High-Intent Leads
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Prospects with life events indicating strong buying/selling intent
              </p>
            </div>
            <div className="flex items-center gap-2">
              {pageMetadata && <FavoritesButton item={pageMetadata} variant="outline" size="sm" />}
              <Button variant="outline" size="sm" asChild>
                <Link href="/market/alerts">
                  View All <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : highIntentLeads.length > 0 ? (
            <div className="space-y-4">
              {highIntentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getEventTypeColor(lead.data.eventType)}>
                        {formatEventType(lead.data.eventType)}
                      </Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Score: {lead.data.leadScore}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {lead.data.prospectLocation}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(lead.data.eventDate).toLocaleDateString()}
                      </div>
                    </div>

                    <p className="text-sm">{lead.data.recommendedAction}</p>

                    {lead.data.additionalEvents && lead.data.additionalEvents.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        Multiple events: {lead.data.additionalEvents.join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No high-intent leads found</p>
              <p className="text-sm">Check back later for new opportunities</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investment Opportunity Form */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Opportunity Analysis</CardTitle>
          <CardDescription>Analyze potential investment opportunities in your market</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Investment opportunity analysis tools coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
