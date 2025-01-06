import * as assert from 'assert';
import * as vscode from 'vscode';
import * as http from 'http';
import { VSCodeStorageManager } from '../../storage';
import { startExternalServer } from '../../external-server';
import { 
    ExternalAccessToken, 
    ExternalKeyResponse, 
    ExternalListResponse 
} from '../../types';

// Mock VS Code classes for testing
class MockSecretStorage implements vscode.SecretStorage {
    private storage = new Map<string, string>();

    async get(key: string): Promise<string | undefined> {
        return this.storage.get(key);
    }

    async store(key: string, value: string): Promise<void> {
        this.storage.set(key, value);
    }

    async delete(key: string): Promise<void> {
        this.storage.delete(key);
    }

    onDidChange = new vscode.EventEmitter<vscode.SecretStorageChangeEvent>().event;
}

class MockMemento implements vscode.Memento {
    private storage = new Map<string, any>();

    get<T>(key: string, defaultValue?: T): T {
        return this.storage.has(key) ? this.storage.get(key) : (defaultValue as T);
    }

    async update(key: string, value: any): Promise<void> {
        this.storage.set(key, value);
    }

    // Required by vscode.Memento interface
    keys(): readonly string[] {
        return Array.from(this.storage.keys());
    }
}

// Type guards for response types
function isKeyResponse(response: ExternalKeyResponse | ExternalListResponse): response is ExternalKeyResponse {
    return 'value' in response;
}

function isListResponse(response: ExternalKeyResponse | ExternalListResponse): response is ExternalListResponse {
    return 'keys' in response;
}

suite('External Access Test Suite', () => {
    let storage: VSCodeStorageManager;
    let token: ExternalAccessToken;
    let serverPort: number;
    let server: http.Server;

    const testKey = 'TEST_API_KEY';
    const testValue = 'test-value-123';
    const testCategory = 'Test Category';

    // Mock server for testing connection issues
    let mockServer: http.Server;
    let mockServerPort: number;

    suiteSetup(async () => {
        // Initialize storage with mock context
        const context = {
            secrets: new MockSecretStorage(),
            globalState: new MockMemento()
        };
        storage = new VSCodeStorageManager(context.secrets, context.globalState);

        // Store test key
        await storage.storeKey(testKey, testValue, testCategory);

        // Generate token and start server
        token = await storage.generateAccessToken();
        const result = await startExternalServer(token.token, storage);
        server = result.server;
        serverPort = result.port;
    });

    test('Should retrieve key with valid token', async () => {
        const response = await makeRequest('/key', {
            keyName: testKey,
            requestId: '1'
        }, token.token);

        assert.strictEqual(response.success, true);
        if (isKeyResponse(response)) {
            assert.strictEqual(response.value, testValue);
        } else {
            assert.fail('Expected key response');
        }
    });

    test('Should fail with invalid token', async () => {
        const response = await makeRequest('/key', {
            keyName: testKey,
            requestId: '2'
        }, 'invalid-token');

        assert.strictEqual(response.success, false);
        assert.ok(response.error?.includes('Invalid or expired token'));
    });

    test('Should list keys in category', async () => {
        const response = await makeRequest('/list', {
            category: testCategory,
            requestId: '3'
        }, token.token);

        assert.strictEqual(response.success, true);
        if (isListResponse(response)) {
            assert.ok(Array.isArray(response.keys));
            assert.strictEqual(response.keys.length, 1);
            assert.strictEqual(response.keys[0].name, testKey);
            assert.strictEqual(response.keys[0].category, testCategory);
        } else {
            assert.fail('Expected list response');
        }
    });

    test('Should handle non-existent key', async () => {
        const response = await makeRequest('/key', {
            keyName: 'NON_EXISTENT_KEY',
            requestId: '4'
        }, token.token);

        assert.strictEqual(response.success, false);
        assert.ok(response.error?.includes('not found'));
    });

    test('Should handle connection retries', async () => {
        // Start mock server that fails first two requests
        let failedAttempts = 0;
        mockServer = http.createServer((req, res) => {
            if (failedAttempts < 2) {
                failedAttempts++;
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Internal server error' }));
            } else {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, value: testValue }));
            }
        });

        await new Promise<void>(resolve => {
            mockServer.listen(0, 'localhost', () => {
                mockServerPort = (mockServer.address() as any).port;
                resolve();
            });
        });

        const response = await makeRequest('/key', {
            keyName: testKey,
            requestId: '5'
        }, token.token, mockServerPort);

        assert.strictEqual(response.success, true);
        if (isKeyResponse(response)) {
            assert.strictEqual(response.value, testValue);
        }
        assert.strictEqual(failedAttempts, 2);
    });

    test('Should persist connection state', async () => {
        if (!server) {
            assert.fail('Server not initialized');
            return;
        }
        // Stop the server to simulate disconnection
        await new Promise<void>(resolve => server.close(() => resolve()));

        // Try to make a request - should fail
        const response1 = await makeRequest('/key', {
            keyName: testKey,
            requestId: '6'
        }, token.token);

        assert.strictEqual(response1.success, false);
        assert.ok(response1.error?.includes('connection'));

        // Restart the server
        const result = await startExternalServer(token.token, storage);
        server = result.server;
        serverPort = result.port;

        // Try again - should succeed
        const response2 = await makeRequest('/key', {
            keyName: testKey,
            requestId: '7'
        }, token.token);

        assert.strictEqual(response2.success, true);
    });

    test('Should handle token refresh', async () => {
        // Wait for token refresh interval
        await new Promise(resolve => setTimeout(resolve, 100));

        // Generate new token
        const newToken = await storage.generateAccessToken();

        // Old token should fail
        const response1 = await makeRequest('/key', {
            keyName: testKey,
            requestId: '8'
        }, token.token);

        assert.strictEqual(response1.success, false);
        assert.ok(response1.error?.includes('Invalid or expired token'));

        // New token should work
        const response2 = await makeRequest('/key', {
            keyName: testKey,
            requestId: '9'
        }, newToken.token);

        assert.strictEqual(response2.success, true);
    });

    test('Should handle network errors gracefully', async () => {
        // Create server that simulates network issues
        mockServer = http.createServer((req, res) => {
            // Destroy connection immediately
            req.socket.destroy();
        });

        await new Promise<void>(resolve => {
            mockServer.listen(0, 'localhost', () => {
                mockServerPort = (mockServer.address() as any).port;
                resolve();
            });
        });

        const response = await makeRequest('/key', {
            keyName: testKey,
            requestId: '10'
        }, token.token, mockServerPort);

        assert.strictEqual(response.success, false);
        assert.ok(response.error?.includes('network'));
    });

    // Helper function to make HTTP requests
    async function makeRequest(
        path: string, 
        body: any, 
        token: string,
        port: number = serverPort
    ): Promise<ExternalKeyResponse | ExternalListResponse> {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port,
                path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                timeout: 1000 // 1 second timeout
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', reject);
            req.write(JSON.stringify(body));
            req.end();
        });
    }
});
