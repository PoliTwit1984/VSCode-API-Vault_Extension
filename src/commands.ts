import * as vscode from 'vscode';
import { StorageManager, CommandRegistry, ViewState } from './types';
import { APIVaultWebviewProvider } from './webview/provider';
import { populateDemoData } from './test/populate-demo-data';
import { logger } from './utils/logger';

export function registerCommands(
    context: vscode.ExtensionContext,
    storage: StorageManager,
    provider: APIVaultWebviewProvider
): void {

    const commands: CommandRegistry = {
        'api-vault.toggleViewMode': async () => {
            try {
                const viewState = await storage.getViewState();
                logger.command(`Toggling view mode. Current state: ${JSON.stringify(viewState)}`);
                
                const newMode = viewState.mode === 'list' ? 'grid' : 'list';
                logger.command(`Setting new mode: ${newMode}`);
                
                await storage.updateViewState({
                    mode: newMode
                });
                
                logger.command('Refreshing view after mode change');
                provider.refreshKeys();
                
                vscode.window.showInformationMessage(`View mode changed to ${newMode}`);
            } catch (error) {
                logger.error('Error in toggleViewMode command', error as Error);
                throw error;
            }
        },

        'api-vault.toggleCompactMode': async () => {
            try {
                const viewState = await storage.getViewState();
                logger.command(`Toggling compact mode. Current state: ${JSON.stringify(viewState)}`);
                
                const newCompact = !viewState.compact;
                logger.command(`Setting compact mode: ${newCompact}`);
                
                await storage.updateViewState({
                    compact: newCompact
                });
                
                logger.command('Refreshing view after compact mode change');
                provider.refreshKeys();
                
                vscode.window.showInformationMessage(`Compact mode ${newCompact ? 'enabled' : 'disabled'}`);
            } catch (error) {
                logger.error('Error in toggleCompactMode command', error as Error);
                throw error;
            }
        },

        'api-vault.focusSearch': async () => {
            provider.focusSearch();
        },

        'api-vault.createCategory': async () => {
            const name = await vscode.window.showInputBox({
                prompt: 'Enter category name',
                placeHolder: 'e.g., Cloud Services'
            });
            if (name) {
                await storage.createCategory(name);
                provider.refreshKeys();
            }
        },

        'api-vault.populateDemoData': async () => {
            try {
                await populateDemoData(context);
                provider.refreshKeys();
                vscode.window.showInformationMessage('Demo data populated successfully!');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to populate demo data: ${(error as Error).message}`);
            }
        },
        'api-vault.storeKey': async (key?: string, value?: string) => {
            if (!key || !value) {
                key = await vscode.window.showInputBox({ 
                    prompt: 'Enter the key name',
                    placeHolder: 'e.g., GITHUB_TOKEN'
                });
                if (!key) return;

                value = await vscode.window.showInputBox({ 
                    prompt: 'Enter the API key',
                    password: true,
                    placeHolder: 'Enter your API key here'
                });
                if (!value) return;
            }

            await storage.storeKey(key, value);
            provider.refreshKeys();
            vscode.window.showInformationMessage(`API key "${key}" stored successfully!`);
        },

        'api-vault.getKey': async (key?: string) => {
            if (!key) {
                const keys = await storage.getKeys();
                
                if (keys.length === 0) {
                    vscode.window.showInformationMessage('No API keys stored yet.');
                    return;
                }

                key = await vscode.window.showQuickPick(keys.map(k => k.name), {
                    placeHolder: 'Select an API key to retrieve'
                });
                if (!key) return;
            }

            const value = await storage.getValue(key);
            if (!value) {
                vscode.window.showErrorMessage(`No API key found for "${key}"`);
                return;
            }

            await vscode.env.clipboard.writeText(value);
            vscode.window.showInformationMessage(`API key "${key}" copied to clipboard!`);
        },

        'api-vault.listKeys': async () => {
            const keys = await storage.getKeys();
            
            if (keys.length === 0) {
                vscode.window.showInformationMessage('No API keys stored yet.');
                return;
            }

            const selectedKey = await vscode.window.showQuickPick(keys.map(k => k.name), {
                placeHolder: 'Select an API key to view options'
            });

            if (selectedKey) {
                const action = await vscode.window.showQuickPick(['Copy to Clipboard', 'Delete Key'], {
                    placeHolder: `Choose action for ${selectedKey}`
                });

                if (action === 'Copy to Clipboard') {
                    await commands['api-vault.getKey'](selectedKey);
                } else if (action === 'Delete Key') {
                    await storage.deleteKey(selectedKey);
                    provider.refreshKeys();
                    vscode.window.showInformationMessage(`API key "${selectedKey}" deleted successfully!`);
                }
            }
        }
    };

    // Register all commands
    Object.entries(commands).forEach(([commandId, handler]) => {
        const disposable = vscode.commands.registerCommand(commandId, async (...args) => {
            try {
                await handler(...args);
            } catch (err) {
                const error = err as Error;
                vscode.window.showErrorMessage(`Error executing command: ${error.message}`);
            }
        });
        context.subscriptions.push(disposable);
    });
}
