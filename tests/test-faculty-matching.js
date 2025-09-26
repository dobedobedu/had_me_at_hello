// Test Faculty Matching Logic
// This script tests various student profiles to see which teachers get matched

const facultyData = require('./knowledge/faculty-story.json');

// Extract the matching logic from the route (simplified for testing)
function sanitizeArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((x) => typeof x === 'string' && x.trim().length > 0).map((s) => s.toLowerCase());
}

function extractTraits(quiz) {
  const traits = [];
  traits.push(...sanitizeArray(quiz?.selectedCharacteristics || []));

  // PRIORITIZE threeWords first (more focused), then childDescription
  const threeWords = quiz?.threeWords?.toLowerCase() || '';
  const childDescription = quiz?.childDescription?.toLowerCase() || '';
  const desc = threeWords || childDescription;

  if (desc) {
    const tokens = desc.match(/[a-zA-Z][a-zA-Z\-]+/g) || [];
    const stop = new Set(['and','the','a','an','of','to','with','who','is','are','for','about','very','really','child','kid','student','my']);
    const picked = [];
    for (const t of tokens) {
      if (!stop.has(t) && picked.indexOf(t) === -1) picked.push(t);
      if (picked.length >= 5) break;
    }
    traits.push(...picked);

    // If we used threeWords and have space, also include some from childDescription
    if (threeWords && childDescription && picked.length < 5) {
      const descTokens = childDescription.match(/[a-zA-Z][a-zA-Z\-]+/g) || [];
      for (const t of descTokens) {
        if (!stop.has(t) && picked.indexOf(t) === -1 && traits.indexOf(t) === -1) {
          traits.push(t);
          if (traits.length >= 7) break;
        }
      }
    }
  }
  return traits;
}

