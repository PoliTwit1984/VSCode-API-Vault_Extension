import * as vscode from 'vscode';
import { VSCodeStorageManager } from './storage';
import { APIVaultWebviewProvider } from './webview/provider';
import { registerCommands } from './commands';
import { startExternalServer } from './external-server';

let provider: APIVaultWebviewProvider | undefined;

export async function activate(context: vscode.ExtensionContext) {
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

    // Start MCP server first
    try {
        const token = await storage.generateAccessToken();
        const mcpProcess = require('child_process').spawn(
            'node',
            ['/Users/joewilson/Documents/Cline/MCP/api-vault-server/build/server.js'],
            {
                env: {
                    ...process.env,
                    API_VAULT_TOKEN: token.token,
                    MCP_SERVER: 'true'
                }
            }
        );
        
        mcpProcess.stdout.on('data', (data: Buffer) => {
            console.log(`MCP Server: ${data.toString()}`);
        });
        
        mcpProcess.stderr.on('data', (data: Buffer) => {
            console.error(`MCP Server Error: ${data.toString()}`);
        });

        context.subscriptions.push({
            dispose: () => {
                mcpProcess.kill();
            }
        });

        // Always start external server for MCP
        try {
            const config = vscode.workspace.getConfiguration('apiVault');
            const configuredPort = config.get<number>('externalPort');
            const port = await startExternalServer(token.token, storage, configuredPort, context);
            console.log(`External server started on port ${port}`);
            
            // Update workspace state
            await context.workspaceState.update('externalAccessEnabled', true);
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to start external server: ${(error as Error).message}`
            );
        }
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to start MCP server: ${(error as Error).message}`
        );
    }
}

export async function deactivate() {
    // Clean up provider
    provider = undefined;

    try {
        // Import cleanupServer dynamically to avoid circular dependencies
        const { cleanupServer } = await import('./external-server');
        await cleanupServer();
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}
