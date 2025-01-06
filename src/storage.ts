import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { 
    KeyData, 
    CategoryData, 
    StorageManager, 
    ExternalAccessToken,
    ExternalKeyRequest,
    ExternalKeyResponse,
    ExternalListRequest,
    ExternalListResponse
} from './types';

export class VSCodeStorageManager implements StorageManager {
    private activeTokens: Map<string, ExternalAccessToken>;
    constructor(
        private readonly secretStorage: vscode.SecretStorage,
        private readonly globalState: vscode.Memento
    ) {
        // Initialize tokens from global state
        this.activeTokens = new Map(
            Object.entries(this.globalState.get<Record<string, ExternalAccessToken>>('api-vault-tokens', {}))
        );
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
        if (!keys.some(k => k.name === key)) {
            keys.push({ name: key, category });
            await this.globalState.update('api-vault-keys', keys);
        }
    }

    async deleteKey(key: string): Promise<void> {
        const keys = await this.getKeys();
        await this.secretStorage.delete(key);
        const updatedKeys = keys.filter(k => k.name !== key);
        await this.globalState.update('api-vault-keys', updatedKeys);
    }

    async createCategory(name: string): Promise<void> {
        const categories = await this.getCategories();
        if (!categories.some(c => c.name === name)) {
            // New categories are added at the end
            const order = categories.length > 0 ? 
                Math.max(...categories.map(c => c.order)) + 1 : 0;
            categories.push({ name, expanded: true, order });
            await this.globalState.update('api-vault-categories', categories);
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
        const updatedKeys = keys.map(key => {
            const existingKey = existingKeys.find(k => k.name === key);
            return existingKey || { name: key };
        });
        await this.globalState.update('api-vault-keys', updatedKeys);
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

    // External access methods
    async generateAccessToken(): Promise<ExternalAccessToken> {
        // Generate a secure random token
        const token = crypto.randomBytes(32).toString('hex');
        
        // Create token with read-only permissions (no expiration)
        const accessToken: ExternalAccessToken = {
            token,
            expiresAt: Number.MAX_SAFE_INTEGER, // Never expires
            permissions: ['read']
        };

        // Store token in memory and persist to global state
        this.activeTokens.set(token, accessToken);
        await this.globalState.update('api-vault-tokens', 
            Object.fromEntries(this.activeTokens.entries())
        );

        return accessToken;
    }

    async validateToken(token: string): Promise<boolean> {
        // For personal use, just check if the token exists
        return this.activeTokens.has(token);
    }

    async handleExternalKeyRequest(request: ExternalKeyRequest): Promise<ExternalKeyResponse> {
        try {
            // Get key value
            const value = await this.getValue(request.keyName);
            if (!value) {
                return {
                    success: false,
                    error: `Key "${request.keyName}" not found`
                };
            }

            return {
                success: true,
                value
            };
        } catch (error) {
            return {
                success: false,
                error: `Error retrieving key: ${(error as Error).message}`
            };
        }
    }

    async handleExternalListRequest(request: ExternalListRequest): Promise<ExternalListResponse> {
        try {
            // Get keys
            const keys = await this.getKeys();
            
            // Filter by category if specified
            const filteredKeys = request.category ? 
                keys.filter(k => k.category === request.category) : 
                keys;

            return {
                success: true,
                keys: filteredKeys
            };
        } catch (error) {
            return {
                success: false,
                error: `Error listing keys: ${(error as Error).message}`
            };
        }
    }
}
