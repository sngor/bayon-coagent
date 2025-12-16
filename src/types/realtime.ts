/**
 * Real-time System Type Definitions
 * Centralized types for WebSocket communication and live updates
 */

// Base WebSocket message structure
export interface WebSocketMessage<T = any> {
    type: WebSocketMessageType;
    data: T;
    message?: string; // For error messages
    timestamp?: number;
}

// All possible WebSocket message types
export type WebSocketMessageType =
    | 'connectionConfirmed'
    | 'chatMessage'
    | 'messageConfirmation'
    | 'userJoined'
    | 'userLeft'
    | 'userOnline'
    | 'userOffline'
    | 'userTyping'
    | 'roomJoined'
    | 'roomLeft'
    | 'liveUpdate'
    | 'updateConfirmation'
    | 'error'
    | 'ping'
    | 'pong';

// Live update specific types
export interface LiveUpdateData {
    resourceType: 'content' | 'project' | 'user' | 'system';
    resourceId: string;
    status: string;
    progress?: number;
    metadata?: LiveUpdateMetadata;
    updatedBy: string;
    timestamp: number;
}

export interface LiveUpdateMetadata {
    stage?: string;
    error?: string;
    completedSteps?: string[];
    totalSteps?: number;
    estimatedCompletion?: number;
    [key: string]: any; // Allow additional metadata
}

// Chat message types
export interface ChatMessageData {
    messageId: string;
    roomId: string;
    senderId: string;
    senderName?: string;
    message: string;
    messageType: 'text' | 'image' | 'file' | 'system';
    metadata?: ChatMessageMetadata;
    timestamp: number;
}

export interface ChatMessageMetadata {
    fileName?: string;
    fileSize?: number;
    imageUrl?: string;
    mentions?: string[];
    [key: string]: any;
}

// Room management types
export interface RoomData {
    roomId: string;
    roomType: 'chat' | 'collaboration' | 'content-review' | 'team';
    userId?: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

// User presence types
export interface UserPresenceData {
    userId: string;
    roomId?: string;
    status: 'online' | 'offline' | 'typing';
    timestamp: number;
    lastSeen?: number;
}

// Connection confirmation data
export interface ConnectionConfirmationData {
    connectionId: string;
    userId: string;
    timestamp: number;
}

// Typed WebSocket messages
export type TypedWebSocketMessage =
    | WebSocketMessage<LiveUpdateData>
    | WebSocketMessage<ChatMessageData>
    | WebSocketMessage<RoomData>
    | WebSocketMessage<UserPresenceData>
    | WebSocketMessage<ConnectionConfirmationData>
    | WebSocketMessage<{ messageId: string; status: string; timestamp: number }>
    | WebSocketMessage<string>; // For simple messages like ping/pong

// WebSocket connection states
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// Content status for real-time tracking
export type ContentStatus = 'draft' | 'generating' | 'reviewing' | 'published' | 'failed';

// Real-time event handlers
export type LiveUpdateHandler = (update: LiveUpdateData) => void;
export type ChatMessageHandler = (message: ChatMessageData) => void;
export type UserPresenceHandler = (presence: UserPresenceData) => void;