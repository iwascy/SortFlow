export function tokenize(filename: string): string[] {
  // Simple tokenizer: split by delimiters, camelCase, numbers
  const tokens: string[] = [];

  // Remove extension
  const parts = filename.split('.');
  if (parts.length > 1) parts.pop();
  const name = parts.join('.');

  // Split by common delimiters
  const rawTokens = name.split(/[-_.\s]+/);

  rawTokens.forEach(t => {
    if (t) tokens.push(t);
  });

  return tokens;
}
