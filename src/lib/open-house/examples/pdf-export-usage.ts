/**
 * PDF Export Usage Examples
 * 
 * Demonstrates how to use the PDF export functionality for open house sessions.
 * Validates Requirements: 6.1
 */

import { exportSessionPDF } from '@/app/(app)/open-house/actions';

/**
 * Example 1: Export a completed session as PDF
 * 
 * This is the most common use case - exporting a completed open house session
 * to share with clients, brokers, or for record keeping.
 */
export async function exportCompletedSession() {
    const sessionId = 'session-123';

    const result = await exportSessionPDF(sessionId);

    if (result.success && result.url) {
        console.log('PDF generated successfully!');
        console.log('Download URL:', result.url);

        // The URL is a presigned S3 URL valid for 1 hour
        // You can:
        // 1. Redirect the user to this URL to download
        // 2. Display a download button with this URL
        // 3. Send this URL via email

        return result.url;
    } else {
        console.error('Failed to generate PDF:', result.error);
        return null;
    }
}

/**
 * Example 2: Export and download in a React component
 * 
 * Shows how to trigger PDF export from a UI component and handle
 * the download in the browser.
 */
export async function handleExportClick(sessionId: string) {
    try {
        // Show loading state
        console.log('Generating PDF...');

        // Call the server action
        const result = await exportSessionPDF(sessionId);

        if (result.success && result.url) {
            // Open the download URL in a new tab
            // The presigned URL has Content-Disposition header set to 'attachment'
            // so the browser will download the file instead of displaying it
            window.open(result.url, '_blank');

            // Or use an anchor element for better control
            const link = document.createElement('a');
            link.href = result.url;
            link.download = `open-house-report-${sessionId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('PDF download started');
        } else {
            throw new Error(result.error || 'Failed to generate PDF');
        }
    } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    }
}

/**
 * Example 3: Export multiple sessions
 * 
 * Demonstrates how to export multiple sessions in sequence.
 * Note: For better UX, consider implementing this with a progress indicator.
 */
export async function exportMultipleSessions(sessionIds: string[]) {
    const results: Array<{ sessionId: string; url?: string; error?: string }> = [];

    for (const sessionId of sessionIds) {
        const result = await exportSessionPDF(sessionId);

        results.push({
            sessionId,
            url: result.url,
            error: result.error,
        });

        // Add a small delay between exports to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Filter successful exports
    const successful = results.filter(r => r.url);
    const failed = results.filter(r => r.error);

    console.log(`Successfully exported ${successful.length} sessions`);
    if (failed.length > 0) {
        console.log(`Failed to export ${failed.length} sessions`);
    }

    return results;
}

/**
 * Example 4: Export with error handling and retry
 * 
 * Shows robust error handling with automatic retry logic.
 */
export async function exportWithRetry(
    sessionId: string,
    maxRetries: number = 3
): Promise<string | null> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Export attempt ${attempt} of ${maxRetries}...`);

            const result = await exportSessionPDF(sessionId);

            if (result.success && result.url) {
                console.log('Export successful!');
                return result.url;
            }

            lastError = result.error;

            // Wait before retrying (exponential backoff)
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`Retrying in ${delay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (error) {
            lastError = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Attempt ${attempt} failed:`, error);
        }
    }

    console.error(`Failed to export after ${maxRetries} attempts:`, lastError);
    return null;
}

/**
 * Example 5: Export and send via email
 * 
 * Demonstrates how to export a PDF and send it via email.
 * Note: This requires email sending functionality to be implemented.
 */
export async function exportAndEmail(
    sessionId: string,
    recipientEmail: string
) {
    // Generate the PDF
    const result = await exportSessionPDF(sessionId);

    if (!result.success || !result.url) {
        throw new Error(result.error || 'Failed to generate PDF');
    }

    // The PDF is now stored in S3 and we have a presigned URL
    // You can:
    // 1. Send the presigned URL directly in the email (valid for 1 hour)
    // 2. Download the PDF and attach it to the email
    // 3. Store the S3 key and generate a new presigned URL when needed

    console.log('PDF generated:', result.url);
    console.log('Ready to send to:', recipientEmail);

    // Example email content
    const emailContent = {
        to: recipientEmail,
        subject: 'Open House Report',
        body: `
            Your open house report is ready!
            
            Download your report here: ${result.url}
            
            Note: This link will expire in 1 hour.
        `,
    };

    return emailContent;
}

/**
 * Example 6: Check export performance
 * 
 * Validates that PDF generation meets the performance requirement (6.4)
 * of completing within 10 seconds for sessions with up to 100 visitors.
 */
export async function measureExportPerformance(sessionId: string) {
    const startTime = Date.now();

    const result = await exportSessionPDF(sessionId);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`PDF export completed in ${duration}ms`);

    // Requirement 6.4: Should complete within 10 seconds for 100 visitors
    if (duration > 10000) {
        console.warn('Export took longer than 10 seconds!');
    } else {
        console.log('Export performance is within acceptable range');
    }

    return {
        success: result.success,
        url: result.url,
        duration,
        withinTarget: duration <= 10000,
    };
}

/**
 * Example 7: Export from session detail page
 * 
 * Complete example showing how to integrate PDF export into a session detail page.
 */
export async function sessionDetailPageExport(sessionId: string) {
    // This would typically be called from a button click handler
    // in the session detail page component

    try {
        // Show loading state
        const loadingToast = {
            title: 'Generating PDF...',
            description: 'Please wait while we create your report',
        };
        console.log(loadingToast);

        // Generate PDF
        const result = await exportSessionPDF(sessionId);

        if (result.success && result.url) {
            // Hide loading, show success
            const successToast = {
                title: 'PDF Generated',
                description: 'Your report is ready to download',
            };
            console.log(successToast);

            // Trigger download
            window.open(result.url, '_blank');

            return true;
        } else {
            // Show error
            const errorToast = {
                title: 'Export Failed',
                description: result.error || 'Unable to generate PDF',
                variant: 'destructive',
            };
            console.error(errorToast);

            return false;
        }
    } catch (error) {
        console.error('Unexpected error during export:', error);
        return false;
    }
}

/**
 * Example 8: Batch export with progress tracking
 * 
 * Shows how to export multiple sessions with progress updates.
 */
export async function batchExportWithProgress(
    sessionIds: string[],
    onProgress?: (current: number, total: number) => void
) {
    const total = sessionIds.length;
    const results: Array<{ sessionId: string; success: boolean; url?: string }> = [];

    for (let i = 0; i < sessionIds.length; i++) {
        const sessionId = sessionIds[i];

        // Update progress
        if (onProgress) {
            onProgress(i + 1, total);
        }

        // Export session
        const result = await exportSessionPDF(sessionId);

        results.push({
            sessionId,
            success: result.success,
            url: result.url,
        });

        // Small delay between exports
        if (i < sessionIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return results;
}
