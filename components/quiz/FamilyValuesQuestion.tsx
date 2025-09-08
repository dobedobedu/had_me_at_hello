import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Award, Globe, Heart, Shield, Sparkles, Trophy, BookOpen, Rocket, Brain, Palette, Map } from 'lucide-react';

interface FamilyValuesQuestionProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isLastStep: boolean;
  isSubmitting: boolean;
}

// Grade-specific values based on Saint Stephen's actual offerings
const VALUES_BY_GRADE: Record<string, Array<{
  id: string;
  title: string;
  description: string;
  icon: any;
  metric: string;
  metricLabel: string;
  details: string[];
}>> = {
  'prek-k': [
    {
      id: 'safe_nurturing',
      title: 'Safe & Nurturing Environment',
      description: 'Small classes with caring teachers',
      icon: Shield,
      metric: '10:1',
      metricLabel: 'Student-Teacher Ratio',
      details: [
        'Dedicated early childhood specialists',
        'Age-appropriate play spaces',
        'Social-emotional learning focus',
        'Gentle transition to school'
      ]
    },
    {
      id: 'play_based_learning',
      title: 'Play-Based Learning',
      description: 'Learning through exploration and discovery',
      icon: Sparkles,
      metric: 'Daily',
      metricLabel: 'Creative Activities',
      details: [
        'Hands-on exploration centers',
        'Music and movement daily',
        'Art and imagination time',
        'Outdoor discovery learning'
      ]
    },
    {
      id: 'reading_readiness',
      title: 'Reading & Language Foundation',
      description: 'Building blocks for literacy',
      icon: BookOpen,
      metric: '100%',
      metricLabel: 'Kindergarten Ready',
      details: [
        'Phonics and letter recognition',
        'Story time and comprehension',
        'Writing readiness activities',
        'Language development focus'
      ]
    },
    {
      id: 'social_skills',
      title: 'Social Development',
      description: 'Learning to share, cooperate, and make friends',
      icon: Users,
      metric: 'Daily',
      metricLabel: 'Social Skills Practice',
      details: [
        'Sharing and turn-taking',
        'Conflict resolution skills',
        'Making friends activities',
        'Group collaboration projects'
      ]
    }
  ],
  
  'lower': [
    {
      id: 'safe_caring_community',
      title: 'Safe & Caring Community',
      description: 'Nurturing environment for young learners',
      icon: Shield,
      metric: '100%',
      metricLabel: 'Anti-Bullying Commitment',
      details: [
        'Full-time counselors available',
        'Positive behavior support systems',
        'Small, supportive class sizes',
        'Social-emotional learning curriculum'
      ]
    },
    {
      id: 'project_based_learning',
      title: 'Project-Based Learning',
      description: 'Hands-on, imaginative learning experiences',
      icon: Rocket,
      metric: 'Transformative',
      metricLabel: 'Learning Experiences',
      details: [
        'Space exploration classroom themes',
        'Interactive science projects',
        'Creative problem-solving',
        'Real-world applications'
      ]
    },
    {
      id: 'character_building',
      title: 'Character Development',
      description: 'Building values and community service',
      icon: Heart,
      metric: 'Weekly',
      metricLabel: 'Service Activities',
      details: [
        'Nursing home visits',
        'Guide dog school partnerships',
        'Chapel programs',
        'Honor code introduction'
      ]
    },
    {
      id: 'academic_fundamentals',
      title: 'Strong Academic Foundation',
      description: 'Core skills in reading, writing, and math',
      icon: Award,
      metric: 'Proven',
      metricLabel: 'Academic Excellence',
      details: [
        'Individualized reading programs',
        'Singapore Math curriculum',
        'Writing workshop approach',
        'Science and social studies integration'
      ]
    },
    {
      id: 'special_events',
      title: 'Enriching Traditions',
      description: 'Memorable experiences and celebrations',
      icon: Sparkles,
      metric: 'Monthly',
      metricLabel: 'Special Events',
      details: [
        'Halloween Hootenanny',
        'Thanksgiving Feast',
        'Academic field trips',
        'Lower School chapel'
      ]
    }
  ],

  'intermediate': [
    {
      id: 'integrated_learning',
      title: 'Integrated Curriculum',
      description: 'Cross-disciplinary learning approach',
      icon: Brain,
      metric: 'Multi-Subject',
      metricLabel: 'Project Integration',
      details: [
        'Study topics across all subjects',
        'English poetry meets science',
        'Art integrated with Spanish',
        'Real-world connections'
      ]
    },
    {
      id: 'social_identity',
      title: 'Social Development Focus',
      description: 'Supporting identity formation',
      icon: Users,
      metric: 'Daily',
      metricLabel: 'Advisory Support',
      details: [
        'Small group gatherings',
        'Chapel programs',
        'Advisory periods',
        'Peer mentorship opportunities'
      ]
    },
    {
      id: 'expert_faculty',
      title: 'Expert Faculty',
      description: 'Highly qualified, caring teachers',
      icon: Award,
      metric: '55%',
      metricLabel: 'Advanced Degrees',
      details: [
        'Master\'s and doctorate holders',
        'Specialized transition guidance',
        'Individual attention',
        'Passionate educators'
      ]
    },
    {
      id: 'critical_thinking',
      title: 'Higher-Level Thinking',
      description: 'From concrete to abstract reasoning',
      icon: Rocket,
      metric: 'Progressive',
      metricLabel: 'Skill Development',
      details: [
        'Critical thinking emphasis',
        'Abstract concept mastery',
        'Problem-solving strategies',
        'Independent learning skills'
      ]
    }
  ],

  'middle': [
    {
      id: 'istem_innovation',
      title: 'iSTEAM Innovation',
      description: 'Cutting-edge technology and creativity',
      icon: Rocket,
      metric: 'Robotics+',
      metricLabel: 'Engineering Program',
      details: [
        'Virtual world design',
        'Robotics engineering',
        'Original music composition',
        'Interactive scientific discovery'
      ]
    },
    {
      id: 'leadership_development',
      title: 'Leadership & Life Skills',
      description: 'Preparing future leaders',
      icon: Trophy,
      metric: 'Advisory',
      metricLabel: 'Program Daily',
      details: [
        'Leadership skill development',
        'Time management training',
        'Self-advocacy coaching',
        'Conflict resolution skills'
      ]
    },
    {
      id: 'global_exploration',
      title: 'Quest Trips & Travel',
      description: 'Learning beyond the classroom',
      icon: Map,
      metric: 'Annual',
      metricLabel: 'Quest Trips',
      details: [
        'Yellowstone National Park',
        'Grand Canyon exploration',
        'Boston & DC trips',
        'International summer programs'
      ]
    },
    {
      id: 'personalized_growth',
      title: 'Individual Potential',
      description: 'Nurturing each student\'s unique gifts',
      icon: Heart,
      metric: '100%',
      metricLabel: 'Personalized Support',
      details: [
        'Academic advising',
        'Social safe spaces',
        'Individual goal setting',
        'Respect for differences'
      ]
    },
    {
      id: 'diverse_tracks',
      title: 'Academic Choice',
      description: 'Multiple pathways to success',
      icon: Palette,
      metric: '4 Tracks',
      metricLabel: 'Specialized Programs',
      details: [
        'Arts track',
        'Business track',
        'Engineering track',
        'Global Leadership track'
      ]
    }
  ],

  'high': [
    {
      id: 'academic_excellence',
      title: 'Academic Excellence',
      description: 'Rigorous college preparatory curriculum',
      icon: Award,
      metric: '25+',
      metricLabel: 'AP Courses Offered',
      details: [
        '100% college acceptance rate',
        'Ivy League & top university placements',
        'National Merit Scholars program',
        'Personalized college counseling'
      ]
    },
    {
      id: 'athletics_excellence',
      title: 'Championship Athletics',
      description: 'Elite sports programs and facilities',
      icon: Trophy,
      metric: '20+',
      metricLabel: 'Varsity Sports',
      details: [
        '15 State Championships (last 5 years)',
        '30+ Division I college athletes',
        'State-of-the-art facilities',
        'Professional coaching staff'
      ]
    },
    {
      id: 'global_perspective',
      title: 'Global Perspectives',
      description: 'International awareness and opportunities',
      icon: Globe,
      metric: '15+',
      metricLabel: 'International Trips',
      details: [
        'Annual international IQ trips',
        'Global exchange programs',
        'Language immersion opportunities',
        'Partnership with schools worldwide'
      ]
    },
    {
      id: 'innovation_research',
      title: 'Innovation & Research',
      description: 'Advanced STEAM and research opportunities',
      icon: Brain,
      metric: 'STEAM',
      metricLabel: 'Innovation Center',
      details: [
        'Independent research projects',
        'University partnerships',
        'Advanced lab facilities',
        'Internship opportunities'
      ]
    },
    {
      id: 'leadership_service',
      title: 'Leadership & Service',
      description: 'Developing ethical leaders',
      icon: Heart,
      metric: '40+',
      metricLabel: 'Service Hours Required',
      details: [
        'Student government opportunities',
        'Community service initiatives',
        'Episcopal values and honor code',
        'Leadership development programs'
      ]
    }
  ],

  // Fallback for elementary grade level
  'elementary': [
    {
      id: 'safe_caring_community',
      title: 'Safe & Caring Community',
      description: 'Nurturing environment for young learners',
      icon: Shield,
      metric: '100%',
      metricLabel: 'Anti-Bullying Commitment',
      details: [
        'Full-time counselors available',
        'Positive behavior support systems',
        'Small, supportive class sizes',
        'Social-emotional learning curriculum'
      ]
    },
    {
      id: 'project_based_learning',
      title: 'Project-Based Learning',
      description: 'Hands-on, imaginative learning experiences',
      icon: Rocket,
      metric: 'Transformative',
      metricLabel: 'Learning Experiences',
      details: [
        'Space exploration classroom themes',
        'Interactive science projects',
        'Creative problem-solving',
        'Real-world applications'
      ]
    },
    {
      id: 'character_building',
      title: 'Character Development',
      description: 'Building values and community service',
      icon: Heart,
      metric: 'Weekly',
      metricLabel: 'Service Activities',
      details: [
        'Community service projects',
        'Chapel programs',
        'Honor code introduction',
        'Leadership opportunities'
      ]
    },
    {
      id: 'academic_fundamentals',
      title: 'Strong Academic Foundation',
      description: 'Core skills development',
      icon: Award,
      metric: 'Proven',
      metricLabel: 'Academic Excellence',
      details: [
        'Individualized learning plans',
        'Strong literacy program',
        'Math and science foundations',
        'Critical thinking development'
      ]
    }
  ]
};

