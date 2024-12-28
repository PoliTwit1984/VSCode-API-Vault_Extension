import { KeyData } from '../types';

const styles = `
    body {
        padding: 10px;
        color: var(--vscode-foreground);
        font-family: var(--vscode-font-family);
    }
    .container {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .form-group {
        margin-bottom: 10px;
    }
    input, select {
        width: 100%;
        padding: 5px;
        margin-top: 5px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        border-radius: 2px;
    }
    select.category-select {
        width: auto;
        margin: 0;
        padding: 2px 4px;
    }
    button {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 4px 8px;
        cursor: pointer;
        border-radius: 2px;
    }
    button:hover {
        background: var(--vscode-button-hoverBackground);
    }
    .search-bar {
        margin-bottom: 10px;
    }
    .keys-table {
        border-collapse: collapse;
        width: 100%;
    }
    .keys-table tr {
        border-bottom: 1px solid var(--vscode-input-border);
        cursor: move;
        user-select: none;
    }
    .keys-table tr.dragging {
        opacity: 0.5;
        background: var(--vscode-list-dropBackground);
    }
    .keys-table tr.drag-over {
        border-top: 2px solid var(--vscode-focusBorder);
    }
    .keys-table td {
        padding: 8px;
        vertical-align: middle;
    }
    .key-name {
        font-weight: 500;
    }
    .key-actions {
        display: flex;
        gap: 4px;
        justify-content: flex-end;
        align-items: center;
    }
    .icon-button {
        padding: 4px;
        background: transparent;
        border: none;
        cursor: pointer;
        opacity: 0.8;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .icon-button:hover {
        opacity: 1;
        background: var(--vscode-toolbar-hoverBackground);
    }
    .key-value {
        font-family: monospace;
        padding: 6px;
        background: var(--vscode-editor-background);
        border-radius: 2px;
        word-break: break-all;
        display: none;
        margin-top: 4px;
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
    .sync-info {
        font-size: 0.9em;
        color: var(--vscode-descriptionForeground);
        padding: 8px;
        background: var(--vscode-textBlockQuote-background);
        border-radius: 2px;
    }
    .section {
        background: var(--vscode-editor-background);
        padding: 12px;
        border-radius: 4px;
    }
    .category-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px;
        background: var(--vscode-sideBarSectionHeader-background);
        cursor: move;
        user-select: none;
        border-radius: 4px;
        margin-bottom: 4px;
    }
    .category-header.dragging {
        opacity: 0.5;
        background: var(--vscode-list-dropBackground);
    }
    .category-header.drag-over {
        border-top: 2px solid var(--vscode-focusBorder);
    }
    .category-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
    }
    .category-chevron {
        width: 16px;
        height: 16px;
        transition: transform 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .category-chevron svg {
        fill: currentColor;
        width: 16px;
        height: 16px;
    }
    .category-wrapper {
        position: relative;
    }
    .category-header:hover {
        background: var(--vscode-list-hoverBackground);
    }
    .category-content {
        display: none;
        margin-left: 16px;
    }
    .category-content.expanded {
        display: block;
    }
    .category-actions {
        margin-top: 10px;
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .category-input {
        flex: 1;
    }
    .category-drop-zone {
        height: 4px;
        margin: 2px 0;
        transition: height 0.2s;
    }
    .category-drop-zone.drag-over {
        height: 20px;
        background: var(--vscode-list-dropBackground);
        border: 2px dashed var(--vscode-focusBorder);
        border-radius: 4px;
    }
`;

const chevronIcon = `
    <svg width="16" height="16" viewBox="0 0 16 16">
        <path fill="currentColor" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"/>
    </svg>
`;

