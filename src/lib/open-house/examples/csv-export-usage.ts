/**
 * CSV Export Usage Examples
 * 
 * Demonstrates how to use the CSV export functionality for open house visitors
 */

import { exportVisitorCSV } from '@/app/(app)/open-house/actions';
import { generateVisitorCSV, generateVisitorCSVBuffer } from '@/lib/open-house/csv-export';
import { Visitor, InterestLevel, CheckInSource } from '@/lib/open-house/types';

// ============================================================================
// Example 1: Export all visitor data to CSV via server action
// ============================================================================

async function exportAllVisitorData(sessionId: string) {
    // Export with all fields (default)
    const result = await exportVisitorCSV(sessionId);

    if (result.success && result.url) {
        console.log('CSV export successful!');
        console.log('Download URL:', result.url);

        // The URL is valid for 1 hour
        // You can provide this to the user for download
        return result.url;
    } else {
        console.error('Export failed:', result.error);
        return null;
    }
}

// ============================================================================
// Example 2: Export with limited fields (permission-based filtering)
// ============================================================================

async function exportLimitedVisitorData(sessionId: string) {
    // Only export name, email, and interest level
    // Useful when sharing with team members who don't need full contact info
    const result = await exportVisitorCSV(sessionId, {
        name: true,
        email: true,
        interestLevel: true,
        checkInTime: true,
        // Exclude phone numbers and notes
        phone: false,
        notes: false,
        visitorId: false,
        followUpGenerated: false,
        followUpSent: false,
        followUpSentAt: false,
        source: false,
        createdAt: false,
        updatedAt: false,
    });

    if (result.success && result.url) {
        console.log('Limited CSV export successful!');
        return result.url;
    } else {
        console.error('Export failed:', result.error);
        return null;
    }
}

// ============================================================================
// Example 3: Generate CSV content directly (for custom processing)
// ============================================================================

function generateCustomCSV(visitors: Visitor[]) {
    // Generate CSV string with all fields
    const csvContent = generateVisitorCSV(visitors);

    console.log('CSV Content:');
    console.log(csvContent);

    return csvContent;
}

// ============================================================================
// Example 4: Generate CSV with specific fields for CRM import
// ============================================================================

function generateCRMImportCSV(visitors: Visitor[]) {
    // Only include fields needed for CRM import
    const csvContent = generateVisitorCSV(visitors, {
        name: true,
        email: true,
        phone: true,
        interestLevel: true,
        notes: true,
        // Exclude internal tracking fields
        visitorId: false,
        followUpGenerated: false,
        followUpSent: false,
        followUpSentAt: false,
        source: false,
        createdAt: false,
        updatedAt: false,
    });

    return csvContent;
}

// ============================================================================
// Example 5: Generate CSV buffer for file download
// ============================================================================

function generateCSVForDownload(visitors: Visitor[]) {
    // Generate as Buffer for file operations
    const csvBuffer = generateVisitorCSVBuffer(visitors);

    // Can be used with file system operations or HTTP responses
    console.log('CSV Buffer size:', csvBuffer.length, 'bytes');

    return csvBuffer;
}

// ============================================================================
// Example 6: Export high-interest visitors only
// ============================================================================

async function exportHighInterestVisitors(sessionId: string, allVisitors: Visitor[]) {
    // Filter to high-interest visitors
    const highInterestVisitors = allVisitors.filter(
        v => v.interestLevel === InterestLevel.HIGH
    );

    // Generate CSV for filtered list
    const csvContent = generateVisitorCSV(highInterestVisitors, {
        name: true,
        email: true,
        phone: true,
        interestLevel: true,
        notes: true,
        checkInTime: true,
        followUpSent: true,
    });

    console.log(`Exported ${highInterestVisitors.length} high-interest visitors`);
    return csvContent;
}

// ============================================================================
// Example 7: Export for email marketing platform
// ============================================================================

function generateEmailMarketingCSV(visitors: Visitor[]) {
    // Format for email marketing platforms (typically need name and email)
    const csvContent = generateVisitorCSV(visitors, {
        name: true,
        email: true,
        interestLevel: true,
        // Exclude all other fields
        phone: false,
        notes: false,
        checkInTime: false,
        followUpGenerated: false,
        followUpSent: false,
        followUpSentAt: false,
        source: false,
        visitorId: false,
        createdAt: false,
        updatedAt: false,
    });

    return csvContent;
}

// ============================================================================
// Example 8: Complete workflow - Export and download
// ============================================================================

