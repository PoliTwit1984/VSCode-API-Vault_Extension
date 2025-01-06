import * as http from 'http';
import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { StorageManager, ExternalKeyRequest, ExternalListRequest } from './types';

const execAsync = promisify(exec);

// Store server instance globally so we can close it
let currentServer: http.Server | undefined;

// Helper function to kill process on a port
async function killProcessOnPort(port: number): Promise<void> {
    try {
        const { stdout } = await execAsync(`lsof -t -i:${port}`);
        if (stdout.trim()) {
            const pid = stdout.trim();
            await execAsync(`kill -9 ${pid}`);
        }
    } catch (error) {
        // No process found on port, or already killed
    }
}

// Helper function to cleanup server
export async function cleanupServer(): Promise<void> {
    if (currentServer) {
        try {
            currentServer.close();
            currentServer = undefined;
        } catch (error) {
            console.error('Error closing server:', error);
        }
    }
}

// Constants
const DEFAULT_PORT = 8000; // Higher default port to avoid conflicts
const MAX_PORT_SEARCH = 8100; // Maximum port to try

export async function startExternalServer(
    initialToken: string,
    storage: StorageManager,
    configuredPort?: number,
    context?: vscode.ExtensionContext
): Promise<{ server: http.Server; port: number }> {
    const server = http.createServer(async (req, res) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Require authentication token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing or invalid authorization token' }));
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        if (!await storage.validateToken(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid or expired token' }));
            return;
        }

        // Handle requests
        try {
            if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });

                req.on('end', async () => {
                    const requestData = JSON.parse(body);

                    switch(req.url) {
                        case '/key': {
                            const keyRequest: ExternalKeyRequest = {
                                keyName: requestData.keyName,
                                requestId: requestData.requestId
                            };
                            const response = await storage.handleExternalKeyRequest(keyRequest);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(response));
                            break;
                        }
                        case '/list': {
                            const listRequest: ExternalListRequest = {
                                category: requestData.category,
                                requestId: requestData.requestId
                            };
                            const response = await storage.handleExternalListRequest(listRequest);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(response));
                            break;
                        }
                        default:
                            res.writeHead(404, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Endpoint not found' }));
                    }
                });
            } else {
                res.writeHead(405, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Method not allowed' }));
            }
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Internal server error: ${(error as Error).message}` }));
        }
    });

    // Clean up any existing server
    await cleanupServer();

    // Try to use configured port
    let port = configuredPort || DEFAULT_PORT;
    
    while (true) {
        try {
            // Kill any existing process on the port
            await killProcessOnPort(port);

            // Start server on the port
            await new Promise<void>((resolve, reject) => {
                currentServer = server;
                server.once('error', (err) => {
                    if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
                        port++;
                        resolve();
                    } else {
                        reject(err);
                    }
                });
                server.listen(port, () => resolve());
            });
            
            // Save the actual port used to VS Code settings
            if (context) {
                const config = vscode.workspace.getConfiguration('apiVault');
                await config.update('externalPort', Number(port), true);
                console.log(`Server started on port ${port}`);
            }
            
            break;
        } catch (error) {
            if (port > MAX_PORT_SEARCH) {
                throw new Error('Unable to find available port');
            }
            port++;
        }
    }

    return { server, port };
}
