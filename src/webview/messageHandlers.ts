import { KeyData } from '../types';
import { logger } from '../utils/logger';
import { getCategoryHeaderHtml } from './components';

export function createMessageHandlers(vscode: any, handlers: any, getRowHtml: any) {
    return {
        handleUpdateKeys(message: any) {
            logger.webview(`Updating keys list with: ${JSON.stringify(message.keys)}`);
            
            // Update view state first
            if (message.viewState) {
                handlers.updateViewState(message.viewState);
            }
            
            // Then update categories and keys
            handlers.setCategories(message.categories || []);
            handlers.updateCategorySelect();
            
            // Clear loading message immediately
            const keysList = document.getElementById('keysList');
            if (keysList && keysList.innerHTML.includes('Loading keys...')) {
                keysList.innerHTML = '';
            }

            // Group keys by category
            const categorizedKeys: { [key: string]: KeyData[] } = {};
            const uncategorizedKeys: KeyData[] = [];
            
            logger.webview(`Processing ${message.keys.length} keys`);
            message.keys.forEach((key: KeyData) => {
                if (key.category) {
                    if (!categorizedKeys[key.category]) {
                        categorizedKeys[key.category] = [];
                    }
                    categorizedKeys[key.category].push(key);
                } else {
                    uncategorizedKeys.push(key);
                }
            });
            logger.webview(`Processed ${Object.keys(categorizedKeys).length} categories and ${uncategorizedKeys.length} uncategorized keys`);
            
            // Update categorized sections
            const categorizedContainer = document.getElementById('categorizedKeys');
            if (categorizedContainer) {
                // Clear existing content
                categorizedContainer.innerHTML = '';
                logger.webview('Cleared categorized container');
                
                // Process each category
                message.categories.forEach((category: any) => {
                    logger.webview(`Processing category: ${category.name}`);
                    const keys = categorizedKeys[category.name] || [];
                    const section = document.createElement('div');
                    section.className = 'category-section';
                    section.dataset.category = category.name;
                    // Always expand categories by default
                    const expanded = true;
                    section.innerHTML = `
                        ${getCategoryHeaderHtml(category.name, expanded)}
                        <div class="category-content expanded">
                            <table class="keys-table">
                                <tbody>
                                    ${keys.map(key => `
                                        <tr draggable="true" data-key="${key.name}">
                                            ${getRowHtml(key, message.categories)}
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                    categorizedContainer.appendChild(section);
                });
            }
            
            // Update visibility of sections based on key count
            const noKeysElement = document.getElementById('noKeys');
            const uncategorizedSection = document.getElementById('uncategorizedKeys');
            const categorizedSection = document.getElementById('categorizedKeys');
            
            const totalKeys = message.keys.length;
            logger.webview(`Total keys: ${totalKeys}`);
            
            // Update section visibility
            if (noKeysElement && uncategorizedSection && categorizedSection) {
                if (totalKeys === 0) {
                    logger.webview('No keys found, showing empty state');
                    noKeysElement.style.display = 'block';
                    uncategorizedSection.style.display = 'none';
                    categorizedSection.style.display = 'none';
                } else {
                    logger.webview('Keys found, showing content');
                    noKeysElement.style.display = 'none';
                    uncategorizedSection.style.display = 'block';
                    categorizedSection.style.display = 'block';
                    
                    // Update uncategorized section
                    if (keysList) {
                        const uncategorizedContent = uncategorizedKeys.length === 0 ? 
                            '<tr><td colspan="2">No uncategorized keys.</td></tr>' : 
                            uncategorizedKeys.map(key => `
                                <tr draggable="true" data-key="${key.name}">
                                    ${getRowHtml(key, message.categories)}
                                </tr>
                            `).join('');
                        
                        // Only update if content has changed
                        if (keysList.innerHTML !== uncategorizedContent) {
                            keysList.innerHTML = uncategorizedContent;
                        }
                    }
                }
            }
            
            // Force a reflow to ensure visibility changes take effect
            if (categorizedSection) {
                categorizedSection.style.display = 'none';
                categorizedSection.offsetHeight; // Force reflow
                categorizedSection.style.display = totalKeys === 0 ? 'none' : 'block';
            }
            
            // Setup drag and drop handlers
            handlers.setupCategoryDragHandlers();
            handlers.setupKeyDragHandlers();
            
            // Update chevron rotations
            document.querySelectorAll('.category-content').forEach(content => {
                const isExpanded = content.classList.contains('expanded');
                const chevron = content.previousElementSibling?.querySelector('.category-chevron');
                if (chevron) {
                    (chevron as HTMLElement).style.transform = isExpanded ? '' : 'rotate(-90deg)';
                }
            });
            
            logger.webview('Keys list updated');
        },

        handleShowKey(message: any) {
            const valueDiv = document.getElementById('value-' + message.key);
            if (valueDiv) {
                valueDiv.textContent = message.value || 'No value found';
                valueDiv.classList.toggle('visible');
            }
        },

        handleKeyStored(message: any) {
            const successMessage = document.getElementById('successMessage');
            if (successMessage) {
                successMessage.textContent = 'API key "' + message.key + '" stored successfully!';
                successMessage.style.display = 'block';
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 3000);
            }
            vscode.postMessage({ command: 'refreshKeys' });
        },

        handleDeleteSuccess() {
            logger.webview('Delete successful, requesting refresh');
            vscode.postMessage({ command: 'refreshKeys' });
        },

        handleDeleteCancelled(message: any) {
            logger.webview(`Delete cancelled for key: ${message.key}`);
        },

        handleDeleteFailed(message: any) {
            logger.webview(`Delete failed for key: ${message.key}`);
        }
    };
}
