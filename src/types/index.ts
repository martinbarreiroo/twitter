export type ClassType<T> = new (...args: any[]) => T;

/**
 * @typedef CursorPagination
 *
 * @description Cursor-Based Pagination using timestamps
 *
 * Read more about Cursor Pagination https://jsonapi.org/profiles/ethanresnick/cursor-pagination/
 *
 * Either before or after should be defined, not both at the same time
 *
 * @property {number} limit - The amount of records to return
 * @property {string} before - The timestamp after which to return records (ISO string)
 * @property {string} after - The timestamp before which to return records (ISO string)
 */
export interface CursorPagination {
  limit?: number;
  before?: string;
  after?: string;
}

/**
 * @typedef OffsetPagination
 *
 * @description Offset-Limit Pagination
 *
 * Read more about Offset-Limit Pagination https://www.prisma.io/docs/concepts/components/prisma-client/pagination#offset-pagination
 *
 * @property {number} limit - The amount of records to return
 * @property {number} skip - The amount of records to skip
 */
export interface OffsetPagination {
  limit?: number;
  skip?: number;
}
