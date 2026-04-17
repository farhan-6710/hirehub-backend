"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const scripts = [
    'seed:user',
    'seed:employer-profile',
    'seed:jobs',
    'seed:my-jobs',
    'seed:applications',
];
const run = (script) => new Promise((resolve, reject) => {
    const child = (0, child_process_1.spawn)('bun', ['run', script], { stdio: 'inherit' });
    child.on('close', (code) => {
        if (code === 0) {
            resolve();
        }
        else {
            reject(new Error(`${script} failed with exit code ${code}`));
        }
    });
});
const main = async () => {
    for (const script of scripts) {
        await run(script);
    }
    console.log('All seeds completed successfully.');
};
main().catch((error) => {
    console.error('seed:all failed:', error);
    process.exit(1);
});
