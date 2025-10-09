'use client';

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Calendar, Check, Home, Mail, Copy, CheckCircle, ChevronDown, Play, Send, QrCode, Download, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AIService } from '@/lib/ai/ai-service';
import { QuizResponse, AnalysisResult } from '@/lib/ai/types';
import alumniData from '@/knowledge/alumni-story.json';
import facultyData from '@/knowledge/faculty-story.json';
import currentStudentData from '@/knowledge/current-student-stories.json';
import factsData from '@/knowledge/facts.json';
import { Confetti } from '@/components/ui/confetti';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { generateEmailTemplate, generateAdmissionsChecklist, copyToClipboard } from '@/lib/email-template';
import { generateTourId, generateQRCode, saveTourPassData, createTourPassEmail, type TourPassData } from '@/lib/qr-generator';
import { WarpBackground } from '@/components/ui/shadcn-io/warp-background';
import { ABTestingService } from '@/lib/ai/ab-testing';

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTourItems, setSelectedTourItems] = useState<string[]>([]);
  const [expandedTourItem, setExpandedTourItem] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [checklistCopied, setChecklistCopied] = useState(false);
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [showTourPassModal, setShowTourPassModal] = useState(false);
  const [tourPassData, setTourPassData] = useState<TourPassData | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [generatingTourPass, setGeneratingTourPass] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState({
    student: true,
    faculty: true,
    alumni: true
  });
  const hasRequestedAnalysis = useRef(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>();
  const [activeSlide, setActiveSlide] = useState(0);

  const storyCards = useMemo(() => {
    const cards: Array<{ id: string; type: 'student' | 'faculty' | 'alumni'; hasVideo: boolean; node: ReactNode }> = [];

    if (!results) {
      return cards;
    }

    const currentStudents = results.matchedStories?.filter(story => !(story as any).classYear) || [];
    const firstCurrentStudent = currentStudents[0];

    if (firstCurrentStudent) {
      const videoUrl = (firstCurrentStudent as any)?.videoUrl;
      cards.push({
        id: 'current-student',
        type: 'student',
        hasVideo: Boolean(videoUrl),
        node: (
          <div className="rounded-2xl overflow-hidden shadow-sm bg-white">
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900">{(() => {
                const id = firstCurrentStudent?.id;
                switch (id) {
                  case 'creative_arts':
                    return 'Meet Betsy';
                  case 'athletics_excellence':
                    return 'Meet the Falcons';
                  case 'athletics_spotlight':
                    return 'Explore Falcons Athletics';
                  case 'lower_school_parents':
                    return 'Meet Our Families';
                  case 'academic_excellence':
                    return 'Meet Our Academic Team';
                  case 'sophia_camden_community':
                    return 'Meet Sophia & Camden';
                  case 'mak_athletics':
                    return 'Meet Mak';
                  case 'leah_jaida_athletics_academics':
                    return 'Meet Leah & Jaida';
                  case 'keymani_athletics_academics':
                    return 'Meet Keymani';
                  case 'julie_journalism_social_media':
                    return 'Meet Julie';
                  case 'isabelle_athletics':
                    return 'Meet Isabelle';
                  case 'grace_pearson_clubs_academics':
                    return 'Meet Grace & Pearson';
                  case 'student_teacher_relationships':
                    return 'Hear From Our Students';
                  default:
                    return `Meet ${firstCurrentStudent.firstName}`;
                }
              })()}</h3>
              {(() => {
                const interests = (quizData?.interests || []).slice(0, 3).join(', ');
                const three = (quizData?.childDescription || '')
                  .split(/[,\s]+/)
                  .filter(Boolean)
                  .slice(0, 3)
                  .join(' ');
                const txt = interests ? `You mentioned: ${interests}` : three ? `You said: ${three}` : '';
                return txt ? <p className="text-xs text-gray-600 mt-1">{txt}</p> : null;
              })()}
            </div>
            <div className="relative w-full aspect-video bg-black">
              {(firstCurrentStudent as any)?.videoUrl && playingVideo === 'current-student' ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${((firstCurrentStudent as any)?.videoUrl || '')
                    .split('v=')[1]?.split('&')[0] || ((firstCurrentStudent as any)?.videoUrl || '')
                    .split('/')
                    .pop()}?autoplay=1&rel=0`}
                  title={`${firstCurrentStudent.firstName} ${(firstCurrentStudent as any).lastName || ''}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (firstCurrentStudent as any)?.videoUrl ? (
                <button
                  className="absolute inset-0"
                  onClick={() => setPlayingVideo('current-student')}
                  aria-label="Play video"
                >
                  <Image
                    src={firstCurrentStudent?.photoUrl || ''}
                    alt={`${firstCurrentStudent?.firstName || 'Student'} photo`}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 400px"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAICEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyejN5QzBWjQfzj9fiGttF+87aDEi2YQBm6Iqs3E7HRwJLNSLvlX9vfvEAqWnUEgBZK87Fy1pDOwrNKFiYxZRxGjgCEW/q3M5OqB4WOEQiZbAg3b4IjqB2HrJDzlqxvKWCo8SfLfASLMEw2LctfJlojfFSBOQUVKYgWHBpNcgdKO+vPCL9Zkg4ry98fFgPT0Y3fKK3CW0o+VHNyRzOx5CJwgWLf7e9iqkfwAThNNSLFJ5vHfHlTWuC0TFKuN3F3bSlGK8F5F5rYNmQ7cTB0EyKQxh7xzfJF8NP7nBwBQr8B4j/2Q=="
                    onLoad={() => setImageLoadingStates(prev => ({ ...prev, student: false }))}
                  />
                  {imageLoadingStates.student && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl">
                      <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                    </div>
                  </div>
                </button>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                  Video coming soon
                </div>
              )}
            </div>
          </div>
        ),
      });
    }

    const firstFaculty = results.matchedFaculty?.[0];
    if (firstFaculty) {
      const videoUrl = firstFaculty.videoUrl;
      cards.push({
        id: 'faculty-match',
        type: 'faculty',
        hasVideo: Boolean(videoUrl),
        node: (
          <div className="rounded-2xl overflow-hidden shadow-sm bg-white">
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900">Meet {firstFaculty.firstName} {firstFaculty.lastName}</h3>
              <p className="text-xs text-gray-600 mt-1">
                {(firstFaculty.title || firstFaculty.formalTitle || 'Faculty Member')} • {firstFaculty.department || 'Department'}
              </p>
            </div>
            <div className="relative w-full aspect-video bg-black">
              {firstFaculty?.videoUrl && playingVideo === 'faculty-match' ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${(firstFaculty.videoUrl || '')
                    .split('v=')[1]?.split('&')[0] || (firstFaculty.videoUrl || '')
                    .split('/')
                    .pop()}?autoplay=1&rel=0`}
                  title={`${firstFaculty.firstName} ${firstFaculty.lastName}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : firstFaculty?.videoUrl ? (
                <button
                  className="absolute inset-0"
                  onClick={() => setPlayingVideo('faculty-match')}
                  aria-label="Play video"
                >
                  <Image
                    src={firstFaculty?.photoUrl || ''}
                    alt={`${firstFaculty?.firstName} ${firstFaculty?.lastName} photo`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl">
                      <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                    </div>
                  </div>
                </button>
              ) : (
                <Image
                  src={firstFaculty?.photoUrl || ''}
                  alt={`${firstFaculty?.firstName} ${firstFaculty?.lastName} photo`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              )}
            </div>
          </div>
        ),
      });
    }

    const alumniStories = results.matchedStories?.filter(story => (story as any).classYear) || [];
    const firstAlumni = alumniStories[0];

    if (firstAlumni) {
      const videoUrl = (firstAlumni as any)?.videoUrl;
      cards.push({
        id: 'alumni-story',
        type: 'alumni',
        hasVideo: Boolean(videoUrl),
        node: (
          <div className="rounded-2xl overflow-hidden shadow-sm bg-white">
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900">Meet {firstAlumni.firstName} {(firstAlumni as any).lastName || ''}</h3>
              <p className="text-xs text-gray-600 mt-1">Class of {(firstAlumni as any).classYear} • {(firstAlumni as any).currentRole || 'Alumni'}</p>
            </div>
            <div className="relative w-full aspect-video bg-black">
              {(firstAlumni as any)?.videoUrl && playingVideo === 'alumni-story' ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${((firstAlumni as any)?.videoUrl || '')
                    .split('v=')[1]?.split('&')[0] || ((firstAlumni as any)?.videoUrl || '')
                    .split('/')
                    .pop()}?autoplay=1&rel=0`}
                  title={`${firstAlumni.firstName} ${(firstAlumni as any).lastName || ''}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (firstAlumni as any)?.videoUrl ? (
                <button
                  className="absolute inset-0"
                  onClick={() => setPlayingVideo('alumni-story')}
                  aria-label="Play video"
                >
                  <Image
                    src={firstAlumni?.photoUrl || ''}
                    alt={`${firstAlumni?.firstName} ${firstAlumni?.lastName} photo`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl">
                      <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                    </div>
                  </div>
                </button>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                  Video coming soon
                </div>
              )}
            </div>
          </div>
        ),
      });
    }

    return cards;
  }, [results, quizData, imageLoadingStates, playingVideo]);

  const totalStorySlides = storyCards.length;

  useEffect(() => {
    if (!carouselApi || storyCards.length === 0) return;

    const handleSelect = () => {
      const index = carouselApi.selectedScrollSnap() ?? 0;
      setActiveSlide(index);
      setPlayingVideo(null);
    };

    carouselApi.on('select', handleSelect);
    handleSelect();

    return () => {
      carouselApi.off('select', handleSelect);
    };
  }, [carouselApi, storyCards.length]);

  useEffect(() => {
    if (!carouselApi || storyCards.length <= 1) return;
    if (playingVideo) return;

    const autoplay = setInterval(() => {
      if (!carouselApi) return;
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext();
      } else {
        carouselApi.scrollTo(0);
      }
    }, 6000);

    return () => clearInterval(autoplay);
  }, [carouselApi, storyCards.length, playingVideo]);

  useEffect(() => {
    // Prevent duplicate analysis calls using ref
    if (results || hasRequestedAnalysis.current) return;

    // Mark that we've started analysis to prevent duplicates
    hasRequestedAnalysis.current = true;

    // Set a reasonable timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (!results) {
        console.warn('Analysis taking too long, showing fallback results');
        setLoading(false);
      }
    }, 15000); // 15 second timeout

    const analyzeQuizData = async () => {
      let parsedQuizData: QuizResponse | null = null;

      try {
        const quizDataStr = sessionStorage.getItem('quizData');
        if (!quizDataStr) {
          router.push('/quiz');
          return;
        }

        parsedQuizData = JSON.parse(quizDataStr);
        setQuizData(parsedQuizData);


        // Use the AI service which respects admin settings
        const aiService = AIService.getInstance();
        
        // Perform analysis
        if (!parsedQuizData) {
          throw new Error('No quiz data found');
        }
        
        const analysisResult = await aiService.analyze(parsedQuizData, {
          stories: [...currentStudentData.stories, ...alumniData.stories] as any[],
          faculty: facultyData.faculty as any[],
          facts: factsData.facts as any[]
        });

        setResults(analysisResult);
      } catch (error) {
        console.error('Analysis error:', error);
        console.log('Using fallback logic with parsed quiz data:', parsedQuizData);
        // Intelligent fallback based on parsed quiz data
        const interests = parsedQuizData?.interests || [];
        console.log('Detected interests:', interests);
        const allStories = [...currentStudentData.stories, ...alumniData.stories];
        
        // Find stories with video content first, then by interest match
        const videoStories = allStories.filter(s => s.videoUrl && s.videoUrl.includes('youtube'));
        const interestMatchedStories = allStories.filter(s => 
          s.interests?.some(si => interests.some(ui => si.toLowerCase().includes(ui.toLowerCase())))
        );
        
        // Goal: 1 current student + 1 teacher with videos
        const currentStudents = allStories.filter(s => s.gradeLevel && !('classYear' in s));
        
        // Broad category matching system
        const categoryMapping = {
          athletics: [
            'athletics', 'sports', 'football', 'basketball', 'tennis', 'soccer', 
            'baseball', 'volleyball', 'track', 'field', 'swimming', 'polo', 
            'golf', 'wrestling', 'cross country', 'lacrosse', 'competition', 
            'teamwork', 'fitness', 'coaching', 'championship', 'training',
            'athletic', 'sporty', 'active', 'physical', 'outdoorsy'
          ],
          academics: [
            'academics', 'science', 'math', 'mathematics', 'technology', 'research', 
            'stem', 'college_prep', 'engineering', 'physics', 'chemistry', 
            'biology', 'computer science', 'literature', 'history', 'geography',
            'economics', 'business', 'leadership', 'scholarship', 'learning',
            'computer', 'coding', 'programming', 'tech', 'robotics', 'chess',
            'intellectual', 'studious', 'analytical', 'logical', 'curious',
            'lego', 'building', 'construction', 'maker', 'hands-on', 'crafting',
            'woodworking', 'mechanical', 'inventor', 'builder', 'tinkering'
          ],
          creativity: [
            'arts', 'creativity', 'creative', 'theater', 'theatre', 'music', 
            'performance', 'visual_arts', 'art', 'painting', 'drawing', 'design', 
            'dance', 'singing', 'drama', 'sculpture', 'photography', 'writing', 
            'poetry', 'storytelling', 'imagination', 'artistic', 'innovative',
            'artsy', 'musical', 'goth', 'alternative', 'indie', 'bohemian',
            'expressive', 'unique', 'unconventional', 'individualistic',
            'introvert', 'introverted', 'quiet', 'reserved', 'thoughtful'
          ],
          community: [
            'community', 'service', 'volunteer', 'helping', 'social', 'friendship',
            'collaboration', 'mentorship', 'civic', 'charity', 'outreach',
            'support', 'care', 'empathy', 'giving back', 'making a difference',
            'church', 'faith', 'spiritual', 'religious', 'ministry', 'mission'
          ],
          entrepreneurs: [
            'business', 'entrepreneur', 'entrepreneurial', 'startup', 'innovation',
            'leadership', 'ambitious', 'driven', 'competitive', 'goal-oriented',
            'visionary', 'strategic', 'risk-taking', 'self-motivated'
          ]
        };

        // Function to check if interests match any category
        const matchesCategory = (category: string[]) => 
          interests.some(interest => 
            category.some(keyword => 
              interest.toLowerCase().includes(keyword.toLowerCase()) || 
              keyword.toLowerCase().includes(interest.toLowerCase())
            )
          );

        // Smart current student selection with broad matching
        const candidateStudents = [];
        
        if (matchesCategory(categoryMapping.creativity)) {
          candidateStudents.push(...currentStudents.filter(s => 'category' in s && s.category === 'creative'));
          console.log('Added creative students based on broad creativity matching');
        }
        
        if (matchesCategory(categoryMapping.athletics)) {
          candidateStudents.push(...currentStudents.filter(s => 'category' in s && s.category === 'athletics'));
          console.log('Added athletics students based on broad athletics matching');
        }
        
        if (matchesCategory(categoryMapping.academics)) {
          candidateStudents.push(...currentStudents.filter(s => 'category' in s && s.category === 'academic'));
          console.log('Added academic students based on broad academics matching');
        }
        
        if (matchesCategory(categoryMapping.entrepreneurs)) {
          candidateStudents.push(...currentStudents.filter(s => 'category' in s && s.category === 'academic')); // Business minded students often in academic track
          console.log('Added students based on entrepreneurial matching');
        }
        
        // If no matches or add some variety, include some default category students
        if (candidateStudents.length === 0) {
          candidateStudents.push(...currentStudents.filter(s => 'category' in s && s.category === 'default'));
        }
        
        // Enhanced alumni matching with broad categories
        if (candidateStudents.length <= 2) {
          // Find alumni that match broad categories
          const categoryMatchedAlumni = allStories.filter(s => {
            if (!('classYear' in s) || !s.videoUrl || !s.videoUrl.includes('youtube')) return false;
            
            return s.interests?.some(storyInterest => {
              const storyInterestLower = storyInterest.toLowerCase();
              
              // Check if story interest matches any of our broad categories
              return (matchesCategory(categoryMapping.athletics) && 
                      categoryMapping.athletics.some(keyword => storyInterestLower.includes(keyword.toLowerCase()))) ||
                     (matchesCategory(categoryMapping.academics) && 
                      categoryMapping.academics.some(keyword => storyInterestLower.includes(keyword.toLowerCase()))) ||
                     (matchesCategory(categoryMapping.creativity) && 
                      categoryMapping.creativity.some(keyword => storyInterestLower.includes(keyword.toLowerCase()))) ||
                     (matchesCategory(categoryMapping.community) && 
                      categoryMapping.community.some(keyword => storyInterestLower.includes(keyword.toLowerCase()))) ||
                     (matchesCategory(categoryMapping.entrepreneurs) && 
                      categoryMapping.entrepreneurs.some(keyword => storyInterestLower.includes(keyword.toLowerCase())));
            });
          });
          
          if (categoryMatchedAlumni.length > 0) {
            console.log('Adding category-matched alumni:', categoryMatchedAlumni.map(s => `${s.firstName} ${'lastName' in s ? s.lastName : ''}`));
            candidateStudents.push(...categoryMatchedAlumni.slice(0, 2)); // Add up to 2 alumni
          }
        }
        
        // Separate current students and alumni for proper card ordering
        const currentStudentCandidates = candidateStudents.filter(s => s.gradeLevel && !('classYear' in s));
        const alumniCandidates = candidateStudents.filter(s => 'classYear' in s);
        
        // Always try to get one current student first
        const selectedCurrentStudent = currentStudentCandidates
          .sort((a, b) => (a.videoUrl ? -1 : 1) - (b.videoUrl ? -1 : 1) || a.id.localeCompare(b.id))[0] || null;
        
        // Always try to get one alumni for the last card
        const selectedAlumni = alumniCandidates
          .sort((a, b) => (a.videoUrl ? -1 : 1) - (b.videoUrl ? -1 : 1) || a.id.localeCompare(b.id))[0] || null;
        
        console.log('Selected current student:', selectedCurrentStudent?.firstName, 'lastName' in (selectedCurrentStudent || {}) ? (selectedCurrentStudent as any).lastName : '');
        console.log('Selected alumni for bottom card:', selectedAlumni?.firstName, 'lastName' in (selectedAlumni || {}) ? (selectedAlumni as any).lastName : '');
        
        // Build stories array: [current student (or faculty if none), faculty, alumni]
        const fallbackStories = [];
        
        // First card: Current student
        if (selectedCurrentStudent) {
          fallbackStories.push(selectedCurrentStudent);
        }
        
        // Add alumni as the last card if available
        if (selectedAlumni) {
          fallbackStories.push(selectedAlumni);
        }
        
        // If we have no stories, fall back to random video stories
        if (fallbackStories.length === 0) {
          fallbackStories.push(...videoStories.slice(0, 1));
        }

        // Smart faculty selection based on broad categories
        const videoFaculty = facultyData.faculty.filter(f => f.videoUrl && f.videoUrl.includes('youtube'));
        
        // Enhanced faculty matching with specific recommendations
        const getFacultyRecommendations = () => {
          const facultyMap = {
            // Business/Entrepreneurship interests
            business: ['bernie_yanelli'], 
            entrepreneurship: ['bernie_yanelli'],
            economics: ['bernie_yanelli'],
            
            // STEAM/Math/Engineering interests  
            stem: ['tyler_cotton'],
            math: ['tyler_cotton'],
            mathematics: ['tyler_cotton'],
            engineering: ['tyler_cotton'],
            technology: ['tyler_cotton'],
            robotics: ['tyler_cotton'],
            computer: ['tyler_cotton'],
            coding: ['tyler_cotton'],
            programming: ['tyler_cotton'],
            lego: ['tyler_cotton'],
            building: ['tyler_cotton'],
            maker: ['tyler_cotton'],
            mechanical: ['tyler_cotton'],
            chess: ['tyler_cotton'],
            
            // Creative/Arts interests
            creativity: ['david_johnson'],
            creative: ['david_johnson'], 
            writing: ['david_johnson'],
            literature: ['david_johnson'],
            english: ['david_johnson'],
            arts: ['david_johnson'],
            
            // History/Social Studies interests
            history: ['patrick_whelan'],
            government: ['patrick_whelan'],
            social_studies: ['patrick_whelan'],
            
            // Athletics interests
            athletics: ['cole_hudson'],
            sports: ['cole_hudson'],
            competition: ['cole_hudson'],
            
            // Younger kids (elementary focus)
            reading: ['jennifer_batson'],
            foundational_skills: ['jennifer_batson'],
            literacy: ['jennifer_batson'],
            
            // Faith/Community interests
            church: ['cori_rigney'],
            faith: ['cori_rigney'],
            spiritual: ['cori_rigney'],
            religious: ['cori_rigney'],
            
            // Default recommendation
            default: ['patrick_whelan'] // Teacher of the Year
          };
          
          const recommendedIds = new Set();
          
          // Priority 1: Specific keyword matches (highest priority)
          const specificMatches = new Set();
          interests.forEach(interest => {
            const interestLower = interest.toLowerCase();
            Object.entries(facultyMap).forEach(([key, facultyIds]) => {
              // Exclude 'default' from specific matches
              if (key !== 'default' && (interestLower.includes(key) || key.includes(interestLower))) {
                facultyIds.forEach(id => {
                  specificMatches.add(id);
                  recommendedIds.add(id);
                });
              }
            });
          });
          
          // Priority 2: Broad category matches (only if no specific matches)
          if (specificMatches.size === 0) {
            if (matchesCategory(categoryMapping.athletics)) recommendedIds.add('cole_hudson');
            if (matchesCategory(categoryMapping.academics)) {
              recommendedIds.add('tyler_cotton'); // STEM
              recommendedIds.add('patrick_whelan'); // Social Studies
            }
            if (matchesCategory(categoryMapping.creativity)) recommendedIds.add('david_johnson');
          }
          
          // If no specific matches, use default recommendation
          if (recommendedIds.size === 0) recommendedIds.add('patrick_whelan');
          
          return Array.from(recommendedIds);
        };
        
        const recommendedFacultyIds = getFacultyRecommendations();
        console.log('Recommended faculty IDs:', recommendedFacultyIds);
        
        const interestMatchedFaculty = facultyData.faculty.filter(f => 
          recommendedFacultyIds.includes(f.id)
        );
        
        console.log('Available video faculty count:', videoFaculty.length);
        console.log('Interest-matched faculty:', interestMatchedFaculty.map(f => `${f.firstName} ${f.lastName} - ${f.title}`));
        
        // Prefer interest-matched faculty, fallback to video faculty, then all faculty
        let facultyCandidates = [];
        
        // First priority: Interest-matched faculty with videos
        const interestVideoFaculty = interestMatchedFaculty.filter(f => f.videoUrl && f.videoUrl.includes('youtube'));
        if (interestVideoFaculty.length > 0) {
          facultyCandidates = interestVideoFaculty;
          console.log('Using interest-matched video faculty');
        }
        // Second priority: Any interest-matched faculty (even without video)
        else if (interestMatchedFaculty.length > 0) {
          facultyCandidates = interestMatchedFaculty;
          console.log('Using interest-matched faculty (no video)');
        }
        // Fallback: Random video faculty
        else {
          facultyCandidates = videoFaculty;
          console.log('Using random video faculty');
        }
        
        // Use timestamp-based randomization for better variety
        const randomSeed = Date.now();
        const shuffleArray = (array: any[]) => {
          const shuffled = [...array];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor((Math.sin(randomSeed + i) + 1) * shuffled.length / 2);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        };
        
        const shuffledFaculty = shuffleArray(facultyCandidates);
        const fallbackFaculty = shuffledFaculty.length > 0 ? shuffledFaculty.slice(0, 1) : 
          shuffleArray(facultyData.faculty).slice(0, 1);
        console.log('Selected faculty:', fallbackFaculty[0]?.firstName, fallbackFaculty[0]?.lastName, '-', fallbackFaculty[0]?.title);
        
        setResults({
          matchScore: 87,
          personalizedMessage: "Thank you for your interest in Saint Stephen's! We're excited to share what makes our school special and help you discover the perfect fit for your child.",
          matchedStories: fallbackStories as any[],
          matchedFaculty: fallbackFaculty as any[],
          keyInsights: ['Academic Excellence', 'Character Development', 'Individual Attention', 'Community Focus'],
          recommendedPrograms: ['College Preparatory Program', 'Fine Arts', 'Athletics'],
          provider: 'client-fallback'
        } as any);
      } finally {
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    };

    analyzeQuizData();

    // Cleanup timeout on unmount
    return () => clearTimeout(loadingTimeout);
  }, [router]);

  const handleCopyEmailTemplate = async () => {
    if (!quizData || !results) return;
    
    const emailData = {
      ...quizData,
      ...results,
      selectedTourItems
    };
    
    const { body } = generateEmailTemplate(emailData, undefined, selectedTourItems);
    
    const success = await copyToClipboard(body);
    if (success) {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 3000);
    }
  };

  const handleCopyAdmissionsChecklist = async () => {
    if (!quizData || !results) return;
    
    const emailData = {
      ...quizData,
      ...results,
      selectedTourItems
    };
    
    const checklist = generateAdmissionsChecklist(emailData);
    
    const success = await copyToClipboard(checklist);
    if (success) {
      setChecklistCopied(true);
      setTimeout(() => setChecklistCopied(false), 3000);
    }
  };

  const handleEmailAdmissions = () => {
    if (!quizData || !results) return;
    
    const emailData = {
      ...quizData,
      ...results,
      selectedTourItems
    };
    
    const { subject, body } = generateEmailTemplate(emailData, undefined, selectedTourItems);
    const tourEmail = process.env.NEXT_PUBLIC_TOUR_EMAIL || 'admissions@saintstephens.org';
    
    const mailtoLink = `mailto:${tourEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleShare = async () => {
    setSharing(true);
    
    const shareData = {
      matchScore: results?.matchScore || 92,
      selectedTourItems,
      studentStory: results?.matchedStories[0],
      faculty: results?.matchedFaculty[0],
      link: window.location.href
    };

    const selectedTourText = selectedTourItems.map(itemId => {
      const option = tourOptions?.find(opt => opt.id === itemId);
      return option ? `• ${option.title}` : '';
    }).filter(Boolean).join('\n') || '• No tour items selected yet';

    const emailSubject = encodeURIComponent(`Saint Stephen's - ${shareData.matchScore}% match`);
    
    const emailBody = encodeURIComponent(`${shareData.matchScore}% match!

${results?.matchedStories?.[0]?.firstName ? `${results.matchedStories[0].firstName}: ${results.matchedStories[0].achievement}` : ''}

${results?.matchedFaculty?.[0]?.firstName ? `Mentor: ${results.matchedFaculty[0].firstName} ${results.matchedFaculty[0].lastName} (${results.matchedFaculty[0].title})` : ''}

Want to see:
${selectedTourText}

Full results: ${shareData.link}`);

    // Open email client with pre-filled content
    window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
    
    setSharing(false);
  };

  const handleGenerateTourPass = async () => {
    if (!results || !quizData) return;
    
    setGeneratingTourPass(true);
    
    try {
      const tourId = generateTourId();
      const studentName = (quizData as any).studentName || 'Student';
      
      // Create tour pass data
      const tourPassData: TourPassData = {
        tourId,
        studentName,
        timestamp: new Date().toISOString(),
        quizResults: {
          interests: quizData.interests || [],
          matchedFaculty: (results.matchedFaculty || []) as any,
          matchedStudent: (results.matchedStories?.filter(s => s.gradeLevel && !('classYear' in s)) || []) as any,
          matchedAlumni: (results.matchedStories?.filter(s => 'classYear' in s) || []) as any
        },
        selectedTours: selectedTourItems.map(itemId => {
          const option = tourOptions?.find(opt => opt.id === itemId);
          return {
            id: itemId,
            title: option?.title || '',
            description: option?.description || ''
          };
        }).filter(tour => tour.title),
        status: 'active'
      };
      
      // Save to localStorage
      saveTourPassData(tourId, tourPassData);
      
      // Generate QR code
      const qrDataURL = await generateQRCode(tourId);
      
      setTourPassData(tourPassData);
      setQrCode(qrDataURL);
      setShowTourPassModal(true);
      
    } catch (error) {
      console.error('Error generating tour pass:', error);
      alert('Error generating tour pass. Please try again.');
    } finally {
      setGeneratingTourPass(false);
    }
  };

  const handleDownloadTourPass = () => {
    if (!qrCode || !tourPassData) return;
    
    const link = document.createElement('a');
    link.download = `saint-stephens-tour-pass-${tourPassData.studentName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrCode;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmailTourPass = () => {
    if (!tourPassData || !qrCode) return;
    
    const emailTemplate = createTourPassEmail(tourPassData, qrCode);
    const [subject, ...bodyLines] = emailTemplate.split('\n');
    const body = bodyLines.join('\n');
    
    const mailtoLink = `mailto:?${subject}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  // Smart tour recommendations based on kid archetypes
  const getTourRecommendations = () => {
    if (!results || !quizData?.interests) return [];

    const interests = quizData.interests;
    
    // Same category mapping as our RAG system
    const categoryMapping = {
      athletics: [
        'athletics', 'sports', 'football', 'basketball', 'tennis', 'soccer', 
        'baseball', 'volleyball', 'track', 'field', 'swimming', 'polo', 
        'golf', 'wrestling', 'cross country', 'lacrosse', 'competition', 
        'teamwork', 'fitness', 'coaching', 'championship', 'training',
        'athletic', 'sporty', 'active', 'physical', 'outdoorsy'
      ],
      academics: [
        'academics', 'science', 'math', 'mathematics', 'technology', 'research', 
        'stem', 'college_prep', 'engineering', 'physics', 'chemistry', 
        'biology', 'computer science', 'literature', 'history', 'geography',
        'economics', 'business', 'leadership', 'scholarship', 'learning',
        'computer', 'coding', 'programming', 'tech', 'robotics', 'chess',
        'intellectual', 'studious', 'analytical', 'logical', 'curious',
        'lego', 'building', 'construction', 'maker', 'hands-on', 'crafting',
        'woodworking', 'mechanical', 'inventor', 'builder', 'tinkering'
      ],
      creativity: [
        'arts', 'creativity', 'creative', 'theater', 'theatre', 'music', 
        'performance', 'visual_arts', 'art', 'painting', 'drawing', 'design', 
        'dance', 'singing', 'drama', 'sculpture', 'photography', 'writing', 
        'poetry', 'storytelling', 'imagination', 'artistic', 'innovative',
        'artsy', 'musical', 'goth', 'alternative', 'indie', 'bohemian',
        'expressive', 'unique', 'unconventional', 'individualistic',
        'introvert', 'introverted', 'quiet', 'reserved', 'thoughtful'
      ],
      community: [
        'community', 'service', 'volunteer', 'helping', 'social', 'friendship',
        'collaboration', 'mentorship', 'civic', 'charity', 'outreach',
        'support', 'care', 'empathy', 'giving back', 'making a difference',
        'church', 'faith', 'spiritual', 'religious', 'ministry', 'mission'
      ],
      entrepreneurs: [
        'business', 'entrepreneur', 'entrepreneurial', 'startup', 'innovation',
        'leadership', 'ambitious', 'driven', 'competitive', 'goal-oriented',
        'visionary', 'strategic', 'risk-taking', 'self-motivated'
      ]
    };

    const matchesCategory = (category: string[]) => 
      interests.some(interest => 
        category.some(keyword => 
          interest.toLowerCase().includes(keyword.toLowerCase()) || 
          keyword.toLowerCase().includes(interest.toLowerCase())
        )
      );

    // All possible tour options with archetype targeting
    const allTourOptions = [
      // Always include meeting the matched faculty
      {
        id: 'meet-faculty',
        title: `Meet ${results.matchedFaculty?.[0] ? (results.matchedFaculty[0].formalTitle + ' ' + results.matchedFaculty[0].lastName) : 'Your Mentor'}`,
        description: `${results.matchedFaculty?.[0]?.title || 'Faculty Member'} - Your personalized connection`,
        priority: 1,
        categories: ['all']
      },
      
      // Athletics options
      {
        id: 'athletics-practice',
        title: 'Watch Team Practice',
        description: '19 varsity sports, 20 state championships - See our competitive spirit',
        priority: 2,
        categories: ['athletics']
      },
      {
        id: 'athletics-facilities',
        title: 'Tour Athletic Facilities',
        description: 'State-of-the-art gym, fields, and training equipment',
        priority: 3,
        categories: ['athletics']
      },
      
      // STEM/Academic options
      {
        id: 'steam-center',
        title: 'Explore STEAM Innovation Center',
        description: 'Maker spaces, robotics lab, and hands-on engineering projects',
        priority: 2,
        categories: ['academics', 'entrepreneurs']
      },
      {
        id: 'marine-lab',
        title: 'Visit Marine Science Lab',
        description: 'Living coral reef, marine research, and cutting-edge science',
        priority: 3,
        categories: ['academics']
      },
      {
        id: 'computer-lab',
        title: 'See Computer Science Labs',
        description: 'Programming, coding bootcamps, and tech innovation spaces',
        priority: 3,
        categories: ['academics']
      },
      
      // Creative options
      {
        id: 'arts-showcase',
        title: 'Explore Arts Programs',
        description: 'Student galleries, 600-seat theater, music studios, and creative spaces',
        priority: 2,
        categories: ['creativity']
      },
      {
        id: 'performing-arts',
        title: 'Visit Performing Arts Center',
        description: 'Theater productions, music performances, and dance studios',
        priority: 3,
        categories: ['creativity']
      },
      
      // Community/Faith options
      {
        id: 'chapel-service',
        title: 'Experience Chapel Service',
        description: 'Spiritual life, community worship, and character development',
        priority: 2,
        categories: ['community']
      },
      {
        id: 'service-projects',
        title: 'See Community Service in Action',
        description: 'Student-led volunteer work and local community partnerships',
        priority: 3,
        categories: ['community']
      },
      
      // Business/Leadership options
      {
        id: 'student-government',
        title: 'Meet Student Leaders',
        description: 'Student government, entrepreneurship club, and leadership development',
        priority: 3,
        categories: ['entrepreneurs']
      },
      
      // General academic excellence
      {
        id: 'small-class',
        title: 'Sit in on a Small Class',
        description: 'Experience our 9:1 student-teacher ratio firsthand',
        priority: 2,
        categories: ['all']
      },
      {
        id: 'college-counseling',
        title: 'Meet College Counselors',
        description: '100% college acceptance rate, $2.3M in scholarships annually',
        priority: 3,
        categories: ['academics', 'entrepreneurs']
      }
    ];

    // Score and filter options based on interests
    let recommendedOptions = [];
    
    // Add high-priority universal options
    recommendedOptions.push(...allTourOptions.filter(opt => 
      opt.categories.includes('all') && opt.priority <= 2
    ));

    // Add category-specific high-priority options
    if (matchesCategory(categoryMapping.athletics)) {
      recommendedOptions.push(...allTourOptions.filter(opt => 
        opt.categories.includes('athletics') && opt.priority <= 2
      ));
    }
    
    if (matchesCategory(categoryMapping.academics)) {
      recommendedOptions.push(...allTourOptions.filter(opt => 
        opt.categories.includes('academics') && opt.priority <= 2
      ));
    }
    
    if (matchesCategory(categoryMapping.creativity)) {
      recommendedOptions.push(...allTourOptions.filter(opt => 
        opt.categories.includes('creativity') && opt.priority <= 2
      ));
    }
    
    if (matchesCategory(categoryMapping.community)) {
      recommendedOptions.push(...allTourOptions.filter(opt => 
        opt.categories.includes('community') && opt.priority <= 2
      ));
    }
    
    if (matchesCategory(categoryMapping.entrepreneurs)) {
      recommendedOptions.push(...allTourOptions.filter(opt => 
        opt.categories.includes('entrepreneurs') && opt.priority <= 2
      ));
    }

    // Fill remaining slots with lower priority options if needed
    const remainingSlots = 4 - recommendedOptions.length;
    if (remainingSlots > 0) {
      const additionalOptions = allTourOptions.filter(opt => 
        !recommendedOptions.some(rec => rec.id === opt.id) && opt.priority === 3
      );
      recommendedOptions.push(...additionalOptions.slice(0, remainingSlots));
    }

    // Remove duplicates and limit to 4 options
    const uniqueOptions = recommendedOptions.filter((option, index, self) => 
      index === self.findIndex(opt => opt.id === option.id)
    );

    return uniqueOptions.slice(0, 4);
  };

  const tourOptions = getTourRecommendations();

  const toggleTourItem = (itemId: string) => {
    if (selectedTourItems.includes(itemId)) {
      setSelectedTourItems(prev => prev.filter(id => id !== itemId));
    } else if (selectedTourItems.length < 5) {
      setSelectedTourItems(prev => [...prev, itemId]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-green-900 to-emerald-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-green-100 mb-6 tracking-tight">
            Finding Your Perfect Match
          </h1>
          <p className="text-lg md:text-xl text-green-200 mb-8">
            Analyzing your responses...
          </p>
          <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-green-300 mt-4">
            This usually takes just a few seconds
          </p>
        </div>
      </div>
    );
  }

  if (!results) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Confetti Animation - once per session */}
      <Confetti duration={1500} particleCount={50} oncePerSession storageKey="results_confetti" />
      
      {/* Header removed on results page to save vertical space */}

      {/* Results Content */}
      <main className="max-w-4xl mx-auto px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Match Score */}
          <div className="text-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="inline-flex flex-col items-center"
            >
              <div className="flex items-baseline gap-2">
                <div className="text-6xl md:text-7xl font-bold text-[#004b34]">
                  {Math.round(results.matchScore)}%
                </div>
                <div className="text-xl md:text-2xl font-semibold text-[#004b34]">match</div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {(() => {
                  const ints = (quizData?.interests || []).map(i => i.toLowerCase());
                  if (ints.some(i => ['business','entrepreneurship','economics','leadership'].includes(i))) return 'Entrepreneurship and leadership';
                  if (ints.some(i => ['athletics','sports','tennis','soccer','basketball','golf','swimming'].includes(i))) return 'Athletic aspirations';
                  if (ints.some(i => ['stem','technology','science','engineering','robotics','coding','programming'].includes(i))) return 'STEM curiosity';
                  if (ints.some(i => ['arts','music','drama','theater','creative','design','media'].includes(i))) return 'Creative passions';
                  return '';
                })()}
              </p>
            </motion.div>
          </div>

          {/* Personalized Message and detailed reasons removed per UX simplification */}


          {/* Stories Carousel */}
          {results.matchedStories && results.matchedStories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Carousel className="w-full" opts={{ loop: false }} setApi={setCarouselApi}>
                <CarouselContent className="ml-0">
                  {storyCards.map(card => (
                    <CarouselItem key={card.id} className="pl-0">
                      {card.node}
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {totalStorySlides > 1 && (
                  <>
                    <CarouselPrevious className="hidden md:flex" />
                    <CarouselNext className="hidden md:flex" />
                  </>
                )}
              </Carousel>
              {totalStorySlides > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  {storyCards.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => carouselApi?.scrollTo(index)}
                      className={`transition-all ${
                        index === activeSlide
                          ? 'w-8 h-2 bg-[#004b34] rounded-full'
                          : 'w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-400'
                      }`}
                      aria-label={`Go to card ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Personalized Tour Checklist */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-sm p-6 md:p-8"
          >
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {selectedTourItems.length >= 3 ? 'Generate Tour Pass' : 'Build Your Perfect Tour'}
            </h2>
            {selectedTourItems.length >= 3 ? (
              <button
                onClick={handleGenerateTourPass}
                disabled={generatingTourPass}
                className="mx-auto mb-4 px-6 py-3 bg-[#003825] text-white rounded-full font-medium hover:bg-[#004b34] transition-all flex items-center shadow-lg"
              >
                <QrCode className="w-4 h-4 mr-2" />
                {generatingTourPass ? 'Creating...' : 'Create Tour Pass'}
              </button>
            ) : (
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">Select what you'd like to experience (select 3+ to create your tour pass)</p>
            )}
            
            <div className="space-y-2">
              {tourOptions.map((option, index) => {
                const isSelected = selectedTourItems.includes(option.id);
                const isExpanded = expandedTourItem === option.id;
                
                return (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                  >
                    <div
                      className={`rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-[#d4a017] bg-[#fffef5]'
                          : 'border-gray-200'
                      }`}
                    >
                      <div
                        onClick={() => {
                          if (!isSelected && selectedTourItems.length < 5) {
                            setSelectedTourItems(prev => [...prev, option.id]);
                          } else if (isSelected) {
                            setSelectedTourItems(prev => prev.filter(id => id !== option.id));
                          }
                        }}
                        className={`p-4 cursor-pointer ${
                          !isSelected && selectedTourItems.length >= 5
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <motion.div 
                            animate={{ 
                              scale: isSelected ? 1.05 : 1
                            }}
                            transition={{ duration: 0.2 }}
                            className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                              isSelected
                                ? 'border-[#d4a017] bg-[#d4a017]'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Check className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                          </motion.div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm md:text-base">{option.title}</h3>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTourItem(isExpanded ? null : option.id);
                            }}
                            className="ml-2 p-1"
                          >
                            <ChevronDown 
                              className={`w-4 h-4 text-gray-400 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4">
                              <p className="text-sm text-gray-600 pl-8">{option.description}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            

          </motion.div>

        </motion.div>
        {/* Mobile bottom spacer to avoid browser chrome overlap */}
        <div className="h-24 md:h-12" />
      </main>

      {/* Tour Pass Modal */}
      <AnimatePresence>
        {showTourPassModal && tourPassData && qrCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowTourPassModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#004b34] to-[#003825] text-white p-4 rounded-t-2xl relative">
                <button
                  onClick={() => setShowTourPassModal(false)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="text-center">
                  <h3 className="text-lg font-bold">Your Tour Pass</h3>
                </div>
              </div>
              
              {/* QR Code */}
              <div className="p-6 pb-24 text-center">
                <div className="bg-white p-4 rounded-lg border-2 border-[#d4a017] inline-block mb-4">
                  <img src={qrCode} alt="Tour Pass QR Code" className="w-48 h-48 mx-auto" />
                </div>
                
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Show at front desk during your tour</h4>
                <p className="text-sm text-gray-600 mb-6">
                  Check with this QR code at front desk during your tour.
                </p>
                
                {/* Tour Summary */}
                <div className="bg-[#fffef5] border border-[#d4a017]/30 rounded-lg p-4 mb-6 text-left">
                  <h5 className="font-semibold text-gray-900 mb-2">Your Tour Includes:</h5>
                  <div className="space-y-1 text-sm text-gray-700">
                    {tourPassData.selectedTours.map((tour, index) => (
                      <div key={tour.id} className="flex items-start">
                        <span className="text-[#d4a017] mr-2">•</span>
                        <span>{tour.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleDownloadTourPass}
                    className="w-full flex items-center justify-center px-4 py-3 bg-[#003825] text-white rounded-lg font-medium hover:bg-[#004b34] transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Save to Phone
                  </button>
                  
                  <button
                    onClick={handleEmailTourPass}
                    className="w-full flex items-center justify-center px-4 py-3 border-2 border-[#003825] text-[#003825] rounded-lg font-medium hover:bg-[#003825]/5 transition-all"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email to Family
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 mt-4">
                  Tour Pass ID: {tourPassData.tourId}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Sticky Book Your Tour Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <a
            href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1pPQ9xNbaHdCjn0RLmWLqhkuL5ePgy2tEp6YAT6tCvHG8emnJQr3gayPfmsnOPCbze_Q_ccJcD"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-8 py-4 bg-[#003825] text-white rounded-full font-medium text-lg hover:bg-[#004b34] transition-all shadow-lg"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Book Your Tour
          </a>
        </div>
      </div>
      
    </div>
  );
}
