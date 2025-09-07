import { motion } from 'framer-motion';
import { GraduationCap, Baby, Users, School } from 'lucide-react';

interface GradeLevelQuestionProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isLastStep: boolean;
  isSubmitting: boolean;
}

const GRADE_LEVELS = [
  {
    id: 'lower',
    title: 'Lower School',
    icon: Baby,
    description: 'Grades Pre-K3 to 3',
    color: 'bg-[#5a8c6f]',
  },
  {
    id: 'intermediate',
    title: 'Intermediate School',
    icon: School,
    description: 'Grades 4-6',
    color: 'bg-[#4a7c5f]',
  },
  {
    id: 'middle',
    title: 'Middle School',
    icon: Users,
    description: 'Grades 7-8',
    color: 'bg-[#3a6c4f]',
  },
  {
    id: 'upper',
    title: 'Upper School',
    icon: GraduationCap,
    description: 'Grades 9-12',
    color: 'bg-[#004b34]',
  },
];

export default function GradeLevelQuestion({ data, onNext }: GradeLevelQuestionProps) {
  const handleSelect = (gradeLevel: string) => {
    onNext({ gradeLevel });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          What grade level is your child entering?
        </h2>
      </motion.div>

      <div className="space-y-3">
        {GRADE_LEVELS.map((level, index) => {
          const Icon = level.icon;
          return (
            <motion.button
              key={level.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleSelect(level.id)}
              className={`w-full p-4 rounded-lg bg-white hover:bg-gray-50 transition-all border-2 flex items-center ${
                data.gradeLevel === level.id ? 'border-[#d4a017] bg-[#fffef5]' : 'border-gray-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-full ${level.color} flex items-center justify-center mr-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">{level.title}</h3>
                <p className="text-gray-600 text-sm">{level.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
