import * as assert from 'assert';
import { VSCodeStorageManager } from '../../storage';
import { MockMemento, MockSecretStorage } from './testUtils';

suite('View State Tests', () => {
    let storage: VSCodeStorageManager;

    setup(async () => {
        storage = await VSCodeStorageManager.create(
            new MockSecretStorage(),
            new MockMemento()
        );
    });

    test('should initialize with default view state', async () => {
        const viewState = await storage.getViewState();
        assert.strictEqual(viewState.mode, 'list');
        assert.strictEqual(viewState.compact, false);
    });

    test('should update view mode', async () => {
        await storage.updateViewState({ mode: 'grid' });
        const viewState = await storage.getViewState();
        assert.strictEqual(viewState.mode, 'grid');
    });

    test('should update compact mode', async () => {
        await storage.updateViewState({ compact: true });
        const viewState = await storage.getViewState();
        assert.strictEqual(viewState.compact, true);
    });

    test('should persist view state', async () => {
        await storage.updateViewState({ mode: 'grid', compact: true });
        
        // Create new storage instance to verify persistence
        const newStorage = await VSCodeStorageManager.create(
            new MockSecretStorage(),
            new MockMemento()
        );
        
        const viewState = await newStorage.getViewState();
        assert.strictEqual(viewState.mode, 'grid');
        assert.strictEqual(viewState.compact, true);
    });

    test('should partially update view state', async () => {
        // Set initial state
        await storage.updateViewState({ mode: 'grid', compact: false });
        
        // Update only compact mode
        await storage.updateViewState({ compact: true });
        
        const viewState = await storage.getViewState();
        assert.strictEqual(viewState.mode, 'grid'); // Should remain unchanged
        assert.strictEqual(viewState.compact, true); // Should be updated
    });
});
