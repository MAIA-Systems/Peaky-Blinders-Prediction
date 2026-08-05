/**
 * Drizzle wraps the underlying Postgres error in `.cause`. The useful bits
 * (Postgres error code, constraint name) live there, not on `.message` —
 * which is just a rendering of the failed query text.
 */
export function pgConstraintName(error: unknown): string | null {
  if (error && typeof error === "object" && "cause" in error) {
    const cause = (error as { cause?: unknown }).cause;
    if (cause && typeof cause === "object" && "constraint" in cause) {
      const constraint = (cause as { constraint?: unknown }).constraint;
      if (typeof constraint === "string") return constraint;
    }
  }
  return null;
}

export function isUniqueViolation(error: unknown): boolean {
  if (error && typeof error === "object" && "cause" in error) {
    const cause = (error as { cause?: unknown }).cause;
    if (cause && typeof cause === "object" && "code" in cause) {
      return (cause as { code?: unknown }).code === "23505";
    }
  }
  return false;
}
