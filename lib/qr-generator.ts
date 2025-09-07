import QRCode from 'qrcode';

export interface TourPassData {
  tourId: string;
  studentName: string;
  timestamp: string;
  quizResults: {
    interests: string[];
    matchedFaculty: Array<{
      firstName: string;
      lastName: string;
      title: string;
    }>;
    matchedStudent: Array<{
      firstName: string;
      lastName: string;
      gradeLevel: string;
    }>;
    matchedAlumni: Array<{
      firstName: string;
      lastName: string;
      classYear: string;
    }>;
  };
  selectedTours: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  status: 'active' | 'used' | 'expired';
}

export function generateTourId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}${random}`;
}

export async function generateQRCode(tourId: string): Promise<string> {
  const tourUrl = `${window.location.origin}/tour/${tourId}`;
  
  try {
    const qrDataURL = await QRCode.toDataURL(tourUrl, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#004b34', // Saint Stephen's green
        light: '#FFFFFF'
      }
    });
    return qrDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

export function saveTourPassData(tourId: string, data: TourPassData): void {
  try {
    const existingData = localStorage.getItem('tourPasses');
    const tourPasses = existingData ? JSON.parse(existingData) : {};
    
    tourPasses[tourId] = data;
    
    localStorage.setItem('tourPasses', JSON.stringify(tourPasses));
  } catch (error) {
    console.error('Error saving tour pass data:', error);
  }
}

export function getTourPassData(tourId: string): TourPassData | null {
  try {
    const existingData = localStorage.getItem('tourPasses');
    if (!existingData) return null;
    
    const tourPasses = JSON.parse(existingData);
    return tourPasses[tourId] || null;
  } catch (error) {
    console.error('Error retrieving tour pass data:', error);
    return null;
  }
}

export function createTourPassEmail(tourPassData: TourPassData, qrDataURL: string): string {
  const { studentName, quizResults, selectedTours } = tourPassData;
  
  const matchedFaculty = quizResults.matchedFaculty[0];
  const tourList = selectedTours.map(tour => `• ${tour.title}`).join('\n');
  
  return `Subject: 🎓 Tour Pass - ${studentName} - Saint Stephen's Episcopal School

Hi Family!

${studentName}'s personalized Saint Stephen's tour is ready! Here are the details:

🎯 PERSONALIZED MATCHES:
• Recommended Faculty: ${matchedFaculty?.firstName} ${matchedFaculty?.lastName} (${matchedFaculty?.title})
• Student Interests: ${quizResults.interests.join(', ')}

📋 SELECTED TOUR EXPERIENCES:
${tourList}

🎟️ TOUR PASS:
Show the QR code (attached image) at the front desk for your personalized tour. No appointment needed - just arrive and scan!

Questions? Contact our Admissions Office:
📧 admissions@saintstephens.org
📞 (555) 123-4567

Looking forward to welcoming you to Saint Stephen's!

The Admissions Team
Saint Stephen's Episcopal School`;
}