export default interface IBaseDB {
  /**
   * Executes a SQL query and returns the result.
   * @param text The SQL query string.
   * @param params Optional parameters for the query.
   * @returns A promise that resolves to the result of the query.
   */
  query(text: string, params?: any[]): Promise<any[]>;
  /**
   * Executes a SQL mutation and returns the result.
   * @param text The SQL mutation string.
   * @param params Optional parameters for the mutation.
   * @returns A promise that resolves to the result of the mutation.
   */
  mutate(text: string, params?: any[]): Promise<any[]>;
  /**
   * Begins a transaction and executes the provided callback function with a transaction client.
   * @param callback The function to execute within the transaction.
   * @returns A promise that resolves to the result of the callback function.
   */
  // transaction<T = any>(callback: (client: IBaseDB) => Promise<T>): Promise<T>;
}

export interface IGraphDB extends IBaseDB {
  /**
   * Executes a Cypher query and returns the result.
   * @param text The Cypher query string.
   * @param params Optional parameters for the query.
   * @returns A promise that resolves to the result of the query.
   */
  query(text: string, params?: any[]): Promise<any[]>;
}
