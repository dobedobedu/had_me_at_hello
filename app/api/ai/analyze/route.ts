import { NextResponse } from 'next/server';
import type { QuizResponse, RAGContext, AnalysisResult, StudentStory, FacultyProfile } from '@/lib/ai/types';
import alumniData from '@/knowledge/alumni-story.json';
import facultyData from '@/knowledge/faculty-story.json';
import currentStudentData from '@/knowledge/current-student-stories.json';
import factsData from '@/knowledge/facts.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('[/api/ai/analyze] env check', {
      model: process.env.OPENROUTER_MODEL || '(unset)',
      keyPrefix: (process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.substring(0, 10) + '…' : '(unset)')
    });

    const body = await request.json();
    const quiz: QuizResponse = body?.quiz;
    if (!quiz) {
      return NextResponse.json({ error: 'Missing quiz' }, { status: 400 });
    }

    // Build RAG context on the server
    const context: RAGContext = {
      stories: [...(currentStudentData as any).stories, ...(alumniData as any).stories],
      faculty: (facultyData as any).faculty,
      facts: (factsData as any).facts,
    } as any;

    // 1) Deterministic matching (reliable + fast)
    const deterministic = matchDeterministic(quiz, context);

    // 2) Ask LLM only for the personalized message (no JSON required)
    const { text: llmText, engine } = await generatePersonalizedMessage(quiz, deterministic)
      .catch((e) => {
        console.error('generatePersonalizedMessage failed, using deterministic text', e);
        return { text: deterministic.personalizedMessage, engine: null as string | null };
      });

    const result: AnalysisResult = {
      ...deterministic,
      personalizedMessage: llmText || deterministic.personalizedMessage,
      provider: engine ? 'openrouter' : 'local',
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Analyze route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// --- Matching helpers (deterministic) ---

function sanitizeArray(arr: any[]): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((x) => typeof x === 'string' && x.trim().length > 0).map((s) => s.toLowerCase());
}

function hasValidVideo(url?: string): boolean {
  return !!(url && (url.includes('youtube.com') || url.includes('youtu.be')));
}

function extractTraits(quiz: QuizResponse): string[] {
  const traits: string[] = [];
  // from selectedCharacteristics if present
  traits.push(...sanitizeArray(quiz?.selectedCharacteristics || []));
  // from childDescription: take up to 5 significant words (increased weight)
  const desc = (quiz?.childDescription || quiz?.threeWords || '').toLowerCase();
  if (desc) {
    const tokens = desc.match(/[a-zA-Z][a-zA-Z\-]+/g) || [];
    const stop = new Set(['and','the','a','an','of','to','with','who','is','are','for','about','very','really']);
    const picked: string[] = [];
    for (const t of tokens) {
      if (!stop.has(t) && picked.indexOf(t) === -1) picked.push(t);
      if (picked.length >= 5) break;
    }
    traits.push(...picked);
  }
  return traits;
}

function expandInterests(ints: string[]): string[] {
  // Map to broader categories and synonyms
  const map: Record<string, string[]> = {
    athletics: ['sports','tennis','soccer','basketball','football','swimming','track','golf','volleyball','competition','team','fitness','athletic'],
    stem: ['science','technology','engineering','math','robotics','coding','programming','computer','steam','physics','chemistry','biology'],
    creativity: ['arts','art','visual','design','music','theater','drama','writing','literature','media','film','photography','creative'],
    community: ['service','volunteer','leadership','mentorship','church','faith','spiritual','religious','community'],
  };
  const out = new Set<string>();
  for (const i of ints) {
    out.add(i);
    for (const [cat, kws] of Object.entries(map)) {
      if (i.includes(cat) || kws.some(k => i.includes(k) || k.includes(i))) {
        out.add(cat);
        kws.forEach(k => out.add(k));
      }
    }
  }
  return Array.from(out);
}

