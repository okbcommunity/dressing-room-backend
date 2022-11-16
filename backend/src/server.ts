import { createServer as createHttpServer } from 'http';
import app from './app';
import config, { STAGE } from './config';
import { closeDB, connectDB } from './core/db';
import { setupGithubWebhookDevRedirect } from './core/githubapp';

export const { httpServer } = (() => {
  const PORT = config.app.port;

  // Create http server
  // https://expressjs.com/en/api.html
  const httpServer = createHttpServer();

  // Create https server
  // Note: Https will be configured through 'nginx'
  // const httpsServer = createHttpsServer();

  // Listen on provided port, on all network interfaces
  httpServer.listen(PORT);
  httpServer.on('error', (error) => {
    throw error;
  });
  httpServer.on('listening', () => {
    console.log(`Running on Port: ${PORT}`);
  });

  // Assign express as request listener to the create http server
  app.set('port', PORT);
  httpServer.on('request', app);

  // Setup Github Dev Webhook to redirect Github events to the localhost interface
  let closeGithubWebhookDevRedirect = () => {};
  if (config.app.stage === STAGE.LOCAL) {
    closeGithubWebhookDevRedirect = setupGithubWebhookDevRedirect();
  }

  // Init DB Connection
  connectDB();

  // Listen '[STRG] + C' event (stop server event) emitted by NodeJs
  // https://nairihar.medium.com/graceful-shutdown-in-nodejs-2f8f59d1c357
  function onKill() {
    console.log('Shutting down backend.');

    // Close Github Dev Webhook redirect
    closeGithubWebhookDevRedirect();

    // Close DB Connection
    closeDB();

    // Shut down server
    httpServer.close(() => {
      console.log('Http server closed.');
    });

    process.exit(0);
  }
  process.on('SIGTERM', onKill);
  process.on('SIGINT', onKill);

  return { httpServer };
})();

export default httpServer;
