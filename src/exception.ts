import { HTTPException } from 'hono/http-exception';
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

export const toHttpCode = (code: ExceptionCode) => {
  switch (code) {
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
};

export class Exception extends HTTPException {
  public code: ExceptionCode;

  constructor(code: ExceptionCode, message: string) {
    super(toHttpCode(code), { message });

    this.code = code;
  }
}