async function completeExportWorkflow(sessionId: string) {
    console.log('Starting CSV export for session:', sessionId);

    // Step 1: Export to S3
    const result = await exportVisitorCSV(sessionId);

    if (!result.success) {
        console.error('Export failed:', result.error);
        return;
    }

    // Step 2: Get download URL
    const downloadUrl = result.url!;
    console.log('Export successful!');
    console.log('Download URL:', downloadUrl);

    // Step 3: Provide URL to user
    // In a real application, you would:
    // - Display a download button with this URL
    // - Or automatically trigger a download
    // - Or send the URL via email

    return {
        success: true,
        downloadUrl,
        expiresIn: '1 hour',
    };
}

// ============================================================================
// Example 9: Batch export for multiple sessions
// ============================================================================

async function batchExportSessions(sessionIds: string[]) {
    const results = [];

    for (const sessionId of sessionIds) {
        console.log(`Exporting session ${sessionId}...`);

        const result = await exportVisitorCSV(sessionId);

        results.push({
            sessionId,
            success: result.success,
            url: result.url,
            error: result.error,
        });

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Exported ${results.filter(r => r.success).length} of ${sessionIds.length} sessions`);
    return results;
}

// ============================================================================
// Example 10: Export with custom filename
// ============================================================================

async function exportWithCustomFilename(sessionId: string, propertyAddress: string) {
    // The server action automatically generates a filename based on:
    // - Property address (sanitized)
    // - Timestamp
    // Example: "open-house-visitors-123-Main-St-2024-01-15T10-30-00-000Z.csv"

    const result = await exportVisitorCSV(sessionId);

    if (result.success && result.url) {
        console.log('CSV exported with filename based on:', propertyAddress);
        console.log('Download URL:', result.url);
        return result.url;
    }

    return null;
}

// ============================================================================
// Sample Data for Testing
// ============================================================================

const sampleVisitors: Visitor[] = [
    {
        visitorId: 'visitor-1',
        sessionId: 'session-1',
        userId: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0100',
        interestLevel: InterestLevel.HIGH,
        notes: 'Very interested, wants to schedule a private showing',
        checkInTime: '2024-01-15T10:30:00Z',
        followUpGenerated: true,
        followUpSent: true,
        followUpSentAt: '2024-01-15T14:00:00Z',
        source: CheckInSource.QR,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T14:00:00Z',
    },
    {
        visitorId: 'visitor-2',
        sessionId: 'session-1',
        userId: 'user-1',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-0200',
        interestLevel: InterestLevel.MEDIUM,
        notes: 'Interested but needs to discuss with spouse',
        checkInTime: '2024-01-15T11:00:00Z',
        followUpGenerated: true,
        followUpSent: false,
        source: CheckInSource.MANUAL,
        createdAt: '2024-01-15T11:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
    },
];

// ============================================================================
// Usage Examples
// ============================================================================

// Example usage in a React component:
/*
'use client';

import { useState } from 'react';
import { exportVisitorCSV } from '@/app/(app)/open-house/actions';
import { Button } from '@/components/ui/button';

export function ExportButton({ sessionId }: { sessionId: string }) {
    const [isExporting, setIsExporting] = useState(false);
    
    const handleExport = async () => {
        setIsExporting(true);
        
        const result = await exportVisitorCSV(sessionId);
        
        if (result.success && result.url) {
            // Trigger download
            window.open(result.url, '_blank');
        } else {
            alert('Export failed: ' + result.error);
        }
        
        setIsExporting(false);
    };
    
    return (
        <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export to CSV'}
        </Button>
    );
}
*/

// Example usage in a server component:
/*
import { exportVisitorCSV } from '@/app/(app)/open-house/actions';

export async function SessionExportPage({ sessionId }: { sessionId: string }) {
    // Generate export on page load
    const result = await exportVisitorCSV(sessionId);
    
    if (!result.success) {
        return <div>Error: {result.error}</div>;
    }
    
    return (
        <div>
            <h1>Export Ready</h1>
            <a href={result.url} download>
                Download CSV
            </a>
        </div>
    );
}
*/

export {
    exportAllVisitorData,
    exportLimitedVisitorData,
    generateCustomCSV,
    generateCRMImportCSV,
    generateCSVForDownload,
    exportHighInterestVisitors,
    generateEmailMarketingCSV,
    completeExportWorkflow,
    batchExportSessions,
    exportWithCustomFilename,
    sampleVisitors,
};
