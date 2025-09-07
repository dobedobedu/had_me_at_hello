'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, GraduationCap, Award, MapPin, Phone, Mail } from 'lucide-react';
import { getTourPassData, type TourPassData } from '@/lib/qr-generator';

export default function TourDetailsPage() {
  const params = useParams();
  const tourId = params.tourId as string;
  const [tourData, setTourData] = useState<TourPassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tourId) {
      try {
        const data = getTourPassData(tourId);
        if (data) {
          setTourData(data);
        } else {
          setError('Tour pass not found. Please generate a new tour pass.');
        }
      } catch (err) {
        setError('Error loading tour details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  }, [tourId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#004b34] to-[#003825] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading tour details...</p>
        </div>
      </div>
    );
  }

  if (error || !tourData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#004b34] to-[#003825] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tour Pass Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-[#003825] text-white rounded-lg font-medium hover:bg-[#004b34] transition-all"
          >
            Take the Quiz Again
          </a>
        </div>
      </div>
    );
  }

  const { studentName, timestamp, quizResults, selectedTours } = tourData;
  const matchedFaculty = quizResults.matchedFaculty[0];
  const matchedStudent = quizResults.matchedStudent[0];
  const matchedAlumni = quizResults.matchedAlumni[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004b34] to-[#003825]">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-[#d4a017] text-4xl mb-2">🎓</div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Saint Stephen's Tour Pass
            </h1>
            <p className="text-white/80">Welcome, {studentName}!</p>
            <p className="text-white/60 text-sm mt-1">
              Generated: {new Date(timestamp).toLocaleDateString()} at {new Date(timestamp).toLocaleTimeString()}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center"
          >
            <div className="text-green-500 text-3xl mb-2">✅</div>
            <h2 className="text-xl font-bold text-green-800 mb-2">Tour Pass Verified</h2>
            <p className="text-green-700">Ready for your personalized Saint Stephen's experience!</p>
          </motion.div>

          {/* Personal Matches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-[#d4a017]" />
              Your Perfect Matches
            </h3>
            
            <div className="space-y-4">
              {/* Faculty Match */}
              {matchedFaculty && (
                <div className="flex items-start space-x-3 p-4 bg-[#004b34]/5 rounded-lg">
                  <User className="w-5 h-5 text-[#004b34] mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {matchedFaculty.firstName} {matchedFaculty.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{matchedFaculty.title}</p>
                    <p className="text-xs text-[#004b34] font-medium">Your Recommended Faculty Connection</p>
                  </div>
                </div>
              )}

              {/* Student Match */}
              {matchedStudent && (
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {matchedStudent.firstName} {matchedStudent.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{matchedStudent.gradeLevel}</p>
                    <p className="text-xs text-blue-600 font-medium">Current Student Connection</p>
                  </div>
                </div>
              )}

              {/* Alumni Match */}
              {matchedAlumni && (
                <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                  <Award className="w-5 h-5 text-purple-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {matchedAlumni.firstName} {matchedAlumni.lastName}
                    </p>
                    <p className="text-sm text-gray-600">Class of {matchedAlumni.classYear}</p>
                    <p className="text-xs text-purple-600 font-medium">Alumni Success Story</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-[#d4a017]/10 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Your Interests:</strong> {quizResults.interests.join(', ')}
              </p>
            </div>
          </motion.div>

          {/* Selected Tour Experiences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-[#d4a017]" />
              Your Custom Tour ({selectedTours.length} Experiences)
            </h3>
            
            <div className="space-y-3">
              {selectedTours.map((tour, index) => (
                <motion.div
                  key={tour.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start space-x-3 p-4 border-2 border-[#d4a017]/20 rounded-lg bg-[#fffef5]"
                >
                  <div className="w-6 h-6 rounded-full bg-[#d4a017] text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{tour.title}</h4>
                    <p className="text-sm text-gray-600">{tour.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Instructions for Staff */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#004b34] text-white rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Ready to Start Your Tour!
            </h3>
            
            <div className="space-y-3">
              <p className="text-white/90">
                Show this screen to our admissions team at the front desk. They have everything they need to provide your personalized tour experience.
              </p>
              
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm text-white/80 mb-2"><strong>Tour ID:</strong> {tourId}</p>
                <p className="text-sm text-white/80"><strong>Status:</strong> <span className="text-green-300">Active & Ready</span></p>
              </div>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-sm p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Questions?</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-[#004b34]" />
                <div>
                  <p className="font-semibold text-gray-900">Call Us</p>
                  <p className="text-sm text-gray-600">(555) 123-4567</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-[#004b34]" />
                <div>
                  <p className="font-semibold text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">admissions@saintstephens.org</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}