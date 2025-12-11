// Standardized action result types for admin operations
export interface AdminActionResult<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
}

export interface AdminOperationState {
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
}

export interface AdminListState<T> extends AdminOperationState {
    items: T[];
    filteredItems: T[];
    searchTerm: string;
    totalCount: number;
}

// Generic admin operation hooks interface
export interface AdminOperations<T> {
    create: (data: Partial<T>) => Promise<boolean>;
    update: (id: string, data: Partial<T>) => Promise<boolean>;
    delete: (item: T) => Promise<boolean>;
    refresh: () => Promise<void>;
    isSaving: boolean;
}