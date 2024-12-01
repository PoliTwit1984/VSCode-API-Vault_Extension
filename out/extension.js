"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
class APIVaultViewProvider {
    constructor(extensionUri, secretStorage, globalState) {
        this._extensionUri = extensionUri;
        this._secretStorage = secretStorage;
        this._globalState = globalState;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getWebviewContent();
        this._setWebviewMessageListener(webviewView.webview);
        this._updateStoredKeys();
    }
    // Public method to check if view exists and refresh keys
    refreshKeys() {
        if (this._view) {
            this._view.webview.postMessage({ command: 'refreshKeys' });
        }
    }
    async _setWebviewMessageListener(webview) {
        webview.onDidReceiveMessage(async (message) => {
            try {
                switch (message.command) {
                    case 'storeKey':
                        await this._secretStorage.store(message.key, message.value);
                        await this._addToKeysList(message.key);
                        vscode.window.showInformationMessage(`API key "${message.key}" stored successfully!`);
                        webview.postMessage({ command: 'keyStored', key: message.key });
                        await this._updateStoredKeys();
                        break;
                    case 'getKey':
                        const value = await this._secretStorage.get(message.key);
                        webview.postMessage({ command: 'showKey', key: message.key, value });
                        break;
                    case 'deleteKey':
                        await this._secretStorage.delete(message.key);
                        await this._removeFromKeysList(message.key);
                        vscode.window.showInformationMessage(`API key "${message.key}" deleted successfully!`);
                        await this._updateStoredKeys();
                        break;
                    case 'refreshKeys':
                        await this._updateStoredKeys();
                        break;
                }
            }
            catch (err) {
                const error = err;
                vscode.window.showErrorMessage(`Error: ${error.message}`);
            }
        });
    }
    async _updateStoredKeys() {
        try {
            if (this._view) {
                const keys = await this._getAllKeys();
                this._view.webview.postMessage({ command: 'updateKeys', keys });
            }
        }
        catch (err) {
            const error = err;
            vscode.window.showErrorMessage(`Error updating stored keys: ${error.message}`);
        }
    }
    async _getAllKeys() {
        try {
            // Get keys from global state (synced across instances)
            const keys = this._globalState.get('api-vault-keys', []);
            return keys;
        }
        catch (err) {
            const error = err;
            vscode.window.showErrorMessage(`Error getting stored keys: ${error.message}`);
            return [];
        }
    }
    async _addToKeysList(key) {
        try {
            const keys = await this._getAllKeys();
            if (!keys.includes(key)) {
                keys.push(key);
                await this._globalState.update('api-vault-keys', keys);
            }
        }
        catch (err) {
            const error = err;
            vscode.window.showErrorMessage(`Error adding key to list: ${error.message}`);
        }
    }
    async _removeFromKeysList(key) {
        try {
            const keys = await this._getAllKeys();
            const updatedKeys = keys.filter(k => k !== key);
            await this._globalState.update('api-vault-keys', updatedKeys);
        }
        catch (err) {
            const error = err;
            vscode.window.showErrorMessage(`Error removing key from list: ${error.message}`);
        }
    }
    _getWebviewContent() {
        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API Vault</title>
            <style>
                body {
                    padding: 10px;
                    color: var(--vscode-foreground);
                    font-family: var(--vscode-font-family);
                }
                .form-group {
                    margin-bottom: 15px;
                }
                input {
                    width: 100%;
                    padding: 5px;
                    margin-top: 5px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                }
                button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 10px;
                    cursor: pointer;
                    margin-right: 5px;
                    margin-bottom: 5px;
                }
                button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .stored-keys {
                    margin-top: 20px;
                }
                .key-item {
                    margin-bottom: 10px;
                    padding: 8px;
                    background: var(--vscode-input-background);
                    border-radius: 4px;
                }
                .key-name {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .key-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                }
                .key-value {
                    font-family: monospace;
                    margin-top: 8px;
                    padding: 6px;
                    background: var(--vscode-editor-background);
                    border-radius: 4px;
                    word-break: break-all;
                    display: none;
                }
                .key-value.visible {
                    display: block;
                }
                .success-message {
                    color: var(--vscode-notificationsSuccessIcon-foreground);
                    margin: 10px 0;
                    padding: 8px;
                    display: none;
                }
                h2 {
                    font-size: 1.1em;
                    margin-top: 15px;
                    margin-bottom: 10px;
                }
                .sync-info {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                    margin-top: 10px;
                    padding: 8px;
                    background: var(--vscode-textBlockQuote-background);
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <h2>Store New API Key</h2>
            <div class="form-group">
                <label>Key Name:</label>
                <input type="text" id="keyName" placeholder="e.g., GITHUB_TOKEN" />
            </div>
            <div class="form-group">
                <label>API Key:</label>
                <input type="password" id="apiKey" placeholder="Enter your API key" />
            </div>
            <button onclick="storeKey()">Store Key</button>
            <div id="successMessage" class="success-message"></div>

            <div class="stored-keys">
                <h2>Stored API Keys</h2>
                <div class="sync-info">
                    ℹ️ Key names are synced across VS Code instances. Values remain secure in your system keychain.
                </div>
                <div id="keysList"></div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                function storeKey() {
                    const keyName = document.getElementById('keyName').value.trim();
                    const apiKey = document.getElementById('apiKey').value.trim();
                    if (keyName && apiKey) {
                        vscode.postMessage({
                            command: 'storeKey',
                            key: keyName,
                            value: apiKey
                        });
                        document.getElementById('keyName').value = '';
                        document.getElementById('apiKey').value = '';
                    }
                }

                function toggleKey(key) {
                    vscode.postMessage({
                        command: 'getKey',
                        key: key
                    });
                }

                function deleteKey(key) {
                    if (confirm('Are you sure you want to delete this API key?')) {
                        vscode.postMessage({
                            command: 'deleteKey',
                            key: key
                        });
                    }
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'updateKeys':
                            const keysList = document.getElementById('keysList');
                            keysList.innerHTML = message.keys.length === 0 ? 
                                '<p>No API keys stored yet.</p>' : '';
                            
                            message.keys.forEach(key => {
                                const keyItem = document.createElement('div');
                                keyItem.className = 'key-item';
                                keyItem.innerHTML = \`
                                    <div class="key-name">\${key}</div>
                                    <div class="key-actions">
                                        <button onclick="toggleKey('\${key}')">Show/Hide</button>
                                        <button onclick="deleteKey('\${key}')">Delete</button>
                                    </div>
                                    <div id="value-\${key}" class="key-value"></div>
                                \`;
                                keysList.appendChild(keyItem);
                            });
                            break;
                        case 'showKey':
                            const valueDiv = document.getElementById(\`value-\${message.key}\`);
                            if (valueDiv) {
                                valueDiv.textContent = message.value || 'No value found';
                                valueDiv.classList.toggle('visible');
                            }
                            break;
                        case 'keyStored':
                            const successMessage = document.getElementById('successMessage');
                            successMessage.textContent = \`API key "\${message.key}" stored successfully!\`;
                            successMessage.style.display = 'block';
                            setTimeout(() => {
                                successMessage.style.display = 'none';
                            }, 3000);
                            vscode.postMessage({ command: 'refreshKeys' });
                            break;
                    }
                });

                // Initial load of keys
                vscode.postMessage({ command: 'refreshKeys' });
            </script>
        </body>
        </html>`;
    }
}
function activate(context) {
    console.log('API Vault extension is now active!');
    const provider = new APIVaultViewProvider(context.extensionUri, context.secrets, context.globalState);
    APIVaultViewProvider.currentProvider = provider;
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('apiVaultView', provider));
    // Register the store key command
    let storeKeyCommand = vscode.commands.registerCommand('api-vault.storeKey', async (key, value) => {
        try {
            if (!key || !value) {
                key = await vscode.window.showInputBox({
                    prompt: 'Enter the key name',
                    placeHolder: 'e.g., GITHUB_TOKEN'
                });
                if (!key)
                    return;
                value = await vscode.window.showInputBox({
                    prompt: 'Enter the API key',
                    password: true,
                    placeHolder: 'Enter your API key here'
                });
                if (!value)
                    return;
            }
            // Get current keys list from global state
            const keys = context.globalState.get('api-vault-keys', []);
            if (!keys.includes(key)) {
                keys.push(key);
                await context.globalState.update('api-vault-keys', keys);
            }
            await context.secrets.store(key, value);
            vscode.window.showInformationMessage(`API key "${key}" stored successfully!`);
            // Refresh the webview if it exists
            APIVaultViewProvider.currentProvider?.refreshKeys();
        }
        catch (err) {
            const error = err;
            vscode.window.showErrorMessage(`Error storing key: ${error.message}`);
        }
    });
    // Register the get key command
    let getKeyCommand = vscode.commands.registerCommand('api-vault.getKey', async (key) => {
        try {
            if (!key) {
                const keys = context.globalState.get('api-vault-keys', []);
                if (keys.length === 0) {
                    vscode.window.showInformationMessage('No API keys stored yet.');
                    return;
                }
                key = await vscode.window.showQuickPick(keys, {
                    placeHolder: 'Select an API key to retrieve'
                });
                if (!key)
                    return;
            }
            const value = await context.secrets.get(key);
            if (!value) {
                vscode.window.showErrorMessage(`No API key found for "${key}"`);
                return undefined;
            }
            // Copy to clipboard
            await vscode.env.clipboard.writeText(value);
            vscode.window.showInformationMessage(`API key "${key}" copied to clipboard!`);
            return value;
        }
        catch (err) {
            const error = err;
            vscode.window.showErrorMessage(`Error retrieving key: ${error.message}`);
            return undefined;
        }
    });
    // Register the list keys command
    let listKeysCommand = vscode.commands.registerCommand('api-vault.listKeys', async () => {
        try {
            const keys = context.globalState.get('api-vault-keys', []);
            if (keys.length === 0) {
                vscode.window.showInformationMessage('No API keys stored yet.');
                return;
            }
            const selectedKey = await vscode.window.showQuickPick(keys, {
                placeHolder: 'Select an API key to view options'
            });
            if (selectedKey) {
                const action = await vscode.window.showQuickPick(['Copy to Clipboard', 'Delete Key'], {
                    placeHolder: `Choose action for ${selectedKey}`
                });
                if (action === 'Copy to Clipboard') {
                    await vscode.commands.executeCommand('api-vault.getKey', selectedKey);
                }
                else if (action === 'Delete Key') {
                    await context.secrets.delete(selectedKey);
                    const updatedKeys = keys.filter(k => k !== selectedKey);
                    await context.globalState.update('api-vault-keys', updatedKeys);
                    vscode.window.showInformationMessage(`API key "${selectedKey}" deleted successfully!`);
                    // Refresh the webview if it exists
                    APIVaultViewProvider.currentProvider?.refreshKeys();
                }
            }
        }
        catch (err) {
            const error = err;
            vscode.window.showErrorMessage(`Error listing keys: ${error.message}`);
        }
    });
    context.subscriptions.push(storeKeyCommand, getKeyCommand, listKeysCommand);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map