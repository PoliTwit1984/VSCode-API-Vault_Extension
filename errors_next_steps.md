# Known Issues and Next Steps

## Current Issues

### 1. MCP Server Communication
- **Issue**: JSON-RPC message validation errors in MCP server communication
- **Details**: The server is receiving malformed messages that fail Zod schema validation
- **Current State**: Messages are being sent but failing validation on the server side
- **Impact**: Natural language key queries through MCP are not working
- **Next Steps**:
  1. Update message format to match MCP schema requirements
  2. Add proper JSON-RPC envelope to all messages
  3. Implement proper error handling for validation failures

### 2. External Access State Persistence
- **Issue**: External access server state doesn't always persist correctly
- **Details**: Server configuration sometimes resets after VS Code restart
- **Impact**: External applications may need to re-authenticate
- **Next Steps**:
  1. Improve state storage mechanism
  2. Add automatic state recovery
  3. Implement better error handling for state restoration

### 3. Token Management
- **Issue**: Access tokens need better rotation and management
- **Details**: Tokens don't expire and aren't automatically rotated
- **Impact**: Potential security risk from long-lived tokens
- **Next Steps**:
  1. Add token expiration
  2. Implement automatic token rotation
  3. Add token revocation capabilities

## Planned Improvements

### 1. MCP Integration
1. Fix message validation
   ```typescript
   // Current problematic format:
   {
     jsonrpc: "2.0",
     method: "tools/call",
     params: { name: "get_api_key", arguments: { query: "..." } }
   }
   
   // Needed format:
   {
     jsonrpc: "2.0",
     method: "tools/call",
     params: {
       name: "get_api_key",
       arguments: { query: "..." },
       _meta: { /* optional metadata */ }
     }
   }
   ```

2. Add proper initialization sequence
   ```typescript
   // Required steps:
   1. Client sends initialize request
   2. Server responds with capabilities
   3. Client sends initialized notification
   4. Normal message exchange can begin
   ```

3. Implement proper error handling
   ```typescript
   try {
     const result = await handleRequest(request);
     return {
       jsonrpc: "2.0",
       id: request.id,
       result
     };
   } catch (error) {
     return {
       jsonrpc: "2.0",
       id: request.id,
       error: {
         code: error.code || -32603,
         message: error.message
       }
     };
   }
   ```

### 2. External Access Improvements
1. Add request rate limiting
2. Implement IP whitelisting
3. Add access logging
4. Improve error reporting

### 3. Security Enhancements
1. Add key encryption at rest
2. Implement key access auditing
3. Add key expiration tracking
4. Improve token security

## Testing Requirements

1. Add MCP protocol tests
   - Test initialization sequence
   - Test message validation
   - Test error handling

2. Add external access tests
   - Test state persistence
   - Test token management
   - Test rate limiting

3. Add security tests
   - Test key encryption
   - Test token rotation
   - Test access controls

## Documentation Updates Needed

1. Add detailed MCP integration guide
2. Update external access documentation
3. Add security best practices guide
4. Add troubleshooting guide

## Timeline

### Immediate (1-2 weeks)
- Fix MCP message validation
- Improve state persistence
- Add basic token management

### Short-term (2-4 weeks)
- Implement security enhancements
- Add rate limiting
- Improve error handling

### Medium-term (1-2 months)
- Add key encryption
- Implement access logging
- Add key expiration

## Getting Started with Fixes

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests to verify current issues: `npm test`
4. Check `src/test/suite/external-access.test.ts` for failing tests
5. Start with MCP message validation fixes in `src/mcp/server.ts`

## Resources

- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/specification/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [VS Code Extension API](https://code.visualstudio.com/api)
