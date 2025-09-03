import {
  InvalidVerificationTokenError,
  SimilarPasswordError,
  VerificationTokenExpiredError,
} from '@/server/services/auth';
import { NextResponse } from 'next/server';
import { ValidationError } from '../validator';

const errorCodeLookup: Record<string, number> = {
  [SimilarPasswordError.name]: 400,
  [InvalidVerificationTokenError.name]: 400,
  [VerificationTokenExpiredError.name]: 410,
  [ValidationError.name]: 422,
  [SyntaxError.name]: 400,
};

export const httpExceptionMapper = (
  error: any,
): Parameters<typeof NextResponse.json> => {
  const status = errorCodeLookup[error.constructor.name];
  if (!status) {
    return [{ error: 'An unexpected error occurred' }, { status: 500 }];
  }
  return [{ error: error.message }, { status }];
};
