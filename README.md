# API Vault for VS Code

A secure and convenient VS Code extension for managing your API keys directly from the Activity Bar, now with sync support across VS Code instances!

## Features

- 🔄 Sync API key names across VS Code instances
- 🔒 Securely store API keys using VS Code's built-in SecretStorage
- 🎯 Quick access from the Activity Bar
- 👀 Easy-to-use interface for managing all your API keys
- 🔑 Show/Hide functionality for viewing key values
- 🗑️ One-click deletion of stored keys

## Installation

1. Install the extension from the VS Code Marketplace
2. Look for the API icon in the Activity Bar (left sidebar)
3. Click it to open the API Vault panel

## Syncing Support

API Vault 2.0 introduces syncing capabilities:
- API key names are synced across all your VS Code instances
- Key values remain secure in your local system keychain
- Enable VS Code Settings Sync to automatically sync key names
- Access your keys from any device while maintaining security

## Usage

### Opening API Vault
- Click the API icon in the Activity Bar (left sidebar)
- The API Vault panel will open, showing all your stored keys

### Storing a New API Key
1. In the API Vault panel, find the "Store New API Key" section at the top
2. Enter the key name (e.g., "GITHUB_TOKEN")
3. Enter the API key value
4. Click "Store Key"
5. The key name will sync across your VS Code instances

### Viewing Stored Keys
- All your stored keys are automatically listed in the panel
- Click "Show/Hide" next to any key to view its value
- Click again to hide the value
- Key names are synced, but values are stored securely in your local system keychain

### Deleting Keys
- Click "Delete" next to any key you want to remove
- Confirm the deletion when prompted
- The deletion will sync across your VS Code instances

## Security

API Vault uses a hybrid approach for maximum security and convenience:

### Key Names (Synced)
- Stored using VS Code's globalState
- Synced across instances via Settings Sync
- No sensitive information included

### Key Values (Secure)
- Stored using VS Code's SecretStorage API:
  - On macOS: System Keychain
  - On Windows: Windows Credential Manager
  - On Linux: System's secret service (libsecret)
- Never synced between instances
- Encrypted at rest
- Only accessible within VS Code

## Commands

While the main interface is accessible from the Activity Bar, you can also use these commands from the Command Palette (Cmd+Shift+P / Ctrl+Shift+P):

- `API Vault: Store New API Key` - Store a new API key
- `API Vault: List API Keys` - Open the API Vault panel
- `API Vault: Get API Key` - Retrieve a specific key

## Requirements

- VS Code version 1.85.0 or higher
- Settings Sync enabled (optional, for syncing key names)

## Extension Settings

This extension contributes no additional settings.

## Known Issues

None at this time.

## Release Notes

### 2.0.0

Major update with syncing support:
- Added sync capability for API key names
- Improved security with hybrid storage approach
- Enhanced UI with sync status indicators
- Updated documentation for sync features

### 1.0.0

Initial release of API Vault:
- Activity Bar integration
- Secure key storage
- Webview interface
- Show/Hide functionality
- One-click deletion
- System keychain integration

## Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/PoliTwit1984/VSCode-API-Vault_Extension).

## License

This extension is licensed under the [MIT License](LICENSE).
