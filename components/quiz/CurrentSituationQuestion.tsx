import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Calendar, Compass, School, Users, TrendingUp, Home } from 'lucide-react';

interface CurrentSituationQuestionProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isLastStep: boolean;
  isSubmitting: boolean;
}

const SITUATIONS = [
  {
    id: 'new_to_area',
    title: 'New to the Area',
    icon: MapPin,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'seeking_change',
    title: 'Time for Change',
    icon: Search,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'first_time',
    title: 'First Independent School',
    icon: School,
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'just_exploring',
    title: 'Just Exploring',
    icon: TrendingUp,
    color: 'bg-orange-100 text-orange-600',
  },
];

export default function CurrentSituationQuestion({ data, onNext }: CurrentSituationQuestionProps) {
  const [selected, setSelected] = useState(data.currentSituation || '');

  const handleSelect = (situation: string) => {
    setSelected(situation);
    // Auto-advance after selection
    setTimeout(() => {
      onNext({ currentSituation: situation });
    }, 300);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          What brings you here today?
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {SITUATIONS.map((situation, index) => {
          const Icon = situation.icon;
          const isSelected = selected === situation.id;
          
          return (
            <motion.button
              key={situation.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(situation.id)}
              className={`relative p-8 rounded-2xl transition-all ${
                isSelected 
                  ? 'bg-[#004b34] text-white shadow-lg' 
                  : 'bg-white border-2 border-gray-200 hover:border-[#004b34]/20'
              }`}
            >
              <motion.div 
                initial={false}
                animate={{ scale: isSelected ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center space-y-3"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  isSelected ? 'bg-white/20' : situation.color
                }`}>
                  <Icon className={`w-8 h-8 ${isSelected ? 'text-white' : ''}`} />
                </div>
                <h3 className={`font-semibold text-base ${
                  isSelected ? 'text-white' : 'text-gray-900'
                }`}>
                  {situation.title}
                </h3>
              </motion.div>
              
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="absolute top-2 right-2 w-6 h-6 bg-[#d4a017] rounded-full flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}