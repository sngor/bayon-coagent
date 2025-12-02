/**
 * CSV Export Utilities for Open House Sessions
 * 
 * Generates CSV files with visitor data for external use
 * Validates Requirements: 6.2, 6.3
 */

import { Visitor } from './types';

/**
 * Formats a date string to a readable format
 */
function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
}

/**
 * Escapes a CSV field value
 * Handles quotes, commas, and newlines
 */
function escapeCsvField(value: string | undefined | null): string {
    if (value === undefined || value === null) {
        return '';
    }

    const stringValue = String(value);

    // If the value contains quotes, commas, or newlines, wrap it in quotes
    // and escape any existing quotes by doubling them
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

/**
 * Defines the fields that can be included in the CSV export
 * Used for permission-based filtering
 */
export interface CsvExportFields {
    name: boolean;
    email: boolean;
    phone: boolean;
    interestLevel: boolean;
    notes: boolean;
    checkInTime: boolean;
    followUpGenerated: boolean;
    followUpSent: boolean;
    followUpSentAt: boolean;
    source: boolean;
    visitorId: boolean;
    createdAt: boolean;
    updatedAt: boolean;
}

/**
 * Default fields to include in CSV export
 * All fields are included by default
 */
export const DEFAULT_CSV_FIELDS: CsvExportFields = {
    name: true,
    email: true,
    phone: true,
    interestLevel: true,
    notes: true,
    checkInTime: true,
    followUpGenerated: true,
    followUpSent: true,
    followUpSentAt: true,
    source: true,
    visitorId: true,
    createdAt: true,
    updatedAt: true,
};

/**
 * Generates a CSV file with visitor data
 * 
 * Property 34: Exports contain all required data
 * For any session export (CSV), the export should contain all visitor information
 * including timestamps and interest levels
 * 
 * @param visitors - Array of visitors to export
 * @param fields - Optional field configuration for permission-based filtering
 * @returns CSV content as string
 */
export function generateVisitorCSV(
    visitors: Visitor[],
    fields: Partial<CsvExportFields> = {}
): string {
    // Merge with default fields
    const includeFields: CsvExportFields = {
        ...DEFAULT_CSV_FIELDS,
        ...fields,
    };

    // Build header row based on included fields
    const headers: string[] = [];

    if (includeFields.visitorId) headers.push('Visitor ID');
    if (includeFields.name) headers.push('Name');
    if (includeFields.email) headers.push('Email');
    if (includeFields.phone) headers.push('Phone');
    if (includeFields.interestLevel) headers.push('Interest Level');
    if (includeFields.checkInTime) headers.push('Check-in Time');
    if (includeFields.source) headers.push('Check-in Source');
    if (includeFields.followUpGenerated) headers.push('Follow-up Generated');
    if (includeFields.followUpSent) headers.push('Follow-up Sent');
    if (includeFields.followUpSentAt) headers.push('Follow-up Sent At');
    if (includeFields.notes) headers.push('Notes');
    if (includeFields.createdAt) headers.push('Created At');
    if (includeFields.updatedAt) headers.push('Updated At');

    // Start with header row
    const rows: string[] = [headers.join(',')];

    // Add data rows
    for (const visitor of visitors) {
        const row: string[] = [];

        if (includeFields.visitorId) {
            row.push(escapeCsvField(visitor.visitorId));
        }

        if (includeFields.name) {
            row.push(escapeCsvField(visitor.name));
        }

        if (includeFields.email) {
            row.push(escapeCsvField(visitor.email));
        }

        if (includeFields.phone) {
            row.push(escapeCsvField(visitor.phone));
        }

        if (includeFields.interestLevel) {
            // Capitalize first letter
            const level = visitor.interestLevel.charAt(0).toUpperCase() + visitor.interestLevel.slice(1);
            row.push(escapeCsvField(level));
        }

        if (includeFields.checkInTime) {
            row.push(escapeCsvField(formatDateTime(visitor.checkInTime)));
        }

        if (includeFields.source) {
            // Capitalize first letter
            const source = visitor.source.charAt(0).toUpperCase() + visitor.source.slice(1);
            row.push(escapeCsvField(source));
        }

        if (includeFields.followUpGenerated) {
            row.push(visitor.followUpGenerated ? 'Yes' : 'No');
        }

        if (includeFields.followUpSent) {
            row.push(visitor.followUpSent ? 'Yes' : 'No');
        }

        if (includeFields.followUpSentAt) {
            row.push(
                visitor.followUpSentAt
                    ? escapeCsvField(formatDateTime(visitor.followUpSentAt))
                    : ''
            );
        }

        if (includeFields.notes) {
            row.push(escapeCsvField(visitor.notes || ''));
        }

        if (includeFields.createdAt) {
            row.push(escapeCsvField(formatDateTime(visitor.createdAt)));
        }

        if (includeFields.updatedAt) {
            row.push(escapeCsvField(formatDateTime(visitor.updatedAt)));
        }

        rows.push(row.join(','));
    }

    // Join all rows with newlines
    return rows.join('\n');
}

/**
 * Generates a CSV buffer from visitor data
 * 
 * @param visitors - Array of visitors to export
 * @param fields - Optional field configuration for permission-based filtering
 * @returns CSV content as Buffer
 */
export function generateVisitorCSVBuffer(
    visitors: Visitor[],
    fields?: Partial<CsvExportFields>
): Buffer {
    const csvContent = generateVisitorCSV(visitors, fields);
    return Buffer.from(csvContent, 'utf-8');
}
