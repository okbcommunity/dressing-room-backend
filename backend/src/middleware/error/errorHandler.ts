import express from 'express';
import { AppError } from './AppError';

export function errorLoggerMiddleware(
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  // Logging
  console.error('\x1b[31m', err); // Adding some color to the log
  next(err);
}

// Error Handler Middleware
// https://expressjs.com/en/guide/error-handling.html
// https://reflectoring.io/express-error-handling/
export function errorHandlerMiddleware(
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  let statusCode = 500;
  const jsonResponse: TErrorJsonResponse = {
    error: 'unknown',
    error_description: null,
    error_uri: null,
  };

  // Handle App Error
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    jsonResponse.error = err.message;
    jsonResponse.error_description = err.description;
    jsonResponse.error_uri = err.uri;
  }
  // Handle unknown Error
  else {
    if (err.message != null) {
      jsonResponse.error = err.message;
    }
    if (err.status != null && typeof err.status === 'number') {
      statusCode = err.status;
    }
  }

  // Response
  res.status(statusCode);
  res.json(jsonResponse);
}

type TErrorJsonResponse = {
  error: string;
  error_description: string | null;
  error_uri: string | null;
};
