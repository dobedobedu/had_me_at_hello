import { QuizResponse } from './types';

export function sanitizeArray(arr: any[]): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((x) => typeof x === 'string' && x.trim().length > 0)
    .map((s) => s.toLowerCase());
}

export function extractTraits(quiz: QuizResponse): string[] {
  const traits: string[] = [];
  traits.push(...sanitizeArray(quiz?.selectedCharacteristics || []));

  const threeWords = quiz?.threeWords?.toLowerCase() || '';
  const childDescription = quiz?.childDescription?.toLowerCase() || '';
  const desc = threeWords || childDescription;

  if (desc) {
    const tokens = desc.match(/[a-zA-Z][a-zA-Z\-]+/g) || [];
    const stop = new Set([
      'and',
      'the',
      'a',
      'an',
      'of',
      'to',
      'with',
      'who',
      'is',
      'are',
      'for',
      'about',
      'very',
      'really',
      'child',
      'kid',
      'student',
      'my',
    ]);
    const picked: string[] = [];
    for (const t of tokens) {
      const token = t.toLowerCase();
      if (!stop.has(token) && picked.indexOf(token) === -1) picked.push(token);
      if (picked.length >= 5) break;
    }
    traits.push(...picked);

    if (threeWords && childDescription && picked.length < 5) {
      const descTokens = childDescription.match(/[a-zA-Z][a-zA-Z\-]+/g) || [];
      for (const t of descTokens) {
        const token = t.toLowerCase();
        if (!stop.has(token) && picked.indexOf(token) === -1 && traits.indexOf(token) === -1) {
          traits.push(token);
          if (traits.length >= 7) break;
        }
      }
    }
  }
  return traits;
}

export function expandInterests(ints: string[]): string[] {
  const map: Record<string, string[]> = {
    athletics: [
      'sports',
      'tennis',
      'soccer',
      'basketball',
      'football',
      'swimming',
      'track',
      'golf',
      'volleyball',
      'competition',
      'team',
      'fitness',
      'athletic',
    ],
    stem: [
      'science',
      'technology',
      'engineering',
      'math',
      'robotics',
      'coding',
      'programming',
      'computer',
      'steam',
      'physics',
      'chemistry',
      'biology',
    ],
    creativity: [
      'arts',
      'art',
      'visual',
      'design',
      'music',
      'theater',
      'drama',
      'writing',
      'literature',
      'media',
      'film',
      'photography',
      'creative',
    ],
    community: [
      'service',
      'volunteer',
      'leadership',
      'mentorship',
      'church',
      'faith',
      'spiritual',
      'religious',
      'community',
    ],
  };
  const out = new Set<string>();
  for (const interest of ints) {
    const normalized = interest.toLowerCase();
    out.add(normalized);
    for (const [category, keywords] of Object.entries(map)) {
      if (normalized.includes(category) || keywords.some((keyword) => normalized.includes(keyword) || keyword.includes(normalized))) {
        out.add(category);
        keywords.forEach((keyword) => out.add(keyword));
      }
    }
  }
  return Array.from(out);
}

export function baseMessage(quiz: QuizResponse): string {
  const interests = (quiz?.interests || []).slice(0, 2).join(' and ');
  return interests
    ? `Based on your interest in ${interests}, we believe Saint Stephen's could be an excellent fit. Our personalized approach and dedicated faculty create the perfect environment for your child to thrive.`
    : `We're excited to learn more about your child and show you what makes Saint Stephen's special!`;
}