const getRowHtml = (key: KeyData, categories: any[]) => `
    <td>
        <div class="key-name">${key.name}</div>
        <div id="value-${key.name}" class="key-value"></div>
    </td>
    <td class="key-actions">
        <button class="icon-button" onclick="toggleKey('${key.name}')" title="Show/Hide">
            <svg width="16" height="16" viewBox="0 0 16 16">
                <path fill="currentColor" d="M8 2c3.9 0 7 2.5 7 6s-3.1 6-7 6-7-2.5-7-6 3.1-6 7-6zm0 1C4.7 3 2 5.1 2 8s2.7 5 6 5 6-2.1 6-5-2.7-5-6-5zm0 2c1.4 0 2.5 1.1 2.5 2.5S9.4 10 8 10s-2.5-1.1-2.5-2.5S6.6 5 8 5zm0 1C7.2 6 6.5 6.7 6.5 7.5S7.2 9 8 9s1.5-.7 1.5-1.5S8.8 6 8 6z"/>
            </svg>
        </button>
        <button class="icon-button" onclick="copyKey('${key.name}')" title="Copy">
            <svg width="16" height="16" viewBox="0 0 16 16">
                <path fill="currentColor" d="M4 4h3v1H4v8h8V9h1v4H3V4zm5-3h6v6h-1V2.5L7.5 9 7 8.5 13.5 2H9V1z"/>
            </svg>
        </button>
        <select class="category-select" onchange="updateKeyCategory('${key.name}', this.value)" title="Category">
            <option value="">No Category</option>
            ${categories.map(cat => `<option value="${cat.name}" ${cat.name === key.category ? 'selected' : ''}>${cat.name}</option>`).join('')}
        </select>
        <button class="icon-button" onclick="deleteKey('${key.name}')" title="Delete">
            <svg width="16" height="16" viewBox="0 0 16 16">
                <path fill="currentColor" d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z"/>
            </svg>
        </button>
    </td>
`;

