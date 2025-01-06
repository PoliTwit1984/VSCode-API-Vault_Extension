import * as vscode from 'vscode';
import { 
    StorageManager, 
    KeyData, 
    CategoryData,
    ExternalAccessToken,
    ExternalKeyRequest,
    ExternalKeyResponse,
    ExternalListRequest,
    ExternalListResponse
} from '../../types';

export class MockStorageManager implements StorageManager {
    private keys: Map<string, string> = new Map();
    private keyData: KeyData[] = [];
    private categories: CategoryData[] = [];

    async getKeys(): Promise<KeyData[]> {
        return this.keyData;
    }

    async getCategories(): Promise<CategoryData[]> {
        return this.categories.sort((a, b) => a.order - b.order);
    }

    async storeKey(key: string, value: string, category?: string): Promise<void> {
        this.keys.set(key, value);
        if (!this.keyData.some(k => k.name === key)) {
            this.keyData.push({ name: key, category });
        }
    }

    async deleteKey(key: string): Promise<void> {
        this.keys.delete(key);
        this.keyData = this.keyData.filter(k => k.name !== key);
    }

    async createCategory(name: string): Promise<void> {
        if (!this.categories.some(c => c.name === name)) {
            const order = this.categories.length > 0 ? 
                Math.max(...this.categories.map(c => c.order)) + 1 : 0;
            this.categories.push({ name, expanded: true, order });
        }
    }

    async deleteCategory(name: string): Promise<void> {
        this.categories = this.categories.filter(c => c.name !== name);
        this.keyData = this.keyData.map(k => {
            if (k.category === name) {
                return { ...k, category: undefined };
            }
            return k;
        });
    }

    async updateKeyCategory(key: string, category?: string): Promise<void> {
        this.keyData = this.keyData.map(k => {
            if (k.name === key) {
                return { ...k, category };
            }
            return k;
        });
    }

    async toggleCategory(name: string): Promise<void> {
        this.categories = this.categories.map(c => {
            if (c.name === name) {
                return { ...c, expanded: !c.expanded };
            }
            return c;
        });
    }

    async updateKeyOrder(keys: string[]): Promise<void> {
        const newKeyData: KeyData[] = [];
        keys.forEach(key => {
            const existingKey = this.keyData.find(k => k.name === key);
            if (existingKey) {
                newKeyData.push(existingKey);
            }
        });
        this.keyData = newKeyData;
    }

    async updateCategoryOrder(categories: string[]): Promise<void> {
        const updatedCategories: CategoryData[] = [];
        categories.forEach((name, index) => {
            const existingCategory = this.categories.find(c => c.name === name);
            if (existingCategory) {
                updatedCategories.push({ ...existingCategory, order: index });
            }
        });
        this.categories = updatedCategories;
    }

    async getValue(key: string): Promise<string | undefined> {
        return this.keys.get(key);
    }

    // External access methods
    private activeTokens: Map<string, ExternalAccessToken> = new Map();

    async generateAccessToken(): Promise<ExternalAccessToken> {
        const token: ExternalAccessToken = {
            token: `test-token-${Date.now()}`,
            expiresAt: Date.now() + 1000, // 1 second expiry for tests
            permissions: ['read']
        };
        this.activeTokens.set(token.token, token);
        return token;
    }

    async validateToken(token: string): Promise<boolean> {
        const accessToken = this.activeTokens.get(token);
        if (!accessToken) {
            return false;
        }
        if (Date.now() > accessToken.expiresAt) {
            this.activeTokens.delete(token);
            return false;
        }
        return true;
    }

    async handleExternalKeyRequest(request: ExternalKeyRequest): Promise<ExternalKeyResponse> {
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
    }

    async handleExternalListRequest(request: ExternalListRequest): Promise<ExternalListResponse> {
        const keys = await this.getKeys();
        const filteredKeys = request.category ? 
            keys.filter(k => k.category === request.category) : 
            keys;

        return {
            success: true,
            keys: filteredKeys
        };
    }
}

export class MockMemento implements vscode.Memento {
    private storage = new Map<string, any>();

    get<T>(key: string): T | undefined;
    get<T>(key: string, defaultValue: T): T;
    get(key: string, defaultValue?: any) {
        const value = this.storage.get(key);
        return value !== undefined ? value : defaultValue;
    }

    update(key: string, value: any): Thenable<void> {
        this.storage.set(key, value);
        return Promise.resolve();
    }

    keys(): readonly string[] {
        return Array.from(this.storage.keys());
    }
}

export class MockSecretStorage implements vscode.SecretStorage {
    private secrets = new Map<string, string>();

    async get(key: string): Promise<string | undefined> {
        return this.secrets.get(key);
    }

    async store(key: string, value: string): Promise<void> {
        this.secrets.set(key, value);
    }

    async delete(key: string): Promise<void> {
        this.secrets.delete(key);
    }

    onDidChange = new vscode.EventEmitter<vscode.SecretStorageChangeEvent>().event;
}
