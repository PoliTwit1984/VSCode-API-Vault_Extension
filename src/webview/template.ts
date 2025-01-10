import { styles } from './styles';
import { getKeyRowHtml, getQuickActionsHtml, getKeyFormHtml, getCategoryHeaderHtml, getKeyboardShortcutsHtml } from './components';
import { createHandlers } from './handlers';
import { createMessageHandlers } from './messageHandlers';

export function getWebviewContent(): string {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Vault</title>
    <style>${styles}</style>
</head>
<body>
    <div class="container">
        <div class="section">
            ${getQuickActionsHtml()}
            ${getKeyFormHtml()}

            <div class="sync-info">
                ℹ️ Key names and categories are synced across VS Code instances. Values remain secure in your system keychain.
            </div>
            
            <div class="search-bar">
                <input type="text" id="searchInput" placeholder="Search keys..." oninput="filterKeys()" />
            </div>

            <div class="category-actions">
                <input type="text" id="newCategory" placeholder="New category name" class="category-input" />
                <button onclick="createCategory()">Add Category</button>
            </div>
            
            <div id="categorizedKeys"></div>
            
            <div id="uncategorizedKeys" class="category-section" data-category="uncategorized">
                ${getCategoryHeaderHtml('Uncategorized', true)}
                <div class="category-content expanded">
                    <table class="keys-table">
                        <tbody id="keysList">
                            <tr><td colspan="2">Loading keys...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="noKeys" style="display: none; text-align: center; padding: 20px; color: var(--vscode-descriptionForeground);">
                No API keys stored yet. Click the + button to add one.
            </div>

            ${getKeyboardShortcutsHtml()}
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const handlers = (${createHandlers.toString()})(vscode);
        const messageHandlers = (${createMessageHandlers.toString()})(vscode, handlers, ${getKeyRowHtml.toString()});

        // Initialize event listeners
        document.addEventListener('keydown', handlers.handleKeyboardShortcuts);

        // Request initial data load
        window.addEventListener('load', () => {
            console.log('[Webview] Requesting initial data load');
            vscode.postMessage({ command: 'refreshKeys' });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            console.log('[Webview] Received message:', message.command);

            // Handle initial loading state
            const keysList = document.getElementById('keysList');
            if (keysList && keysList.innerHTML.includes('Loading keys...')) {
                if (message.command !== 'updateKeys') {
                    // Keep showing loading for non-update messages
                    return;
                }
            }

            switch (message.command) {
                case 'updateKeys':
                    messageHandlers.handleUpdateKeys(message);
                    break;

                case 'showKey':
                    messageHandlers.handleShowKey(message);
                    break;

                case 'keyStored':
                    messageHandlers.handleKeyStored(message);
                    break;

                case 'deleteSuccess':
                    messageHandlers.handleDeleteSuccess();
                    break;

                case 'deleteCancelled':
                    messageHandlers.handleDeleteCancelled(message);
                    break;

                case 'deleteFailed':
                    messageHandlers.handleDeleteFailed(message);
                    break;
            }
        });

        // Expose handlers to HTML
        window.showNewKeyForm = handlers.showNewKeyForm;
        window.toggleCompactMode = handlers.toggleCompactMode;
        window.createCategory = handlers.createCategory;
        window.deleteCategory = handlers.deleteCategory;
        window.updateKeyCategory = handlers.updateKeyCategory;
        window.toggleCategory = handlers.toggleCategory;
        window.storeKey = handlers.storeKey;
        window.filterKeys = handlers.filterKeys;
        window.toggleKey = handlers.toggleKey;
        window.copyKey = handlers.copyKey;
        window.deleteKey = handlers.deleteKey;
    </script>
</body>
</html>`;

    return htmlContent;
}
