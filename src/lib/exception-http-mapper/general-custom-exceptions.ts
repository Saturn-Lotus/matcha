// Generic semantic exceptions shared across services.
// Naming convention: `<Intent>Exception` for HTTP-status-only carriers,
// `<Domain><Reason>Error` for service-specific errors.
// Each constructor accepts an optional message so services can attach domain context
// while sharing the underlying HTTP status mapping.
import { HTTPError } from './mapper';

@HTTPError(404)
class NotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

@HTTPError(403)
class ForbiddenException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

@HTTPError(401)
class UnauthorizedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

@HTTPError(400)
class BadRequestException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

@HTTPError(409)
class ConflictException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

@HTTPError(409)
class AlreadyExistsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

@HTTPError(400)
class SelfActionForbiddenException extends Error {
  constructor(message = 'Cannot perform this action on yourself') {
    super(message);
    this.name = this.constructor.name;
  }
}

export {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  AlreadyExistsException,
  SelfActionForbiddenException,
};
