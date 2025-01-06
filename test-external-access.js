const http = require('http');

// Configuration - These values will need to be provided
const PORT = 8000; // Default port from configuration
const ACCESS_TOKEN = 'beef35fc0ce42970bebfae61ae9df628a2e3f7844cec9d4f962c793ec1beedff';

// Test keys with variations
// We just want to get the Deepseek key
const TEST_KEYS = [
    { request: 'elevenlabs api key', stored: 'ElevenLabs' }
];

// Helper function to normalize key names (remove spaces, special chars, make lowercase)
function normalizeKeyName(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/(key|token|api)$/g, '');
}

// Helper function to find best matching key
function findBestMatch(requestedKey, availableKeys) {
    const normalizedRequest = normalizeKeyName(requestedKey);
    
    // Try exact match first
    let match = availableKeys.find(k => k.name === requestedKey);
    if (match) return match.name;

    // Try normalized match
    match = availableKeys.find(k => 
        normalizeKeyName(k.name) === normalizedRequest
    );
    if (match) return match.name;

    // Try partial match
    match = availableKeys.find(k => 
        normalizeKeyName(k.name).includes(normalizedRequest) ||
        normalizedRequest.includes(normalizeKeyName(k.name))
    );
    if (match) return match.name;

    return null;
}

// Helper function to make HTTP requests
async function makeRequest(path, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: PORT,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
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

// Test functions
async function testListKeys() {
    console.log('\nTesting List Keys...');
    try {
        const response = await makeRequest('/list', {
            requestId: '1'
        });
        console.log('List Keys Response:', JSON.stringify(response, null, 2));
    } catch (error) {
        console.error('List Keys Error:', error);
    }
}

async function testGetKey(requestedKey, expectedStoredKey) {
    console.log(`\nTesting Get Key - Request: "${requestedKey}" (Expected: "${expectedStoredKey}")...`);
    try {
        // First, get the list of available keys
        const listResponse = await makeRequest('/list', { requestId: 'list-1' });
        if (!listResponse.success) {
            console.error('Failed to get key list:', listResponse.error);
            return;
        }

        // Find the best matching key
        const matchedKey = findBestMatch(requestedKey, listResponse.keys);
        if (!matchedKey) {
            console.log(`No matching key found for "${requestedKey}"`);
            return;
        }

        // Get the matched key
        const response = await makeRequest('/key', {
            keyName: matchedKey,
            requestId: `get-${matchedKey}`
        });

        console.log('Matched Key:', matchedKey);
        console.log('Get Key Response:', JSON.stringify(response, null, 2));

        // Verify if we found the expected key
        if (matchedKey === expectedStoredKey) {
            console.log('✅ Successfully matched expected key!');
        } else {
            console.log('⚠️ Found a key, but not the expected one');
        }
    } catch (error) {
        console.error('Get Key Error:', error);
    }
}

// Run tests
async function runTests() {
    if (!ACCESS_TOKEN) {
        console.error('Please set the ACCESS_TOKEN variable with a valid token');
        return;
    }

    console.log('Starting API Vault External Access Tests...');
    console.log('Using Port:', PORT);
    console.log('Using Token:', ACCESS_TOKEN);

    await testListKeys();
    
    // Test each key variation
    for (const test of TEST_KEYS) {
        await testGetKey(test.request, test.stored);
    }
}

runTests();
