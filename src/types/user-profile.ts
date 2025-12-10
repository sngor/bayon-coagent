export interface UserProfile {
    id: string;
    name?: string;
    email: string;
    photoURL?: string;
    phone?: string;
    company?: string;
    title?: string;
    bio?: string;
    website?: string;
    socialLinks?: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
    };
    preferences?: {
        theme?: 'light' | 'dark' | 'system';
        notifications?: boolean;
        emailUpdates?: boolean;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface CognitoUser {
    id: string;
    email: string;
    attributes?: {
        name?: string;
        given_name?: string;
        family_name?: string;
        email?: string;
        phone_number?: string;
        email_verified?: string;
        phone_number_verified?: string;
    };
}

export interface UserDropdownProps {
    profile: UserProfile | null;
    user: CognitoUser;
    userName: string;
    getInitials: (name: string) => string;
    handleSignOut: () => void;
}

// Helper type for user role management
export type UserRole = 'user' | 'admin' | 'superadmin';

export interface UserWithRole extends CognitoUser {
    role?: UserRole;
    permissions?: string[];
}