import { KeyData } from '../types';
import { chevronIcon, addIcon, compactIcon, categoryIcon, searchIcon, showHideIcon, copyIcon, deleteIcon } from './icons';

export function getKeyRowHtml(key: KeyData, categories: any[]) {
    return `
    <td>
        <div class="key-name" ondblclick="startEditing('${key.name}')" oncontextmenu="showContextMenu(event, '${key.name}')">${key.name}</div>
        <div id="value-${key.name}" class="key-value"></div>
    </td>
    <td class="key-actions">
        <button class="icon-button" onclick="toggleKey('${key.name}')" title="Show/Hide">
            ${showHideIcon}
        </button>
        <button class="icon-button" onclick="copyKey('${key.name}')" title="Copy">
            ${copyIcon}
        </button>
        <select class="category-select" onchange="updateKeyCategory('${key.name}', this.value)" title="Category">
            <option value="">No Category</option>
            ${categories.map(cat => `<option value="${cat.name}" ${cat.name === key.category ? 'selected' : ''}>${cat.name}</option>`).join('')}
        </select>
        <button class="icon-button" onclick="deleteKey('${key.name}')" title="Delete">
            ${deleteIcon}
        </button>
    </td>
`;
}

export function getQuickActionsHtml() {
    return `
    <div class="quick-actions">
        <button class="action-button" onclick="showNewKeyForm()" title="Add New Key">
            ${addIcon}
        </button>
        <button class="action-button" onclick="toggleCompactMode()" title="Toggle Compact Mode (⌘/Ctrl+Shift+C)">
            ${compactIcon}
        </button>
        <button class="action-button" onclick="createCategory()" title="New Category (⌘/Ctrl+Shift+N)">
            ${categoryIcon}
        </button>
        <button class="action-button" onclick="document.getElementById('searchInput').focus()" title="Search (⌘/Ctrl+F)">
            ${searchIcon}
        </button>
    </div>
`;
}

export function getKeyFormHtml() {
    return `
    <div class="key-form" id="keyForm">
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
`;
}

export function getCategoryHeaderHtml(name: string, expanded: boolean) {
    return `
    <div class="category-header" draggable="true">
        <div class="category-header-left" onclick="event.stopPropagation(); toggleCategory('${name}')">
            <span class="category-chevron" style="transform: ${expanded ? '' : 'rotate(-90deg)'}">
                ${chevronIcon}
            </span>
            <span class="category-name">${name}</span>
        </div>
        <button class="icon-button" onclick="event.stopPropagation(); deleteCategory('${name}')" title="Delete Category">
            ${deleteIcon}
        </button>
    </div>
`;
}

export function getKeyboardShortcutsHtml() {
    return `
    <div class="keyboard-shortcuts">
        <div class="shortcut-item">
            <kbd>⌘/Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd>
            <span>Toggle Compact Mode</span>
        </div>
        <div class="shortcut-item">
            <kbd>⌘/Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd>
            <span>New Category</span>
        </div>
        <div class="shortcut-item">
            <kbd>⌘/Ctrl</kbd> + <kbd>F</kbd>
            <span>Search Keys</span>
        </div>
    </div>
`;
}
