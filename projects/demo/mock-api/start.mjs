import { createMockApiServer } from './server.mjs';

const host = '127.0.0.1';
const port = 3000;
const server = createMockApiServer();

server.on('error', (error) => {
  console.error(`Mock API failed to start: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Mock API listening at http://${host}:${port}/api/users`);
});

function shutdown() {
  server.close((error) => {
    if (error) {
      console.error(`Mock API failed to close: ${error.message}`);
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
