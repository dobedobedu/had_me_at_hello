# Had Me At Hello — Agent Overview

This doc explains how matching works now, how to add content, and how to test.

## Summary

- We use a hybrid approach:
  - Deterministic selection (server-side) picks exactly 1 student video + 1 faculty, video-first and grade-aware.
  - The LLM is optional and only writes a short warm summary; matching never depends on LLM JSON.

## Deterministic Routing (Real Assets Only)

Student video selection (in order):
- Lower/Intermediate: `lower_school_parents` → `student_teacher_relationships`
- Athletics: `athletics_excellence` (preferred) → `athletics_spotlight` → `student_teacher_relationships`
- Arts/Theater/Music: `creative_arts` → `student_teacher_relationships`
- STEM/Tech/Robotics/Coding/Math: `academic_excellence` → `student_teacher_relationships`
- Default: `student_teacher_relationships`

Faculty selection (grade-aware, video-first when possible):
- Lower/Intermediate: `jennifer_batson` → `david_johnson` → `andrew_hasbrouck`
- STEM: `tyler_cotton`
- History/Gov/Social Studies: `patrick_whelan`
- Business/Entrepreneurship/Economics: `bernie_yanelli` (fallback `patrick_whelan`)
- English/Writing/Literature: `david_johnson` (fallback `jamie_moore`)
- Arts/Drama/Music: `jeannine_elisha`
- Athletics: prefer video faculty if available, else `cole_hudson`
- Service/Community/Faith: `cori_rigney`
- Fallback: first video faculty, else any faculty

Scoring is a small add-on just to compute `matchScore`; cards are selected by routing, not scored search.

## Knowledge Base (Real only)

- Students: `knowledge/current-student-stories.json` (videos only; no placeholders)
- Alumni: `knowledge/alumni-story.json` (kept only if photo or video is real)
- Faculty: `knowledge/faculty-story.json` (real photos; videos preferred)
- Facts: `knowledge/facts.json` (anchors for facilities/programs; includes Coach Brown athletics and REEF marine science videos)

Canonical interest tags:
- athletics: `athletics`, `sports`, `tennis`, `football`, `competition`, `teamwork`, `fitness`
- stem: `stem`, `science`, `technology`, `engineering`, `robotics`, `coding`, `programming`, `math`, `research`
- arts: `arts`, `music`, `theater`, `drama`, `creative`, `design`, `media`
- community: `service`, `community`, `faith`, `church`, `spiritual`
- business: `business`, `entrepreneurship`, `economics`, `leadership`

## LLM (Optional)

- The LLM is used only for a 2–4 sentence warm summary.
- Server calls OpenRouter (Responses API for GPT-5; Chat Completions otherwise). If it fails, we keep deterministic text.

## Environment

- `.env.local` (example):
  - `OPENROUTER_API_KEY=sk-or-...`
  - `OPENROUTER_MODEL=openai/gpt-5-nano` (or `openai/gpt-4o-mini`)
  - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
  - `NEXT_PUBLIC_ADMIN_PASSWORD=change_me`

## Testing

- Run: `npm test`
- Key files:
  - `tests/top-scenarios.test.ts`: 20 representative quizzes → should return valid matches.
  - `tests/routing.test.ts`: Asserts deterministic routing picks the expected student/faculty by interest/grade.
  - `tests/knowledge-base.test.ts`: Validates data structure & coverage; may require updating content if expectations change.
  - `tests/rag-accuracy.test.ts`: Broader expectations. If network is unavailable, the client falls back to deterministic; adjust data accordingly.

## Adding Content

- Students (videos): prefer YouTube; set `gradeLevel` and `category` where possible.
- Faculty: include `department` (e.g., `Science & Mathematics`, `Social Studies`, `English`, `Arts`, `Athletics`, `Business`). Add `videoUrl` when you have it.
- Alumni: only real `photoUrl` or `videoUrl`. Keep `interests` aligned to canonical tags above.

## UI Notes

- Home hero has reduced motion + fade; Results shows only the essentials: percent match, cards, and tour builder.
- Confetti triggers once per session.
- Swipeable cards support drag on touch; arrows removed per KISS.

