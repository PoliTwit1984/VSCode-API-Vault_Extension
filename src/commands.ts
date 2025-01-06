import * as vscode from 'vscode';
import { StorageManager, CommandRegistry } from './types';
import { APIVaultWebviewProvider } from './webview/provider';
import { populateDemoData } from './test/populate-demo-data';
import { startExternalServer } from './external-server';

// Get configuration
function getConfig() {
    return vscode.workspace.getConfiguration('apiVault');
}

export function registerCommands(
    context: vscode.ExtensionContext,
    storage: StorageManager,
    provider: APIVaultWebviewProvider
): void {
    const commands: CommandRegistry = {
        // External access commands
        'api-vault.generateAccessToken': async () => {
            try {
                const token = await storage.generateAccessToken();
                
                // Copy token to clipboard for easy access
                await vscode.env.clipboard.writeText(token.token);
                
                // Update MCP settings with new token
                const mcpSettingsPath = '/Users/joewilson/Library/Application Support/Code - Insiders/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json';
                const mcpSettingsUri = vscode.Uri.file(mcpSettingsPath);
                
                let mcpSettings;
                try {
                    const fileContent = await vscode.workspace.fs.readFile(mcpSettingsUri);
                    mcpSettings = JSON.parse(fileContent.toString());
                } catch {
                    // Create new settings file if it doesn't exist
                    mcpSettings = { mcpServers: {} };
                }

                if (!mcpSettings.mcpServers['api-vault']) {
                    mcpSettings.mcpServers['api-vault'] = {
                        command: '/Users/joewilson/.nvm/versions/node/v18.20.4/bin/node',
                        args: ['/Users/joewilson/Documents/Cline/MCP/api-vault-server/build/server.js'],
                        version: '18.20.4'
                    };
                }
                
                mcpSettings.mcpServers['api-vault'].env = {
                    API_VAULT_TOKEN: token.token
                };
                
                await vscode.workspace.fs.writeFile(
                    mcpSettingsUri,
                    Buffer.from(JSON.stringify(mcpSettings, null, 2))
                );
                
                vscode.window.showInformationMessage(
                    'Access token generated and copied to clipboard! ' +
                    'This token will remain valid until you generate a new one. ' +
                    'MCP settings have been updated.'
                );
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to generate access token: ${(error as Error).message}`);
            }
        },

        'api-vault.configurePort': async () => {
            try {
                const config = getConfig();
                const currentPort = config.get<number>('externalPort') || 8000;
                
                const port = await vscode.window.showInputBox({
                    prompt: 'Enter port number for external access (default: 8000)',
                    value: currentPort.toString(),
                    validateInput: (value) => {
                        const num = parseInt(value);
                        if (isNaN(num) || num < 1024 || num > 65535) {
                            return 'Please enter a valid port number (1024-65535)';
                        }
                        return null;
                    }
                });

                if (port) {
                    await config.update('externalPort', parseInt(port), true);
                    vscode.window.showInformationMessage(`External access port set to ${port}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to configure port: ${(error as Error).message}`);
            }
        },

        'api-vault.disableExternalAccess': async () => {
            try {
                // Update workspace state
                await context.workspaceState.update('externalAccessEnabled', false);
                
                // Clean up server
                const { cleanupServer } = await import('./external-server');
                await cleanupServer();
                
                vscode.window.showInformationMessage(
                    'External access disabled and server stopped. ' +
                    'The server will not auto-start on extension reload.'
                );
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Failed to disable external access: ${(error as Error).message}`
                );
            }
        },

        'api-vault.exposeExternalAccess': async () => {
            try {
                const token = await storage.generateAccessToken();
                const config = getConfig();
                const configuredPort = config.get<number>('externalPort');
                const result = await startExternalServer(token.token, storage, configuredPort, context);
                
                // Store external access state
                await context.workspaceState.update('externalAccessEnabled', true);
                
                vscode.window.showInformationMessage(
                    `External access enabled on port ${result.port}. ` +
                    'Use the access token for authentication.'
                );
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to expose external access: ${(error as Error).message}`);
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
