# API Vault (v5.4.0)

A VS Code extension for secure API key management with external access capabilities and MCP integration. Provides natural language API key retrieval through the MCP tab in VS Code.

## Features

- 🔒 Secure key storage using system keychain
- 🔑 External access server with token-based authentication
- 🤖 Natural language key queries with fuzzy matching
- 📁 Category-based key organization
- 🔄 State persistence across VS Code restarts
- 🔌 Enhanced MCP integration with automatic token synchronization
- 🔐 Improved token management and validation
- 🔍 Intelligent key matching with confidence scores
- 🚀 High-performance HTTP requests with node-fetch
- 🛡️ Robust error handling and retry logic

## Security Features

### 1. Key Storage Security
- 🔐 System keychain integration for secure key storage
- 🔒 Encrypted storage of sensitive data
- 🛡️ Isolation from extension storage
- 🚫 No plaintext key storage

### 2. Authentication & Authorization
- 🎫 Token-based authentication for external access
- ⏰ Automatic token refresh (30-minute intervals)
- 🔄 Token synchronization with MCP settings
- 🚪 Access control with bearer tokens

### 3. Network Security
- 🌐 CORS protection for external server
- 🔐 HTTPS support for secure communication
- 🛡️ Request validation and sanitization
- 🚫 Rate limiting and request throttling

### 4. Error Handling & Recovery
- 🔄 Exponential backoff for failed requests
- 🛡️ Connection state management
- 🚨 Error monitoring and reporting
- 🔄 Automatic retry with configurable limits

### 5. Data Protection
- 🔒 Input validation and sanitization
- 🛡️ Protection against injection attacks
- 🚫 No sensitive data in logs
- 🔐 Secure error messages

### 6. MCP Security
- 🔑 Automatic external server management
- 🔒 Token validation with retry mechanism
- 🛡️ Connection pooling and state management
- 🚫 Secure token transmission

## Getting Started

1. Install the extension
2. Use the command palette (`Cmd/Ctrl + Shift + P`) to:
   - Add API keys: `API Vault: Add Key`
   - List keys: `API Vault: List Keys`
   - Enable external access: `API Vault: Enable External Access`
   - Generate access token: `API Vault: Generate Access Token`

## External Access

The extension provides an HTTP server for external access to your API keys:

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

API Vault provides two MCP tools for API key management:

1. `get_api_key`: Retrieve API keys using natural language
   ```typescript
   {
     "query": "Get the OpenRouter API key"  // Returns the key with confidence score
   }
   ```

2. `list_keys`: List all available keys with optional category filtering
   ```typescript
   {
     "query": "Show LLM keys"  // Optional category filter
   }
   ```

Features:
- Natural language key queries with fuzzy matching and confidence scores
- Category-based filtering and organization
- Secure key retrieval with token-based authentication
- Automatic token synchronization with VS Code settings
- Robust error handling with automatic retries
- High-performance HTTP requests using node-fetch
- IPv4/IPv6 compatibility for improved connectivity

The MCP server automatically starts with VS Code and handles:
- External server management for API key access
- Token validation and refresh
- Secure key storage and retrieval
- Natural language processing for key queries

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
