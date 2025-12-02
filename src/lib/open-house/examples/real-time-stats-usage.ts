/**
 * Real-time Session Statistics Usage Examples
 * 
 * This file demonstrates how to use the real-time statistics features
 * for active open house sessions.
 * 
 * Validates Requirements: 11.1, 11.2
 */

import { useSessionStats } from '@/hooks/use-session-stats';
import { OpenHouseSession } from '@/lib/open-house/types';

// ============================================================================
// Example 1: Basic Usage in a Component
// ============================================================================

/**
 * Example: Using the useSessionStats hook in a component
 * 
 * The hook automatically polls for updates every 2 seconds when the session
 * is active, and updates the elapsed time every minute.
 */
export function ExampleComponent({ session }: { session: OpenHouseSession }) {
    const { stats, isLoading, error, refresh } = useSessionStats({
        sessionId: session.sessionId,
        initialSession: session,
        pollingInterval: 2000, // Poll every 2 seconds (Requirement 11.2)
        enabled: session.status === 'active',
    });

    return (
        <div>
        <h2>Real - time Statistics </h2>

    {/* Visitor Count (Requirement 11.1) */ }
    <div>
        <p>Total Visitors: { stats.visitorCount } </p>
            </div>

    {/* Interest Level Distribution (Requirement 11.1) */ }
    <div>
        <p>High Interest: { stats.interestLevelDistribution.high } </p>
            < p > Medium Interest: { stats.interestLevelDistribution.medium } </p>
                < p > Low Interest: { stats.interestLevelDistribution.low } </p>
                    </div>

    {/* Elapsed Time (Requirement 11.1) */ }
    <div>
        <p>Elapsed Time: { stats.elapsedTimeFormatted } </p>
            < p > Minutes: { stats.elapsedTime } </p>
                </div>

    {/* Loading and Error States */ }
    { isLoading && <p>Updating...</p> }
    { error && <p>Error: { error } </p> }

    {/* Manual Refresh */ }
    <button onClick={ refresh }> Refresh Now </button>
        </div>
    );
}

// ============================================================================
// Example 2: Custom Polling Interval
// ============================================================================

/**
 * Example: Using a custom polling interval
 * 
 * You can adjust the polling interval based on your needs.
 * Default is 2000ms (2 seconds) to meet Requirement 11.2.
 */
export function CustomPollingExample({ session }: { session: OpenHouseSession }) {
    const { stats } = useSessionStats({
        sessionId: session.sessionId,
        initialSession: session,
        pollingInterval: 5000, // Poll every 5 seconds
        enabled: true,
    });

    return (
        <div>
        <p>Visitors: { stats.visitorCount } </p>
            </div>
    );
}

// ============================================================================
// Example 3: Conditional Polling
// ============================================================================

/**
 * Example: Enable/disable polling based on conditions
 * 
 * Polling is automatically disabled for non-active sessions,
 * but you can also control it manually.
 */
export function ConditionalPollingExample({
    session,
    userWantsRealtime
}: {
    session: OpenHouseSession;
    userWantsRealtime: boolean;
}) {
    const { stats } = useSessionStats({
        sessionId: session.sessionId,
        initialSession: session,
        enabled: session.status === 'active' && userWantsRealtime,
    });

    return (
        <div>
        <p>Visitors: { stats.visitorCount } </p>
            < p > Status: { stats.isActive ? 'Active' : 'Inactive' } </p>
                </div>
    );
}

// ============================================================================
// Example 4: Displaying Percentage Distribution
// ============================================================================

/**
 * Example: Calculate and display interest level percentages
 */
export function PercentageDistributionExample({ session }: { session: OpenHouseSession }) {
    const { stats } = useSessionStats({
        sessionId: session.sessionId,
        initialSession: session,
    });

    const total = stats.visitorCount;
    const highPercent = total > 0 ? Math.round((stats.interestLevelDistribution.high / total) * 100) : 0;
    const mediumPercent = total > 0 ? Math.round((stats.interestLevelDistribution.medium / total) * 100) : 0;
    const lowPercent = total > 0 ? Math.round((stats.interestLevelDistribution.low / total) * 100) : 0;

    return (
        <div>
        <h3>Interest Level Distribution </h3>
            < div >
            <p>High: { stats.interestLevelDistribution.high } ({ highPercent } %) </p>
                < p > Medium: { stats.interestLevelDistribution.medium } ({ mediumPercent } %) </p>
                    < p > Low: { stats.interestLevelDistribution.low } ({ lowPercent } %) </p>
                        </div>
                        </div>
    );
}

