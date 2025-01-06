"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const storage_1 = require("./storage");
const provider_1 = require("./webview/provider");
const commands_1 = require("./commands");
const external_server_1 = require("./external-server");
let provider;
async function activate(context) {
    console.log('API Vault extension is now active!');
    // Initialize storage manager
    const storage = new storage_1.VSCodeStorageManager(context.secrets, context.globalState);
    // Initialize webview provider
    provider = new provider_1.APIVaultWebviewProvider(context.extensionUri, storage);
    // Register webview provider
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('apiVaultView', provider));
    // Register commands
    (0, commands_1.registerCommands)(context, storage, provider);
    // Start MCP server first
    try {
        const token = await storage.generateAccessToken();
        const mcpProcess = require('child_process').spawn('node', ['/Users/joewilson/Documents/Cline/MCP/api-vault-server/build/server.js'], {
            env: {
                ...process.env,
                API_VAULT_TOKEN: token.token,
                MCP_SERVER: 'true'
            }
        });
        mcpProcess.stdout.on('data', (data) => {
            console.log(`MCP Server: ${data.toString()}`);
        });
        mcpProcess.stderr.on('data', (data) => {
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
            const configuredPort = config.get('externalPort');
            const port = await (0, external_server_1.startExternalServer)(token.token, storage, configuredPort, context);
            console.log(`External server started on port ${port}`);
            // Update workspace state
            await context.workspaceState.update('externalAccessEnabled', true);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to start external server: ${error.message}`);
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to start MCP server: ${error.message}`);
    }
}
exports.activate = activate;
async function deactivate() {
    // Clean up provider
    provider = undefined;
    try {
        // Import cleanupServer dynamically to avoid circular dependencies
        const { cleanupServer } = await Promise.resolve().then(() => require('./external-server'));
        await cleanupServer();
    }
    catch (error) {
        console.error('Error during cleanup:', error);
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map