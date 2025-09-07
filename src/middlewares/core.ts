import { NextMiddleware, NextResponse } from 'next/server';

export type MiddlewareFactory = (next: NextMiddleware) => NextMiddleware;

export class MiddlewarePipeline {
  private factories: MiddlewareFactory[] = [];

  constructor(factories: MiddlewareFactory[] = []) {
    this.factories = factories;
  }

  use(factory: MiddlewareFactory) {
    this.factories.push(factory);
  }

  useAll(factories: MiddlewareFactory[]) {
    this.factories.push(...factories);
  }

  compose(): NextMiddleware {
    const defaultNext: NextMiddleware = () => NextResponse.next();
    return this.factories.reduceRight(
      (next, factory) => factory(next),
      defaultNext,
    );
  }
}
