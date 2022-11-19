import express, { NextFunction } from 'express';
import logger from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import config from './config';
import routes from './routes';
import bodyParser from 'body-parser';
import {
  errorHandlerMiddleware,
  errorLoggerMiddleware,
  invalidPathHandlerMiddleware,
} from './middleware/error';

// Init Express App
const { app } = (() => {
  const app = express();

  // Logging Middleware
  app.use(logger('dev'));

  // Protect app from some well-known web vulnerabilities
  app.use(helmet());

  // Cors Middleware
  app.use(
    cors({
      origin: config.app.corsOrigins,
      credentials: true, // Access-Control-Allow-Credentials
    })
  );

  // Parse JSON Body
  app.use(bodyParser.json());

  app.use('/', routes);

  // Error Handling
  app.use(invalidPathHandlerMiddleware);
  app.use(errorLoggerMiddleware);
  app.use(errorHandlerMiddleware);

  return { app };
})();

export default app;
