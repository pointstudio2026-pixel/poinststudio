export interface AppErrorShape {
  code: string;
  message: string;
  httpStatus: number;
  details?: unknown;
  isOperational: boolean;
}

export class AppError extends Error implements AppErrorShape {
  readonly code: string;
  readonly httpStatus: number;
  readonly details?: unknown;
  readonly isOperational: boolean;

  constructor(params: {
    code: string;
    message: string;
    httpStatus: number;
    details?: unknown;
    isOperational?: boolean;
  }) {
    super(params.message);
    this.name = this.constructor.name;
    this.code = params.code;
    this.httpStatus = params.httpStatus;
    this.details = params.details;
    this.isOperational = params.isOperational ?? true;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ code: "VALIDATION_ERROR", message, httpStatus: 400, details });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super({ code: "AUTHENTICATION_ERROR", message, httpStatus: 401 });
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Not authorized") {
    super({ code: "AUTHORIZATION_ERROR", message, httpStatus: 403 });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super({ code: "NOT_FOUND", message, httpStatus: 404 });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflicting state") {
    super({ code: "CONFLICT", message, httpStatus: 409 });
  }
}

export class UsageLimitError extends AppError {
  constructor(message = "Usage limit reached") {
    super({ code: "USAGE_LIMIT_REACHED", message, httpStatus: 429 });
  }
}

export class ProviderError extends AppError {
  constructor(message = "Upstream provider error", details?: unknown) {
    super({ code: "PROVIDER_ERROR", message, httpStatus: 502, details });
  }
}

export class InternalError extends AppError {
  constructor(message = "Internal server error", details?: unknown) {
    super({
      code: "INTERNAL_ERROR",
      message,
      httpStatus: 500,
      details,
      isOperational: false,
    });
  }
}
