/**
 * QR Code Display Component Tests
 * 
 * Tests the QRCodeDisplay component functionality including:
 * - Rendering with session information overlay
 * - Download functionality
 * - Print functionality
 * - Session information display
 * 
 * Validates Requirements: 4.4
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QRCodeDisplay } from '@/components/open-house/qr-code-display';

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: jest.fn(),
    }),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img {...props} />;
    },
}));

describe('QRCodeDisplay Component', () => {
    const mockProps = {
        sessionId: 'test-session-123',
        qrCodeUrl: 'https://example.com/qr-code.png',
        propertyAddress: '123 Main Street, Anytown, CA 12345',
        scheduledDate: '2024-12-15',
        scheduledStartTime: '2024-12-15T14:00:00Z',
    };

    beforeEach(() => {
        // Mock canvas and its methods
        HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
            fillStyle: '',
            fillRect: jest.fn(),
            drawImage: jest.fn(),
            font: '',
            textAlign: '',
            fillText: jest.fn(),
            measureText: jest.fn(() => ({ width: 100 })),
        })) as any;

        HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
            callback(new Blob(['test'], { type: 'image/png' }));
        }) as any;

        HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,test');

        // Mock window.open
        global.window.open = jest.fn();

        // Mock URL methods
        global.URL.createObjectURL = jest.fn(() => 'blob:test');
        global.URL.revokeObjectURL = jest.fn();

        // Mock Image constructor
        (global as any).Image = class {
            onload: (() => void) | null = null;
            src = '';
            crossOrigin = '';

            constructor() {
                setTimeout(() => {
                    if (this.onload) {
                        this.onload();
                    }
                }, 0);
            }
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering with Session Information Overlay', () => {
        it('should render QR code with session information overlay', () => {
            render(<QRCodeDisplay {...mockProps} />);

            // Check for header text
            expect(screen.getByText('Open House Check-in')).toBeInTheDocument();

            // Check for property address
            expect(screen.getByText(mockProps.propertyAddress)).toBeInTheDocument();

            // Check for instruction text
            expect(screen.getByText('Scan with your phone camera to check in')).toBeInTheDocument();
        });

        it('should display scheduled date and time when provided', () => {
            render(<QRCodeDisplay {...mockProps} />);

            // The date should be formatted and displayed
            expect(screen.getByText(/Saturday, December 15/)).toBeInTheDocument();
        });

        it('should render without date/time when not provided', () => {
            const propsWithoutDateTime = {
                ...mockProps,
                scheduledDate: undefined,
                scheduledStartTime: undefined,
            };

            render(<QRCodeDisplay {...propsWithoutDateTime} />);

            // Should still render the main elements
            expect(screen.getByText('Open House Check-in')).toBeInTheDocument();
            expect(screen.getByText(mockProps.propertyAddress)).toBeInTheDocument();
        });

        it('should display QR code image', () => {
            render(<QRCodeDisplay {...mockProps} />);

            const qrImage = screen.getByAltText('QR Code for check-in');
            expect(qrImage).toBeInTheDocument();
            expect(qrImage).toHaveAttribute('src', mockProps.qrCodeUrl);
        });

        it('should display download/print instructions', () => {
            render(<QRCodeDisplay {...mockProps} />);

            expect(screen.getByText('Download or print includes session information')).toBeInTheDocument();
            expect(screen.getByText('for easy display at your open house')).toBeInTheDocument();
        });
    });

    describe('Action Buttons', () => {
        it('should render all action buttons', () => {
            render(<QRCodeDisplay {...mockProps} />);

            expect(screen.getByRole('button', { name: /download qr code/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /print qr code/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /open check-in page/i })).toBeInTheDocument();
        });

        it('should have download button with icon', () => {
            render(<QRCodeDisplay {...mockProps} />);

            const downloadButton = screen.getByRole('button', { name: /download qr code/i });
            expect(downloadButton).toBeInTheDocument();
        });

        it('should have print button with icon', () => {
            render(<QRCodeDisplay {...mockProps} />);

            const printButton = screen.getByRole('button', { name: /print qr code/i });
            expect(printButton).toBeInTheDocument();
        });

        it('should have open check-in page button with icon', () => {
            render(<QRCodeDisplay {...mockProps} />);

            const openButton = screen.getByRole('button', { name: /open check-in page/i });
            expect(openButton).toBeInTheDocument();
        });
    });

    describe('Download Functionality', () => {
        it('should trigger download when download button is clicked', async () => {
            render(<QRCodeDisplay {...mockProps} />);

            const downloadButton = screen.getByRole('button', { name: /download qr code/i });

            // Mock document methods
            const mockLink = {
                href: '',
                download: '',
                click: jest.fn(),
            };
            const originalCreateElement = document.createElement.bind(document);
            document.createElement = jest.fn((tagName) => {
                if (tagName === 'a') {
                    return mockLink as any;
                }
                return originalCreateElement(tagName);
            });
            document.body.appendChild = jest.fn();
            document.body.removeChild = jest.fn();

            fireEvent.click(downloadButton);

            await waitFor(() => {
                expect(mockLink.click).toHaveBeenCalled();
            }, { timeout: 3000 });

            expect(mockLink.download).toBe(`open-house-qr-${mockProps.sessionId}.png`);
        });
    });

    describe('Print Functionality', () => {
        it('should open print dialog when print button is clicked', async () => {
            const mockPrintWindow = {
                document: {
                    write: jest.fn(),
                    close: jest.fn(),
                },
                focus: jest.fn(),
                print: jest.fn(),
            };

            (global.window.open as jest.Mock).mockReturnValue(mockPrintWindow);

            render(<QRCodeDisplay {...mockProps} />);

            const printButton = screen.getByRole('button', { name: /print qr code/i });
            fireEvent.click(printButton);

            await waitFor(() => {
                expect(window.open).toHaveBeenCalledWith('', '_blank');
            }, { timeout: 3000 });

            expect(mockPrintWindow.document.write).toHaveBeenCalled();
            expect(mockPrintWindow.document.close).toHaveBeenCalled();
            expect(mockPrintWindow.focus).toHaveBeenCalled();
        });
    });

    describe('Open Check-in Page', () => {
        it('should open check-in page in new tab when button is clicked', () => {
            render(<QRCodeDisplay {...mockProps} />);

            const openButton = screen.getByRole('button', { name: /open check-in page/i });
            fireEvent.click(openButton);

            expect(window.open).toHaveBeenCalledWith(
                expect.stringContaining(`/open-house/check-in/${mockProps.sessionId}`),
                '_blank'
            );
        });
    });

    describe('Canvas Overlay Generation', () => {
        it('should generate canvas with session information overlay', async () => {
            render(<QRCodeDisplay {...mockProps} />);

            // Wait for canvas to be rendered
            await waitFor(() => {
                const canvas = document.querySelector('canvas');
                expect(canvas).toBeInTheDocument();
            });

            // Verify canvas context was requested
            expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
        });

        it('should set canvas dimensions correctly', async () => {
            render(<QRCodeDisplay {...mockProps} />);

            await waitFor(() => {
                const canvas = document.querySelector('canvas') as HTMLCanvasElement;
                expect(canvas).toBeInTheDocument();
                // Canvas should be 600x700 as per implementation
                expect(canvas.width).toBe(600);
                expect(canvas.height).toBe(700);
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA attributes on canvas', () => {
            render(<QRCodeDisplay {...mockProps} />);

            const canvas = document.querySelector('canvas');
            expect(canvas).toHaveAttribute('aria-hidden', 'true');
        });

        it('should have descriptive button labels', () => {
            render(<QRCodeDisplay {...mockProps} />);

            expect(screen.getByRole('button', { name: /download qr code/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /print qr code/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /open check-in page/i })).toBeInTheDocument();
        });

        it('should have alt text on QR code image', () => {
            render(<QRCodeDisplay {...mockProps} />);

            const qrImage = screen.getByAltText('QR Code for check-in');
            expect(qrImage).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle long property addresses', () => {
            const longAddressProps = {
                ...mockProps,
                propertyAddress: 'A Very Long Property Address That Should Wrap Across Multiple Lines In The Display',
            };

            render(<QRCodeDisplay {...longAddressProps} />);

            // Component should render without errors
            expect(screen.getByText(longAddressProps.propertyAddress)).toBeInTheDocument();
        });

        it('should handle invalid date formats gracefully', () => {
            const invalidDateProps = {
                ...mockProps,
                scheduledDate: 'invalid-date',
                scheduledStartTime: 'invalid-time',
            };

            render(<QRCodeDisplay {...invalidDateProps} />);

            // Should still render the main elements
            expect(screen.getByText('Open House Check-in')).toBeInTheDocument();
            expect(screen.getByText(mockProps.propertyAddress)).toBeInTheDocument();
        });
    });
});