function matchDeterministic(quiz: QuizResponse, context: RAGContext): AnalysisResult {
  const userTraits = extractTraits(quiz); // HIGHEST PRIORITY: child description
  const userInterests = expandInterests(sanitizeArray(quiz?.interests || [])); // MEDIUM PRIORITY
  const userFamilyValues = sanitizeArray(quiz?.familyValues || []); // LOWEST PRIORITY
  const userGrade = quiz?.gradeLevel || 'middle';

  // ROUTED STUDENT VIDEO SELECTION (video-first, deterministic)
  const byId = (arr: any[], id: string) => (arr as any[]).find((s) => s.id === id);
  const students = context.stories as any[];

  const pickStudent = (): StudentStory => {
    const isLower = userGrade === 'lower' || userGrade === 'elementary' || userGrade === 'intermediate';
    const has = (id: string) => Boolean(byId(students, id));
    const ACADEMIC = 'academic_excellence';
    const CREATIVE = 'creative_arts';
    const ATHLETICS_PRIMARY = 'athletics_excellence'; // xKcpYSIFRYY (preferred)
    const ATHLETICS_SECONDARY = 'athletics_spotlight'; // eIjS5GZjwzk (flyover)
    const RELATIONSHIPS = 'student_teacher_relationships';
    const LOWER_PARENTS = 'lower_school_parents';

    // Lower/Intermediate: prefer lower parents video, else relationships
    if (isLower) {
      if (has(LOWER_PARENTS)) return byId(students, LOWER_PARENTS);
      return byId(students, RELATIONSHIPS) || students[0];
    }

    // Athletics: prefer primary athletics video, then secondary, else relationships
    if (userInterests.some((i) => ['athletics','sports','tennis','football','competition','teamwork','fitness'].includes(i))) {
      return byId(students, ATHLETICS_PRIMARY) || byId(students, ATHLETICS_SECONDARY) || byId(students, RELATIONSHIPS) || students[0];
    }

    // Creativity/Arts: Betsy
    if (userInterests.some((i) => ['arts','music','theater','drama','creative','design','media'].includes(i))) {
      return byId(students, CREATIVE) || byId(students, RELATIONSHIPS) || students[0];
    }

    // STEM/Academic: academic club
    if (userInterests.some((i) => ['stem','science','technology','engineering','robotics','coding','programming','math','research'].includes(i))) {
      return byId(students, ACADEMIC) || byId(students, RELATIONSHIPS) || students[0];
    }

    // Default: relationships
    return byId(students, RELATIONSHIPS) || students[0];
  };

  // ROUTED FACULTY SELECTION (prefer video, grade-aware)
  const facultyArr = context.faculty as any[];
  const fById = (id: string) => (facultyArr as any[]).find((f) => f.id === id);
  const pickFaculty = (): FacultyProfile => {
    const isLower = userGrade === 'lower' || userGrade === 'elementary' || userGrade === 'intermediate';
    const tryList = (ids: string[]) => ids.map(fById).filter(Boolean) as any[];

    // 1. CHILD DESCRIPTION TRAITS (HIGHEST PRIORITY)
    if (userTraits.some(t => ['creative','artistic','imaginative','expressive','visual','musical'].includes(t))) {
      return (fById('jeannine_elisha') || facultyArr[0]);
    }
    if (userTraits.some(t => ['athletic','competitive','energetic','physical','strong','fast','sporty'].includes(t))) {
      return (fById('tyler_cotton')?.videoUrl ? fById('tyler_cotton') : (fById('cole_hudson') || facultyArr[0]));
    }
    if (userTraits.some(t => ['smart','intelligent','curious','analytical','logical','scientific','mathematical'].includes(t))) {
      return (fById('tyler_cotton') || facultyArr[0]);
    }
    if (userTraits.some(t => ['kind','caring','helpful','empathetic','compassionate','service'].includes(t))) {
      return (fById('cori_rigney') || facultyArr[0]);
    }
    if (userTraits.some(t => ['leader','confident','outgoing','social','charismatic','bold'].includes(t))) {
      return (fById('bernie_yanelli') || fById('patrick_whelan') || facultyArr[0]);
    }
    if (userTraits.some(t => ['reader','bookish','literary','writer','storyteller','verbal'].includes(t))) {
      return (fById('david_johnson') || fById('jamie_moore') || facultyArr[0]);
    }

    // 2. INTERESTS (MEDIUM PRIORITY)
    if (userInterests.some(i => ['arts','music','theater','drama','creative'].includes(i))) {
      return (fById('jeannine_elisha') || facultyArr[0]);
    }
    if (userInterests.some(i => ['athletics','sports','tennis','football'].includes(i))) {
      return (fById('tyler_cotton')?.videoUrl ? fById('tyler_cotton') : (fById('cole_hudson') || facultyArr[0]));
    }
    if (userInterests.some(i => ['stem','science','technology','engineering','robotics','coding','programming','math'].includes(i))) {
      return (fById('tyler_cotton') || facultyArr[0]);
    }
    if (userInterests.some(i => ['service','community','faith','church','spiritual'].includes(i))) {
      return (fById('cori_rigney') || facultyArr[0]);
    }
    if (userInterests.some(i => ['business','entrepreneurship','economics','leadership'].includes(i))) {
      return (fById('bernie_yanelli') || fById('patrick_whelan') || facultyArr[0]);
    }
    if (userInterests.some(i => ['english','writing','literature'].includes(i))) {
      return (fById('david_johnson') || fById('jamie_moore') || facultyArr[0]);
    }

    // 3. FAMILY VALUES (LOWEST PRIORITY)
    if (userFamilyValues.some(v => ['creative_expression','arts_focus','individual_creativity'].includes(v))) {
      return (fById('jeannine_elisha') || facultyArr[0]);
    }
    if (userFamilyValues.some(v => ['athletic_excellence','team_sports','physical_development'].includes(v))) {
      return (fById('tyler_cotton')?.videoUrl ? fById('tyler_cotton') : (fById('cole_hudson') || facultyArr[0]));
    }
    if (userFamilyValues.some(v => ['stem_innovation','technology_integration','academic_rigor'].includes(v))) {
      return (fById('tyler_cotton') || facultyArr[0]);
    }
    if (userFamilyValues.some(v => ['character_development','service_learning','faith_based_education'].includes(v))) {
      return (fById('cori_rigney') || facultyArr[0]);
    }

    // 4. GRADE-BASED DEFAULTS
    if (isLower && !userInterests.some(i => ['athletics','sports'].includes(i))) {
      return (fById('jennifer_batson') || fById('david_johnson') || fById('andrew_hasbrouck') || facultyArr[0]);
    }

    // 5. FALLBACK
    const videoFaculty = facultyArr.filter((f: any) => typeof f.videoUrl === 'string' && f.videoUrl.includes('youtube'));
    return (videoFaculty[0] || facultyArr[0]);
  };

  const student = pickStudent() as any;
  const faculty = pickFaculty() as any;
  const finalStories: StudentStory[] = [student].filter(Boolean) as any;
  const finalFaculty: FacultyProfile[] = [faculty].filter(Boolean) as any;

  const matchScore = 82 + (student?.videoUrl ? 4 : 0) + (faculty?.videoUrl ? 4 : 0);
  const personalizedMessage = baseMessage(quiz);

  return {
    matchScore,
    personalizedMessage,
    matchedStories: finalStories,
    matchedFaculty: finalFaculty,
    matchedFacts: [],
    keyInsights: keyInsightsFromInterests(userInterests),
    recommendedPrograms: recommendFromTraitsInterestsValues(userTraits, userInterests, userFamilyValues),
    provider: 'local',
  };
}

