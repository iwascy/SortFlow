const CHINESE_STOPWORDS = new Set([
  '在', '的', '了', '是', '和', '与', '及', '到', '从', '给', '对', '为', '着', '地'
]);

const splitBaseTokens = (name: string): string[] => {
  let tokens = name.split(/[-_.\s]+/);

  tokens = tokens.flatMap(token => token.split(/(?=[A-Z])/));

  tokens = tokens.flatMap(token => token.split(/(\d+)/));

  return tokens.filter(t => t && t.trim().length > 0);
};

export function tokenize(filename: string): string[] {
  const parts = filename.split('.');
  if (parts.length > 1) parts.pop();
  const name = parts.join('.').trim();
  if (!name) return [];

  const tokens: string[] = [];
  const canSegment = typeof Intl !== 'undefined' && typeof (Intl as any).Segmenter === 'function';

  if (canSegment) {
    const segmenter = new Intl.Segmenter('zh-Hans', { granularity: 'word' });
    for (const segment of segmenter.segment(name)) {
      if (!segment.isWordLike) continue;
      const chunk = segment.segment.trim();
      if (!chunk) continue;
      tokens.push(chunk);
    }
  } else {
    tokens.push(...splitBaseTokens(name));
  }

  const expanded = tokens
    .flatMap(token => token.split(/[-_.\s]+/))
    .flatMap(token => splitBaseTokens(token));

  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of expanded) {
    const token = raw.trim();
    if (!token) continue;
    if (CHINESE_STOPWORDS.has(token)) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    result.push(token);
  }
  return result;
}
