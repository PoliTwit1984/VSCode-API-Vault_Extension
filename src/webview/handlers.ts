import { KeyData } from '../types';
import { logger } from '../utils/logger';

export function createHandlers(vscode: any) {
    let viewState = {
        mode: 'list',
        compact: false
    };
    let categories: any[] = [];
    let draggedKey: string | null = null;
    let draggedCategory: string | null = null;

    function updateViewState(newState: any) {
        logger.webview(`Updating view state with: ${JSON.stringify(newState)}`);
        logger.webview(`Current view state: ${JSON.stringify(viewState)}`);
        
        viewState = { ...viewState, ...newState };
        logger.webview(`New view state: ${JSON.stringify(viewState)}`);
        
        requestAnimationFrame(() => {
            const container = document.querySelector('.container');
            logger.webview(`Found container: ${container?.outerHTML || 'null'}`);
            
            if (container) {
                container.classList.remove('grid-view', 'list-view', 'compact-mode');
                container.classList.add(viewState.mode === 'grid' ? 'grid-view' : 'list-view');
                if (viewState.compact) {
                    container.classList.add('compact-mode');
                }
                logger.webview(`Updated container classes: ${container.className}`);
            }
        });
    }

    function showNewKeyForm() {
        const form = document.getElementById('keyForm');
        if (form) {
            // Always show the form when clicking the plus button
            form.classList.add('visible');
            document.getElementById('keyName')?.focus();
        }
    }

    function toggleCompactMode() {
        logger.webview('Toggle compact mode clicked');
        vscode.postMessage({
            command: 'api-vault.toggleCompactMode'
        });
    }

    function getCategoryOptions(selected: string) {
        return categories.map(cat => 
            `<option value="${cat.name}" ${cat.name === selected ? 'selected' : ''}>${cat.name}</option>`
        ).join('');
    }

    function updateCategorySelect() {
        const select = document.getElementById('keyCategory');
        if (select) {
            select.innerHTML = '<option value="">No Category</option>' + 
                categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
        }
    }

    function createCategory() {
        const input = document.getElementById('newCategory') as HTMLInputElement;
        const name = input.value.trim();
        if (name && !categories.some(c => c.name === name)) {
            vscode.postMessage({
                command: 'createCategory',
                name: name
            });
            input.value = '';
        }
    }

    function deleteCategory(name: string) {
        vscode.postMessage({
            command: 'deleteCategory',
            name: name
        });
    }

    function updateKeyCategory(key: string, category?: string) {
        vscode.postMessage({
            command: 'updateKeyCategory',
            key: key,
            category: category || undefined
        });
    }

    function toggleCategory(name: string) {
        logger.webview(`Toggling category: ${name}`);
        const section = document.querySelector(`[data-category="${name}"]`);
        logger.webview(`Found section: ${section?.outerHTML || 'null'}`);
        
        if (section) {
            const content = section.querySelector('.category-content');
            const chevron = section.querySelector('.category-chevron') as HTMLElement;
            logger.webview(`Found content: ${content?.outerHTML || 'null'}`);
            logger.webview(`Found chevron: ${chevron?.outerHTML || 'null'}`);
            
            if (content) {
                // Always expand the category when first loaded
                if (!content.classList.contains('expanded')) {
                    content.classList.add('expanded');
                    if (chevron) {
                        chevron.style.transform = '';
                    }
                } else {
                    content.classList.remove('expanded');
                    if (chevron) {
                        chevron.style.transform = 'rotate(-90deg)';
                    }
                }
                
                const isExpanded = content.classList.contains('expanded');
                logger.webview(`Content expanded state: ${isExpanded}`);
                
                vscode.postMessage({
                    command: 'toggleCategory',
                    name: name
                });
            }
        }
    }

    function storeKey() {
        const keyName = (document.getElementById('keyName') as HTMLInputElement).value.trim();
        const apiKey = (document.getElementById('apiKey') as HTMLInputElement).value.trim();
        const category = (document.getElementById('keyCategory') as HTMLSelectElement).value;
        
        if (keyName && apiKey) {
            vscode.postMessage({
                command: 'storeKey',
                key: keyName,
                value: apiKey,
                category: category || undefined
            });
            
            (document.getElementById('keyName') as HTMLInputElement).value = '';
            (document.getElementById('apiKey') as HTMLInputElement).value = '';
            (document.getElementById('keyCategory') as HTMLSelectElement).value = '';
            document.getElementById('keyForm')?.classList.remove('visible');
        }
    }

    function filterKeys() {
        const searchTerm = (document.getElementById('searchInput') as HTMLInputElement).value.toLowerCase();
        const rows = document.querySelectorAll('.keys-table tr');
        
        rows.forEach(row => {
            const keyName = row.querySelector('.key-name')?.textContent?.toLowerCase();
            if (keyName) {
                (row as HTMLElement).style.display = keyName.includes(searchTerm) ? '' : 'none';
            }
        });
    }

    function toggleKey(key: string) {
        vscode.postMessage({
            command: 'getKey',
            key: key
        });
    }

    function copyKey(key: string) {
        vscode.postMessage({
            command: 'copyKey',
            key: key
        });
    }

    function deleteKey(key: string) {
        vscode.postMessage({
            command: 'confirmDelete',
            key: key
        });
    }

    function setupCategoryDragHandlers() {
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('dragstart', e => {
                const categoryElement = header.closest('[data-category]') as HTMLElement;
                draggedCategory = categoryElement?.dataset.category || null;
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
                const categoryElement = header.closest('[data-category]') as HTMLElement;
                if (draggedCategory && draggedCategory !== categoryElement?.dataset.category) {
                    header.classList.add('drag-over');
                }
            });

            header.addEventListener('dragleave', () => {
                header.classList.remove('drag-over');
            });

            header.addEventListener('drop', e => {
                e.preventDefault();
                const categoryElement = header.closest('[data-category]') as HTMLElement;
                const targetCategory = categoryElement?.dataset.category;
                if (draggedCategory && targetCategory && draggedCategory !== targetCategory) {
                    const headers = Array.from(document.querySelectorAll('.category-header'));
                    const categories = headers.map(h => {
                        const categoryEl = h.closest('[data-category]') as HTMLElement;
                        return categoryEl?.dataset.category;
                    }).filter(Boolean) as string[];
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

    function setupKeyDragHandlers() {
        document.querySelectorAll('.keys-table tr[draggable="true"]').forEach(row => {
            row.addEventListener('dragstart', e => {
                draggedKey = (row as HTMLElement).dataset.key || null;
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
                if (draggedKey !== (row as HTMLElement).dataset.key) {
                    row.classList.add('drag-over');
                }
            });
            
            row.addEventListener('dragleave', () => {
                row.classList.remove('drag-over');
            });
            
            row.addEventListener('drop', e => {
                e.preventDefault();
                if (draggedKey !== (row as HTMLElement).dataset.key) {
                    const tbody = row.closest('tbody');
                    const category = tbody?.closest('.category-content')?.previousElementSibling?.querySelector('.category-name')?.textContent || undefined;
                    
                    if (category) {
                        vscode.postMessage({
                            command: 'updateKeyCategory',
                            key: draggedKey,
                            category: category
                        });
                    }
                    
                    if (tbody) {
                        const rows = Array.from(tbody.querySelectorAll('tr[draggable="true"]'));
                        const keys = rows.map(r => (r as HTMLElement).dataset.key).filter(Boolean);
                        const fromIndex = keys.indexOf(draggedKey as string);
                        const toIndex = keys.indexOf((row as HTMLElement).dataset.key as string);
                        
                        if (fromIndex !== -1 && toIndex !== -1) {
                            keys.splice(fromIndex, 1);
                            keys.splice(toIndex, 0, draggedKey as string);
                            
                            vscode.postMessage({
                                command: 'updateOrder',
                                keys: keys
                            });
                        }
                    }
                }
                row.classList.remove('drag-over');
            });
        });
    }

    function handleKeyboardShortcuts(event: KeyboardEvent) {
        logger.webview(`Keydown event: ${event.key} ${event.code}`);
        
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
            return;
        }

        if (event.metaKey || event.ctrlKey) {
            if (event.shiftKey && event.code === 'KeyC') {
                logger.webview('Keyboard shortcut: Toggle Compact Mode');
                event.preventDefault();
                toggleCompactMode();
            }
            else if (event.shiftKey && event.code === 'KeyN') {
                logger.webview('Keyboard shortcut: Create Category');
                event.preventDefault();
                document.getElementById('newCategory')?.focus();
            }
            else if (event.code === 'KeyF') {
                logger.webview('Keyboard shortcut: Focus Search');
                event.preventDefault();
                document.getElementById('searchInput')?.focus();
            }
        }
    }

    return {
        updateViewState,
        showNewKeyForm,
        toggleCompactMode,
        getCategoryOptions,
        updateCategorySelect,
        createCategory,
        deleteCategory,
        updateKeyCategory,
        toggleCategory,
        storeKey,
        filterKeys,
        toggleKey,
        copyKey,
        deleteKey,
        setupCategoryDragHandlers,
        setupKeyDragHandlers,
        handleKeyboardShortcuts,
        setCategories: (newCategories: any[]) => {
            categories = newCategories;
        }
    };
}