function calcScore(scoredStories: any[], scoredFaculty: any[]): number {
  const topStoryScore = scoredStories[0]?.score || 0;
  const topFacultyScore = scoredFaculty[0]?.score || 0;
  const base = 78;
  const bonus = Math.min((topStoryScore + topFacultyScore) / 4, 12);
  return Math.min(base + bonus, 93);
}

function baseMessage(quiz: QuizResponse): string {
  const interests = (quiz?.interests || []).slice(0, 2).join(' and ');
  return interests
    ? `Based on your interest in ${interests}, we believe Saint Stephen's could be an excellent fit. Our personalized approach and dedicated faculty create the perfect environment for your child to thrive.`
    : `We're excited to learn more about your child and show you what makes Saint Stephen's special!`;
}

function keyInsightsFromInterests(interests: string[]): string[] {
  const base = ['Academic Excellence', 'Character Development', 'Individual Attention'];
  if (interests.includes('arts') || interests.includes('creative')) return [...base, 'Creative Expression'];
  if (interests.includes('sports') || interests.includes('athletics')) return [...base, 'Athletic Development'];
  if (interests.includes('technology') || interests.includes('stem')) return [...base, 'STEM Innovation'];
  return [...base, 'Community Engagement'];
}

function recommendFromTraitsInterestsValues(traits: string[], interests: string[], familyValues: string[] = []): string[] {
  const programs = new Set<string>();
  
  // 1. CHILD DESCRIPTION TRAITS (HIGHEST PRIORITY) - max 1 program
  if (traits.some(t => ['creative','artistic','imaginative','expressive','visual','musical'].includes(t))) {
    programs.add('Fine Arts Program');
  } else if (traits.some(t => ['athletic','competitive','energetic','physical','strong','fast','sporty'].includes(t))) {
    programs.add('Athletics Program');
  } else if (traits.some(t => ['smart','intelligent','curious','analytical','logical','scientific','mathematical'].includes(t))) {
    programs.add('STEAM Program');
  } else if (traits.some(t => ['kind','caring','helpful','empathetic','compassionate','service'].includes(t))) {
    programs.add('Leadership & Service');
  } else if (traits.some(t => ['leader','confident','outgoing','social','charismatic','bold'].includes(t))) {
    programs.add('Leadership & Service');
  } else if (traits.some(t => ['reader','bookish','literary','writer','storyteller','verbal'].includes(t))) {
    programs.add('Advanced Academics');
  }
  
  // 2. INTERESTS (MEDIUM PRIORITY) - add 1 more if different
  if (programs.size < 2) {
    if (interests.some((i) => ['arts', 'music', 'drama', 'creative'].includes(i)) && !programs.has('Fine Arts Program')) {
      programs.add('Fine Arts Program');
    } else if (interests.some((i) => ['sports', 'athletics', 'competition'].includes(i)) && !programs.has('Athletics Program')) {
      programs.add('Athletics Program');
    } else if (interests.some((i) => ['science', 'technology', 'stem', 'engineering'].includes(i)) && !programs.has('STEAM Program')) {
      programs.add('STEAM Program');
    } else if (interests.some((i) => ['service', 'community', 'leadership'].includes(i)) && !programs.has('Leadership & Service')) {
      programs.add('Leadership & Service');
    }
  }
  
  // 3. FAMILY VALUES (LOWEST PRIORITY) - only if we need a third
  if (programs.size < 2) {
    if (familyValues.some(v => ['creative_expression','arts_focus','individual_creativity'].includes(v)) && !programs.has('Fine Arts Program')) {
      programs.add('Fine Arts Program');
    } else if (familyValues.some(v => ['athletic_excellence','team_sports','physical_development'].includes(v)) && !programs.has('Athletics Program')) {
      programs.add('Athletics Program');
    } else if (familyValues.some(v => ['stem_innovation','technology_integration','academic_rigor'].includes(v)) && !programs.has('STEAM Program')) {
      programs.add('STEAM Program');
    } else if (familyValues.some(v => ['service_learning','character_development','leadership_development'].includes(v)) && !programs.has('Leadership & Service')) {
      programs.add('Leadership & Service');
    }
  }
  
  // Always include College Prep as base, limit to 3 total
  const result = ['College Preparatory Program', ...Array.from(programs)];
  return result.slice(0, 3);
}