// ============================================================================
// Example 5: Elapsed Time Formatting
// ============================================================================

/**
 * Example: Different ways to display elapsed time
 */
export function ElapsedTimeExample({ session }: { session: OpenHouseSession }) {
    const { stats } = useSessionStats({
        sessionId: session.sessionId,
        initialSession: session,
    });

    // The hook provides both raw minutes and formatted string
    const hours = Math.floor(stats.elapsedTime / 60);
    const minutes = stats.elapsedTime % 60;

    return (
        <div>
        <h3>Elapsed Time </h3>

    {/* Pre-formatted string */ }
    <p>Formatted: { stats.elapsedTimeFormatted } </p>

    {/* Raw minutes */ }
    <p>Total Minutes: { stats.elapsedTime } </p>

    {/* Custom formatting */ }
    <p>Custom: { hours }: { minutes.toString().padStart(2, '0') } </p>
        </div>
    );
}

// ============================================================================
// Example 6: Real-time Update Indicator
// ============================================================================

/**
 * Example: Show when data is being updated
 */
export function UpdateIndicatorExample({ session }: { session: OpenHouseSession }) {
    const { stats, isLoading } = useSessionStats({
        sessionId: session.sessionId,
        initialSession: session,
    });

    return (
        <div>
        <div style= {{ display: 'flex', alignItems: 'center', gap: '8px' }
}>
    <h3>Live Statistics </h3>
{
    isLoading && (
        <span style={
            {
                width: '8px',
                    height: '8px',
                        borderRadius: '50%',
                            backgroundColor: 'blue',
                                animation: 'pulse 1s infinite'
            }
    } />
                )
}
</div>
    < p > Visitors: { stats.visitorCount } </p>
        </div>
    );
}

// ============================================================================
// Example 7: Integration with ActiveSessionMonitor Component
// ============================================================================

/**
 * Example: Using the pre-built ActiveSessionMonitor component
 * 
 * The ActiveSessionMonitor component provides a complete UI for real-time
 * statistics with all the features built-in.
 */
export function ActiveSessionMonitorExample({ session }: { session: OpenHouseSession }) {
    // Import the component
    // import { ActiveSessionMonitor } from '@/components/open-house/active-session-monitor';

    return (
        <div>
        {/* Only show for active sessions */ }
            {
        session.status === 'active' && (
            // <ActiveSessionMonitor session={session} />
            <div>ActiveSessionMonitor would render here </div>
            )
    }
    </div>
    );
}

// ============================================================================
// API Route Usage
// ============================================================================

/**
 * The real-time statistics are fetched from:
 * GET /api/open-house/sessions/[sessionId]/stats
 *
 * Response format:
 * {
 *   success: true,
 *   session: {
 *     sessionId: string,
 *     visitorCount: number,
 *     interestLevelDistribution: {
 *       high: number,
 *       medium: number,
 *       low: number
 *     },
 *     actualStartTime: string,
 *     status: string,
 *     ...
 *   }
 * }
 *
 * The hook automatically calculates:
 * - Elapsed time from actualStartTime
 * - Formatted elapsed time string
 * - Whether the session is active
 */

// ============================================================================
// Performance Considerations
// ============================================================================

/**
 * Performance Notes:
 * 
 * 1. Polling Interval: Default is 2 seconds to meet Requirement 11.2
 *    - Adjust based on your needs (longer = less load, shorter = more real-time)
 * 
 * 2. Automatic Cleanup: The hook automatically stops polling when:
 *    - The component unmounts
 *    - The session becomes inactive
 *    - Polling is disabled via the `enabled` prop
 * 
 * 3. Elapsed Time Updates: Elapsed time updates every minute locally
 *    without making API calls, reducing server load
 * 
 * 4. Initial Data: The hook uses initialSession to show data immediately
 *    before the first poll completes
 */
