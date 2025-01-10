import * as vscode from 'vscode';
import { VSCodeStorageManager } from './storage';
import { APIVaultWebviewProvider } from './webview/provider';
import { registerCommands } from './commands';
import { logger } from './utils/logger';

let provider: APIVaultWebviewProvider | undefined;

export async function activate(context: vscode.ExtensionContext) {
    // Initialize logger
    logger.initialize(context);
    logger.command('API Vault extension is now active!');

    try {
        // Initialize storage manager
        const storage = await VSCodeStorageManager.create(context.secrets, context.globalState);

        // Initialize webview provider
        provider = new APIVaultWebviewProvider(context.extensionUri, storage);

        // Log initial state
        const keys = await storage.getKeys();
        const categories = await storage.getCategories();
        logger.command(`Initial state - Keys: ${keys.length}, Categories: ${categories.length}`);

        // Register webview provider
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('apiVaultView', provider)
        );

        // Register commands
        registerCommands(context, storage, provider);

        // Log initialization complete
        logger.command('Extension initialization complete');
    } catch (error) {
        logger.error('Failed to initialize extension', error as Error);
        vscode.window.showErrorMessage('Failed to initialize API Vault extension');
    }
}

export function deactivate() {
    provider = undefined;
}
