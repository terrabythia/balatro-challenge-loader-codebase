export function inverseObject<T extends string, S extends string>(
  object: Record<T, S>,
): Record<S, T> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(object)) {
    result[value as string] = key;
  }
  return result as Record<S, T>;
}
