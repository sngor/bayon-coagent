/**
 * Support Ticket Service
 * 
 * Handles support ticket creation, management, and messaging.
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import {
    getSupportTicketKeys,
    getTicketMessageKeys,
} from '@/aws/dynamodb/keys';
import { v4 as uuidv4 } from 'uuid';
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from '@/aws/dynamodb/client';

export interface SupportTicket {
    ticketId: string;
    userId: string;
    userName: string;
    userEmail: string;
    subject: string;
    description: string;
    category: 'bug' | 'feature_request' | 'help' | 'billing' | 'other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
    createdAt: number;
    updatedAt: number;
    assignedTo?: string;
    messages: TicketMessage[];
}

export interface TicketMessage {
    messageId: string;
    ticketId: string;
    authorId: string;
    authorName: string;
    authorRole: 'user' | 'admin';
    message: string;
    timestamp: number;
    attachments?: string[];
}

export class SupportTicketService {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    /**
     * Creates a new support ticket
     */
    async createTicket(
        userId: string,
        userName: string,
        userEmail: string,
        subject: string,
        description: string,
        category: SupportTicket['category']
    ): Promise<SupportTicket> {
        const ticketId = uuidv4();
        const now = Date.now();

        const ticket: SupportTicket = {
            ticketId,
            userId,
            userName,
            userEmail,
            subject,
            description,
            category,
            priority: 'medium',
            status: 'open',
            createdAt: now,
            updatedAt: now,
            messages: [],
        };

        const keys = getSupportTicketKeys(ticketId, 'open', 'medium', now);

        await this.repository.create(
            keys.PK,
            keys.SK,
            'SupportTicket',
            ticket,
            {
                GSI1PK: keys.GSI1PK,
                GSI1SK: keys.GSI1SK,
            }
        );

        return ticket;
    }

    /**
     * Gets all support tickets with filtering
     */
    async getTickets(options?: {
        status?: string;
        priority?: string;
        assignedTo?: string;
        limit?: number;
        lastKey?: string;
    }): Promise<{
        tickets: SupportTicket[];
        lastKey?: string;
    }> {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';
        const client = getDocumentClient();

        // If filtering by status, use GSI1
        if (options?.status) {
            const command = new QueryCommand({
                TableName: tableName,
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :pk',
                ExpressionAttributeValues: {
                    ':pk': `TICKETS#${options.status}`,
                },
                Limit: options.limit || 50,
                ExclusiveStartKey: options.lastKey ? JSON.parse(options.lastKey) : undefined,
                ScanIndexForward: false, // Most recent first (by priority#createdAt)
            });

            const result = await client.send(command);
            let tickets = (result.Items || []).map((item: any) => item.Data as SupportTicket);

            // Apply additional filters
            if (options.priority) {
                tickets = tickets.filter((t: SupportTicket) => t.priority === options.priority);
            }
            if (options.assignedTo) {
                tickets = tickets.filter((t: SupportTicket) => t.assignedTo === options.assignedTo);
            }

            return {
                tickets,
                lastKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
            };
        }

        // Otherwise, scan all tickets (less efficient, but works for small datasets)
        const scanCommand = new ScanCommand({
            TableName: tableName,
            FilterExpression: 'EntityType = :type',
            ExpressionAttributeValues: {
                ':type': 'SupportTicket',
            },
            Limit: options?.limit || 50,
            ExclusiveStartKey: options?.lastKey ? JSON.parse(options.lastKey) : undefined,
        });

        const result = await client.send(scanCommand);
        let tickets = (result.Items || []).map((item: any) => item.Data as SupportTicket);

        // Apply filters
        if (options?.priority) {
            tickets = tickets.filter((t: SupportTicket) => t.priority === options.priority);
        }
        if (options?.assignedTo) {
            tickets = tickets.filter((t: SupportTicket) => t.assignedTo === options.assignedTo);
        }

        // Sort by creation date (most recent first)
        tickets.sort((a: SupportTicket, b: SupportTicket) => b.createdAt - a.createdAt);

        return {
            tickets,
            lastKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
        };
    }

    /**
     * Gets a specific ticket with full message history
     */
    async getTicket(ticketId: string): Promise<SupportTicket | null> {
        const keys = getSupportTicketKeys(ticketId);
        const ticket = await this.repository.get<SupportTicket>(keys.PK, keys.SK);

        if (!ticket) {
            return null;
        }

        // Load messages
        const messagesResult = await this.repository.query<TicketMessage>(
            keys.PK,
            'MESSAGE#',
            { scanIndexForward: true }
        );

        ticket.messages = messagesResult.items;

        return ticket;
    }

    /**
     * Adds a message to a ticket
     */
    async addMessage(
        ticketId: string,
        authorId: string,
        authorName: string,
        authorRole: 'user' | 'admin',
        message: string
    ): Promise<void> {
        const messageId = uuidv4();
        const timestamp = Date.now();

        const ticketMessage: TicketMessage = {
            messageId,
            ticketId,
            authorId,
            authorName,
            authorRole,
            message,
            timestamp,
        };

        const keys = getTicketMessageKeys(ticketId, messageId, timestamp);

        await this.repository.create(
            keys.PK,
            keys.SK,
            'TicketMessage',
            ticketMessage
        );

        // Update ticket's updatedAt timestamp
        const ticketKeys = getSupportTicketKeys(ticketId);
        await this.repository.update(
            ticketKeys.PK,
            ticketKeys.SK,
            { updatedAt: timestamp }
        );
    }

    /**
     * Updates ticket status
     */
    async updateTicketStatus(
        ticketId: string,
        status: SupportTicket['status'],
        adminId: string,
        resolutionNote?: string
    ): Promise<void> {
        const keys = getSupportTicketKeys(ticketId);
        const updates: Partial<SupportTicket> = {
            status,
            updatedAt: Date.now(),
        };

        await this.repository.update(keys.PK, keys.SK, updates);

        // If closing, add resolution note as a message
        if (status === 'closed' && resolutionNote) {
            await this.addMessage(
                ticketId,
                adminId,
                'Admin',
                'admin',
                `Ticket closed: ${resolutionNote}`
            );
        }
    }

    /**
     * Assigns ticket to an admin
     */
    async assignTicket(ticketId: string, adminId: string): Promise<void> {
        const keys = getSupportTicketKeys(ticketId);
        await this.repository.update(keys.PK, keys.SK, {
            assignedTo: adminId,
            updatedAt: Date.now(),
        });
    }
}

// Export singleton instance
export const supportTicketService = new SupportTicketService();
