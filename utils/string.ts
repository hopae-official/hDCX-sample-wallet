/**
 * Converts a string to Pascal Case
 * e.g., "hello_world" -> "Hello World"
 */
export function toPascalCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