export function getWebviewContent(): string {
    return `<!DOCTYPE html>
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
                <div class="form-group">
                    <label>Key Name:</label>
                    <input type="text" id="keyName" placeholder="e.g., GITHUB_TOKEN" />
                </div>
                <div class="form-group">
                    <label>API Key:</label>
                    <input type="password" id="apiKey" placeholder="Enter your API key" />
                </div>
                <div class="form-group">
                    <label>Category (optional):</label>
                    <select id="keyCategory">
                        <option value="">No Category</option>
                    </select>
                </div>
                <button onclick="storeKey()">Store Key</button>
                <div id="successMessage" class="success-message"></div>
            </div>

            <div class="section">
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
                    <div class="category-header">
                        <div class="category-header-left" onclick="event.stopPropagation(); toggleCategory('uncategorized')">
                            <span class="category-chevron">
                                ${chevronIcon}
                            </span>
                            <span>Uncategorized</span>
                        </div>
                    </div>
                    <div class="category-content expanded">
                        <table class="keys-table">
                            <tbody id="keysList"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const getRowHtml = ${getRowHtml.toString()};
            let draggedKey = null;
            let draggedCategory = null;
            let categories = [];

            function getCategoryOptions(selected) {
                return categories.map(cat => 
                    \`<option value="\${cat.name}" \${cat.name === selected ? 'selected' : ''}>\${cat.name}</option>\`
                ).join('');
            }

            function updateCategorySelect() {
                const select = document.getElementById('keyCategory');
                select.innerHTML = '<option value="">No Category</option>' + 
                    categories.map(cat => \`<option value="\${cat.name}">\${cat.name}</option>\`).join('');
            }

            function createCategory() {
                const input = document.getElementById('newCategory');
                const name = input.value.trim();
                if (name && !categories.some(c => c.name === name)) {
                    vscode.postMessage({
                        command: 'createCategory',
                        name: name
                    });
                    input.value = '';
                }
            }

            function deleteCategory(name) {
                vscode.postMessage({
                    command: 'deleteCategory',
                    name: name
                });
            }

            function updateKeyCategory(key, category) {
                vscode.postMessage({
                    command: 'updateKeyCategory',
                    key: key,
                    category: category || undefined
                });
            }

            function toggleCategory(name) {
                console.log('[Webview] Toggling category:', name);
                const section = document.querySelector(\`[data-category="\${name}"]\`);
                console.log('[Webview] Found section:', section?.outerHTML);
                
                if (section) {
                    const content = section.querySelector('.category-content');
                    const chevron = section.querySelector('.category-chevron');
                    console.log('[Webview] Found content:', content?.outerHTML);
                    console.log('[Webview] Found chevron:', chevron?.outerHTML);
                    
                    if (content) {
                        const wasExpanded = content.classList.contains('expanded');
                        content.classList.toggle('expanded');
                        const isExpanded = content.classList.contains('expanded');
                        console.log('[Webview] Content expanded state:', wasExpanded, '->', isExpanded);
                        
                        // Always rotate chevron based on expanded state
                        chevron.style.transform = isExpanded ? '' : 'rotate(-90deg)';
                        console.log('[Webview] Setting chevron rotation:', chevron.style.transform);
                        
                        vscode.postMessage({
                            command: 'toggleCategory',
                            name: name
                        });
                    }
                }
            }

            function storeKey() {
                const keyName = document.getElementById('keyName').value.trim();
                const apiKey = document.getElementById('apiKey').value.trim();
                const category = document.getElementById('keyCategory').value;
                if (keyName && apiKey) {
                    vscode.postMessage({
                        command: 'storeKey',
                        key: keyName,
                        value: apiKey,
                        category: category || undefined
                    });
                    document.getElementById('keyName').value = '';
                    document.getElementById('apiKey').value = '';
                    document.getElementById('keyCategory').value = '';
                }
            }

            function filterKeys() {
                const searchTerm = document.getElementById('searchInput').value.toLowerCase();
                const rows = document.querySelectorAll('.keys-table tr');
                
                rows.forEach(row => {
                    const keyName = row.querySelector('.key-name')?.textContent.toLowerCase();
                    if (keyName) {
                        row.style.display = keyName.includes(searchTerm) ? '' : 'none';
                    }
                });
            }

            function toggleKey(key) {
                vscode.postMessage({
                    command: 'getKey',
                    key: key
                });
            }

            function copyKey(key) {
                vscode.postMessage({
                    command: 'copyKey',
                    key: key
                });
            }

            function deleteKey(key) {
                vscode.postMessage({
                    command: 'confirmDelete',
                    key: key
                });
            }

            // Add drag and drop handlers for categories
            function setupCategoryDragHandlers() {
                document.querySelectorAll('.category-header').forEach(header => {
                    header.addEventListener('dragstart', e => {
                        draggedCategory = header.closest('[data-category]')?.dataset.category;
                        if (draggedCategory) {
                            header.classList.add('dragging');
                        }
                    });

                    header.addEventListener('dragend', () => {
                        draggedCategory = null;
                        header.classList.remove('dragging');
                        document.querySelectorAll('.drag-over').forEach(el => 
                            el.classList.remove('drag-over')
                        );
                    });

                    header.addEventListener('dragover', e => {
                        e.preventDefault();
                        if (draggedCategory && draggedCategory !== header.closest('[data-category]')?.dataset.category) {
                            header.classList.add('drag-over');
                        }
                    });

                    header.addEventListener('dragleave', () => {
                        header.classList.remove('drag-over');
                    });

                    header.addEventListener('drop', e => {
                        e.preventDefault();
                        const targetCategory = header.closest('[data-category]')?.dataset.category;
                        if (draggedCategory && targetCategory && draggedCategory !== targetCategory) {
                            const headers = Array.from(document.querySelectorAll('.category-header'));
                            const categories = headers.map(h => h.closest('[data-category]')?.dataset.category).filter(Boolean);
                            const fromIndex = categories.indexOf(draggedCategory);
                            const toIndex = categories.indexOf(targetCategory);
                            
                            if (fromIndex !== -1 && toIndex !== -1) {
                                categories.splice(fromIndex, 1);
                                categories.splice(toIndex, 0, draggedCategory);
                                
                                vscode.postMessage({
                                    command: 'updateCategoryOrder',
                                    categories: categories
                                });
                            }
                        }
                        header.classList.remove('drag-over');
                    });
                });
            }

            // Add drag and drop handlers for keys
            function setupKeyDragHandlers() {
                document.querySelectorAll('.keys-table tr[draggable="true"]').forEach(row => {
                    row.addEventListener('dragstart', e => {
                        draggedKey = row.dataset.key;
                        row.classList.add('dragging');
                    });
                    
                    row.addEventListener('dragend', () => {
                        draggedKey = null;
                        row.classList.remove('dragging');
                        document.querySelectorAll('.drag-over').forEach(el => 
                            el.classList.remove('drag-over')
                        );
                    });
                    
                    row.addEventListener('dragover', e => {
                        e.preventDefault();
                        if (draggedKey !== row.dataset.key) {
                            row.classList.add('drag-over');
                        }
                    });
                    
                    row.addEventListener('dragleave', () => {
                        row.classList.remove('drag-over');
                    });
                    
                    row.addEventListener('drop', e => {
                        e.preventDefault();
                        if (draggedKey !== row.dataset.key) {
                            const tbody = row.closest('tbody');
                            const category = tbody.closest('.category-content')?.previousElementSibling?.querySelector('.category-name')?.textContent;
                            
                            if (category) {
                                // Update key's category
                                vscode.postMessage({
                                    command: 'updateKeyCategory',
                                    key: draggedKey,
                                    category: category
                                });
                            }
                            
                            // Update key order within category
                            const rows = Array.from(tbody.querySelectorAll('tr[draggable="true"]'));
                            const keys = rows.map(r => r.dataset.key);
                            const fromIndex = keys.indexOf(draggedKey);
                            const toIndex = keys.indexOf(row.dataset.key);
                            
                            if (fromIndex !== -1 && toIndex !== -1) {
                                keys.splice(fromIndex, 1);
                                keys.splice(toIndex, 0, draggedKey);
                                
                                vscode.postMessage({
                                    command: 'updateOrder',
                                    keys: keys
                                });
                            }
                        }
                        row.classList.remove('drag-over');
                    });
                });
            }

            window.addEventListener('message', event => {
                const message = event.data;
                console.log('[Webview] Received message:', message.command);
                
                switch (message.command) {
                    case 'updateKeys':
                        console.log('[Webview] Updating keys list with:', message.keys);
                        categories = message.categories || [];
                        updateCategorySelect();
                        
                        // Group keys by category
                        const categorizedKeys = {};
                        const uncategorizedKeys = [];
                        
                        message.keys.forEach(key => {
                            if (key.category) {
                                if (!categorizedKeys[key.category]) {
                                    categorizedKeys[key.category] = [];
                                }
                                categorizedKeys[key.category].push(key);
                            } else {
                                uncategorizedKeys.push(key);
                            }
                        });
                        
                        // Update categorized sections
                        const categorizedContainer = document.getElementById('categorizedKeys');
                        categorizedContainer.innerHTML = '';
                        
                        categories.forEach(category => {
                            const keys = categorizedKeys[category.name] || [];
                            const section = document.createElement('div');
                            section.className = 'category-section';
                            section.dataset.category = category.name;
                            section.innerHTML = \`
                                <div class="category-header" draggable="true">
                                    <div class="category-header-left" onclick="event.stopPropagation(); toggleCategory('\${category.name}')">
                                        <span class="category-chevron">
                                            ${chevronIcon}
                                        </span>
                                        <span class="category-name">\${category.name}</span>
                                    </div>
                                    <button class="icon-button" onclick="event.stopPropagation(); deleteCategory('\${category.name}')" title="Delete Category">
                                        <svg width="16" height="16" viewBox="0 0 16 16">
                                            <path fill="currentColor" d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z"/>
                                        </svg>
                                    </button>
                                </div>
                                <div class="category-content \${category.expanded ? 'expanded' : ''}">
                                    <table class="keys-table">
                                        <tbody>
                                            \${keys.map(key => \`
                                                <tr draggable="true" data-key="\${key.name}">
                                                    \${getRowHtml(key, categories)}
                                                </tr>
                                            \`).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            \`;
                            categorizedContainer.appendChild(section);
                        });
                        
                        // Update uncategorized section
                        const keysList = document.getElementById('keysList');
                        keysList.innerHTML = uncategorizedKeys.length === 0 ? 
                            '<tr><td colspan="2">No uncategorized keys.</td></tr>' : 
                            uncategorizedKeys.map(key => \`
                                <tr draggable="true" data-key="\${key.name}">
                                    \${getRowHtml(key, categories)}
                                </tr>
                            \`).join('');
                        
                        // Setup drag and drop handlers
                        setupCategoryDragHandlers();
                        setupKeyDragHandlers();
                        
                        // Update chevron rotations
                        document.querySelectorAll('.category-content').forEach(content => {
                            const isExpanded = content.classList.contains('expanded');
                            const chevron = content.previousElementSibling?.querySelector('.category-chevron');
                            if (chevron) {
                                chevron.style.transform = isExpanded ? '' : 'rotate(-90deg)';
                            }
                        });
                        
                        console.log('[Webview] Keys list updated');
                        break;
                    case 'showKey':
                        const valueDiv = document.getElementById('value-' + message.key);
                        if (valueDiv) {
                            valueDiv.textContent = message.value || 'No value found';
                            valueDiv.classList.toggle('visible');
                        }
                        break;
                    case 'keyStored':
                        const successMessage = document.getElementById('successMessage');
                        successMessage.textContent = 'API key "' + message.key + '" stored successfully!';
                        successMessage.style.display = 'block';
                        setTimeout(() => {
                            successMessage.style.display = 'none';
                        }, 3000);
                        vscode.postMessage({ command: 'refreshKeys' });
                        break;
                    case 'deleteSuccess':
                        console.log('[Webview] Delete successful, requesting refresh');
                        vscode.postMessage({ command: 'refreshKeys' });
                        break;
                    case 'deleteCancelled':
                        console.log('[Webview] Delete cancelled for key:', message.key);
                        break;
                    case 'deleteFailed':
                        console.log('[Webview] Delete failed for key:', message.key);
                        break;
                }
            });

            console.log('[Webview] Requesting initial keys');
            vscode.postMessage({ command: 'refreshKeys' });
        </script>
    </body>
    </html>`;
}
