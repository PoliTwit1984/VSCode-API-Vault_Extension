"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const storage_1 = require("./storage");
const provider_1 = require("./webview/provider");
const commands_1 = require("./commands");
let provider;
function activate(context) {
    console.log('API Vault extension is now active!');
    // Initialize storage manager
    const storage = new storage_1.VSCodeStorageManager(context.secrets, context.globalState);
    // Initialize webview provider
    provider = new provider_1.APIVaultWebviewProvider(context.extensionUri, storage);
    // Register webview provider
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('apiVaultView', provider));
    // Register commands
    (0, commands_1.registerCommands)(context, storage, provider);
}
function deactivate() {
    provider = undefined;
}
//# sourceMappingURL=extension.js.map