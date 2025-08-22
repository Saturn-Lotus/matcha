import { CheckValidationError, TypeValidationError } from './exceptions';

export type AssertFunc<T> = (value: unknown) => asserts value is T;
export type CheckFunc<T> = (value: T) => void;
export type ParseFunc<T> = (value: unknown) => T;
export interface Parser<T> {
  parse: ParseFunc<T>;
}

export function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeValidationError(value, 'string');
  }
}
export function assertNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new TypeValidationError(value, 'number');
  }
}

export function assertBoolean(value: unknown): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw new TypeValidationError(value, 'boolean');
  }
}

export function assertDate(value: unknown): asserts value is Date {
  if (!(value instanceof Date)) {
    throw new TypeValidationError(value, 'Date');
  }
}



export class StringParser implements Parser<string> {
  private readonly checks: CheckFunc<string>[] = [];

  constructor(checks?: CheckFunc<string>[]) {
    if (checks) {
      this.checks.push(...checks);
    }
  }
  parse(value: unknown): string {
    assertString(value);
    for (const check of this.checks) {
      check(value);
    }
    return value;
  }

  email() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return new StringParser([
      ...this.checks,
      (value: string) => {
        if (!emailPattern.test(value)) {
          throw new CheckValidationError(value, 'not a valid email');
        }
      },
    ]);
  }
  length({ min, max, fix }: { min?: number; max?: number; fix?: number }) {
    return new StringParser([
      ...this.checks,
      (value: string) => {
        if (min !== undefined && value.length < min) {
          throw new CheckValidationError(
            value,
            `shorter than ${min} characters`,
          );
        }
        if (max !== undefined && value.length > max) {
          throw new CheckValidationError(
            value,
            `longer than ${max} characters`,
          );
        }
        if (fix !== undefined && value.length !== fix) {
          throw new CheckValidationError(
            value,
            `must be exactly ${fix} characters`,
          );
        }
      },
    ]);
  }
}

export class NumberParser implements Parser<number> {
  private readonly checks: CheckFunc<number>[];
  constructor(checks?: CheckFunc<number>[]) {
    this.checks = checks || [];
  }
  parse(value: unknown): number {
    assertNumber(value);
    for (const check of this.checks) {
      check(value);
    }
    return value;
  }

  min(minValue: number) {
    return new NumberParser([
      ...this.checks,
      (value) => {
        if (value < minValue) {
          throw new CheckValidationError(value, `less than ${minValue}`);
        }
      },
    ]);
  }
  max(maxValue: number) {
    return new NumberParser([
      ...this.checks,
      (value) => {
        if (value > maxValue) {
          throw new CheckValidationError(value, `greater than ${maxValue}`);
        }
      },
    ]);
  }
}

export class BooleanParser implements Parser<boolean> {
  parse(value: unknown): boolean {
    assertBoolean(value);
    return value;
  }
}

export class DateParser implements Parser<Date> {
  parse(value: unknown): Date {
    assertDate(value);
    return value;
  }
}

