import { createServer as createHttpServer } from 'http';
import app from './app';
import config from './config';
import SmeeClient from 'smee-client';

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

  // Setup Github dev Webhook to redirect Github events to the localhost
  if (process.env.NODE_ENV === 'development') {
    const closeGithubDevWebhook = setupGithubDevWebhook();

    // Listen '[STRG] + C' event (stop server event) emitted by NodeJs
    // https://nairihar.medium.com/graceful-shutdown-in-nodejs-2f8f59d1c357
    process.on('SIGTERM', () => {
      console.log('Starting to shutdown backend.');

      // Close Webhooks
      closeGithubDevWebhook();

      // Shut down server
      httpServer.close(() => {
        console.log('Http server closed.');
      });

      process.exit(0);
    });
  }

  return { httpServer };
})();

export default httpServer;

function setupGithubDevWebhook(): () => void {
  // Setup Github Dev Webhook
  const githubSmee = new SmeeClient({
    source: 'https://smee.io/VmyxJteWkIp4bd',
    target: `${config.app.baseUrl}/github/events`,
    logger: console,
  });
  const githubEvents = githubSmee.start();

  return githubEvents.close;
}
