import { httpExceptionMapper } from '@/lib/exception-http-mapper';
import {
  InvalidVerificationTokenError,
  SimilarPasswordError,
  VerificationTokenExpiredError,
} from '@/server/services/auth';
import { ValidationError } from '@/lib/validator';

describe('httpExceptionMapper', () => {
  it('maps SimilarPasswordError to 400', () => {
    const err = new SimilarPasswordError('Passwords are too similar');
    const [body, init] = httpExceptionMapper(err);
    expect((body as any).error.message).toEqual(err.message);

    expect(init).toEqual({ status: 400 });
  });

  it('maps InvalidVerificationTokenError to 400', () => {
    const err = new InvalidVerificationTokenError('Invalid token');
    const [body, init] = httpExceptionMapper(err);
    expect((body as any).error.message).toEqual(err.message);
    expect(init).toEqual({ status: 400 });
  });

  it('maps VerificationTokenExpiredError to 410', () => {
    const err = new VerificationTokenExpiredError('Token expired');
    const [body, init] = httpExceptionMapper(err);
    expect((body as any).error.message).toEqual(err.message);
    expect(init).toEqual({ status: 410 });
  });

  it('maps ValidationError to 422', () => {
    const err = new ValidationError('Invalid input');
    const [body, init] = httpExceptionMapper(err);
    expect((body as any).error.message).toEqual(err.message);

    expect(init).toEqual({ status: 422 });
  });

  it('maps SyntaxError to 400', () => {
    const err = new SyntaxError('Bad JSON');
    const [body, init] = httpExceptionMapper(err);
    expect((body as any).error.message).toEqual(err.message);

    expect(init).toEqual({ status: 401 });
  });

  it('falls back to 500 for unknown errors', () => {
    class UnknownError extends Error {}
    const err = new UnknownError('Boom');
    const [body, init] = httpExceptionMapper(err as any);
    expect((body as any).error.message).toEqual('An unexpected error occurred');
    expect(init).toEqual({ status: 500 });
  });
});
