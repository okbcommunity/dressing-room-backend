import { createServer as createHttpServer } from 'http';
import app from './app';
import config from './config';

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

  // Assign express as request listener to the server
  app.set('port', PORT);
  httpServer.on('request', app);

  return { httpServer };
})();

export default httpServer;