export default function FamilyValuesQuestion({ data, onNext, onBack }: FamilyValuesQuestionProps) {
  const [selected, setSelected] = useState<string[]>(data.familyValues || []);
  const [expanded, setExpanded] = useState<string[]>([]);
  
  // Get grade-appropriate values based on the grade level selected in question 1
  const gradeLevel = data.gradeLevel || 'middle';
  const VALUES = VALUES_BY_GRADE[gradeLevel] || VALUES_BY_GRADE['middle'];

  const toggleValue = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(v => v !== id);
      }
      if (prev.length >= 3) {
        return prev; // Limit to 3 selections
      }
      return [...prev, id];
    });
  };

  const toggleExpanded = (id: string) => {
    setExpanded(prev => 
      prev.includes(id) 
        ? prev.filter(v => v !== id)
        : [...prev, id]
    );
  };

  const handleContinue = () => {
    if (selected.length > 0) {
      onNext({ familyValues: selected });
    }
  };

  // Get grade-specific title
  const getTitle = () => {
    switch(gradeLevel) {
      case 'prek-k':
        return 'What matters most for your young learner?';
      case 'lower':
      case 'elementary':
        return 'What matters most for your elementary student?';
      case 'intermediate':
        return 'What matters most during these transition years?';
      case 'middle':
        return 'What priorities will guide your middle schooler?';
      case 'high':
        return 'What matters most for your high school student?';
      default:
        return 'What matters most to your family?';
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          {getTitle()}
        </h2>
        <p className="text-gray-600 mt-2">
          Select up to 3 priorities that resonate with your family
        </p>
      </motion.div>

      <div className="space-y-3 mb-8">
        {VALUES.map((value, index) => {
          const Icon = value.icon;
          const isSelected = selected.includes(value.id);
          const isExpanded = expanded.includes(value.id);
          
          return (
            <motion.div
              key={value.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                onClick={() => {
                  if (!(!isSelected && selected.length >= 3)) {
                    toggleValue(value.id);
                  }
                }}
                className={`w-full p-4 rounded-xl flex items-center text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#fffef5] border-2 border-[#d4a017]'
                    : selected.length >= 3
                    ? 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                    : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  isSelected
                    ? 'bg-[#004b34]'
                    : 'bg-gray-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    isSelected ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    isSelected ? 'text-gray-900' : 'text-gray-900'
                  }`}>
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isSelected && value.metric ? (
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-[#004b34] text-base">{value.metric}</span>
                        <span>{value.metricLabel}</span>
                      </span>
                    ) : (
                      value.description
                    )}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2">
                    {value.details && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(value.id);
                        }}
                        className="text-[#004b34] hover:text-[#003825] transition-colors"
                      >
                        <svg 
                          className={`w-5 h-5 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    <div className="w-6 h-6 rounded-full bg-[#d4a017] flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              
              {isSelected && isExpanded && value.details && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 ml-16 p-3 bg-[#004b34]/5 rounded-lg"
                >
                  <ul className="space-y-1">
                    {value.details.map((detail, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="text-[#d4a017] mr-2">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Sticky Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={handleContinue}
            disabled={selected.length === 0}
            className={`w-full py-4 rounded-md font-semibold text-lg transition-all ${
              selected.length > 0
                ? 'bg-[#003825] text-white hover:bg-[#004b34]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue ({selected.length}/3 selected)
          </motion.button>
        </div>
      </div>
    </div>
  );
}