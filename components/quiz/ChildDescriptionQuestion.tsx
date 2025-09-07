'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ChildDescriptionQuestionProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isLastStep: boolean;
  isSubmitting: boolean;
}


export default function ChildDescriptionQuestion({ 
  data, 
  onNext, 
  isLastStep, 
  isSubmitting 
}: ChildDescriptionQuestionProps) {
  const [threeWords, setThreeWords] = useState(data.threeWords || '');


  const handleSubmit = () => {
    if (threeWords.trim()) {
      onNext({ 
        threeWords: threeWords.trim(),
        childDescription: threeWords.trim()
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Tell us about your child
        </h2>
        <p className="text-gray-600 mt-2">
          In 3 words, how would you describe your child?
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="mb-8">
          <input
            type="text"
            value={threeWords}
            onChange={(e) => setThreeWords(e.target.value)}
            placeholder="e.g. creative curious athletic"
            className="w-full text-2xl p-6 text-center bg-gradient-to-br from-[#003825] to-[#004b34] text-white placeholder-white/50 border-2 border-[#004b34] rounded-xl focus:border-[#d4a017] focus:outline-none"
            maxLength={100}
          />
          <p className="text-sm text-gray-500 text-center mt-2">
            {threeWords.split(' ').filter(word => word.trim()).length} words • {threeWords.length}/100 characters
          </p>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={handleSubmit}
        disabled={!threeWords.trim() || isSubmitting}
        className={`w-full mt-8 py-4 rounded-md font-semibold text-lg transition-all flex items-center justify-center ${
          threeWords.trim() && !isSubmitting
            ? 'bg-[#003825] text-white hover:bg-[#004b34]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Complete Quiz'
        )}
      </motion.button>

    </div>
  );
}