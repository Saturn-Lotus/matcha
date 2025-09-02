import { MissingFieldError, TypeValidationError } from './exceptions';
import {
  BooleanParser,
  DateParser,
  NumberParser,
  Parser,
  StringParser,
} from './parsers';

export const Su = {
  string: () => new StringParser(),
  number: () => new NumberParser(),
  boolean: () => new BooleanParser(),
  date: () => new DateParser(),
  literal<const T extends readonly string[]>(literalValues: T) {
    type RType = T[number];
    return {
      parse(value: unknown): RType {
        if (literalValues.indexOf(value as RType) === -1) {
          throw new TypeValidationError(value, 'literal');
        }
        return value as RType;
      },
    };
  },
  optional<T>(parser: Parser<T>) {
    return {
      parse(value: unknown): T | undefined {
        if (value === undefined) {
          return undefined;
        }
        return parser.parse(value);
      },
    };
  },

  array<P extends Parser<any>>(itemParser: P) {
    type T = ReturnType<P['parse']>;
    function validate(value: unknown): asserts value is T[] {
      if (!Array.isArray(value)) {
        throw new TypeValidationError(value, 'array');
      }
      for (const item of value) {
        itemParser.parse(item);
      }
    }

    return {
      parse(value: unknown) {
        validate(value);
        return value;
      },
    };
  },
  object<T, S extends Record<string, Parser<T>>>(schema: S) {
    function validateSchema(value: unknown): asserts value is {
      [K in keyof S]: ReturnType<S[K]['parse']>;
    } {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new TypeValidationError(value, 'object');
      }

      const obj = value as Record<string, unknown>;
      const missingFields = Object.keys(schema).filter((key) => !(key in obj));
      if (missingFields.length > 0) {
        throw new MissingFieldError(missingFields);
      }

      for (const key of Object.keys(schema)) {
        schema[key].parse(obj[key]);
      }
    }
    return {
      parse(value: unknown) {
        validateSchema(value);
        return value;
      },
    };
  },
};
export type SuInfer<T> = T extends Parser<any> ? ReturnType<T['parse']> : never;

