import { MiddlewarePipeline, withAuthorization } from './middlewares';

export default new MiddlewarePipeline([withAuthorization]).compose();

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
};
