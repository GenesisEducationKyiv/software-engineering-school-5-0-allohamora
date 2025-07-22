import { Status } from 'nice-grpc';
import { HttpStatus } from './types/http.types.js';

/*
  This is a set of application-specific exception codes that can be used to identify
  different types of exceptions that may occur in the application.

  Usage of Exception + ExceptionCode is a replacement for polluting the code with a separate class
  for each error type (Java-style).
*/
export const enum ExceptionCode {
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
}

export class Exception extends Error {
  public code: ExceptionCode;

  constructor(code: ExceptionCode, message: string) {
    super(message);

    this.code = code;
  }

  public getGrpcStatus() {
    switch (this.code) {
      case ExceptionCode.NOT_FOUND:
        return Status.NOT_FOUND;
      case ExceptionCode.VALIDATION_ERROR:
        return Status.INVALID_ARGUMENT;
      case ExceptionCode.ALREADY_EXISTS:
        return Status.ALREADY_EXISTS;
      case ExceptionCode.INTERNAL_SERVER_ERROR:
      default:
        return Status.INTERNAL;
    }
  }

  public getHttpCode() {
    switch (this.code) {
      case ExceptionCode.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case ExceptionCode.VALIDATION_ERROR:
        return HttpStatus.BAD_REQUEST;
      case ExceptionCode.ALREADY_EXISTS:
        return HttpStatus.CONFLICT;
      case ExceptionCode.INTERNAL_SERVER_ERROR:
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  public static NotFound(message: string) {
    return new Exception(ExceptionCode.NOT_FOUND, message);
  }

  public static InternalServerError(message: string) {
    return new Exception(ExceptionCode.INTERNAL_SERVER_ERROR, message);
  }

  public static ValidationError(message: string) {
    return new Exception(ExceptionCode.VALIDATION_ERROR, message);
  }

  public static AlreadyExists(message: string) {
    return new Exception(ExceptionCode.ALREADY_EXISTS, message);
  }
}
