import express, { NextFunction } from 'express';
import logger from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import config from './config';
import createHttpError from 'http-errors';
import routes from './routes';
import bodyParser from 'body-parser';

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

  // Middleware to catch unregistered routes as 404 errors
  app.use((req, res, next) => {
    next(createHttpError(404)); // Go to next middleware (-> 'Error Handler Middleware' that was registered as last)
  });

  // Error Handler Middleware
  // https://expressjs.com/en/guide/error-handling.html
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: NextFunction
    ) => {
      res.status(err.status || 500);
      res.json({ error: err });
    }
  );

  return { app };
})();

export default app;
