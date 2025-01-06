// Basic Data Types
export interface KeyData {
    name: string;
    category?: string;
}

export interface CategoryData {
    name: string;
    expanded: boolean;
    order: number;
}

// Webview Communication
export interface WebviewMessage {
    command: string;
    key?: string;
    value?: string;
    category?: string;
    name?: string;
    keys?: string[];
    categories?: string[];
    targetCategory?: string;
}

// External Access Types
export interface ExternalAccessToken {
    token: string;
    expiresAt: number;
    permissions: string[];
}

export interface ExternalKeyRequest {
    keyName: string;
    requestId: string;
}

export interface ExternalListRequest {
    category?: string;
    requestId: string;
}

export interface ExternalKeyResponse {
    success: boolean;
    value?: string;
    error?: string;
}

export interface ExternalListResponse {
    success: boolean;
    keys?: KeyData[];
    error?: string;
}

// Command Handling
export type CommandHandler = (...args: any[]) => Promise<void>;

export interface CommandRegistry {
    [key: string]: CommandHandler;
}

// Storage Management
export interface StorageManager {
    // Basic key operations
    getKeys(): Promise<KeyData[]>;
    getValue(key: string): Promise<string | undefined>;
    storeKey(key: string, value: string, category?: string): Promise<void>;
    deleteKey(key: string): Promise<void>;
    
    // Category operations
    getCategories(): Promise<CategoryData[]>;
    createCategory(name: string): Promise<void>;
    deleteCategory(name: string): Promise<void>;
    updateKeyCategory(key: string, category?: string): Promise<void>;
    toggleCategory(name: string): Promise<void>;
    
    // Ordering operations
    updateKeyOrder(keys: string[]): Promise<void>;
    updateCategoryOrder(categories: string[]): Promise<void>;
    
    // External access operations
    generateAccessToken(): Promise<ExternalAccessToken>;
    validateToken(token: string): Promise<boolean>;
    handleExternalKeyRequest(request: ExternalKeyRequest): Promise<ExternalKeyResponse>;
    handleExternalListRequest(request: ExternalListRequest): Promise<ExternalListResponse>;
}
