/**
 * Example: Offline-Enabled Check-In Form
 * 
 * This component demonstrates how to integrate offline support
 * into a visitor check-in form for open house sessions.
 */

'use client';

import { useState } from 'react';
import { useConnectivity } from '../use-offline-sync';
import { queueOfflineOperation } from '../sync-service';

interface CheckInFormData {
    name: string;
    email: string;
    phone: string;
    interestLevel: 'low' | 'medium' | 'high';
    notes?: string;
}

interface OfflineCheckInExampleProps {
    sessionId: string;
    userId: string;
    onCheckIn?: (data: CheckInFormData, offline: boolean) => void;
}

export function OfflineCheckInExample({
    sessionId,
    userId,
    onCheckIn,
}: OfflineCheckInExampleProps) {
    const { isOnline, isOffline } = useConnectivity();
    const [formData, setFormData] = useState<CheckInFormData>({
        name: '',
        email: '',
        phone: '',
        interestLevel: 'medium',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            if (isOffline) {
                // Queue for offline sync
                const { operationId } = await queueOfflineOperation(
                    'checkIn',
                    'visitor',
                    sessionId,
                    formData,
                    userId
                );

                setMessage({
                    type: 'success',
                    text: 'Check-in queued for sync when online',
                });

                onCheckIn?.(formData, true);

                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    interestLevel: 'medium',
                    notes: '',
                });
            } else {
                // Execute immediately if online
                // Note: In a real implementation, this would call the server action
                // const result = await checkInVisitor(sessionId, formData);

                setMessage({
                    type: 'success',
                    text: 'Visitor checked in successfully',
                });

                onCheckIn?.(formData, false);

                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    interestLevel: 'medium',
                    notes: '',
                });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to check in visitor',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            {/* Offline Banner */}
            {isOffline && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ You are offline. Check-ins will be synced when connection is restored.
                    </p>
                </div>
            )}

            {/* Success/Error Message */}
            {message && (
                <div
                    className={`mb-4 p-3 rounded ${message.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                        }`}
                >
                    <p className="text-sm">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Visitor Check-In</h2>

                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                        Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email *
                    </label>
                    <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                </div>

                {/* Phone */}
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1">
                        Phone *
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                </div>

                {/* Interest Level */}
                <div>
                    <label htmlFor="interestLevel" className="block text-sm font-medium mb-1">
                        Interest Level *
                    </label>
                    <select
                        id="interestLevel"
                        required
                        value={formData.interestLevel}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                interestLevel: e.target.value as 'low' | 'medium' | 'high',
                            })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>

                {/* Notes */}
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium mb-1">
                        Notes (Optional)
                    </label>
                    <textarea
                        id="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting
                        ? 'Checking In...'
                        : isOffline
                            ? 'Queue Check-In (Offline)'
                            : 'Check In Visitor'}
                </button>
            </form>
        </div>
    );
}
