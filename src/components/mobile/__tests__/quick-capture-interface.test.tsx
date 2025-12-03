import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickCaptureInterface, type CaptureData } from '../quick-capture-interface';

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: jest.fn(),
    }),
}));

// Mock geolocation
const mockGeolocation = {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
});

describe('QuickCaptureInterface', () => {
    const mockOnCapture = jest.fn();
    const mockOnOpenChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders when open', () => {
        render(
            <QuickCaptureInterface
                open={true}
                onOpenChange={mockOnOpenChange}
                onCapture={mockOnCapture}
            />
        );

        expect(screen.getByText('Quick Capture')).toBeInTheDocument();
        expect(screen.getByText('Capture content using camera, voice, or text')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(
            <QuickCaptureInterface
                open={false}
                onOpenChange={mockOnOpenChange}
                onCapture={mockOnCapture}
            />
        );

        expect(screen.queryByText('Quick Capture')).not.toBeInTheDocument();
    });

    it('displays all three mode buttons', () => {
        render(
            <QuickCaptureInterface
                open={true}
                onOpenChange={mockOnOpenChange}
                onCapture={mockOnCapture}
            />
        );

        expect(screen.getByText('Camera')).toBeInTheDocument();
        expect(screen.getByText('Voice')).toBeInTheDocument();
        expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('switches between modes when buttons are clicked', () => {
        render(
            <QuickCaptureInterface
                open={true}
                onOpenChange={mockOnOpenChange}
                onCapture={mockOnCapture}
                defaultMode="camera"
            />
        );

        // Click voice button
        fireEvent.click(screen.getByText('Voice'));
        expect(screen.getByText('Record voice notes with automatic transcription')).toBeInTheDocument();

        // Click text button
        fireEvent.click(screen.getByText('Text'));
        expect(screen.getByPlaceholderText(/Type your content here/)).toBeInTheDocument();

        // Click camera button
        fireEvent.click(screen.getByText('Camera'));
        expect(screen.getByText('Capture property photos with automatic AI analysis')).toBeInTheDocument();
    });

    it('starts with default mode', () => {
        render(
            <QuickCaptureInterface
                open={true}
                onOpenChange={mockOnOpenChange}
                onCapture={mockOnCapture}
                defaultMode="text"
            />
        );

        expect(screen.getByPlaceholderText(/Type your content here/)).toBeInTheDocument();
    });

    it('text mode allows input and submission', async () => {
        render(
            <QuickCaptureInterface
                open={true}
                onOpenChange={mockOnOpenChange}
                onCapture={mockOnCapture}
                defaultMode="text"
            />
        );

        const textarea = screen.getByPlaceholderText(/Type your content here/);
        const submitButton = screen.getByRole('button', { name: /Submit/i });

        // Initially disabled
        expect(submitButton).toBeDisabled();

        // Type some text
        fireEvent.change(textarea, { target: { value: 'Test property description' } });

        // Now enabled
        expect(submitButton).not.toBeDisabled();

        // Submit
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnCapture).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'text',
                    content: 'Test property description',
                })
            );
        });
    });

    it('displays character and word count in text mode', () => {
        render(
            <QuickCaptureInterface
                open={true}
                onOpenChange={mockOnOpenChange}
                onCapture={mockOnCapture}
                defaultMode="text"
            />
        );

        const textarea = screen.getByPlaceholderText(/Type your content here/);

        fireEvent.change(textarea, { target: { value: 'Hello world test' } });

        expect(screen.getByText('16 characters')).toBeInTheDocument();
        expect(screen.getByText('3 words')).toBeInTheDocument();
    });

    it('requests location when enabled', () => {
        mockGeolocation.getCurrentPosition.mockImplementation((success) => {
            success({
                coords: {
                    latitude: 40.7128,
                    longitude: -74.0060,
                    accuracy: 10,
                },
            });
        });

        render(
            <QuickCaptureInterface
                open={true}
                onOpenChange={mockOnOpenChange}
                onCapture={mockOnCapture}
                enableLocation={true}
            />
        );

        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it('does not request location when disabled', () => {
        render(
            <QuickCaptureInterface
                open={true}
                onOpenChange={mockOnOpenChange}
                onCapture={mockOnCapture}
                enableLocation={false}
            />
        );

        expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
    });

    it('resets state when closed', () => {
        const { rerender } = render(
            <QuickCaptureInterface
                open={true}
                onOpenChange={mockOnOpenChange}
                onCapture={mockOnCapture}
                defaultMode="camera"
            />
        );

        // Switch to text mode
        fireEvent.click(screen.getByText('Text'));
        expect(screen.getByPlaceholderText(/Type your content here/)).toBeInTheDocument();

        // Close
        rerender(
            <QuickCaptureInterface
                open={false}
                onOpenChange={mockOnOpenChange}
                onCapture={mockOnCapture}
                defaultMode="camera"
            />
        );

        // Reopen
        rerender(
            <QuickCaptureInterface
                open={true}
                onOpenChange={mockOnOpenChange}
                onCapture={mockOnCapture}
                defaultMode="camera"
            />
        );

        // Should be back to camera mode
        expect(screen.getByText('Capture property photos with automatic AI analysis')).toBeInTheDocument();
    });

    it('includes location in capture data when available', async () => {
        const mockCoords = {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
        };

        mockGeolocation.getCurrentPosition.mockImplementation((success) => {
            success({ coords: mockCoords });
        });

        render(
            <QuickCaptureInterface
                open={true}
                onOpenChange={mockOnOpenChange}
                onCapture={mockOnCapture}
                defaultMode="text"
                enableLocation={true}
            />
        );

        // Wait for location to be set
        await waitFor(() => {
            expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
        });

        const textarea = screen.getByPlaceholderText(/Type your content here/);
        fireEvent.change(textarea, { target: { value: 'Test with location' } });

        const submitButton = screen.getByRole('button', { name: /Submit/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnCapture).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'text',
                    content: 'Test with location',
                    location: mockCoords,
                })
            );
        });
    });

    it('applies touch-friendly classes to buttons', () => {
        render(
            <QuickCaptureInterface
                open={true}
                onOpenChange={mockOnOpenChange}
                onCapture={mockOnCapture}
            />
        );

        const cameraButton = screen.getByText('Camera').closest('button');
        expect(cameraButton).toHaveClass('min-h-[44px]');
        expect(cameraButton).toHaveClass('min-w-[44px]');
    });
});
