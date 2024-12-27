export interface KeyData {
    name: string;
    category?: string;
}

export interface CategoryData {
    name: string;
    expanded: boolean;
    order: number;  // Added for category ordering
}

export interface WebviewMessage {
    command: string;
    key?: string;
    value?: string;
    category?: string;
    name?: string;
    keys?: string[];
    categories?: string[];  // Added for category reordering
    targetCategory?: string;  // Added for drag between categories
}

export interface StorageManager {
    getKeys(): Promise<KeyData[]>;
    getCategories(): Promise<CategoryData[]>;
    storeKey(key: string, value: string, category?: string): Promise<void>;
    deleteKey(key: string): Promise<void>;
    createCategory(name: string): Promise<void>;
    deleteCategory(name: string): Promise<void>;
    updateKeyCategory(key: string, category?: string): Promise<void>;
    toggleCategory(name: string): Promise<void>;
    updateKeyOrder(keys: string[]): Promise<void>;
    updateCategoryOrder(categories: string[]): Promise<void>;  // Added for category reordering
    getValue(key: string): Promise<string | undefined>;
}

export type CommandHandler = (...args: any[]) => Promise<void>;

export interface CommandRegistry {
    [key: string]: CommandHandler;
}
