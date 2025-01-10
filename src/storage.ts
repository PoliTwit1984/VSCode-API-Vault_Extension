import * as vscode from 'vscode';
import { KeyData, CategoryData, StorageManager, ViewState } from './types';
import { logger } from './utils/logger';

export class VSCodeStorageManager implements StorageManager {
    private viewState: ViewState = {
        mode: 'list',
        compact: false
    };

    static async create(
        secretStorage: vscode.SecretStorage,
        globalState: vscode.Memento
    ): Promise<VSCodeStorageManager> {
        const instance = new VSCodeStorageManager(secretStorage, globalState);
        await instance.initialize();
        return instance;
    }

    private constructor(
        private readonly secretStorage: vscode.SecretStorage,
        private readonly globalState: vscode.Memento
    ) {}

    private static readonly VIEW_STATE_KEY = 'api-vault-view-state';

    private async initialize(): Promise<void> {
        // Initialize view state from storage
        const savedViewState = this.globalState.get<ViewState>(VSCodeStorageManager.VIEW_STATE_KEY);
        if (savedViewState) {
            logger.storage(`Loaded initial view state: ${JSON.stringify(savedViewState)}`);
            this.viewState = savedViewState;
        } else {
            logger.storage(`Using default view state: ${JSON.stringify(this.viewState)}`);
            // Initialize storage with default state
            try {
                await this.globalState.update(VSCodeStorageManager.VIEW_STATE_KEY, this.viewState);
                logger.storage('Initialized storage with default view state');
            } catch (error) {
                logger.error('Failed to initialize storage with default view state', error as Error);
            }
        }
    }

    async getKeys(): Promise<KeyData[]> {
        return this.globalState.get<KeyData[]>('api-vault-keys', []);
    }

    async getCategories(): Promise<CategoryData[]> {
        const categories = this.globalState.get<CategoryData[]>('api-vault-categories', []);
        // Sort categories by order
        return categories.sort((a, b) => a.order - b.order);
    }

    async storeKey(key: string, value: string, category?: string): Promise<void> {
        await this.secretStorage.store(key, value);
        const keys = await this.getKeys();
        // Update existing key or add new one
        const existingKeyIndex = keys.findIndex(k => k.name === key);
        if (existingKeyIndex !== -1) {
            // Update existing key's category
            keys[existingKeyIndex].category = category;
        } else {
            // Add new key
            keys.push({ name: key, category });
        }
        await this.globalState.update('api-vault-keys', keys);
        logger.storage(`Stored key: ${key} with category: ${category || 'none'}`);
    }

    async deleteKey(key: string): Promise<void> {
        const keys = await this.getKeys();
        await this.secretStorage.delete(key);
        const updatedKeys = keys.filter(k => k.name !== key);
        await this.globalState.update('api-vault-keys', updatedKeys);
    }

    async createCategory(name: string, icon?: string, color?: string): Promise<void> {
        const categories = await this.getCategories();
        if (!categories.some(c => c.name === name)) {
            // New categories are added at the end
            const order = categories.length > 0 ? 
                Math.max(...categories.map(c => c.order)) + 1 : 0;
            categories.push({ name, expanded: true, order, icon, color });
            await this.globalState.update('api-vault-categories', categories);
        }
    }

    async updateCategoryStyle(name: string, icon?: string, color?: string): Promise<void> {
        const categories = await this.getCategories();
        const updatedCategories = categories.map(c => {
            if (c.name === name) {
                return { ...c, icon, color };
            }
            return c;
        });
        await this.globalState.update('api-vault-categories', updatedCategories);
    }

    async getViewState(): Promise<ViewState> {
        try {
            logger.storage('Getting view state');
            const state = await this.globalState.get<ViewState>(VSCodeStorageManager.VIEW_STATE_KEY);
            logger.storage(`Retrieved state: ${JSON.stringify(state)}`);
            const finalState = state || this.viewState;
            logger.storage(`Returning state: ${JSON.stringify(finalState)}`);
            return finalState;
        } catch (error) {
            logger.error('Error getting view state', error as Error);
            throw error;
        }
    }

    async updateViewState(newState: Partial<ViewState>): Promise<void> {
        try {
            logger.storage(`Updating view state with: ${JSON.stringify(newState)}`);
            const currentState = await this.getViewState();
            logger.storage(`Current state: ${JSON.stringify(currentState)}`);
            const updatedState = { ...currentState, ...newState };
            logger.storage(`Final state: ${JSON.stringify(updatedState)}`);
            await this.globalState.update(VSCodeStorageManager.VIEW_STATE_KEY, updatedState);
            this.viewState = updatedState;
            logger.storage('View state updated successfully');
        } catch (error) {
            logger.error('Error updating view state', error as Error);
            throw error;
        }
    }

    async deleteCategory(name: string): Promise<void> {
        const categories = await this.getCategories();
        const keys = await this.getKeys();
        
        // Remove category
        const updatedCategories = categories.filter(c => c.name !== name);
        await this.globalState.update('api-vault-categories', updatedCategories);
        
        // Remove category from keys
        const updatedKeys = keys.map(k => {
            if (k.category === name) {
                return { ...k, category: undefined };
            }
            return k;
        });
        await this.globalState.update('api-vault-keys', updatedKeys);
    }

    async updateKeyCategory(key: string, category?: string): Promise<void> {
        const keys = await this.getKeys();
        const updatedKeys = keys.map(k => {
            if (k.name === key) {
                return { ...k, category };
            }
            return k;
        });
        await this.globalState.update('api-vault-keys', updatedKeys);
    }

    async toggleCategory(name: string): Promise<void> {
        const categories = await this.getCategories();
        const updatedCategories = categories.map(c => {
            if (c.name === name) {
                return { ...c, expanded: !c.expanded };
            }
            return c;
        });
        await this.globalState.update('api-vault-categories', updatedCategories);
    }

    async updateKeyOrder(keys: string[]): Promise<void> {
        const existingKeys = await this.getKeys();
        // Create a map for quick lookup of existing keys
        const keyMap = new Map(existingKeys.map(k => [k.name, k]));
        
        // Preserve all existing keys and their categories while updating order
        const updatedKeys = keys.map(key => {
            const existingKey = keyMap.get(key);
            // If key exists, preserve all its properties
            return existingKey || { name: key };
        });

        // Add any keys that weren't in the order array to preserve them
        existingKeys.forEach(key => {
            if (!keys.includes(key.name)) {
                updatedKeys.push(key);
            }
        });

        // Log before and after counts to help debug any key loss
        logger.storage(`Updating key order - Before: ${existingKeys.length}, After: ${updatedKeys.length}`);
        if (existingKeys.length !== updatedKeys.length) {
            logger.storage('Key count mismatch during order update:');
            logger.storage(`Existing keys: ${JSON.stringify(existingKeys.map(k => k.name))}`);
            logger.storage(`Updated keys: ${JSON.stringify(updatedKeys.map(k => k.name))}`);
        }

        await this.globalState.update('api-vault-keys', updatedKeys);
        logger.storage(`Updated key order. Total keys: ${updatedKeys.length}`);
    }

    async updateCategoryOrder(categories: string[]): Promise<void> {
        const existingCategories = await this.getCategories();
        const updatedCategories = categories.map((name, index) => {
            const existingCategory = existingCategories.find(c => c.name === name);
            if (existingCategory) {
                return { ...existingCategory, order: index };
            }
            return { name, expanded: true, order: index };
        });
        await this.globalState.update('api-vault-categories', updatedCategories);
    }

    async getValue(key: string): Promise<string | undefined> {
        return await this.secretStorage.get(key);
    }
}
