# Test Files Documentation

## Overview

This document describes the test files in the API Vault project, their purposes, and how to use them.

## Test Structure

```
test/
├── populate-demo-data.ts     # Utility to create test data
├── runTest.ts               # Test runner configuration
└── suite/
    ├── extension.test.ts    # Core extension tests
    ├── external-access.test.ts # External access server tests
    └── testUtils.ts         # Shared test utilities
```

## Test Files

### 1. test-external-access.js
**Purpose**: Tests the external access server's HTTP endpoints and authentication

**Key Features**:
- Tests key listing endpoint
- Tests key retrieval endpoint
- Tests token authentication
- Tests error handling

**Usage**:
```bash
# First enable external access and generate a token in VS Code
# Then run the test
node test-external-access.js
```

**Example Output**:
```javascript
Starting API Vault External Access Tests...
Using Port: 8000
Using Token: [your-token]

Testing List Keys...
List Keys Response: {
  "success": true,
  "keys": [
    {
      "name": "ElevenLabs",
      "category": "AI Services"
    },
    // ... more keys
  ]
}

Testing Get Key...
Result: {
  "success": true,
  "value": "[key-value]"
}
```

### 2. test-client.js (MCP)
**Purpose**: Tests the MCP server implementation

**Key Features**:
- Tests MCP protocol initialization
- Tests natural language key queries
- Tests key listing with categories
- Tests error handling

**Usage**:
```bash
cd /path/to/api-vault-server
npm run build
node test-client.js
```

**Example Output**:
```javascript
Connecting to server...
API Vault MCP server running on stdio
Connected successfully

Testing get_api_key...
Result: {
  "content": [
    {
      "type": "text",
      "text": "Here's the API key for ElevenLabs..."
    }
  ]
}
```

### 3. extension.test.ts
**Purpose**: Tests core extension functionality

**Key Features**:
- Tests key storage
- Tests key retrieval
- Tests category management
- Tests VS Code commands

**Usage**:
```bash
npm test
```

### 4. external-access.test.ts
**Purpose**: Integration tests for external access functionality

**Key Features**:
- Tests server startup/shutdown
- Tests state persistence
- Tests token management
- Tests request handling

**Usage**:
```bash
npm test
```

## Writing New Tests

### 1. External Access Tests
```typescript
// Example test structure
describe('External Access Server', () => {
  beforeEach(async () => {
    // Setup test environment
    await enableExternalAccess();
    token = await generateToken();
  });

  it('should list available keys', async () => {
    const response = await makeRequest('/list', {
      token,
      requestId: '1'
    });
    expect(response.success).toBe(true);
    expect(response.keys).toBeDefined();
  });
});
```

### 2. MCP Tests
```typescript
// Example test structure
describe('MCP Server', () => {
  beforeEach(async () => {
    // Setup MCP client and server
    client = new Client({...});
    await client.connect();
  });

  it('should handle natural language queries', async () => {
    const result = await client.callTool('api-vault-server', 'get_api_key', {
      query: 'get the elevenlabs key'
    });
    expect(result.content).toBeDefined();
  });
});
```

## Test Configuration

### Environment Setup
1. Create a `.env` file with test configuration:
```env
TEST_PORT=8000
TEST_TOKEN=your-test-token
```

2. Configure test timeouts in `jest.config.js`:
```javascript
module.exports = {
  testTimeout: 10000,  // 10 seconds
  // ... other config
};
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Files
```bash
# Run external access tests only
npm test -- external-access.test.ts

# Run MCP tests only
node test-client.js
```

### Watch Mode
```bash
npm test -- --watch
```

## Debugging Tests

1. Use VS Code's debug configuration:
   - Set breakpoints in test files
   - Use the "Extension Tests" launch configuration
   - Step through test execution

2. Enable verbose logging:
```bash
DEBUG=api-vault:* npm test
```

## Common Issues

1. **Port Conflicts**
   - Error: EADDRINUSE
   - Solution: Change test port in .env file

2. **Token Validation**
   - Error: Invalid token
   - Solution: Generate new token before tests

3. **MCP Communication**
   - Error: Message validation failed
   - Solution: Check message format against MCP schema
