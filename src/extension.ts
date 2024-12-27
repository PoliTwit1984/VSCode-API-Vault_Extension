import * as vscode from 'vscode';
import { VSCodeStorageManager } from './storage';
import { APIVaultWebviewProvider } from './webview/provider';
import { registerCommands } from './commands';

let provider: APIVaultWebviewProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('API Vault extension is now active!');

    // Initialize storage manager
    const storage = new VSCodeStorageManager(context.secrets, context.globalState);

    // Initialize webview provider
    provider = new APIVaultWebviewProvider(context.extensionUri, storage);

    // Register webview provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('apiVaultView', provider)
    );

    // Register commands
    registerCommands(context, storage, provider);
}

export function deactivate() {
    provider = undefined;
}
