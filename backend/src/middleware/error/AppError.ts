// https://stackoverflow.com/questions/31626231/custom-error-class-in-typescript
export class AppError extends Error {
  // Http Status Code
  public readonly statusCode: number;
  // Uri that points to a site describing the Error in more detail
  public readonly uri: string | null;
  // More detailed Error description
  public readonly description: string | null;

  constructor(
    statusCode: number,
    message?: string,
    options: TErrorOptions = {}
  ) {
    super(message);

    // Set the prototype explicity
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = Error.name;
    this.statusCode = statusCode;
    this.uri = options.uri ?? null;
    this.description = options.description ?? null;

    // https://stackoverflow.com/questions/59625425/understanding-error-capturestacktrace-and-stack-trace-persistance
    Error.captureStackTrace(this);
  }
}

type TErrorOptions = {
  uri?: string;
  description?: string;
};
