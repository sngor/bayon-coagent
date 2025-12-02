/**
 * PDF Export Utilities for Open House Sessions
 * 
 * Generates PDF reports with session details, visitor list, and statistics
 * Validates Requirements: 6.1
 */

import { jsPDF } from 'jspdf';
import { OpenHouseSession, Visitor } from './types';

/**
 * Formats a date string to a readable format
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Formats a time string to a readable format
 */
function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Formats a duration in minutes to hours and minutes
 */
function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
        return `${mins} minutes`;
    } else if (mins === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
        return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
    }
}

/**
 * Calculates session duration in minutes
 */
function calculateDuration(session: OpenHouseSession): number | null {
    if (!session.actualStartTime || !session.actualEndTime) {
        return null;
    }

    const start = new Date(session.actualStartTime);
    const end = new Date(session.actualEndTime);
    return Math.round((end.getTime() - start.getTime()) / 60000);
}

/**
 * Calculates average interest level
 */
function calculateAverageInterestLevel(session: OpenHouseSession): string {
    const { high, medium, low } = session.interestLevelDistribution;
    const total = high + medium + low;

    if (total === 0) return 'N/A';

    // Weight: high=3, medium=2, low=1
    const weighted = (high * 3 + medium * 2 + low * 1) / total;

    if (weighted >= 2.5) return 'High';
    if (weighted >= 1.5) return 'Medium';
    return 'Low';
}

/**
 * Generates a PDF report for an open house session
 * 
 * @param session - The open house session data
 * @param visitors - Array of visitors who attended
 * @returns PDF as Buffer
 */
