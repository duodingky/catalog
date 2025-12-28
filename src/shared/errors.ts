export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(opts: { message: string; statusCode: number; code: string }) {
    super(opts.message);
    this.statusCode = opts.statusCode;
    this.code = opts.code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super({ message, statusCode: 404, code: "NOT_FOUND" });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super({ message, statusCode: 409, code: "CONFLICT" });
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super({ message, statusCode: 400, code: "BAD_REQUEST" });
  }
}

