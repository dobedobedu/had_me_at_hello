import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Beaker, Palette, Trophy, Code, Music, Globe, 
  BookOpen, Heart, Rocket, Camera, Gamepad2, Trees 
} from 'lucide-react';

interface InterestsQuestionProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isLastStep: boolean;
  isSubmitting: boolean;
}

const INTERESTS_BY_GRADE: Record<string, Array<{id: string, label: string, icon: any}>> = {
  'lower': [
    { id: 'play', label: 'Playing & Exploring', icon: Gamepad2 },
    { id: 'arts', label: 'Art & Crafts', icon: Palette },
    { id: 'music', label: 'Music & Songs', icon: Music },
    { id: 'nature', label: 'Nature & Animals', icon: Trees },
    { id: 'building', label: 'Building & Creating', icon: Rocket },
    { id: 'stories', label: 'Stories & Books', icon: BookOpen },
    { id: 'movement', label: 'Movement & Dance', icon: Heart },
    { id: 'friends', label: 'Making Friends', icon: Globe },
  ],
  'intermediate': [
    { id: 'science', label: 'Science Experiments', icon: Beaker },
    { id: 'arts', label: 'Art & Creativity', icon: Palette },
    { id: 'sports', label: 'Sports & Games', icon: Trophy },
    { id: 'technology', label: 'Computers & Tech', icon: Code },
    { id: 'music', label: 'Music & Performance', icon: Music },
    { id: 'reading', label: 'Reading Adventures', icon: BookOpen },
    { id: 'building', label: 'Building Things', icon: Rocket },
    { id: 'nature', label: 'Nature & Environment', icon: Trees },
  ],
  'middle': [
    { id: 'science', label: 'Science & Research', icon: Beaker },
    { id: 'arts', label: 'Visual & Digital Arts', icon: Palette },
    { id: 'athletics', label: 'Team Sports', icon: Trophy },
    { id: 'technology', label: 'Coding & Robotics', icon: Code },
    { id: 'music', label: 'Band & Orchestra', icon: Music },
    { id: 'languages', label: 'World Languages', icon: Globe },
    { id: 'writing', label: 'Creative Writing', icon: BookOpen },
    { id: 'service', label: 'Community Service', icon: Heart },
    { id: 'drama', label: 'Drama & Theater', icon: Camera },
    { id: 'leadership', label: 'Student Leadership', icon: Rocket },
  ],
  'upper': [
    { id: 'stem', label: 'STEM Research', icon: Beaker },
    { id: 'arts', label: 'Arts & Design', icon: Palette },
    { id: 'athletics', label: 'Athletics', icon: Trophy },
    { id: 'technology', label: 'Computer Science', icon: Code },
    { id: 'music', label: 'Music & Composition', icon: Music },
    { id: 'languages', label: 'Global Studies', icon: Globe },
    { id: 'literature', label: 'Literature & Writing', icon: BookOpen },
    { id: 'service', label: 'Service Leadership', icon: Heart },
    { id: 'business', label: 'Entrepreneurship', icon: Rocket },
    { id: 'media', label: 'Media Production', icon: Camera },
    { id: 'debate', label: 'Debate & Model UN', icon: Gamepad2 },
    { id: 'environment', label: 'Environmental Science', icon: Trees },
  ],
};

export default function InterestsQuestion({ data, onNext, onBack }: InterestsQuestionProps) {
  const [selected, setSelected] = useState<string[]>(data.interests || []);
  
  // Get grade-specific interests
  const gradeLevel = data.gradeLevel || 'intermediate';
  const interests = INTERESTS_BY_GRADE[gradeLevel] || INTERESTS_BY_GRADE['intermediate'];
  
  const toggleInterest = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 5) {
        return prev; // Limit to 5 selections
      }
      return [...prev, id];
    });
  };

  const handleContinue = () => {
    if (selected.length > 0) {
      onNext({ interests: selected });
    }
  };
  
  // Grade-specific messaging
  const getHeading = () => {
    switch(gradeLevel) {
      case 'lower': return 'What does your child love to do?';
      case 'intermediate': return 'What interests your child most?';
      case 'middle': return 'What activities excite your student?';
      case 'upper': return 'What are your student\'s passions?';
      default: return 'What excites your child?';
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {getHeading()}
        </h2>
        <p className="text-gray-600">
          Select up to 5 areas (choose {5 - selected.length} more)
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {interests.map((interest, index) => {
          const Icon = interest.icon;
          const isSelected = selected.includes(interest.id);
          
          return (
            <motion.button
              key={interest.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleInterest(interest.id)}
              disabled={!isSelected && selected.length >= 5}
              className={`p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-[#d4a017] bg-[#fffef5]'
                  : selected.length >= 5
                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Icon className={`w-6 h-6 mx-auto mb-2 ${
                isSelected ? 'text-[#d4a017]' : 'text-gray-500'
              }`} />
              <p className={`text-sm font-medium ${
                isSelected ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {interest.label}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Sticky Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 p-4 z-50">
        <div className="max-w-4xl mx-auto">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleContinue}
            disabled={selected.length === 0}
            className={`w-full py-4 rounded-md font-semibold text-lg transition-all ${
              selected.length > 0
                ? 'bg-[#003825] text-white hover:bg-[#004b34]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue ({selected.length} selected)
          </motion.button>
        </div>
      </div>
    </div>
  );
}
