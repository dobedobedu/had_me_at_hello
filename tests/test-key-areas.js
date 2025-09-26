// Test Key Areas: Academics, Environment Science, International Students, Athletics
// This ensures we have proper teacher matching for main student types

const facultyData = require('./knowledge/faculty-story.json');

// Reuse the matching logic
function sanitizeArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((x) => typeof x === 'string' && x.trim().length > 0).map((s) => s.toLowerCase());
}

function extractTraits(quiz) {
  const traits = [];
  traits.push(...sanitizeArray(quiz?.selectedCharacteristics || []));

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

// Simplified matching logic (same as updated route)
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
      ['mandy_herren'],
      ['andrew_angelo'],
      ['rachel_ward', 'tyler_cotton'],
      ['tyler_cotton', 'rachel_ward', 'andrew_angelo']
    );
  }
  if (userTraits.some(t => ['kind','caring','helpful','empathetic','compassionate','service'].includes(t))) {
    return (fById('cori_rigney') || facultyArr[0]);
  }
  if (userTraits.some(t => ['leader','confident','outgoing','social','charismatic','bold'].includes(t))) {
    return pickByGrade(
      ['cori_rigney'],
      ['chris_valcarcel'],
      ['patrick_whelan', 'bernie_yanelli'],
      ['patrick_whelan', 'bernie_yanelli']
    );
  }
  if (userTraits.some(t => ['reader','bookish','literary','writer','storyteller','verbal'].includes(t))) {
    return pickByGrade(
      ['jennifer_batson'],
      ['tanya_creneti', 'jennifer_batson'],
      ['david_johnson'],
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
      ['mandy_herren'],
      ['andrew_angelo'],
      ['rachel_ward', 'tyler_cotton'],
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
      ['jennifer_batson'],
      ['tanya_creneti', 'jennifer_batson'],
      ['david_johnson'],
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

  const videoFaculty = facultyArr.filter((f) => typeof f.videoUrl === 'string' && f.videoUrl.includes('youtube'));
  return (videoFaculty[0] || facultyArr[0]);
}

// KEY AREA TEST SCENARIOS
const keyAreaTests = {
  academics: [
    {
      name: "Lower School Academic Excellence",
      quiz: {
        gradeLevel: 'lower',
        threeWords: 'smart curious studious',
        interests: ['reading', 'math'],
        familyValues: ['academic_excellence']
      }
    },
    {
      name: "Middle School Honor Student",
      quiz: {
        gradeLevel: 'middle',
        threeWords: 'intelligent analytical focused',
        interests: ['literature', 'writing'],
        familyValues: ['academic_rigor']
      }
    },
    {
      name: "Upper School College Prep",
      quiz: {
        gradeLevel: 'upper',
        threeWords: 'scholarly ambitious driven',
        interests: ['advanced_academics', 'college_prep'],
        familyValues: ['college_preparation']
      }
    }
  ],

  environment_science: [
    {
      name: "Lower School Nature Lover",
      quiz: {
        gradeLevel: 'lower',
        threeWords: 'curious nature-loving scientific',
        interests: ['science', 'environment', 'animals'],
        familyValues: ['environmental_awareness']
      }
    },
    {
      name: "Middle School Environmental Scientist",
      quiz: {
        gradeLevel: 'middle',
        threeWords: 'environmental analytical investigative',
        interests: ['environmental_science', 'biology', 'conservation'],
        familyValues: ['stem_innovation']
      }
    },
    {
      name: "Upper School Marine Science",
      quiz: {
        gradeLevel: 'upper',
        threeWords: 'scientific research-oriented environmental',
        interests: ['marine_biology', 'chemistry', 'research'],
        familyValues: ['scientific_inquiry']
      }
    }
  ],

  international: [
    {
      name: "Intermediate School Global Citizen",
      quiz: {
        gradeLevel: 'intermediate',
        threeWords: 'multicultural globally-minded curious',
        interests: ['world_cultures', 'languages', 'travel'],
        familyValues: ['global_awareness']
      }
    },
    {
      name: "6th Grade Spanish Learner",
      quiz: {
        gradeLevel: 'middle',
        threeWords: 'bilingual cultural internationally-minded',
        interests: ['spanish', 'cultural_exchange'],
        familyValues: ['language_learning']
      }
    },
    {
      name: "Upper School International Relations",
      quiz: {
        gradeLevel: 'upper',
        threeWords: 'diplomatic globally-aware culturally-sensitive',
        interests: ['international_relations', 'history', 'diplomacy'],
        familyValues: ['global_perspective']
      }
    }
  ],

  athletics: [
    {
      name: "Lower School Active Kid",
      quiz: {
        gradeLevel: 'lower',
        threeWords: 'energetic athletic active',
        interests: ['sports', 'teamwork', 'fitness'],
        familyValues: ['physical_development']
      }
    },
    {
      name: "Middle School Team Captain",
      quiz: {
        gradeLevel: 'middle',
        threeWords: 'competitive team-oriented athletic',
        interests: ['basketball', 'leadership', 'competition'],
        familyValues: ['team_sports']
      }
    },
    {
      name: "Upper School Varsity Athlete",
      quiz: {
        gradeLevel: 'upper',
        threeWords: 'athletic dedicated competitive',
        interests: ['varsity_sports', 'fitness', 'team_leadership'],
        familyValues: ['athletic_excellence']
      }
    }
  ]
};

console.log('🎯 KEY AREAS FACULTY MATCHING TEST');
console.log('Testing: Academics, Environment Science, International, Athletics\n');
console.log('='.repeat(70));

Object.entries(keyAreaTests).forEach(([area, tests]) => {
  console.log(`\n📚 ${area.toUpperCase().replace('_', ' ')}`);
  console.log('='.repeat(50));

  tests.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name}`);
    console.log('-'.repeat(30));

    const traits = extractTraits(scenario.quiz);
    const interests = expandInterests(scenario.quiz.interests || []);

    console.log(`Grade: ${scenario.quiz.gradeLevel}`);
    console.log(`Three Words: ${scenario.quiz.threeWords}`);
    console.log(`Extracted Traits: ${traits.join(', ')}`);
    console.log(`Expanded Interests: ${interests.slice(0, 6).join(', ')}`);

    const matchedFaculty = pickFaculty(scenario.quiz, facultyData.faculty);

    if (matchedFaculty) {
      console.log(`✅ MATCHED: ${matchedFaculty.formalTitle} ${matchedFaculty.lastName}`);
      console.log(`   Role: ${matchedFaculty.title}`);
      console.log(`   Department: ${matchedFaculty.department}`);
      console.log(`   Has Video: ${matchedFaculty.videoUrl ? '🎥 YES' : '❌ NO'}`);

      // Show matching logic reasoning
      const traitMatches = traits.filter(t =>
        matchedFaculty.specializesIn?.some(spec =>
          spec.includes(t) || t.includes(spec.replace('_', ''))
        )
      );
      if (traitMatches.length > 0) {
        console.log(`   🎯 Trait Match: ${traitMatches.join(', ')}`);
      }

      const interestMatches = interests.filter(i =>
        matchedFaculty.specializesIn?.some(spec =>
          spec.includes(i) || i.includes(spec.replace('_', ''))
        )
      );
      if (interestMatches.length > 0) {
        console.log(`   🎯 Interest Match: ${interestMatches.join(', ')}`);
      }
    } else {
      console.log('❌ NO MATCH FOUND');
    }
  });
});

console.log('\n' + '='.repeat(70));
console.log('📊 COVERAGE ANALYSIS:');
console.log('✅ Academics: Should show various teachers by grade level');
console.log('✅ Environment Science: Should prioritize science teachers by grade');
console.log('✅ International: Should show Spanish/World Culture teachers');
console.log('✅ Athletics: Should show athletic/competitive matches');
console.log('\n🎯 Goal: Each area should demonstrate diverse, appropriate matches!');