// PROPOSED EMBEDDING ENHANCEMENT FOR VIDEO SURFACING

function buildEnhancedEmbeddingText(item: any, category: string): string {
  const videoKeywords = item.videoUrl ? [
    'authentic video testimonial',
    'visual story',
    'compelling narrative',
    'student voice',
    'genuine experience',
    'engaging content',
    'personal connection',
    'real student perspective'
  ] : [];

  const emotionalContext = getEmotionalContext(item, category);
  const authenticityMarkers = getAuthenticityMarkers(item, category);

  if (category === 'student') {
    return [
      `Student: ${item.firstName}`,
      item.videoUrl ? 'VIDEO TESTIMONIAL AVAILABLE: Real student sharing authentic experience' : '',
      `Story: ${item.achievement}`,
      `Interests: ${item.interests.join(', ')}`,
      item.storyTldr ? `Summary: ${item.storyTldr}` : '',
      item.personaDescriptors ? `Personality: ${item.personaDescriptors.join(', ')}` : '',
      item.interestKeywords ? `Keywords: ${item.interestKeywords.join(', ')}` : '',

      // Enhanced emotional/engagement markers
      item.videoUrl ? 'Student speaking directly to camera about their experience' : '',
      emotionalContext.join(', '),
      authenticityMarkers.join(', '),
      videoKeywords.join(', '),

      item.gradeLevel ? `Grade: ${item.gradeLevel}` : '',
      item.gradeBands ? `Grades: ${item.gradeBands.join('/')}` : '',
      item.parentQuote ? `Parent: "${item.parentQuote}"` : '',
      item.studentQuote ? `Student: "${item.studentQuote}"` : ''
    ].filter(Boolean).join('. ');
  }

  // Similar enhancements for faculty and alumni...
}

function getEmotionalContext(item: any, category: string): string[] {
  const contexts = [];

  if (item.videoUrl) {
    contexts.push('engaging visual story');
    contexts.push('authentic peer connection');
    contexts.push('emotional resonance');

    if (category === 'student') {
      contexts.push('relatable student journey');
      contexts.push('inspiring academic growth');
    }

    if (category === 'faculty') {
      contexts.push('teaching philosophy demonstration');
      contexts.push('mentorship style showcase');
    }
  }

  return contexts;
}

function getAuthenticityMarkers(item: any, category: string): string[] {
  const markers = [];

  if (item.videoUrl) {
    markers.push('unscripted genuine response');
    markers.push('natural student expression');
    markers.push('real school environment');

    if (item.studentQuote) {
      markers.push('direct student testimony');
    }

    if (item.parentQuote) {
      markers.push('parent validation included');
    }
  }

  return markers;
}

// EXAMPLE OUTPUT:
// OLD: "Student: Isabelle. Story: Athletic excellence. Interests: athletics, sports..."
//
// NEW: "Student: Isabelle. VIDEO TESTIMONIAL AVAILABLE: Real student sharing authentic experience.
//      Story: Athletic excellence. Interests: athletics, sports. Student speaking directly to camera
//      about their experience. engaging visual story, authentic peer connection, emotional resonance,
//      relatable student journey, inspiring academic growth. unscripted genuine response, natural
//      student expression, real school environment, direct student testimony, parent validation included.
//      authentic video testimonial, visual story, compelling narrative..."