async function generatePersonalizedMessage(quiz: QuizResponse, deterministic: AnalysisResult): Promise<{ text: string; engine: string | null }> {
  const key = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  if (!key) return { text: deterministic.personalizedMessage, engine: null };

  const sys = [
    'You are an admissions guide writing a warm, specific summary for a visiting family.',
    'Write 2–4 concise sentences (no lists, no headings, no JSON).',
    'Mention the matched faculty by full name and title, and the matched student by name/role if available.',
    'Invite the family to meet the faculty member and see a relevant campus stop that aligns with interests.',
    'Keep the tone friendly, encouraging, and focused on long-term development and belonging.'
  ].join('\n');

  const userTraits = extractTraits(quiz);
  const user = `Student grade: ${quiz.gradeLevel}\nChild description: ${userTraits.join(', ')}\nInterests: ${(quiz.interests || []).join(', ')}\nFamily Values: ${(quiz.familyValues || []).join(', ')}\nMatched student story: ${deterministic.matchedStories?.[0]?.achievement || 'N/A'}\nMatched faculty: ${deterministic.matchedFaculty?.[0]?.firstName || 'N/A'} ${deterministic.matchedFaculty?.[0]?.lastName || ''} ${deterministic.matchedFaculty?.[0]?.title ? '(' + deterministic.matchedFaculty?.[0]?.title + ')' : ''}\nWrite a warm, specific encouragement that references the child's traits, interests, and these personalized matches.`;

  const useResponsesAPI = /gpt-5/i.test(model);
  const endpoint = useResponsesAPI ? 'responses' : 'chat/completions';
  const url = `${baseURL}/${endpoint}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
    'Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
    'X-Title': 'Had Me At Hello',
  };

  const messages = [
    { role: 'system', content: sys },
    { role: 'user', content: user }
  ];

  // For Responses API, construct typed content array per message
  const responsesInput = [
    { role: 'system', content: [{ type: 'text', text: sys }] },
    { role: 'user', content: [{ type: 'text', text: user }] }
  ];

  const body = useResponsesAPI
    ? { model, input: responsesInput, temperature: 0.5, max_output_tokens: 200 }
    : { model, messages, temperature: 0.5, max_tokens: 200 };

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  // Validate content-type to avoid HTML disguised as OK
  const ctype = res.headers.get('content-type') || '';
  if (!res.ok || !ctype.includes('application/json')) {
    let text = '';
    try { text = await res.text(); } catch {}
    console.error('LLM message request failed or non-JSON', { status: res.status, contentType: ctype, body: text.slice(0, 500) });
    // Retry once with a safe fallback model via chat/completions
    const fallbackModel = 'openai/gpt-4o-mini';
    try {
      const res2 = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: fallbackModel,
          messages,
          temperature: 0.5,
          max_tokens: 200,
        })
      });
      const ctype2 = res2.headers.get('content-type') || '';
      if (!res2.ok || !ctype2.includes('application/json')) {
        const txt2 = await res2.text();
        console.error('Fallback model also failed or non-JSON', { status: res2.status, contentType: ctype2, body: txt2.slice(0, 500) });
        throw new Error('Fallback model also failed');
      }
      const data2 = await res2.json();
      const txt = data2?.choices?.[0]?.message?.content || '';
      return { text: txt || deterministic.personalizedMessage, engine: fallbackModel };
    } catch (e) {
      // Give up on LLM message; use deterministic
      return { text: deterministic.personalizedMessage, engine: null };
    }
  }

  // Parse JSON response
  const data = await res.json();
  if (useResponsesAPI) {
    const output = Array.isArray(data?.output) ? data.output[0] : undefined;
    const parts = Array.isArray(output?.content) ? output.content : [];
    const textPart = parts.find((p: any) => typeof p?.text === 'string' || p?.type?.includes('text'));
    const txt = (textPart?.text || textPart?.content || textPart?.value || '').toString();
    return { text: txt || deterministic.personalizedMessage, engine: model };
  }
  const txt = data?.choices?.[0]?.message?.content || '';
  return { text: txt || deterministic.personalizedMessage, engine: model };
}
