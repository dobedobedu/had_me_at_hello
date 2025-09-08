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
      metric: '14-18',
      metricLabel: 'Students Per Class',
      details: [
        'Safe, caring community environment',
        'Parents encouraged to be on campus',
        'Small, supportive class sizes',
        'Students often don\'t want to leave at day\'s end'
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
        'Room-sized rocket ships and star tunnels',
        'Classrooms transform into planets and environments',
        'Astronaut simulations and space exploration',
        'Handmade planets and educational environments'
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
        'Project-based math learning',
        'Writing workshop approach',
        'Science and social studies integration'
      ]
    },
    {
      id: 'joyful_childhood',
      title: 'Joyful Childhood Experience',
      description: 'Creating lasting memories and traditions',
      icon: Sparkles,
      metric: 'Monthly',
      metricLabel: 'Special Events',
      details: [
        'Halloween Hootenanny celebration',
        'Thanksgiving Feast tradition',
        'Lessons and Carols service',
        'Wonder Women and Super Men days'
      ]
    }
  ],

  'intermediate': [
    {
      id: 'deep_understanding',
      title: 'Deep Understanding & Connection',
      description: 'Learning that connects and makes sense',
      icon: Brain,
      metric: 'Multi-Subject',
      metricLabel: 'Project Integration',
      details: [
        'One topic studied across all classes',
        'Poetry in English, watercolors in art',
        'iPad collages in Spanish class',
        'Animal anatomy in science - all connected!'
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
      id: 'trusted_guidance',
      title: 'Trusted Adult Guidance',
      description: 'Expert support during transition years',
      icon: Award,
      metric: '55%',
      metricLabel: 'Advanced Degrees',
      details: [
        '55% of teachers have advanced degrees',
        'Experts in concrete-to-abstract learning',
        'Specialized in transition-age students',
        'Bridge to Middle School success'
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
      id: 'innovation_creativity',
      title: 'Innovation & Creative Expression',
      description: 'Nurturing future-ready thinking',
      icon: Rocket,
      metric: 'Robotics+',
      metricLabel: 'Engineering Program',
      details: [
        'Virtual world design in tech labs',
        'Robotics engineering projects',
        'Original music in sound studio',
        'State-of-the-art STEAM Center access'
      ]
    },
    {
      id: 'life_skills_preparation',
      title: 'Life Skills & Self-Advocacy',
      description: 'Building confidence and independence',
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
      id: 'global_perspective',
      title: 'Global Perspective & Adventure',
      description: 'Expanding horizons through travel',
      icon: Map,
      metric: 'Annual',
      metricLabel: 'Quest Trips',
      details: [
        'Interim Quest: Yellowstone, Grand Canyon',
        'Washington DC & Boston experiences', 
        'Costa Rica international travel',
        'Belize and Puerto Rico adventures planned'
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
      id: 'academic_choice',
      title: 'Academic Freedom & Choice',
      description: 'Following your passions and interests',
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

  'upper': [
    {
      id: 'academic_excellence',
      title: 'Academic Excellence',
      description: 'AP courses and integrated curriculum approach',
      icon: Award,
      metric: '25+',
      metricLabel: 'AP Courses Offered',
      details: [
        '25+ Advanced Placement courses',
        'Integrated curriculum approach',
        '100% college acceptance rate',
        '52 National Merit finalists since 2005',
        'Ranked #1 college prep in Manatee County'
      ]
    },
    {
      id: 'athletic_excellence',
      title: 'Athletic Excellence & Character',
      description: 'Building champions on and off the field',
      icon: Trophy,
      metric: '20+',
      metricLabel: 'Varsity Sports',
      details: [
        '20 State Championships',
        '19 sport teams',
        '30+ Division I college athletes',
        'State-of-the-art facilities'
      ]
    },
    {
      id: 'global_perspective',
      title: 'Global Perspective',
      description: 'Diversity and international experiences',
      icon: Globe,
      metric: '20+',
      metricLabel: 'Nationalities',
      details: [
        '20+ different nationalities represented',
        'Interim Quest international trips',
        'Sister schools: Tanzania, Japan, Argentina, Denmark, Honduras, Spain',
        'Global citizenship development',
        'Cultural exchange programs'
      ]
    },
    {
      id: 'innovation_creativity',
      title: 'Innovation & Creativity',
      description: 'STEAM innovation and creative exploration',
      icon: Brain,
      metric: 'STEAM',
      metricLabel: 'Innovation Center',
      details: [
        '$13 million state-of-the-art STEAM Center',
        'Marine Science Center',
        'Computer science and robotics lab',
        'Media production studio',
        'The Gauntlet and The View student publications'
      ]
    },
    {
      id: 'leadership',
      title: 'Leadership',
      description: 'Shaping tomorrow\'s changemakers',
      icon: Users,
      metric: '25+',
      metricLabel: 'Student Clubs',
      details: [
        '25+ student clubs and organizations',
        'Global Scholar program',
        'Capstone Scholar distinction',
        'Honor Council leadership',
        'Cum Laude Society membership'
      ]
    },
    {
      id: 'community_service',
      title: 'Community & Service',
      description: 'Building character through service',
      icon: Heart,
      metric: '40+',
      metricLabel: 'Service Hours Required',
      details: [
        'Mandatory community service',
        'Local and international service trips',
        'Small class community feel',
        'Faculty-student mentorship',
        'Culture of kindness'
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
      case 'upper':
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