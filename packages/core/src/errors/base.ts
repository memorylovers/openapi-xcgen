import type { XcgenErrorCode } from "./codes";

/**
 * Base error class for all openapi-xcgen errors
 * Provides common functionality and structure for error handling
 */
export class XcgenError extends Error {
  /**
   * Error code for categorizing the error
   */
  public readonly code?: XcgenErrorCode;

  /**
   * Additional details about the error
   */
  public readonly details?: unknown;

  /**
   * Timestamp when the error was created
   */
  public readonly timestamp: Date;

  /**
   * Creates a new XcgenError instance
   * @param message - The error message
   * @param code - Optional error code
   * @param details - Optional additional error details
   */
  constructor(message: string, code?: XcgenErrorCode, details?: unknown) {
    super(message);
    this.name = "XcgenError";
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set the prototype explicitly to ensure instanceof checks work correctly
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Converts the error to a JSON representation
   * @returns JSON object with error properties
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  /**
   * Returns a string representation of the error
   * @returns Formatted error string
   */
  toString(): string {
    const parts = [this.name];
    if (this.code) {
      parts.push(`[${this.code}]`);
    }
    parts.push(`:`, this.message);
    return parts.join(" ");
  }
}
