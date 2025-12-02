/**
 * Export UI Components Usage Examples
 * 
 * Demonstrates how to use the export UI components in different scenarios
 */

// ============================================================================
// Example 1: Simple Export Buttons
// ============================================================================

/*
import { ExportButtons } from '@/components/open-house/export-buttons';

function SessionHeader({ session }) {
    return (
        <div className="flex items-center justify-between">
            <h1>{session.propertyAddress}</h1>
            
            {session.status === 'completed' && (
                <ExportButtons
                    sessionId={session.sessionId}
                    visitorCount={session.visitorCount}
                />
            )}
        </div>
    );
}
*/

// ============================================================================
// Example 2: Export Dialog with Custom Trigger
// ============================================================================

/*
import { ExportDialog } from '@/components/open-house/export-dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

function SessionActions({ session }) {
    return (
        <div className="flex gap-2">
            <ExportDialog
                sessionId={session.sessionId}
                visitorCount={session.visitorCount}
                trigger={
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                }
            />
        </div>
    );
}
*/

// ============================================================================
// Example 3: Export Buttons in Different Variants
// ============================================================================

/*
import { ExportButtons } from '@/components/open-house/export-buttons';

function SessionCard({ session }) {
    return (
        <div className="card">
            <div className="card-header">
                <h3>{session.propertyAddress}</h3>
            </div>
            <div className="card-footer">
                {/* Default variant *\/}
                <ExportButtons
                    sessionId={session.sessionId}
                    visitorCount={session.visitorCount}
                    variant="default"
                />
                
                {/* Outline variant *\/}
                <ExportButtons
                    sessionId={session.sessionId}
                    visitorCount={session.visitorCount}
                    variant="outline"
                />
                
                {/* Ghost variant *\/}
                <ExportButtons
                    sessionId={session.sessionId}
                    visitorCount={session.visitorCount}
                    variant="ghost"
                />
                
                {/* Icon only *\/}
                <ExportButtons
                    sessionId={session.sessionId}
                    visitorCount={session.visitorCount}
                    size="icon"
                    showLabel={false}
                />
            </div>
        </div>
    );
}
*/

// ============================================================================
// Example 4: Export Dialog with Progress Tracking
// ============================================================================

/*
import { ExportDialog } from '@/components/open-house/export-dialog';

function SessionDetailPage({ session }) {
    return (
        <div>
            <h1>{session.propertyAddress}</h1>
            
            {/* The dialog automatically handles progress indicators *\/}
            <ExportDialog
                sessionId={session.sessionId}
                visitorCount={session.visitorCount}
            />
            
            {/* Progress states:
                - idle: Shows format selection and options
                - exporting: Shows progress bar and percentage
                - success: Shows success message and download button
                - error: Shows error message and retry button
            *\/}
        </div>
    );
}
*/

// ============================================================================
// Example 5: Conditional Export Based on Session Status
// ============================================================================

/*
import { ExportButtons } from '@/components/open-house/export-buttons';
import { ExportDialog } from '@/components/open-house/export-dialog';

function SessionActions({ session }) {
    // Only show export for completed sessions
    if (session.status !== 'completed') {
        return null;
    }
    
    return (
        <div className="flex gap-2">
            {/* Quick export dropdown *\/}
            <ExportButtons
                sessionId={session.sessionId}
                visitorCount={session.visitorCount}
                variant="outline"
            />
            
            {/* Detailed export dialog *\/}
            <ExportDialog
                sessionId={session.sessionId}
                visitorCount={session.visitorCount}
            />
        </div>
    );
}
*/

// ============================================================================
// Example 6: Export in Session List
// ============================================================================

/*
import { ExportButtons } from '@/components/open-house/export-buttons';

function SessionList({ sessions }) {
    return (
        <div className="space-y-4">
            {sessions.map((session) => (
                <div key={session.sessionId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <h3>{session.propertyAddress}</h3>
                        <p className="text-sm text-muted-foreground">
                            {session.visitorCount} visitors
                        </p>
                    </div>
                    
                    {session.status === 'completed' && (
                        <ExportButtons
                            sessionId={session.sessionId}
                            visitorCount={session.visitorCount}
                            variant="ghost"
                            size="sm"
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
*/

// ============================================================================
// Example 7: Export with Performance Monitoring
// ============================================================================

/*
import { ExportDialog } from '@/components/open-house/export-dialog';
import { estimateExportTime } from '@/lib/open-house/export-performance';

function SessionExport({ session }) {
    const estimatedTime = estimateExportTime(session.visitorCount);
    
    return (
        <div>
            <p className="text-sm text-muted-foreground mb-2">
                Estimated export time: {Math.round(estimatedTime / 1000)} seconds
            </p>
            
            <ExportDialog
                sessionId={session.sessionId}
                visitorCount={session.visitorCount}
            />
            
            {session.visitorCount > 100 && (
                <p className="text-sm text-yellow-600 mt-2">
                    Large session detected. Export may take longer than usual.
                </p>
            )}
        </div>
    );
}
*/

// ============================================================================
// Example 8: Export in Analytics Dashboard
// ============================================================================

/*
import { ExportButtons } from '@/components/open-house/export-buttons';

function AnalyticsDashboard({ sessions }) {
    return (
        <div>
            <h2>Session Analytics</h2>
            
            <div className="grid grid-cols-3 gap-4">
                {sessions.map((session) => (
                    <div key={session.sessionId} className="card">
                        <div className="card-header">
                            <h3>{session.propertyAddress}</h3>
                        </div>
                        <div className="card-content">
                            <p>Visitors: {session.visitorCount}</p>
                            <p>High Interest: {session.interestLevelDistribution.high}</p>
                        </div>
                        <div className="card-footer">
                            <ExportButtons
                                sessionId={session.sessionId}
                                visitorCount={session.visitorCount}
                                variant="outline"
                                size="sm"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
*/

export { };
