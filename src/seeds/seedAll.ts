import { spawn } from 'child_process';

const scripts = [
  'seed:user',
  'seed:employer-profile',
  'seed:jobs',
  'seed:my-jobs',
  'seed:applications',
];

const run = (script: string) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn('bun', ['run', script], { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
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
