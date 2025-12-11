// Shared types for admin functionality
export interface Team {
    id: string;
    name: string;
    adminId: string;
    memberCount?: number;
    createdAt: string;
}

export interface User {
    id: string;
    name?: string;
    email: string;
    role: 'admin' | 'super_admin' | 'user';
}

export interface AdminActionResult<T = any> {
    message: string;
    data?: T;
    errors?: string[];
}