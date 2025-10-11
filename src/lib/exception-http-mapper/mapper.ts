/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { NextResponse } from 'next/server';

class HTTPExceptionMapper {
  private errorCodeLookup: Record<string, number>;

  constructor() {
    this.errorCodeLookup = {
      [SyntaxError.name]: 401,
    };
  }

  addMapping(errorName: string, statusCode: number) {
    if (statusCode < 400 || statusCode >= 600) {
      throw new Error('Status code must be a valid HTTP error code (400-599)');
    }

    this.errorCodeLookup[errorName] = statusCode;
  }

  mapException(error: any): Parameters<typeof NextResponse.json> {
    const status = this.errorCodeLookup[error.constructor.name];
    if (!status) {
      return [{ error: 'An unexpected error occurred' }, { status: 500 }];
    }
    return [{ error: error.message }, { status }];
  }
}

const httpExceptionMapperInstance = new HTTPExceptionMapper();


export const httpExceptionMapper = (
  error: any,
): Parameters<typeof NextResponse.json> => {
  return httpExceptionMapperInstance.mapException(error);
};

/**
 * Decorator to map a custom error class to an HTTP status code.
 * @param statusCode - The HTTP status code to map the error to.
 */
export function HTTPError(statusCode: number) {
  return function (constructor: Function) {
    httpExceptionMapperInstance.addMapping(constructor.name, statusCode);
  };
}