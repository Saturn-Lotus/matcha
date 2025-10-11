import { httpExceptionMapper } from '@/lib/exception-http-mapper';
import { NextRequest, NextResponse } from 'next/server';

type Handler = (req: NextRequest, context?: any) => Promise<Response>;

export function withErrorHandler(handler: Handler): Handler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error: any) {
      console.error(error);
      return NextResponse.json(...httpExceptionMapper(error));
    }
  };
}
