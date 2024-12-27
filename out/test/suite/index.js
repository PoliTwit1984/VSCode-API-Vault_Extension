"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const path = require("path");
const Mocha = require("mocha");
const glob = require("glob");
const vscode = require("vscode");
async function run() {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 60000 // Increased timeout for extension operations
    });
    const testsRoot = path.resolve(__dirname, '.');
    // Get the extension context
    const extension = vscode.extensions.getExtension('JosephDavidWilsonJr.api-vault');
    if (extension) {
        await extension.activate();
        global.testContext = extension._extensionContext;
    }
    return new Promise((resolve, reject) => {
        glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
            if (err) {
                return reject(err);
            }
            // Add files to the test suite
            files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));
            try {
                // Run the mocha test
                mocha.run(failures => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    }
                    else {
                        resolve();
                    }
                });
            }
            catch (err) {
                console.error(err);
                reject(err);
            }
        });
    });
}
//# sourceMappingURL=index.js.map