function expandInterests(ints) {
  const map = {
    athletics: ['sports','tennis','soccer','basketball','football','swimming','track','golf','volleyball','competition','team','fitness','athletic'],
    stem: ['science','technology','engineering','math','robotics','coding','programming','computer','steam','physics','chemistry','biology'],
    creativity: ['arts','art','visual','design','music','theater','drama','writing','literature','media','film','photography','creative'],
    community: ['service','volunteer','leadership','mentorship','church','faith','spiritual','religious','community'],
  };
  const out = new Set();
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

// Updated faculty matching logic
function pickFaculty(quiz, facultyArr) {
  const userTraits = extractTraits(quiz);
  const userInterests = expandInterests(sanitizeArray(quiz?.interests || []));
  const userFamilyValues = sanitizeArray(quiz?.familyValues || []);
  const userGrade = quiz?.gradeLevel || 'middle';

  const fById = (id) => facultyArr.find((f) => f.id === id);

  const isLower = userGrade === 'lower' || userGrade === 'elementary';
  const isIntermediate = userGrade === 'intermediate';
  const isMiddle = userGrade === 'middle';
  const isUpper = userGrade === 'upper' || userGrade === 'high';

  // Helper to pick grade-appropriate faculty
  const pickByGrade = (lowerIds, middleIds, upperIds, fallback) => {
    if (isLower) return lowerIds.map(fById).filter(Boolean)[0];
    if (isIntermediate || isMiddle) return middleIds.map(fById).filter(Boolean)[0];
    if (isUpper) return upperIds.map(fById).filter(Boolean)[0];
    return fallback.map(fById).filter(Boolean)[0] || facultyArr[0];
  };

  // 1. CHILD DESCRIPTION TRAITS (HIGHEST PRIORITY)
  if (userTraits.some(t => ['creative','artistic','imaginative','expressive','visual','musical'].includes(t))) {
    return (fById('jeannine_elisha') || fById('julianne_hambrick') || facultyArr[0]);
  }
  if (userTraits.some(t => ['athletic','competitive','energetic','physical','strong','fast','sporty'].includes(t))) {
    return (fById('tyler_cotton')?.videoUrl ? fById('tyler_cotton') : (fById('cole_hudson') || facultyArr[0]));
  }
  if (userTraits.some(t => ['smart','intelligent','curious','analytical','logical','scientific','mathematical'].includes(t))) {
    return pickByGrade(
      ['mandy_herren'], // Lower: Mrs. Herren (Science)
      ['andrew_angelo'], // Middle: Mr. Angelo (Science)
      ['rachel_ward', 'tyler_cotton'], // Upper: Dr. Ward (Chemistry) or Mr. Cotton (Math)
      ['tyler_cotton', 'rachel_ward', 'andrew_angelo']
    );
  }
  if (userTraits.some(t => ['kind','caring','helpful','empathetic','compassionate','service'].includes(t))) {
    return (fById('cori_rigney') || facultyArr[0]);
  }
  if (userTraits.some(t => ['leader','confident','outgoing','social','charismatic','bold'].includes(t))) {
    return pickByGrade(
      ['cori_rigney'], // Lower: Chaplain for character development
      ['chris_valcarcel'], // Middle: World Culture
      ['patrick_whelan', 'bernie_yanelli'], // Upper: PRIORITY Teacher of the Year
      ['patrick_whelan', 'bernie_yanelli']
    );
  }
  if (userTraits.some(t => ['reader','bookish','literary','writer','storyteller','verbal'].includes(t))) {
    return pickByGrade(
      ['jennifer_batson'], // Lower: Reading specialist (though she's middle school)
      ['tanya_creneti', 'jennifer_batson'], // Middle: 6th grade English or Reading
      ['david_johnson'], // Upper: English teacher
      ['david_johnson', 'tanya_creneti', 'jennifer_batson']
    );
  }

  // 2. INTERESTS (MEDIUM PRIORITY)
  if (userInterests.some(i => ['arts','music','theater','drama','creative'].includes(i))) {
    return (fById('jeannine_elisha') || fById('julianne_hambrick') || facultyArr[0]);
  }
  if (userInterests.some(i => ['athletics','sports','tennis','football'].includes(i))) {
    return (fById('tyler_cotton')?.videoUrl ? fById('tyler_cotton') : (fById('cole_hudson') || facultyArr[0]));
  }
  if (userInterests.some(i => ['stem','science','technology','engineering','robotics','coding','programming','math'].includes(i))) {
    return pickByGrade(
      ['mandy_herren'], // Lower: Science
      ['andrew_angelo'], // Middle: Science
      ['rachel_ward', 'tyler_cotton'], // Upper: Chemistry or Math/Engineering
      ['tyler_cotton', 'rachel_ward', 'andrew_angelo']
    );
  }
  if (userInterests.some(i => ['service','community','faith','church','spiritual'].includes(i))) {
    return (fById('cori_rigney') || facultyArr[0]);
  }
  if (userInterests.some(i => ['business','entrepreneurship','economics','leadership'].includes(i))) {
    return (fById('bernie_yanelli') || fById('patrick_whelan') || facultyArr[0]);
  }
  if (userInterests.some(i => ['english','writing','literature'].includes(i))) {
    return pickByGrade(
      ['jennifer_batson'], // Lower: Reading (closest match)
      ['tanya_creneti', 'jennifer_batson'], // Middle: 6th grade English or Reading
      ['david_johnson'], // Upper: English
      ['david_johnson', 'tanya_creneti']
    );
  }
  if (userInterests.some(i => ['spanish','language','cultural','world'].includes(i))) {
    return (fById('jennifer_hambrick_spanish') || fById('chris_valcarcel') || facultyArr[0]);
  }

  // 4. GRADE-BASED DEFAULTS
  if (isLower && !userInterests.some(i => ['athletics','sports'].includes(i))) {
    return (fById('mandy_herren') || fById('andrew_hasbrouck') || facultyArr[0]);
  }
  if ((isIntermediate || isMiddle) && !userInterests.some(i => ['athletics','sports'].includes(i))) {
    return (fById('tanya_creneti') || fById('jennifer_batson') || fById('andrew_angelo') || facultyArr[0]);
  }
  if (isUpper && !userInterests.some(i => ['athletics','sports'].includes(i))) {
    return (fById('patrick_whelan') || fById('david_johnson') || fById('rachel_ward') || facultyArr[0]);
  }

  // 5. FALLBACK
  const videoFaculty = facultyArr.filter((f) => typeof f.videoUrl === 'string' && f.videoUrl.includes('youtube'));
  return (videoFaculty[0] || facultyArr[0]);
}

// TEST SCENARIOS
const testScenarios = [
  {
    name: "Lower School STEM Kid",
    quiz: {
      gradeLevel: 'lower',
      childDescription: 'curious analytical smart',
      interests: ['science', 'robotics'],
      familyValues: ['stem_innovation']
    }
  },
  {
    name: "Upper School STEM Kid",
    quiz: {
      gradeLevel: 'upper',
      childDescription: 'intelligent logical mathematical',
      interests: ['chemistry', 'engineering'],
      familyValues: ['academic_rigor']
    }
  },
  {
    name: "Middle School Creative Kid",
    quiz: {
      gradeLevel: 'middle',
      childDescription: 'artistic imaginative creative',
      interests: ['theater', 'music'],
      familyValues: ['creative_expression']
    }
  },
  {
    name: "Upper School Leader",
    quiz: {
      gradeLevel: 'upper',
      childDescription: 'confident outgoing charismatic',
      interests: ['leadership', 'history'],
      familyValues: ['leadership_development']
    }
  },
  {
    name: "6th Grade English Lover",
    quiz: {
      gradeLevel: 'middle',
      childDescription: 'reader bookish literary',
      interests: ['writing', 'literature'],
      familyValues: ['academic_excellence']
    }
  },
  {
    name: "Intermediate Spanish Interest",
    quiz: {
      gradeLevel: 'intermediate',
      childDescription: 'outgoing social',
      interests: ['spanish', 'cultural'],
      familyValues: ['global_awareness']
    }
  },
  {
    name: "Lower School Default",
    quiz: {
      gradeLevel: 'lower',
      childDescription: 'sweet kind happy',
      interests: [],
      familyValues: ['nurturing_environment']
    }
  },
  {
    name: "Upper School Default",
    quiz: {
      gradeLevel: 'upper',
      childDescription: 'nice good student',
      interests: [],
      familyValues: ['college_prep']
    }
  },
  {
    name: "Three Words Priority Test",
    quiz: {
      gradeLevel: 'middle',
      threeWords: 'creative artistic musical',
      childDescription: 'My child is really smart and loves math and science',
      interests: ['theater'],
      familyValues: []
    }
  },
  {
    name: "Athletics Test",
    quiz: {
      gradeLevel: 'upper',
      threeWords: 'athletic competitive energetic',
      interests: ['athletics', 'sports'],
      familyValues: []
    }
  },
  {
    name: "Entrepreneurship Test",
    quiz: {
      gradeLevel: 'upper',
      threeWords: 'entrepreneurial business-minded innovative',
      interests: ['entrepreneurship', 'business'],
      familyValues: []
    }
  },
  {
    name: "Environment Community Test",
    quiz: {
      gradeLevel: 'middle',
      threeWords: 'environmental community service',
      interests: ['environment', 'community', 'service'],
      familyValues: []
    }
  },
  {
    name: "Beach Environment Test",
    quiz: {
      gradeLevel: 'upper',
      threeWords: 'beach environmental nature',
      interests: ['beach', 'environment'],
      familyValues: []
    }
  }
];

console.log('🧪 TESTING FACULTY MATCHING LOGIC\n');
console.log('=' .repeat(60));

testScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`);
  console.log('-'.repeat(40));

  const traits = extractTraits(scenario.quiz);
  const interests = expandInterests(scenario.quiz.interests || []);

  console.log(`Grade: ${scenario.quiz.gradeLevel}`);
  console.log(`Traits: ${traits.join(', ')}`);
  console.log(`Interests: ${interests.slice(0, 5).join(', ')}`);

  const matchedFaculty = pickFaculty(scenario.quiz, facultyData.faculty);

  if (matchedFaculty) {
    console.log(`✅ MATCHED: ${matchedFaculty.formalTitle} ${matchedFaculty.lastName}`);
    console.log(`   Role: ${matchedFaculty.title}`);
    console.log(`   Department: ${matchedFaculty.department}`);
    console.log(`   Has Video: ${matchedFaculty.videoUrl ? '🎥 YES' : '❌ NO'}`);

    // Show why this match was made
    const reasonTraits = traits.filter(t =>
      matchedFaculty.specializesIn?.some(spec =>
        spec.includes(t) || t.includes(spec.replace('_', ''))
      )
    );
    if (reasonTraits.length > 0) {
      console.log(`   Trait Match: ${reasonTraits.join(', ')}`);
    }
  } else {
    console.log('❌ NO MATCH FOUND');
  }
});

console.log('\n' + '='.repeat(60));
console.log('🎯 SUMMARY: Each scenario should show different teachers!');