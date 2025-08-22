export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}
export class TypeValidationError extends ValidationError {
  constructor(val: any, typeName: string) {
    super(`Invalid value '${val}' for type '${typeName}'`);
  }
}

export class CheckValidationError extends ValidationError {
  constructor(val: any, message: string) {
    super(`Invalid value '${val}': value ${message}`);
  }
}
