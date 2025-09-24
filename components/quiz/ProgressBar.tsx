import { motion } from 'framer-motion';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
  onBack?: () => void;
  stepLabels?: string[];
}

export default function ProgressBar({ currentStep, totalSteps, onStepClick, onBack, stepLabels }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full bg-gradient-to-b from-white to-gray-50/50 border-b border-gray-200/60 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          {onBack && (
            <button
              onClick={onBack}
              disabled={currentStep === 1}
              className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                  : 'text-[#004b34] hover:text-white hover:bg-[#004b34] bg-[#004b34]/5 hover:shadow-md hover:scale-105'
              }`}
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50/80 border border-gray-200/50">
            <div className="w-2 h-2 rounded-full bg-[#d4a017] animate-pulse" />
            <span className="text-sm font-medium text-gray-700">
              {currentStep === totalSteps
                ? 'Almost done!'
                : `${totalSteps - currentStep} questions remaining`}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              <button
                onClick={() => onStepClick && index < currentStep && onStepClick(index + 1)}
                disabled={!onStepClick || index >= currentStep}
                className={`group relative flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold transition-all duration-300 ${
                  index < currentStep - 1
                    ? 'bg-gradient-to-r from-[#003825] to-[#004b34] text-white cursor-pointer hover:shadow-xl hover:shadow-[#003825]/30 hover:scale-110 ring-2 ring-[#003825]/20'
                    : index === currentStep - 1
                    ? 'bg-gradient-to-r from-[#d4a017] to-[#b8901f] text-white shadow-xl shadow-[#d4a017]/40 cursor-default ring-4 ring-[#d4a017]/20 animate-pulse'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {/* Enhanced step number with subtle glow */}
                <span className="relative z-10">{index + 1}</span>

                {/* Active step glow effect */}
                {index === currentStep - 1 && (
                  <div className="absolute inset-0 rounded-full bg-[#d4a017] opacity-20 animate-ping" />
                )}

                {/* Completed step checkmark overlay */}
                {index < currentStep - 1 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>

              {index < totalSteps - 1 && (
                <div className="flex-1 h-2 mx-3">
                  <div className="h-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#003825] to-[#004b34] rounded-full shadow-sm"
                      initial={{ width: 0 }}
                      animate={{ width: index < currentStep - 1 ? '100%' : '0%' }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}