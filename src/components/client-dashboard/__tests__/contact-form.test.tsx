import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactForm } from '../contact-form';
import * as actions from '@/features/client-dashboards/actions/client-dashboard-actions';

// Mock the server action
const mockSendClientInquiry = actions.sendClientInquiry as unknown as ReturnType<typeof vi.fn>;

vi.mock('@/features/client-dashboards/actions/client-dashboard-actions', () => ({
    sendClientInquiry: vi.fn(),
}));

describe('ContactForm', () => {
    const mockOnClose = jest.fn();
    const defaultProps = {
        token: 'test-token',
        primaryColor: '#3b82f6',
        onClose: mockOnClose,
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        clientPhone: '555-1234',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders contact form with default values', () => {
        render(<ContactForm {...defaultProps} />);

        expect(screen.getByText('Contact Your Agent')).toBeInTheDocument();
        expect(screen.getByLabelText(/Your Name/i)).toHaveValue('John Doe');
        expect(screen.getByLabelText(/Email/i)).toHaveValue('john@example.com');
        expect(screen.getByLabelText(/Phone/i)).toHaveValue('555-1234');
    });

    it('renders with CMA type and custom subject', () => {
        render(
            <ContactForm
                {...defaultProps}
                defaultType="cma"
                defaultSubject="Question about my CMA report"
            />
        );

        expect(screen.getByText('Discuss This Report')).toBeInTheDocument();
        expect(screen.getByLabelText(/Subject/i)).toHaveValue('Question about my CMA report');
    });

    it('renders with property type and property details', () => {
        render(
            <ContactForm
                {...defaultProps}
                defaultType="property"
                propertyAddress="123 Main St, City, ST 12345"
            />
        );

        expect(screen.getByText('Ask About This Property')).toBeInTheDocument();
        expect(screen.getByText('123 Main St, City, ST 12345')).toBeInTheDocument();
    });

    it('renders with valuation type', () => {
        render(<ContactForm {...defaultProps} defaultType="valuation" />);

        expect(screen.getByText('Discuss This Valuation')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        render(<ContactForm {...defaultProps} />);

        const sendButton = screen.getByRole('button', { name: /Send Message/i });

        // Button should be disabled when subject and message are empty
        expect(sendButton).toBeDisabled();

        // Fill in subject
        const subjectInput = screen.getByLabelText(/Subject/i);
        fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });

        // Button should still be disabled without message
        expect(sendButton).toBeDisabled();

        // Fill in message
        const messageInput = screen.getByLabelText(/Message/i);
        fireEvent.change(messageInput, { target: { value: 'Test message' } });

        // Button should now be enabled
        expect(sendButton).not.toBeDisabled();
    });

    it('submits form successfully', async () => {
        mockSendClientInquiry.mockResolvedValue({
            message: 'success',
            data: { success: true },
            errors: {},
        });

        render(<ContactForm {...defaultProps} />);

        // Fill in form
        fireEvent.change(screen.getByLabelText(/Subject/i), {
            target: { value: 'Test Subject' },
        });
        fireEvent.change(screen.getByLabelText(/Message/i), {
            target: { value: 'Test message' },
        });

        // Submit form
        const sendButton = screen.getByRole('button', { name: /Send Message/i });
        fireEvent.click(sendButton);

        // Wait for submission
        await waitFor(() => {
            expect(mockSendClientInquiry).toHaveBeenCalledWith('test-token', {
                type: 'general',
                subject: 'Test Subject',
                message: 'Test message',
                clientName: 'John Doe',
                clientEmail: 'john@example.com',
                clientPhone: '555-1234',
                propertyId: undefined,
                propertyAddress: undefined,
            });
        });

        // Should show success message
        await waitFor(() => {
            expect(screen.getByText('Message Sent!')).toBeInTheDocument();
        });

        // Should auto-close after 2 seconds
        await waitFor(
            () => {
                expect(mockOnClose).toHaveBeenCalled();
            },
            { timeout: 3000 }
        );
    });

    it('handles submission error', async () => {
        mockSendClientInquiry.mockResolvedValue({
            message: 'Failed to send inquiry',
            data: null,
            errors: {},
        });

        render(<ContactForm {...defaultProps} />);

        // Fill in form
        fireEvent.change(screen.getByLabelText(/Subject/i), {
            target: { value: 'Test Subject' },
        });
        fireEvent.change(screen.getByLabelText(/Message/i), {
            target: { value: 'Test message' },
        });

        // Submit form
        const sendButton = screen.getByRole('button', { name: /Send Message/i });
        fireEvent.click(sendButton);

        // Should show error message
        await waitFor(() => {
            expect(screen.getByText(/Failed to send inquiry/i)).toBeInTheDocument();
        });

        // Should not close
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('closes when cancel button is clicked', () => {
        render(<ContactForm {...defaultProps} />);

        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        fireEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes when clicking outside modal', () => {
        render(<ContactForm {...defaultProps} />);

        const backdrop = screen.getByRole('button', { name: /Cancel/i }).closest('div')?.parentElement?.parentElement;
        if (backdrop) {
            fireEvent.click(backdrop);
        }

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('includes property details in submission for property inquiries', async () => {
        mockSendClientInquiry.mockResolvedValue({
            message: 'success',
            data: { success: true },
            errors: {},
        });

        render(
            <ContactForm
                {...defaultProps}
                defaultType="property"
                propertyId="prop-123"
                propertyAddress="123 Main St"
            />
        );

        // Fill in form
        fireEvent.change(screen.getByLabelText(/Subject/i), {
            target: { value: 'Property Inquiry' },
        });
        fireEvent.change(screen.getByLabelText(/Message/i), {
            target: { value: 'I am interested' },
        });

        // Submit form
        const sendButton = screen.getByRole('button', { name: /Send Message/i });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(mockSendClientInquiry).toHaveBeenCalledWith('test-token', {
                type: 'property',
                subject: 'Property Inquiry',
                message: 'I am interested',
                clientName: 'John Doe',
                clientEmail: 'john@example.com',
                clientPhone: '555-1234',
                propertyId: 'prop-123',
                propertyAddress: '123 Main St',
            });
        });
    });
});