export function generateSessionPDF(
    session: OpenHouseSession,
    visitors: Visitor[]
): Buffer {
    // Create new PDF document (Letter size: 8.5" x 11")
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 0.75;
    const contentWidth = pageWidth - (margin * 2);

    let yPosition = margin;

    // ========================================================================
    // Header Section
    // ========================================================================

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Open House Report', margin, yPosition);
    yPosition += 0.4;

    // Property Address
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(session.propertyAddress, margin, yPosition);
    yPosition += 0.5;

    // Divider line
    doc.setLineWidth(0.01);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 0.3;

    // ========================================================================
    // Session Information Section
    // ========================================================================

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Session Information', margin, yPosition);
    yPosition += 0.25;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    // Scheduled Date & Time
    doc.text('Scheduled:', margin, yPosition);
    doc.text(
        `${formatDate(session.scheduledDate)} at ${formatTime(session.scheduledStartTime)}`,
        margin + 1.5,
        yPosition
    );
    yPosition += 0.2;

    // Actual Start Time
    if (session.actualStartTime) {
        doc.text('Started:', margin, yPosition);
        doc.text(
            `${formatDate(session.actualStartTime)} at ${formatTime(session.actualStartTime)}`,
            margin + 1.5,
            yPosition
        );
        yPosition += 0.2;
    }

    // Actual End Time
    if (session.actualEndTime) {
        doc.text('Ended:', margin, yPosition);
        doc.text(
            `${formatDate(session.actualEndTime)} at ${formatTime(session.actualEndTime)}`,
            margin + 1.5,
            yPosition
        );
        yPosition += 0.2;
    }

    // Duration
    const duration = calculateDuration(session);
    if (duration !== null) {
        doc.text('Duration:', margin, yPosition);
        doc.text(formatDuration(duration), margin + 1.5, yPosition);
        yPosition += 0.2;
    }

    // Status
    doc.text('Status:', margin, yPosition);
    doc.text(session.status.charAt(0).toUpperCase() + session.status.slice(1), margin + 1.5, yPosition);
    yPosition += 0.4;

    // ========================================================================
    // Statistics Section
    // ========================================================================

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistics', margin, yPosition);
    yPosition += 0.25;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    // Total Visitors
    doc.text('Total Visitors:', margin, yPosition);
    doc.text(session.visitorCount.toString(), margin + 1.5, yPosition);
    yPosition += 0.2;

    // Interest Level Distribution
    doc.text('High Interest:', margin, yPosition);
    doc.text(
        `${session.interestLevelDistribution.high} (${session.visitorCount > 0 ? Math.round((session.interestLevelDistribution.high / session.visitorCount) * 100) : 0}%)`,
        margin + 1.5,
        yPosition
    );
    yPosition += 0.2;

    doc.text('Medium Interest:', margin, yPosition);
    doc.text(
        `${session.interestLevelDistribution.medium} (${session.visitorCount > 0 ? Math.round((session.interestLevelDistribution.medium / session.visitorCount) * 100) : 0}%)`,
        margin + 1.5,
        yPosition
    );
    yPosition += 0.2;

    doc.text('Low Interest:', margin, yPosition);
    doc.text(
        `${session.interestLevelDistribution.low} (${session.visitorCount > 0 ? Math.round((session.interestLevelDistribution.low / session.visitorCount) * 100) : 0}%)`,
        margin + 1.5,
        yPosition
    );
    yPosition += 0.2;

    // Average Interest Level
    doc.text('Average Interest:', margin, yPosition);
    doc.text(calculateAverageInterestLevel(session), margin + 1.5, yPosition);
    yPosition += 0.4;

    // ========================================================================
    // Visitor List Section
    // ========================================================================

    // Check if we need a new page
    if (yPosition > pageHeight - 2) {
        doc.addPage();
        yPosition = margin;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Visitor List', margin, yPosition);
    yPosition += 0.3;

    if (visitors.length === 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.text('No visitors checked in', margin, yPosition);
    } else {
        // Table header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');

        const col1X = margin;
        const col2X = margin + 2.2;
        const col3X = margin + 4.2;
        const col4X = margin + 5.7;

        doc.text('Name', col1X, yPosition);
        doc.text('Email', col2X, yPosition);
        doc.text('Phone', col3X, yPosition);
        doc.text('Interest', col4X, yPosition);
        yPosition += 0.05;

        // Header underline
        doc.setLineWidth(0.005);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 0.15;

        // Table rows
        doc.setFont('helvetica', 'normal');

        for (const visitor of visitors) {
            // Check if we need a new page
            if (yPosition > pageHeight - margin - 0.3) {
                doc.addPage();
                yPosition = margin;

                // Repeat header on new page
                doc.setFont('helvetica', 'bold');
                doc.text('Name', col1X, yPosition);
                doc.text('Email', col2X, yPosition);
                doc.text('Phone', col3X, yPosition);
                doc.text('Interest', col4X, yPosition);
                yPosition += 0.05;
                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 0.15;
                doc.setFont('helvetica', 'normal');
            }

            // Truncate long text to fit columns
            const name = visitor.name.length > 20 ? visitor.name.substring(0, 17) + '...' : visitor.name;
            const email = visitor.email.length > 22 ? visitor.email.substring(0, 19) + '...' : visitor.email;
            const phone = visitor.phone;
            const interest = visitor.interestLevel.charAt(0).toUpperCase() + visitor.interestLevel.slice(1);

            doc.text(name, col1X, yPosition);
            doc.text(email, col2X, yPosition);
            doc.text(phone, col3X, yPosition);
            doc.text(interest, col4X, yPosition);
            yPosition += 0.2;
        }
    }

    // ========================================================================
    // Notes Section (if present)
    // ========================================================================

    if (session.notes && session.notes.trim().length > 0) {
        yPosition += 0.3;

        // Check if we need a new page
        if (yPosition > pageHeight - 2) {
            doc.addPage();
            yPosition = margin;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes', margin, yPosition);
        yPosition += 0.25;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        // Split notes into lines that fit the page width
        const lines = doc.splitTextToSize(session.notes, contentWidth);

        for (const line of lines) {
            // Check if we need a new page
            if (yPosition > pageHeight - margin - 0.3) {
                doc.addPage();
                yPosition = margin;
            }

            doc.text(line, margin, yPosition);
            yPosition += 0.2;
        }
    }

    // ========================================================================
    // Footer
    // ========================================================================

    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);

        // Page number
        doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - 0.4,
            { align: 'center' }
        );

        // Generated timestamp
        doc.text(
            `Generated on ${new Date().toLocaleString('en-US')}`,
            pageWidth / 2,
            pageHeight - 0.25,
            { align: 'center' }
        );
    }

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
}
