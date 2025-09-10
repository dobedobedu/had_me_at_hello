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
            checkInData: fullData.checkInData
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
                checkInData: fullData.checkInData
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
      {/* Simplified Header - Green for valid, quick recognition */}
      <div className="bg-[#004b34] text-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Saint Stephen's Tour Pass</h1>
              <p className="text-sm text-white/80">ID: {tourId.toUpperCase()}</p>
            </div>
            <div className="text-right">
              {isCheckedIn ? (
                <div className="flex items-center text-green-300">
                  <CheckCircle2 className="w-5 h-5 mr-1" />
                  <span className="text-sm font-medium">Checked In</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-300">
                  <Clock className="w-5 h-5 mr-1" />
                  <span className="text-sm font-medium">Ready</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Main Info Card - Big and Clear */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-4"
        >
          {/* Student Info - Most Important */}
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isCheckedIn && tourData.checkInData 
                    ? tourData.checkInData.fullName 
                    : tourData.studentName || 'Guest'}
                </h2>
                {isCheckedIn && tourData.checkInData && (
                  <p className="text-gray-600 mt-1">
                    {tourData.checkInData.currentGrade} • {tourData.checkInData.currentSchool}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Interested in: {tourData.gradeLevel}
                </p>
              </div>
              <div className="text-4xl">🎓</div>
            </div>
          </div>

          {/* Quick Glance Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Primary Interest</p>
              <p className="font-semibold text-gray-900">
                {tourData.interests[0] || 'General'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Faculty Match</p>
              <p className="font-semibold text-gray-900 text-sm">
                {tourData.recommendedFaculty}
              </p>
            </div>
          </div>

          {/* Tour Stops - Clear List */}
          <div className="bg-[#fffef5] rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              TOUR STOPS ({tourData.tourExperiences.length})
            </p>
            <div className="space-y-1">
              {tourData.tourExperiences.map((exp, idx) => (
                <div key={idx} className="flex items-center text-sm">
                  <span className="text-[#d4a017] mr-2">•</span>
                  <span className="text-gray-700">{exp}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Check-In Section */}
        {!isCheckedIn && !showCheckIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => setShowCheckIn(true)}
              className="w-full py-4 bg-[#d4a017] text-white font-bold rounded-xl hover:bg-[#b8901f] transition-colors flex items-center justify-center"
            >
              <User className="w-5 h-5 mr-2" />
              Front Desk Check-In
            </button>
          </motion.div>
        )}

        {/* Check-In Form */}
        {showCheckIn && !isCheckedIn && (
          <CheckInForm 
            tourId={tourId}
            studentName={tourData.studentName}
            onCheckIn={handleCheckIn}
          />
        )}

        {/* Status Message for Checked In */}
        {isCheckedIn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center"
          >
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-800">Ready for Tour!</p>
            <p className="text-sm text-green-600 mt-1">
              Checked in at {tourData.checkInData && 
                new Date(tourData.checkInData.timestamp).toLocaleTimeString()}
            </p>
          </motion.div>
        )}

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Generated: {new Date(tourData.timestamp).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}