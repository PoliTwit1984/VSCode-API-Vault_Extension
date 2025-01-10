import * as vscode from 'vscode';
import { StorageManager, WebviewMessage } from '../types';
import { getWebviewContent } from './template';
import { logger } from '../utils/logger';

export class APIVaultWebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _updateTimeout?: NodeJS.Timeout;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly storage: StorageManager
    ) {}

    private _debounce(func: Function, wait: number) {
        clearTimeout(this._updateTimeout);
        this._updateTimeout = setTimeout(() => func(), wait);
    }

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = getWebviewContent();

        this._setWebviewMessageListener(webviewView.webview);
        
        // Initialize view state and keys
        const initializeWebview = async () => {
            logger.webview('Initializing webview data');
            await this._updateStoredKeys();
            
            // Schedule a follow-up update to ensure data is loaded
            setTimeout(async () => {
                if (webviewView.visible) {
                    logger.webview('Performing follow-up data refresh');
                    await this._updateStoredKeys();
                }
            }, 1000);
        };

        // Initial load
        await initializeWebview();

        // Register webview visibility change handler
        webviewView.onDidChangeVisibility(async () => {
            if (webviewView.visible) {
                logger.webview('Webview became visible, refreshing data');
                await initializeWebview();
            }
        });
    }

    public refreshKeys(): void {
        if (this._view) {
            // Clear any pending debounced updates
            if (this._updateTimeout) {
                clearTimeout(this._updateTimeout);
                this._updateTimeout = undefined;
            }
            // Force an immediate update
            this._updateStoredKeys();
        }
    }

    public focusSearch(): void {
        if (this._view) {
            this._view.webview.postMessage({ command: 'focusSearch' });
        }
    }

    private async _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(async (message: WebviewMessage) => {
            try {
                switch (message.command) {
                    case 'api-vault.toggleViewMode':
                        const currentMode = await this.storage.getViewState();
                        await this.storage.updateViewState({
                            mode: currentMode.mode === 'list' ? 'grid' : 'list'
                        });
                        await this._updateStoredKeys();
                        break;
                    case 'api-vault.toggleCompactMode':
                        const currentCompact = await this.storage.getViewState();
                        await this.storage.updateViewState({
                            compact: !currentCompact.compact
                        });
                        await this._updateStoredKeys();
                        break;
                    case 'storeKey':
                        if (message.key && message.value) {
                            await this.storage.storeKey(message.key, message.value, message.category);
                            vscode.window.showInformationMessage(`API key "${message.key}" stored successfully!`);
                            webview.postMessage({ command: 'keyStored', key: message.key });
                            await this._updateStoredKeys();
                        }
                        break;
                    case 'getKey':
                        if (message.key) {
                            const value = await this.storage.getValue(message.key);
                            webview.postMessage({ command: 'showKey', key: message.key, value });
                        }
                        break;
                    case 'copyKey':
                        if (message.key) {
                            const value = await this.storage.getValue(message.key);
                            if (value) {
                                await vscode.env.clipboard.writeText(value);
                                vscode.window.showInformationMessage(`API key "${message.key}" copied to clipboard!`);
                            }
                        }
                        break;
                    case 'updateOrder':
                        if (message.keys) {
                            await this.storage.updateKeyOrder(message.keys);
                        }
                        break;
                    case 'createCategory':
                        if (message.name) {
                            await this.storage.createCategory(message.name);
                            await this._updateStoredKeys();
                        }
                        break;
                    case 'deleteCategory':
                        if (message.name) {
                            await this.storage.deleteCategory(message.name);
                            await this._updateStoredKeys();
                        }
                        break;
                    case 'updateKeyCategory':
                        if (message.key) {
                            await this.storage.updateKeyCategory(message.key, message.category);
                            await this._updateStoredKeys();
                        }
                        break;
                    case 'toggleCategory':
                        if (message.name) {
                            await this.storage.toggleCategory(message.name);
                        }
                        break;
                    case 'confirmDelete':
                        if (message.key) {
                            const answer = await vscode.window.showWarningMessage(
                                `Are you sure you want to delete the API key "${message.key}"?`,
                                { modal: true },
                                'Yes',
                                'No'
                            );
                            
                            if (answer === 'Yes') {
                                try {
                                    await this.storage.deleteKey(message.key);
                                    vscode.window.showInformationMessage(`API key "${message.key}" deleted successfully!`);
                                    webview.postMessage({ command: 'deleteSuccess', key: message.key });
                                    await this._updateStoredKeys();
                                } catch (error) {
                                    console.error('[Extension] Error in deleteKey:', error);
                                    vscode.window.showErrorMessage(`Failed to delete key "${message.key}": ${error instanceof Error ? error.message : 'Unknown error'}`);
                                    webview.postMessage({ command: 'deleteFailed', key: message.key });
                                }
                            } else {
                                webview.postMessage({ command: 'deleteCancelled', key: message.key });
                            }
                        }
                        break;
                    case 'refreshKeys':
                        await this._updateStoredKeys();
                        break;
                }
            } catch (err) {
                const error = err as Error;
                console.error('[Extension] Error in message handler:', error);
                vscode.window.showErrorMessage(`Error: ${error.message}`);
            }
        });
    }

    private async _updateStoredKeys() {
        try {
            if (!this._view) {
                logger.webview('View not available, skipping update');
                return;
            }

            logger.webview('Updating stored keys and view state');
            const [keys, categories, viewState] = await Promise.all([
                this.storage.getKeys(),
                this.storage.getCategories(),
                this.storage.getViewState()
            ]);
            logger.webview(`Retrieved view state: ${JSON.stringify(viewState)}`);
            
            // Ensure the webview is still available and visible before sending update
            if (this._view && this._view.visible) {
                logger.webview(`Sending combined update with ${keys.length} keys and ${categories.length} categories`);
                await this._view.webview.postMessage({ 
                    command: 'updateKeys', 
                    keys,
                    categories,
                    viewState
                });
                logger.webview('Update sent to webview');
            } else {
                logger.webview('View no longer visible, update skipped');
            }
        } catch (err) {
            const error = err as Error;
            logger.error('Error updating stored keys', error);
            vscode.window.showErrorMessage(`Error updating stored keys: ${error.message}`);
        }
    }
}
