import { ApiError } from "./client";

/**
 * The message to put in front of someone.
 *
 * Every backend module answers with `{"error": {"code", "message"}}` and those
 * messages are already written for a reader ("pre-configured sites cannot be
 * deleted — deactivate it instead"), so they are worth showing as-is. Anything
 * that is not an ApiError — a dropped connection, a proxy 502 — gets the
 * caller's fallback instead of a stack-shaped string.
 */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
