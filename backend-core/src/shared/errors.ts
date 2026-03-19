/**
 * FinEra - Application Errors
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function forbiddenError(message = "Access denied") {
  return new AppError(403, "AUTHORIZATION_ERROR", message);
}
