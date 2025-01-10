import * as assert from 'assert';
import * as vscode from 'vscode';
import { MockStorageManager, MockMemento, MockSecretStorage } from './testUtils';
import { VSCodeStorageManager } from '../../storage';
import { APIVaultWebviewProvider } from '../../webview/provider';

suite('API Vault Extension Test Suite', () => {
    let storage: VSCodeStorageManager;
    let mockSecrets: MockSecretStorage;
    let mockGlobalState: MockMemento;

    setup(async () => {
        mockSecrets = new MockSecretStorage();
        mockGlobalState = new MockMemento();
        storage = await VSCodeStorageManager.create(mockSecrets, mockGlobalState);
    });

    test('Store and retrieve key', async () => {
        const key = 'TEST_KEY';
        const value = 'test-value';
        
        await storage.storeKey(key, value);
        const retrievedValue = await storage.getValue(key);
        
        assert.strictEqual(retrievedValue, value);
    });

    test('Create and delete category', async () => {
        const categoryName = 'Test Category';
        
        await storage.createCategory(categoryName);
        let categories = await storage.getCategories();
        assert.strictEqual(categories.length, 1);
        assert.strictEqual(categories[0].name, categoryName);
        assert.strictEqual(categories[0].expanded, true);
        assert.strictEqual(categories[0].order, 0);
        
        await storage.deleteCategory(categoryName);
        categories = await storage.getCategories();
        assert.strictEqual(categories.length, 0);
    });

    test('Update key category', async () => {
        const key = 'TEST_KEY';
        const value = 'test-value';
        const category = 'Test Category';
        
        await storage.storeKey(key, value);
        await storage.createCategory(category);
        await storage.updateKeyCategory(key, category);
        
        const keys = await storage.getKeys();
        assert.strictEqual(keys.length, 1);
        assert.strictEqual(keys[0].name, key);
        assert.strictEqual(keys[0].category, category);
    });

    test('Toggle category expansion', async () => {
        const category = 'Test Category';
        
        await storage.createCategory(category);
        let categories = await storage.getCategories();
        assert.strictEqual(categories[0].expanded, true);
        
        await storage.toggleCategory(category);
        categories = await storage.getCategories();
        assert.strictEqual(categories[0].expanded, false);
        
        await storage.toggleCategory(category);
        categories = await storage.getCategories();
        assert.strictEqual(categories[0].expanded, true);
    });

    test('Update category order', async () => {
        const categoryNames = ['Category 1', 'Category 2', 'Category 3'];
        
        // Create categories in original order
        for (const name of categoryNames) {
            await storage.createCategory(name);
        }
        
        // Verify initial order
        let categories = await storage.getCategories();
        assert.strictEqual(categories[0].name, 'Category 1');
        assert.strictEqual(categories[1].name, 'Category 2');
        assert.strictEqual(categories[2].name, 'Category 3');
        
        // Update order
        const newOrder = ['Category 3', 'Category 1', 'Category 2'];
        await storage.updateCategoryOrder(newOrder);
        
        // Verify new order
        categories = await storage.getCategories();
        assert.strictEqual(categories[0].name, 'Category 3');
        assert.strictEqual(categories[1].name, 'Category 1');
        assert.strictEqual(categories[2].name, 'Category 2');
    });

    test('Update key order within category', async () => {
        const category = 'Test Category';
        const keys = ['Key 1', 'Key 2', 'Key 3'];
        
        // Create category and keys
        await storage.createCategory(category);
        for (const key of keys) {
            await storage.storeKey(key, 'value', category);
        }
        
        // Update order
        const newOrder = ['Key 3', 'Key 1', 'Key 2'];
        await storage.updateKeyOrder(newOrder);
        
        // Verify new order
        const storedKeys = await storage.getKeys();
        const categoryKeys = storedKeys.filter(k => k.category === category);
        assert.strictEqual(categoryKeys[0].name, 'Key 3');
        assert.strictEqual(categoryKeys[1].name, 'Key 1');
        assert.strictEqual(categoryKeys[2].name, 'Key 2');
    });

    test('Move key between categories', async () => {
        const sourceCategory = 'Source Category';
        const targetCategory = 'Target Category';
        const key = 'TEST_KEY';
        
        // Setup categories and key
        await storage.createCategory(sourceCategory);
        await storage.createCategory(targetCategory);
        await storage.storeKey(key, 'value', sourceCategory);
        
        // Move key to target category
        await storage.updateKeyCategory(key, targetCategory);
        
        // Verify key moved
        const keys = await storage.getKeys();
        const movedKey = keys.find(k => k.name === key);
        assert.strictEqual(movedKey?.category, targetCategory);
    });

    test('Delete category removes category from keys', async () => {
        const key = 'TEST_KEY';
        const value = 'test-value';
        const category = 'Test Category';
        
        await storage.storeKey(key, value);
        await storage.createCategory(category);
        await storage.updateKeyCategory(key, category);
        
        let keys = await storage.getKeys();
        assert.strictEqual(keys[0].category, category);
        
        await storage.deleteCategory(category);
        keys = await storage.getKeys();
        assert.strictEqual(keys[0].category, undefined);
    });

    test('Category expansion state is preserved', async () => {
        // Create a category
        const category = 'Test Category';
        await storage.createCategory(category);

        // Verify initial expanded state
        let categories = await storage.getCategories();
        assert.strictEqual(categories[0].expanded, true);

        // Toggle category closed
        await storage.toggleCategory(category);
        categories = await storage.getCategories();
        assert.strictEqual(categories[0].expanded, false);

        // Verify state is preserved after refresh
        const refreshedCategories = await storage.getCategories();
        assert.strictEqual(refreshedCategories[0].expanded, false);

        // Toggle category open
        await storage.toggleCategory(category);
        categories = await storage.getCategories();
        assert.strictEqual(categories[0].expanded, true);
    });

    test('Store duplicate key updates existing key', async () => {
        const key = 'TEST_KEY';
        const value1 = 'test-value-1';
        const value2 = 'test-value-2';
        
        await storage.storeKey(key, value1);
        await storage.storeKey(key, value2);
        
        const keys = await storage.getKeys();
        assert.strictEqual(keys.length, 1);
        
        const retrievedValue = await storage.getValue(key);
        assert.strictEqual(retrievedValue, value2);
    });
});
