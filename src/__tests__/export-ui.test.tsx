/**
 * Export UI Components Tests
 * 
 * Tests for export buttons and dialog components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportButtons } from '@/components/open-house/export-buttons';
import { ExportDialog } from '@/components/open-house/export-dialog';
import { exportSessionPDF, exportVisitorCSV } from '@/app/(app)/open-house/actions';

// Mock the actions
jest.mock('@/app/(app)/open-house/actions', () => ({
    exportSessionPDF: jest.fn(),
    exportVisitorCSV: jest.fn(),
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: jest.fn(),
    }),
}));

describe('ExportButtons', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders export button', () => {
        render(
            <ExportButtons
                sessionId="test-session"
                visitorCount={10}
            />
        );

        expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('disables CSV export when no visitors', async () => {
        render(
            <ExportButtons
                sessionId="test-session"
                visitorCount={0}
            />
        );

        // Click to open dropdown
        const button = screen.getByText('Export');
        fireEvent.click(button);

        // CSV option should be disabled
        await waitFor(() => {
            const csvOption = screen.getByText(/Export as CSV/);
            expect(csvOption.closest('div')).toHaveAttribute('data-disabled', 'true');
        });
    });

    it('shows loading state during export', async () => {
        (exportSessionPDF as jest.Mock).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve({ success: true, url: 'test.pdf' }), 100))
        );

        render(
            <ExportButtons
                sessionId="test-session"
                visitorCount={10}
            />
        );

        // Click to open dropdown
        const button = screen.getByText('Export');
        fireEvent.click(button);

        // Click PDF option
        const pdfOption = screen.getByText('Export as PDF');
        fireEvent.click(pdfOption);

        // Should show loading state
        await waitFor(() => {
            expect(screen.getByText('Exporting...')).toBeInTheDocument();
        });
    });

    it('handles successful PDF export', async () => {
        (exportSessionPDF as jest.Mock).mockResolvedValue({
            success: true,
            url: 'https://example.com/test.pdf',
        });

        render(
            <ExportButtons
                sessionId="test-session"
                visitorCount={10}
            />
        );

        // Click to open dropdown
        const button = screen.getByText('Export');
        fireEvent.click(button);

        // Click PDF option
        const pdfOption = screen.getByText('Export as PDF');
        fireEvent.click(pdfOption);

        await waitFor(() => {
            expect(exportSessionPDF).toHaveBeenCalledWith('test-session');
        });
    });

    it('handles export error', async () => {
        (exportSessionPDF as jest.Mock).mockResolvedValue({
            success: false,
            error: 'Export failed',
        });

        render(
            <ExportButtons
                sessionId="test-session"
                visitorCount={10}
            />
        );

        // Click to open dropdown
        const button = screen.getByText('Export');
        fireEvent.click(button);

        // Click PDF option
        const pdfOption = screen.getByText('Export as PDF');
        fireEvent.click(pdfOption);

        await waitFor(() => {
            expect(exportSessionPDF).toHaveBeenCalledWith('test-session');
        });
    });
});

describe('ExportDialog', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders dialog trigger', () => {
        render(
            <ExportDialog
                sessionId="test-session"
                visitorCount={10}
            />
        );

        expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('opens dialog on trigger click', async () => {
        render(
            <ExportDialog
                sessionId="test-session"
                visitorCount={10}
            />
        );

        const trigger = screen.getByText('Export');
        fireEvent.click(trigger);

        await waitFor(() => {
            expect(screen.getByText('Export Session Data')).toBeInTheDocument();
        });
    });

    it('shows format selection options', async () => {
        render(
            <ExportDialog
                sessionId="test-session"
                visitorCount={10}
            />
        );

        const trigger = screen.getByText('Export');
        fireEvent.click(trigger);

        await waitFor(() => {
            expect(screen.getByText('PDF Report')).toBeInTheDocument();
            expect(screen.getByText('CSV Data')).toBeInTheDocument();
        });
    });

    it('shows CSV field options when CSV is selected', async () => {
        render(
            <ExportDialog
                sessionId="test-session"
                visitorCount={10}
            />
        );

        const trigger = screen.getByText('Export');
        fireEvent.click(trigger);

        await waitFor(() => {
            const csvRadio = screen.getByLabelText(/CSV Data/);
            fireEvent.click(csvRadio);
        });

        await waitFor(() => {
            expect(screen.getByText('Include Fields')).toBeInTheDocument();
            expect(screen.getByLabelText('Name')).toBeInTheDocument();
            expect(screen.getByLabelText('Email')).toBeInTheDocument();
        });
    });

    it('disables CSV option when no visitors', async () => {
        render(
            <ExportDialog
                sessionId="test-session"
                visitorCount={0}
            />
        );

        const trigger = screen.getByText('Export');
        fireEvent.click(trigger);

        await waitFor(() => {
            const csvRadio = screen.getByLabelText(/CSV Data/);
            expect(csvRadio).toBeDisabled();
        });
    });

    it('shows progress during export', async () => {
        (exportSessionPDF as jest.Mock).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve({ success: true, url: 'test.pdf' }), 200))
        );

        render(
            <ExportDialog
                sessionId="test-session"
                visitorCount={10}
            />
        );

        const trigger = screen.getByText('Export');
        fireEvent.click(trigger);

        await waitFor(() => {
            const exportButton = screen.getAllByText('Export').find(el => el.tagName === 'BUTTON');
            if (exportButton) fireEvent.click(exportButton);
        });

        await waitFor(() => {
            expect(screen.getByText(/Generating PDF/)).toBeInTheDocument();
        });
    });

    it('shows success state after export', async () => {
        (exportSessionPDF as jest.Mock).mockResolvedValue({
            success: true,
            url: 'https://example.com/test.pdf',
        });

        render(
            <ExportDialog
                sessionId="test-session"
                visitorCount={10}
            />
        );

        const trigger = screen.getByText('Export');
        fireEvent.click(trigger);

        await waitFor(() => {
            const exportButton = screen.getAllByText('Export').find(el => el.tagName === 'BUTTON');
            if (exportButton) fireEvent.click(exportButton);
        });

        await waitFor(() => {
            expect(screen.getByText('Export Complete!')).toBeInTheDocument();
            expect(screen.getByText('Download')).toBeInTheDocument();
        });
    });

    it('shows error state on export failure', async () => {
        (exportSessionPDF as jest.Mock).mockResolvedValue({
            success: false,
            error: 'Export failed',
        });

        render(
            <ExportDialog
                sessionId="test-session"
                visitorCount={10}
            />
        );

        const trigger = screen.getByText('Export');
        fireEvent.click(trigger);

        await waitFor(() => {
            const exportButton = screen.getAllByText('Export').find(el => el.tagName === 'BUTTON');
            if (exportButton) fireEvent.click(exportButton);
        });

        await waitFor(() => {
            expect(screen.getByText('Export Failed')).toBeInTheDocument();
            expect(screen.getByText('Try Again')).toBeInTheDocument();
        });
    });

    it('allows retry after error', async () => {
        (exportSessionPDF as jest.Mock)
            .mockResolvedValueOnce({ success: false, error: 'Export failed' })
            .mockResolvedValueOnce({ success: true, url: 'test.pdf' });

        render(
            <ExportDialog
                sessionId="test-session"
                visitorCount={10}
            />
        );

        const trigger = screen.getByText('Export');
        fireEvent.click(trigger);

        // First attempt
        await waitFor(() => {
            const exportButton = screen.getAllByText('Export').find(el => el.tagName === 'BUTTON');
            if (exportButton) fireEvent.click(exportButton);
        });

        // Wait for error
        await waitFor(() => {
            expect(screen.getByText('Export Failed')).toBeInTheDocument();
        });

        // Retry
        const retryButton = screen.getByText('Try Again');
        fireEvent.click(retryButton);

        // Should succeed
        await waitFor(() => {
            expect(screen.getByText('Export Complete!')).toBeInTheDocument();
        });
    });
});
