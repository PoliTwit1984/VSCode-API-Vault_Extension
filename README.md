# API Vault (v5.4.0) 🔐

> ⚠️ **IMPORTANT SECURITY NOTICE**
> 
> The current version of API Vault uses an MCP server to retrieve API keys from VS Code's secure storage, which means the Language Model (LLM) has access to your API keys when you request them. While the keys are stored securely, please be aware of the following:
> 
> - The LLM can see any API key you request through the natural language interface
> - Exercise caution when sharing API keys with any AI system, including this one
> - Consider using test/development API keys rather than production keys
> - Future versions will store keys in system environment variables for enhanced security
> - Always follow your organization's security policies regarding API key handling
> 
> We recommend carefully evaluating your security requirements before using this feature with sensitive API keys.

Say goodbye to insecure API key storage! API Vault is your fortress for API keys, providing military-grade security with an intuitive interface. This VS Code extension offers secure key management, natural language retrieval, and seamless external access capabilities.

![API Vault Interface](api-vault-ui.png)

## Why API Vault? 🚀

Never worry about exposing your API keys again! API Vault provides bank-level security for your sensitive credentials while making them easily accessible when you need them. With natural language queries and MCP integration, managing your API keys has never been more secure or convenient!

## Core Features

- 🔒 **Fort Knox-Level Security**: Your keys are encrypted and stored in the system keychain
- 🤖 **Natural Language Magic**: Simply ask for your keys in plain English
- 🔑 **Secure External Access**: Token-based authentication for safe external retrieval
- 📁 **Smart Organization**: Intuitive category-based key management
- 🔄 **Persistent & Reliable**: Your keys stay secure across VS Code restarts
- 🔌 **Seamless Integration**: Enhanced MCP integration with automatic token sync
- 🎯 **Intelligent Matching**: Smart key retrieval with confidence scoring
- ⚡ **Lightning Fast**: High-performance operations with node-fetch
- 🛡️ **Battle-tested Security**: Robust error handling and retry logic

## Security Features

### 1. Key Storage Security
- 🔐 System keychain integration for unbreakable security
- 🔒 Military-grade encryption for sensitive data
- 🛡️ Complete isolation from extension storage
- 🚫 Zero plaintext storage - your keys are always encrypted

### 2. Authentication & Authorization
- 🎫 Secure token-based authentication
- ⏰ Automatic token refresh every 30 minutes
- 🔄 Seamless token synchronization
- 🚪 Strict access control with bearer tokens

### 3. Network Security
- 🌐 Bulletproof CORS protection
- 🔐 Bank-grade HTTPS encryption
- 🛡️ Advanced request validation
- 🚫 Intelligent rate limiting

### 4. Error Handling & Recovery
- 🔄 Smart exponential backoff
- 🛡️ Robust connection management
- 🚨 Comprehensive error monitoring
- 🔄 Intelligent retry system

### 5. Data Protection
- 🔒 Advanced input sanitization
- 🛡️ Zero-tolerance for injection attacks
- 🚫 Secure logging practices
- 🔐 Privacy-focused error reporting

### 6. MCP Security
- 🔑 Automated server management
- 🔒 Advanced token validation
- 🛡️ Optimized connection pooling
- 🚫 Encrypted token transmission

## Getting Started

1. Install the extension
2. Use the command palette (`Cmd/Ctrl + Shift + P`) to:
   - Add API keys: `API Vault: Add Key`
   - List keys: `API Vault: List Keys`
   - Enable external access: `API Vault: Enable External Access`
   - Generate access token: `API Vault: Generate Access Token`

## External Access

Access your keys securely from anywhere:

1. Enable external access using the command palette
2. Generate an access token
3. Use the token to authenticate requests to `http://localhost:8000`

Example using curl:
```bash
# List all keys
curl -X POST http://localhost:8000/list \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requestId": "1"}'

# Get a specific key using natural language
curl -X POST http://localhost:8000/key \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "2",
    "query": "I need the OpenRouter API key"
  }'
```

## MCP Integration

API Vault provides two powerful MCP tools:

1. `get_api_key`: Natural language key retrieval
   ```typescript
   {
     "query": "Get the OpenRouter API key"  // Returns the key with confidence score
   }
   ```

2. `list_keys`: Smart key listing with category filtering
   ```typescript
   {
     "query": "Show LLM keys"  // Optional category filter
   }
   ```

Features:
- Intelligent natural language processing
- Smart category organization
- Secure token-based authentication
- Automatic token synchronization
- Robust error handling
- High-performance operations
- Universal compatibility (IPv4/IPv6)

The MCP server automatically manages:
- Secure external access
- Token lifecycle
- Encrypted storage
- Natural language processing

See `mcp.md` for detailed MCP documentation.

## Project Structure

```
api-vault/
├── src/                    # Extension source code
│   ├── commands.ts        # VS Code commands
│   ├── extension.ts       # Extension entry point
│   ├── external-server.ts # External access server
│   ├── storage.ts         # Key storage management
│   ├── types.ts          # TypeScript types
│   └── key-manager.ts    # MCP key management
├── test/                  # Test files
│   └── suite/            # Test suites
│       ├── extension.test.ts    # Extension tests
│       ├── external-access.test.ts # External access tests
│       └── testUtils.ts  # Test utilities
└── docs/                  # Documentation
```

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Build: `npm run compile`
4. Run tests: `npm test`

See `project_plan.md` for current status and roadmap.

## Known Issues

See `errors_next_steps.md` for current issues and planned fixes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT
