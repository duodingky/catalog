import type { DatabaseError } from "pg";

export function isPgError(err: unknown): err is DatabaseError {
  return typeof err === "object" && err !== null && "code" in err;
}

export const PG_ERROR = {
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503"
} as const;

