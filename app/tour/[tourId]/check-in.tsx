'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, School, GraduationCap, Check } from 'lucide-react';

interface CheckInFormProps {
  tourId: string;
  studentName: string;
  onCheckIn: (data: CheckInData) => void;
}

export interface CheckInData {
  fullName: string;
  currentGrade: string;
  currentSchool: string;
  timestamp: string;
}

export default function CheckInForm({ tourId, studentName, onCheckIn }: CheckInFormProps) {
  const [formData, setFormData] = useState<CheckInData>({
    fullName: studentName || '',
    currentGrade: '',
    currentSchool: '',
    timestamp: new Date().toISOString()
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    onCheckIn(formData);
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border-2 border-green-300 rounded-xl p-6 text-center"
      >
        <div className="text-green-500 text-4xl mb-3">
          <Check className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-xl font-bold text-green-800 mb-2">Check-In Complete!</h3>
        <p className="text-green-700">Tour guide has been notified</p>
        <div className="mt-4 p-3 bg-white rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>{formData.fullName}</strong><br />
            {formData.currentGrade} • {formData.currentSchool}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Check-In</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
            <User className="w-4 h-4 mr-1" />
            Student Name
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Enter full name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
            required
          />
        </div>

        {/* Current Grade */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
            <GraduationCap className="w-4 h-4 mr-1" />
            Current Grade
          </label>
          <select
            value={formData.currentGrade}
            onChange={(e) => setFormData({ ...formData, currentGrade: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
            required
          >
            <option value="">Select grade...</option>
            <option value="Pre-K3">Pre-K3</option>
            <option value="Pre-K4">Pre-K4</option>
            <option value="Kindergarten">Kindergarten</option>
            <option value="1st Grade">1st Grade</option>
            <option value="2nd Grade">2nd Grade</option>
            <option value="3rd Grade">3rd Grade</option>
            <option value="4th Grade">4th Grade</option>
            <option value="5th Grade">5th Grade</option>
            <option value="6th Grade">6th Grade</option>
            <option value="7th Grade">7th Grade</option>
            <option value="8th Grade">8th Grade</option>
            <option value="9th Grade">9th Grade</option>
            <option value="10th Grade">10th Grade</option>
            <option value="11th Grade">11th Grade</option>
            <option value="12th Grade">12th Grade</option>
          </select>
        </div>

        {/* Current School */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
            <School className="w-4 h-4 mr-1" />
            Current School
          </label>
          <input
            type="text"
            value={formData.currentSchool}
            onChange={(e) => setFormData({ ...formData, currentSchool: e.target.value })}
            placeholder="Enter current school name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-green-700 text-white font-semibold rounded-lg hover:bg-green-800 transition-colors"
        >
          Complete Check-In
        </button>
      </form>
    </motion.div>
  );
}