import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

expand(config());

// Loaded via runtime require (not a hoisted import) so env is in place before
// modules that read it at init run — e.g. the session secret in @/lib/auth/session.
const { startSocketServer } = require('./server') as typeof import('./server');

startSocketServer();
