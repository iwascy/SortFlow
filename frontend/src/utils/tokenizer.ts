export function tokenize(filename: string): string[] {
  // Remove extension
  const parts = filename.split('.');
  if (parts.length > 1) parts.pop();
  const name = parts.join('.');

  // 1. Split by common delimiters
  let tokens = name.split(/[-_.\s]+/);

  // 2. Split by CamelCase
  tokens = tokens.flatMap(token => {
    // Split at uppercase letters
    return token.split(/(?=[A-Z])/);
  });

  // 3. Separate numbers
  tokens = tokens.flatMap(token => {
    // Split keeping the numbers
    return token.split(/(\d+)/);
  });

  // 4. Denoise and Filter
  tokens = tokens.filter(t => t && t.trim().length > 0);

  // 5. Deduplicate
  return Array.from(new Set(tokens));
}
