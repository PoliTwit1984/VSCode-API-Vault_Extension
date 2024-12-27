"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const cp = require("child_process");
const test_electron_1 = require("@vscode/test-electron");
async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, './suite/index');
        // Download VS Code, unzip it and run the integration test
        const vscodeExecutablePath = await (0, test_electron_1.downloadAndUnzipVSCode)();
        const [cliPath, ...args] = (0, test_electron_1.resolveCliArgsFromVSCodeExecutablePath)(vscodeExecutablePath);
        // Use cp.spawn to create a new process
        cp.spawnSync(cliPath, [...args, '--install-extension', path.join(extensionDevelopmentPath, 'api-vault-2.0.9.vsix')], {
            encoding: 'utf-8',
            stdio: 'inherit'
        });
        await (0, test_electron_1.runTests)({
            vscodeExecutablePath,
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: ['--disable-extensions']
        });
    }
    catch (err) {
        console.error('Failed to run tests:', err);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=runTest.js.map