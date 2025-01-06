# Model Context Protocol (MCP)

## Overview
The Model Context Protocol (MCP) is an open standard designed to enable secure, two-way connections between data sources and AI-powered tools. It provides a universal protocol for connecting AI systems with various data sources, ensuring standardized access to contextual information.

## Architecture
MCP follows a client-host-server architecture:
- **Host**: LLM applications
- **Client**: Connectors within the host application
- **Server**: Services that provide context and capabilities

Communication between these components is facilitated through JSON-RPC 2.0 messages.

## Key Features

### 1. Standardized Integration
- Universal protocol for AI system connections
- Consistent interface across different data sources
- Seamless integration capabilities

### 2. Security
- Local-first connections prioritized
- Clear security boundaries through architecture
- Isolated concerns for better security management

### 3. Flexibility
- Ability to switch between LLM providers
- Vendor-agnostic implementation
- Future-proof design

### 4. Contextual Information Sharing
- Standardized context provision to LLMs
- Enhanced response accuracy through better context
- Structured data sharing capabilities

## Implementation

### Documentation
- Official Specification: https://spec.modelcontextprotocol.io/specification/
- Spring AI Reference: https://docs.spring.io/spring-ai/reference/api/model-context-protocol.html

### Best Practices
1. Use MCP to standardize context provision to LLMs
2. Leverage the client-host-server architecture for security
3. Build composable integrations and workflows
4. Utilize contextual information sharing capabilities
5. Maintain clear security boundaries

## Protocol Details

### Communication
- Based on JSON-RPC 2.0 messages for establishing communication between hosts, clients, and servers
- Supports bidirectional communication
- Latest Protocol Revision: 2024-11-05

### Server Primitives
MCP servers provide three fundamental building blocks for adding context to language models:

1. **Prompts**
   - Pre-defined templates or instructions that guide language model interactions
   - User-controlled
   - Examples: Interactive templates invoked by user choice, slash commands, menu options

2. **Resources**
   - Structured data or content that provides additional context to the model
   - Application-controlled
   - Examples: File contents, git history, contextual data attached and managed by the client

3. **Tools**
   - Executable functions that allow models to perform actions or retrieve information
   - Model-controlled
   - Examples: API POST requests, file writing, functions exposed to the LLM to take actions

### Control Hierarchy
Each primitive type has specific characteristics and control mechanisms:
- **Prompts**: User-controlled with interactive templates
- **Resources**: Application-controlled with managed contextual data
- **Tools**: Model-controlled with executable functions

### Integration Patterns
1. Direct data source connections
2. Tool integration
3. Workflow composition
4. Context management
5. Capability exposure

## Security Considerations

### 1. Local-First Approach
- Prioritizes local connections
- Addresses privacy concerns
- Handles sensitive data securely

### 2. Architectural Security
- Clear boundaries between components
- Isolated concerns
- Controlled data flow

### 3. Data Protection
- Secure context sharing
- Protected communication channels
- Privacy-preserving design

## API Vault MCP Implementation (v5.4.0)

API Vault implements an MCP server that provides secure API key management capabilities through natural language queries. The server exposes two primary tools:

1. **get_api_key**
   ```typescript
   {
     "name": "get_api_key",
     "description": "Get an API key by name or description",
     "inputSchema": {
       "type": "object",
       "properties": {
         "query": {
           "type": "string",
           "description": "Natural language query (e.g., 'Get the OpenRouter API key')"
         }
       },
       "required": ["query"]
     }
   }
   ```
   Returns: API key with confidence score for the match

2. **list_keys**
   ```typescript
   {
     "name": "list_keys",
     "description": "List all available API keys",
     "inputSchema": {
       "type": "object",
       "properties": {
         "query": {
           "type": "string",
           "description": "Optional category filter (e.g., 'Show LLM keys')"
         }
       }
     }
   }
   ```
   Returns: Categorized list of available API keys

### Key Features

1. **Natural Language Processing**
   - Fuzzy matching for key names
   - Category-based filtering
   - Confidence scoring for matches
   - Alias support for common variations

2. **Security**
   - Token-based authentication
   - Automatic token refresh
   - Secure key storage using system keychain
   - Connection state management

3. **Integration**
   - Automatic server startup with VS Code
   - External server management
   - Token synchronization
   - Error handling with exponential backoff

4. **Performance**
   - High-performance HTTP requests
   - Connection pooling
   - Retry mechanism for failed operations
   - State persistence

## Use Cases

1. **AI Application Integration**
   - Connecting LLMs to data sources
   - Tool integration
   - Workflow automation

2. **Context Management**
   - Standardized context sharing
   - Enhanced response accuracy
   - Consistent information flow

3. **Tool Exposure**
   - Capability sharing
   - Function calling
   - Resource access

## Future Considerations

1. **Extensibility**
   - New tool integration
   - Additional protocol features
   - Enhanced security measures

2. **Standardization**
   - Industry adoption
   - Protocol evolution
   - Best practices development

3. **Integration Patterns**
   - New use cases
   - Advanced workflows
   - Enhanced capabilities
