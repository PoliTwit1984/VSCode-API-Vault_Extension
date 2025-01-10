export interface KeyData {
    name: string;
    category?: string;
}

export interface CategoryData {
    name: string;
    expanded: boolean;
    order: number;
    icon?: string;
    color?: string;
}

export interface ViewState {
    mode: 'list' | 'grid';
    compact: boolean;
}

export interface WebviewMessage {
    command: 'api-vault.toggleViewMode' | 'api-vault.toggleCompactMode' | 'storeKey' | 'getKey' | 'copyKey' | 'updateOrder' | 'createCategory' | 'deleteCategory' | 'updateKeyCategory' | 'toggleCategory' | 'confirmDelete' | 'refreshKeys' | 'updateKeys' | 'keyStored' | 'showKey' | 'deleteSuccess' | 'deleteCancelled' | 'deleteFailed' | 'focusSearch';
    key?: string;
    value?: string;
    category?: string;
    name?: string;
    keys?: string[];
    categories?: string[];
    targetCategory?: string;
    viewState?: ViewState;
}

export interface StorageManager {
    getKeys(): Promise<KeyData[]>;
    getCategories(): Promise<CategoryData[]>;
    storeKey(key: string, value: string, category?: string): Promise<void>;
    deleteKey(key: string): Promise<void>;
    createCategory(name: string, icon?: string, color?: string): Promise<void>;
    deleteCategory(name: string): Promise<void>;
    updateKeyCategory(key: string, category?: string): Promise<void>;
    toggleCategory(name: string): Promise<void>;
    updateKeyOrder(keys: string[]): Promise<void>;
    updateCategoryOrder(categories: string[]): Promise<void>;
    getValue(key: string): Promise<string | undefined>;
    getViewState(): Promise<ViewState>;
    updateViewState(newState: Partial<ViewState>): Promise<void>;
    updateCategoryStyle(name: string, icon?: string, color?: string): Promise<void>;
}

export type CommandHandler = (...args: any[]) => Promise<void>;

export interface CommandRegistry {
    [key: string]: CommandHandler;
}
