import { MiddlewarePipeline, withAuthorization, withProfileComplete } from './middlewares';

export default new MiddlewarePipeline([withAuthorization, withProfileComplete]).compose();

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
};
