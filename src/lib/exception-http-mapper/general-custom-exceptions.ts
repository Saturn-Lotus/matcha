import { HTTPError } from './mapper';

@HTTPError(404)
class NotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export { NotFoundException };
