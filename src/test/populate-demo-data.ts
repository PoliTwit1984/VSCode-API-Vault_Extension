import * as vscode from 'vscode';
import { VSCodeStorageManager } from '../storage';

export async function populateDemoData(context: vscode.ExtensionContext) {
    const storage = await VSCodeStorageManager.create(context.secrets, context.globalState);

    // Create categories
    const categories = [
        'Cloud Services',
        'Payment APIs',
        'Social Media',
        'AI & ML',
        'Development Tools'
    ];

    for (const category of categories) {
        await storage.createCategory(category);
    }

    // Sample API keys with realistic-looking formats
    const demoKeys = [
        // Cloud Services
        { name: 'AWS_ACCESS_KEY', value: 'AKIA4XAMPLEKEY123456', category: 'Cloud Services' },
        { name: 'AWS_SECRET_KEY', value: 'kX6yP9zF2vB8nM4qR7wT1cL5aJ3hN9dK', category: 'Cloud Services' },
        { name: 'AZURE_API_KEY', value: 'c8a9b4f2-e6d5-4b3a-9c7f-1d2e3a4b5c6d', category: 'Cloud Services' },
        
        // Payment APIs
        { name: 'STRIPE_SECRET_KEY', value: 'sk_test_51ABC123XYZ456789', category: 'Payment APIs' },
        { name: 'STRIPE_PUBLISHABLE_KEY', value: 'pk_test_98XYZ765ABC432109', category: 'Payment APIs' },
        { name: 'PAYPAL_CLIENT_ID', value: 'AaBbCcDdEeFfGgHh12345678', category: 'Payment APIs' },
        
        // Social Media
        { name: 'TWITTER_API_KEY', value: 'NPz8K4xY2mR7vL9qB5tJ3wQ6', category: 'Social Media' },
        { name: 'TWITTER_API_SECRET', value: 'hG9kM2pX4nZ7vF5tL8wQ1yB3cR6mK9jN', category: 'Social Media' },
        { name: 'FACEBOOK_APP_SECRET', value: 'fb_app_234567890abcdef123456789', category: 'Social Media' },
        
        // AI & ML
        { name: 'OPENAI_API_KEY', value: 'sk-Aa1Bb2Cc3Dd4Ee5Ff6Gg7Hh8Ii9', category: 'AI & ML' },
        { name: 'HUGGINGFACE_API_KEY', value: 'hf_abcdefghijklmnopqrstuvwxyz', category: 'AI & ML' },
        { name: 'COHERE_API_KEY', value: 'co-xxxxxxxxxxxxxxxxxxxxxxxxxxxx', category: 'AI & ML' },
        
        // Development Tools
        { name: 'GITHUB_ACCESS_TOKEN', value: 'ghp_123456789abcdefghijklmno', category: 'Development Tools' },
        { name: 'GITLAB_ACCESS_TOKEN', value: 'glpat-XXXXXXXXXXXXXXXXXXXX', category: 'Development Tools' },
        { name: 'NPM_ACCESS_TOKEN', value: 'npm_XXXXXXXXXXXXXXXXXXXXXXXXXXXXX', category: 'Development Tools' }
    ];

    // Store all demo keys
    for (const key of demoKeys) {
        await storage.storeKey(key.name, key.value, key.category);
    }

    // Set category order and expanded state
    await storage.updateCategoryOrder(categories);
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('api-vault.populateDemoData', () => {
        populateDemoData(context).then(() => {
            vscode.window.showInformationMessage('Demo data populated successfully!');
        }).catch(err => {
            vscode.window.showErrorMessage(`Failed to populate demo data: ${err.message}`);
        });
    });

    context.subscriptions.push(disposable);
}
