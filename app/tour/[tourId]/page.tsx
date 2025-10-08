'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, MapPin, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import CheckInForm, { type CheckInData } from './check-in';

// Simplified tour pass data structure for quick loading
interface SimplifiedTourPass {
  tourId: string;
  studentName: string;
  gradeLevel: string;
  interests: string[];
  recommendedFaculty: string;
  tourExperiences: string[];
  timestamp: string;
  status: 'active' | 'checked-in' | 'expired';
  checkInData?: CheckInData;
  // Quiz responses for display
  quizResponses?: {
    gradeRange: string;
    interests: string[];
    motivation: string;
    timeline: string;
    parentValues: string[];
    aboutKids?: string; // 3 words about kids
  };
}

export default function ImprovedTourPassPage() {
  const params = useParams();
  const tourId = params.tourId as string;
  const [tourData, setTourData] = useState<SimplifiedTourPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    const fetchTourData = async () => {
      try {
        // First try API (works across devices)
        const response = await fetch(`/api/tour-pass/${tourId}`);
        
        if (response.ok) {
          const fullData = await response.json();
          
          // Simplify the data for quick display
          const simplified: SimplifiedTourPass = {
            tourId: fullData.tourId,
            studentName: fullData.studentName,
            gradeLevel: fullData.quizResults?.gradeLevel || 'Not specified',
            interests: fullData.quizResults?.interests || [],
            recommendedFaculty: fullData.quizResults?.matchedFaculty?.[0] 
              ? `${fullData.quizResults.matchedFaculty[0].firstName} ${fullData.quizResults.matchedFaculty[0].lastName}`
              : 'Available on arrival',
            tourExperiences: fullData.selectedTours?.map((t: any) => t.title) || [],
            timestamp: fullData.timestamp,
            status: fullData.status || 'active',
            checkInData: fullData.checkInData,
            quizResponses: fullData.quizResults ? {
              gradeRange: fullData.quizResults.gradeLevel || '9th-10th Grade',
              interests: fullData.quizResults.interests || [],
              motivation: fullData.quizResults.motivation || 'Just exploring',
              timeline: fullData.quizResults.timeline || 'Fall 2025',
              parentValues: fullData.quizResults.parentValues || [],
              aboutKids: fullData.quizResults.threeWords || fullData.quizResults.aboutKids || ''
            } : undefined
          };
          setTourData(simplified);
        } else {
          // Fallback to localStorage if API fails
          const storedData = localStorage.getItem('tourPasses');
          if (storedData) {
            const allPasses = JSON.parse(storedData);
            const fullData = allPasses[tourId];
            
            if (fullData) {
              const simplified: SimplifiedTourPass = {
                tourId: fullData.tourId,
                studentName: fullData.studentName,
                gradeLevel: fullData.quizResults?.gradeLevel || 'Not specified',
                interests: fullData.quizResults?.interests || [],
                recommendedFaculty: fullData.quizResults?.matchedFaculty?.[0] 
                  ? `${fullData.quizResults.matchedFaculty[0].firstName} ${fullData.quizResults.matchedFaculty[0].lastName}`
                  : 'Available on arrival',
                tourExperiences: fullData.selectedTours?.map((t: any) => t.title) || [],
                timestamp: fullData.timestamp,
                status: fullData.status || 'active',
                checkInData: fullData.checkInData,
                quizResponses: fullData.quizResults ? {
                  gradeRange: fullData.quizResults.gradeLevel || '9th-10th Grade',
                  interests: fullData.quizResults.interests || [],
                  motivation: fullData.quizResults.motivation || 'Just exploring',
                  timeline: fullData.quizResults.timeline || 'Fall 2025',
                  parentValues: fullData.quizResults.parentValues || [],
                  aboutKids: fullData.quizResults.threeWords || fullData.quizResults.aboutKids || ''
                } : undefined
              };
              setTourData(simplified);
            }
          }
        }
      } catch (error) {
        console.error('Error loading tour data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTourData();
  }, [tourId]);

  const handleCheckIn = (checkInData: CheckInData) => {
    // Update tour data with check-in information
    if (tourData) {
      const updatedData = {
        ...tourData,
        status: 'checked-in' as const,
        checkInData
      };
      setTourData(updatedData);
      
      // Save to localStorage (in production, send to server)
      const storedData = localStorage.getItem('tourPasses');
      if (storedData) {
        const allPasses = JSON.parse(storedData);
        if (allPasses[tourId]) {
          allPasses[tourId].checkInData = checkInData;
          allPasses[tourId].status = 'checked-in';
          localStorage.setItem('tourPasses', JSON.stringify(allPasses));
        }
      }
      
      setShowCheckIn(false);
    }
  };

  // Minimal loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004b34] mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!tourData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Tour Pass</h1>
          <p className="text-gray-600 text-sm mb-4">This QR code is not valid or has expired.</p>
          <a 
            href="/quiz" 
            className="inline-block px-4 py-2 bg-[#004b34] text-white rounded-lg text-sm font-medium"
          >
            Generate New Pass
          </a>
        </div>
      </div>
    );
  }

  const isCheckedIn = tourData.status === 'checked-in';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header with Timestamp and ID */}
      <div className="bg-[#004b34] text-white p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="font-bold text-lg">
            {new Date(tourData.timestamp).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }).toUpperCase()} • {new Date(tourData.timestamp).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </div>
          <div className="text-sm text-white/80">TOUR PASS #{tourId.substring(0, 8).toUpperCase()}</div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Check-In Button or Status - TOP PRIORITY */}
        {!isCheckedIn && !showCheckIn && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <button
              onClick={() => setShowCheckIn(true)}
              className="w-full py-4 bg-[#d4a017] text-white font-bold rounded-xl hover:bg-[#b8901f] transition-colors flex items-center justify-center shadow-lg"
            >
              <User className="w-5 h-5 mr-2" />
              CHECK IN
            </button>
          </motion.div>
        )}

        {/* Checked In Status - Compact */}
        {isCheckedIn && tourData.checkInData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-green-600 font-semibold flex items-center text-xs">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                CHECKED IN • {new Date(tourData.checkInData.timestamp).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </span>
            </div>
            <div className="text-gray-900 font-semibold text-sm">{tourData.checkInData.fullName} • {tourData.checkInData.currentGrade}</div>
            <div className="text-gray-600 text-xs">{tourData.checkInData.currentSchool}</div>
          </motion.div>
        )}

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          {/* Quiz Snapshot Section - Optimized spacing */}
          <div className="p-3 border-b">
            <h3 className="text-xs font-bold text-gray-500 mb-2">QUIZ SNAPSHOT</h3>
            <div className="space-y-1.5">
              <div className="flex">
                <span className="text-xs mr-1.5">1️⃣</span>
                <span className="text-xs text-gray-600 flex-shrink-0 mr-1">Grade →</span>
                <span className="text-xs font-semibold text-gray-900">{tourData.quizResponses?.gradeRange || tourData.gradeLevel}</span>
              </div>
              <div className="flex">
                <span className="text-xs mr-1.5">2️⃣</span>
                <span className="text-xs text-gray-600 flex-shrink-0 mr-1">Interests →</span>
                <span className="text-xs font-semibold text-gray-900 truncate">{tourData.quizResponses?.interests.join(', ') || tourData.interests.join(', ')}</span>
              </div>
              <div className="flex">
                <span className="text-xs mr-1.5">3️⃣</span>
                <span className="text-xs text-gray-600 flex-shrink-0 mr-1">Why Now? →</span>
                <span className="text-xs font-semibold text-gray-900">{tourData.quizResponses?.motivation || 'Just exploring'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-xs mr-1.5">4️⃣</span>
                <span className="text-xs text-gray-600 flex-shrink-0 mr-1">Timeline →</span>
                <span className="text-xs font-semibold text-gray-900">{tourData.quizResponses?.timeline || 'Fall 2025'}</span>
                <span className="text-yellow-500 ml-1 text-xs">⭐</span>
              </div>
              <div className="flex">
                <span className="text-xs mr-1.5">5️⃣</span>
                <span className="text-xs text-gray-600 flex-shrink-0 mr-1">Values →</span>
                <span className="text-xs font-semibold text-gray-900 truncate">{tourData.quizResponses?.parentValues.join(', ') || 'Small Classes, Individual Attention'}</span>
              </div>
              {tourData.quizResponses?.aboutKids && (
                <div className="flex">
                  <span className="text-xs mr-1.5">6️⃣</span>
                  <span className="text-xs text-gray-600 flex-shrink-0 mr-1">About Kids →</span>
                  <span className="text-xs font-semibold text-gray-900">{tourData.quizResponses.aboutKids}</span>
                </div>
              )}
            </div>
          </div>

          {/* Matches Section - Compact */}
          <div className="p-3 border-b bg-gray-50">
            <h3 className="text-xs font-bold text-gray-500 mb-2">YOUR MATCHES</h3>
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-xs mr-1.5">👨‍🏫</span>
                <span className="text-xs font-semibold text-gray-900">{tourData.recommendedFaculty}</span>
              </div>
              {/* Add student/alumni matches if available */}
            </div>
          </div>

          {/* Tour Route Section - Compact */}
          <div className="p-3 bg-[#fffef5]">
            <h3 className="text-xs font-bold text-gray-500 mb-2">TOUR ROUTE</h3>
            <div className="space-y-0.5">
              {tourData.tourExperiences.map((exp, idx) => (
                <div key={idx} className="flex items-center">
                  <span className="text-xs mr-1.5">📍</span>
                  <span className="text-xs text-gray-700">{exp}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>

      {/* Check-In Modal/Sheet */}
      {showCheckIn && !isCheckedIn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center"
          onClick={() => setShowCheckIn(false)}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Quick Check-In</h2>
              <button
                onClick={() => setShowCheckIn(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <CheckInForm 
                tourId={tourId}
                studentName={tourData.studentName}
                onCheckIn={(data) => {
                  handleCheckIn(data);
                  setShowCheckIn(false);
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}