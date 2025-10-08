"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMatchingProfile = buildMatchingProfile;
exports.selectMatchesWithMetadata = selectMatchesWithMetadata;
exports.computeCompositeScore = computeCompositeScore;
exports.summarizeMatches = summarizeMatches;
exports.debugScoreFaculty = debugScoreFaculty;
exports.debugScoreStory = debugScoreStory;
function buildMatchingProfile(params) {
    const { quiz, gradeLevel, traits, interests, primaryInterests, familyValues } = params;
    const gradeBand = normalizeGradeBand(gradeLevel);
    const descriptionText = `${quiz.childDescription || ''} ${quiz.threeWords || ''}`.toLowerCase();
    const normalizedInterests = normalizeSet(interests);
    const normalizedPrimaryInterests = normalizeSet(primaryInterests);
    const normalizedTraits = normalizeSet(traits);
    const normalizedValues = normalizeSet(familyValues);
    return {
        gradeBand,
        interests: normalizedInterests,
        primaryInterests: normalizedPrimaryInterests,
        traits: normalizedTraits,
        familyValues: normalizedValues,
        descriptionText,
    };
}
function selectMatchesWithMetadata(context, profile) {
    const stories = Array.isArray(context.stories) ? context.stories : [];
    const faculty = Array.isArray(context.faculty) ? context.faculty : [];
    const studentCandidates = stories.filter((story) => story && !story.classYear);
    const alumniCandidates = stories.filter((story) => story && story.classYear);
    const scoredStudents = studentCandidates
        .map((story) => ({ story, score: scoreStoryRecord(story, profile) }))
        .sort((a, b) => b.score - a.score);
    const bestStudentEntry = scoredStudents[0];
    const bestStudent = bestStudentEntry?.story || studentCandidates[0] || null;
    const scoredFaculty = faculty
        .map((member) => ({ member, score: scoreFacultyRecord(member, profile) }))
        .sort((a, b) => b.score - a.score);
    const bestFacultyEntry = scoredFaculty[0];
    const bestFaculty = bestFacultyEntry?.member || faculty[0] || null;
    let bestAlumni = null;
    let bestAlumniScore = 0;
    if (shouldIncludeAlumni(profile)) {
        const scoredAlumni = alumniCandidates
            .filter((story) => hasValidVideo(story.videoUrl))
            .map((story) => ({ story, score: scoreStoryRecord(story, profile) }))
            .filter((entry) => entry.score > 0)
            .sort((a, b) => b.score - a.score);
        if (scoredAlumni.length > 0) {
            bestAlumni = scoredAlumni[0].story;
            bestAlumniScore = scoredAlumni[0].score;
        }
    }
    return {
        student: bestStudent || null,
        faculty: bestFaculty || null,
        alumni: bestAlumni,
        studentScore: bestStudentEntry?.score || (bestStudent ? 20 : 0),
        facultyScore: bestFacultyEntry?.score || (bestFaculty ? 20 : 0),
        alumniScore: bestAlumniScore,
    };
}
function computeCompositeScore(selection) {
    const base = 82;
    const studentBonus = selection.student ? Math.min(selection.studentScore / 4, 10) : 0;
    const facultyBonus = selection.faculty ? Math.min(selection.facultyScore / 4, 10) : 0;
    const alumniBonus = selection.alumni ? Math.min(selection.alumniScore / 5, 6) : 0;
    const score = Math.round(Math.min(base + studentBonus + facultyBonus + alumniBonus, 96));
    return Math.max(score, 78);
}
function summarizeMatches(selection) {
    const highlights = [];
    if (selection.student) {
        highlights.push(selection.student.firstName || selection.student.achievement || 'one of our students');
    }
    if (selection.faculty) {
        const name = `${selection.faculty.formalTitle ? selection.faculty.formalTitle + ' ' : ''}${selection.faculty.lastName || selection.faculty.firstName || 'a faculty leader'}`.trim();
        highlights.push(name);
    }
    if (selection.alumni) {
        const alumniName = `${selection.alumni.firstName || 'an alumni'}${selection.alumni.lastName ? ` ${selection.alumni.lastName}` : ''}`.trim();
        highlights.push(alumniName);
    }
    const filtered = highlights.filter(Boolean);
    if (!filtered.length)
        return null;
    return formatList(filtered);
}
// Debug helpers (not used in production code but handy for tests)
function debugScoreFaculty(member, profile) {
    return scoreFacultyRecord(member, profile);
}
function debugScoreStory(story, profile) {
    return scoreStoryRecord(story, profile);
}
function scoreStoryRecord(story, profile) {
    let score = 12;
    const gradeBands = normalizeKeywords(story.gradeBands || (story.gradeLevel ? [story.gradeLevel] : []));
    score += gradeAlignmentScore(gradeBands, profile.gradeBand);
    const interestKeywords = normalizeKeywords(story.interestKeywords || story.interests || []);
    score += keywordMatchScore(interestKeywords, profile.interests, 8, 5);
    score += keywordMatchScore(interestKeywords, profile.familyValues, 4, 3);
    const personaDescriptors = normalizeKeywords(story.personaDescriptors || []);
    score += keywordMatchScore(personaDescriptors, profile.traits, 5, 3);
    if (profile.descriptionText && interestKeywords.some((kw) => profile.descriptionText.includes(kw))) {
        score += 3;
    }
    if (hasValidVideo(story.videoUrl))
        score += 14;
    if (Array.isArray(story.outcomeHighlights) && story.outcomeHighlights.length)
        score += 6;
    return score;
}
function scoreFacultyRecord(member, profile) {
    let score = 14;
    const gradeBands = normalizeKeywords(member.gradeBands && member.gradeBands.length ? member.gradeBands : deriveGradeBandsFromTitle(member.title));
    score += gradeAlignmentScore(gradeBands, profile.gradeBand);
    const interestPool = normalizeKeywords([...member.interestKeywords || [], ...(member.specializesIn || [])]);
    score += keywordMatchScore(interestPool, profile.interests, 10, 5);
    score += keywordMatchScore(interestPool, profile.familyValues, 5, 3);
    score += primaryInterestCoverageScore(interestPool, profile.primaryInterests);
    const personaDescriptors = normalizeKeywords(member.personaDescriptors || []);
    score += keywordMatchScore(personaDescriptors, profile.traits, 6, 3);
    if (hasValidVideo(member.videoUrl))
        score += 18;
    if ((Array.isArray(member.outcomeHighlights) && member.outcomeHighlights.length) || (Array.isArray(member.awards) && member.awards.length)) {
        score += 7;
    }
    return score;
}
function keywordMatchScore(source, targets, weight, maxMatches = 4) {
    if (!source.length || !targets.length)
        return 0;
    const normalizedTargets = targets.map((target) => target.replace(/[_-]/g, ' '));
    let matches = 0;
    let score = 0;
    for (const term of source) {
        const normalizedTerm = term.replace(/[_-]/g, ' ');
        if (normalizedTargets.some((target) => normalizedTerm.includes(target) || target.includes(normalizedTerm))) {
            score += weight;
            matches += 1;
            if (matches >= maxMatches)
                break;
        }
    }
    return score;
}
function gradeAlignmentScore(bands, gradeBand) {
    if (!gradeBand)
        return 10;
    const normalizedBands = bands.length ? bands : ['all'];
    if (normalizedBands.includes('all'))
        return 15;
    if (normalizedBands.includes(gradeBand))
        return 24;
    const neighborMap = {
        lower: ['intermediate'],
        intermediate: ['lower', 'middle'],
        middle: ['intermediate', 'upper'],
        upper: ['middle'],
    };
    if (neighborMap[gradeBand]?.some((neighbor) => normalizedBands.includes(neighbor))) {
        return 18;
    }
    return 8;
}
function normalizeGradeBand(gradeLevel) {
    const lowerGrade = (gradeLevel || '').toLowerCase();
    if (['lower', 'elementary', 'prek-k', 'prek', 'pre-k'].includes(lowerGrade))
        return 'lower';
    if (['intermediate'].includes(lowerGrade))
        return 'intermediate';
    if (['middle'].includes(lowerGrade))
        return 'middle';
    if (['upper', 'high', 'hs'].includes(lowerGrade))
        return 'upper';
    return 'middle';
}
function deriveGradeBandsFromTitle(title) {
    const lowerTitle = (title || '').toLowerCase();
    if (!lowerTitle)
        return ['all'];
    if (lowerTitle.includes('upper'))
        return ['upper'];
    if (lowerTitle.includes('middle') || lowerTitle.includes('6th'))
        return ['middle'];
    if (lowerTitle.includes('lower') || lowerTitle.includes('intermediate'))
        return ['lower'];
    return ['all'];
}
function shouldIncludeAlumni(profile) {
    const combined = `${profile.interests.join(' ')} ${profile.traits.join(' ')} ${profile.familyValues.join(' ')} ${profile.descriptionText}`;
    const athleticsRegex = /(athletic|athletics|sport|football|soccer|lacrosse|track|field|volleyball|basketball)/i;
    const medicalRegex = /(medical|medicine|doctor|pre[-\s]?med|premed|health|healthcare|physician)/i;
    return athleticsRegex.test(combined) || medicalRegex.test(combined);
}
function normalizeSet(values) {
    return Array.from(new Set((values || []).map((value) => value.toLowerCase()).filter(Boolean)));
}
function normalizeKeywords(list) {
    if (!Array.isArray(list))
        return [];
    return Array.from(new Set(list
        .map((item) => (item || '').toString().toLowerCase().trim())
        .filter(Boolean)));
}
const INTEREST_SYNONYMS = {
    stem: ['stem', 'science', 'technology', 'engineering', 'math', 'steam', 'robotics', 'coding', 'programming'],
    athletics: ['athletics', 'athletic', 'sports', 'sport', 'football', 'soccer', 'lacrosse', 'baseball', 'basketball', 'track', 'field', 'volleyball', 'tennis'],
    arts: ['art', 'arts', 'creative', 'creativity', 'theater', 'drama', 'visual', 'design', 'performing', 'music'],
    media: ['media', 'journalism', 'broadcast', 'filmmaking', 'storytelling', 'video'],
    service: ['service', 'community', 'volunteer', 'leadership', 'mentorship'],
    business: ['business', 'entrepreneurship', 'economics', 'finance'],
    technology: ['technology', 'coding', 'computer', 'robotics', 'programming'],
};
function primaryInterestCoverageScore(source, primaryInterests) {
    if (!source.length || !primaryInterests.length)
        return 0;
    let score = 0;
    for (const interest of primaryInterests) {
        const synonyms = INTEREST_SYNONYMS[interest] || [interest];
        const matched = source.some((term) => synonyms.some((syn) => term.includes(syn) || syn.includes(term)));
        if (matched) {
            score += 8;
        }
    }
    return score;
}
function hasValidVideo(url) {
    return !!(url && (url.includes('youtube.com') || url.includes('youtu.be')));
}
function formatList(items) {
    if (items.length === 1)
        return items[0];
    if (items.length === 2)
        return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
