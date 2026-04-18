import { HTTPError } from './mapper';

@HTTPError(404)
class NotFoundException extends Error {
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

export { NotFoundException, BadRequestException };

