export abstract class BaseRepositoryClass<T> {
  abstract create(item: T): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(
    conditions: Record<string, any>,
    limit?: number,
  ): Promise<T[]>;
  abstract update(id: string, item: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;
}

export default BaseRepositoryClass;
