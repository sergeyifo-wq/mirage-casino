/** Public files need the same deployment prefix as Next's scripts and styles. */
export function assetPath(path: string): string {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  return `${basePath}${path}`;
}
