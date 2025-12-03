import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { AIMonitoringConfig } from '../ai-monitoring-config';
import type { AIMonitoringConfig as AIMonitoringConfigType } from '@/lib/types/common/common';

describe('AIMonitoringConfig', () => {
    const mockUserId = 'test-user-123';
    const mockConfig: AIMonitoringConfigType = {
        id: 'config-1',
        userId: mockUserId,
        enabled: true,
        frequency: 'weekly',
        platforms: ['chatgpt', 'perplexity'],
        queryTemplates: ['template-1', 'template-2'],
        alertThreshold: 20,
        lastExecuted: '2024-01-15T10:00:00Z',
        nextScheduled: '2024-01-22T10:00:00Z',
        queriesThisPeriod: 10,
        queryLimit: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    it('renders with initial configuration', () => {
        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={mockConfig}
            />
        );

        expect(screen.getByText('Monitoring Configuration')).toBeInTheDocument();
        expect(screen.getByText('Enable AI Monitoring')).toBeInTheDocument();
        expect(screen.getByText('Monitoring Frequency')).toBeInTheDocument();
        expect(screen.getByText('AI Platforms to Monitor')).toBeInTheDocument();
        expect(screen.getByText('Alert Threshold')).toBeInTheDocument();
    });

    it('displays enabled state correctly', () => {
        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={mockConfig}
            />
        );

        const enableSwitch = screen.getByRole('switch');
        expect(enableSwitch).toBeChecked();
    });

    it('displays selected platforms correctly', () => {
        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={mockConfig}
            />
        );

        const chatgptCheckbox = screen.getByLabelText('ChatGPT');
        const perplexityCheckbox = screen.getByLabelText('Perplexity');
        const claudeCheckbox = screen.getByLabelText('Claude');
        const geminiCheckbox = screen.getByLabelText('Gemini');

        expect(chatgptCheckbox).toBeChecked();
        expect(perplexityCheckbox).toBeChecked();
        expect(claudeCheckbox).not.toBeChecked();
        expect(geminiCheckbox).not.toBeChecked();
    });

    it('displays alert threshold correctly', () => {
        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={mockConfig}
            />
        );

        expect(screen.getByText('20%')).toBeInTheDocument();
    });

    it('toggles enabled state', async () => {
        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={mockConfig}
            />
        );

        const enableSwitch = screen.getByRole('switch');
        fireEvent.click(enableSwitch);

        await waitFor(() => {
            expect(enableSwitch).not.toBeChecked();
        });
    });

    it('toggles platform selection', async () => {
        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={mockConfig}
            />
        );

        const claudeCheckbox = screen.getByLabelText('Claude');
        fireEvent.click(claudeCheckbox);

        await waitFor(() => {
            expect(claudeCheckbox).toBeChecked();
        });
    });

    it('prevents removing the last platform', async () => {
        const singlePlatformConfig = {
            ...mockConfig,
            platforms: ['chatgpt'] as Array<'chatgpt' | 'perplexity' | 'claude' | 'gemini'>,
        };

        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={singlePlatformConfig}
            />
        );

        const chatgptCheckbox = screen.getByLabelText('ChatGPT');
        expect(chatgptCheckbox).toBeDisabled();
    });

    it('calls onSave with updated configuration', async () => {
        let savedConfig: any = null;
        const mockOnSave = async (config: any) => {
            savedConfig = config;
        };

        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={mockConfig}
                onSave={mockOnSave}
            />
        );

        // Toggle enabled
        const enableSwitch = screen.getByRole('switch');
        fireEvent.click(enableSwitch);

        // Click save
        const saveButton = screen.getByRole('button', { name: /save configuration/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(savedConfig).not.toBeNull();
            expect(savedConfig.enabled).toBe(false);
            expect(savedConfig.frequency).toBe('weekly');
            expect(savedConfig.platforms).toEqual(['chatgpt', 'perplexity']);
            expect(savedConfig.alertThreshold).toBe(20);
        });
    });

    it('disables save button when no changes', () => {
        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={mockConfig}
            />
        );

        const saveButton = screen.getByRole('button', { name: /save configuration/i });
        expect(saveButton).toBeDisabled();
    });

    it('enables save button when changes are made', async () => {
        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={mockConfig}
            />
        );

        const enableSwitch = screen.getByRole('switch');
        fireEvent.click(enableSwitch);

        const saveButton = screen.getByRole('button', { name: /save configuration/i });
        await waitFor(() => {
            expect(saveButton).not.toBeDisabled();
        });
    });

    it('displays last executed date', () => {
        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={mockConfig}
            />
        );

        expect(screen.getByText(/Last checked:/)).toBeInTheDocument();
    });

    it('displays "Not yet monitored" when no last executed date', () => {
        const configWithoutLastExecuted = {
            ...mockConfig,
            lastExecuted: '',
        };

        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={configWithoutLastExecuted}
            />
        );

        expect(screen.getByText('Not yet monitored')).toBeInTheDocument();
    });

    it('shows success message after successful save', async () => {
        const mockOnSave = async () => {
            // Success
        };

        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={mockConfig}
                onSave={mockOnSave}
            />
        );

        // Make a change
        const enableSwitch = screen.getByRole('switch');
        fireEvent.click(enableSwitch);

        // Save
        const saveButton = screen.getByRole('button', { name: /save configuration/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Configuration saved successfully')).toBeInTheDocument();
        });
    });

    it('shows error message on save failure', async () => {
        const mockOnSave = async () => {
            throw new Error('Save failed');
        };

        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={mockConfig}
                onSave={mockOnSave}
            />
        );

        // Make a change
        const enableSwitch = screen.getByRole('switch');
        fireEvent.click(enableSwitch);

        // Save
        const saveButton = screen.getByRole('button', { name: /save configuration/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Save failed')).toBeInTheDocument();
        });
    });

    it('disables controls when monitoring is disabled', () => {
        const disabledConfig = {
            ...mockConfig,
            enabled: false,
        };

        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={disabledConfig}
            />
        );

        // Platform checkboxes should be disabled
        const chatgptCheckbox = screen.getByLabelText('ChatGPT');
        const perplexityCheckbox = screen.getByLabelText('Perplexity');

        expect(chatgptCheckbox).toBeDisabled();
        expect(perplexityCheckbox).toBeDisabled();
    });

    it('renders without initial config', () => {
        render(
            <AIMonitoringConfig
                userId={mockUserId}
                initialConfig={null}
            />
        );

        expect(screen.getByText('Monitoring Configuration')).toBeInTheDocument();
        expect(screen.getByText('Not yet monitored')).toBeInTheDocument();
    });
});
