'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

export default function CourseLearningPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  
  const [course, setCourse] = useState<any>(null);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [activeChapter, setActiveChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
  
  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<{[key: number]: number}>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizResults, setQuizResults] = useState<any[]>([]); // Store detailed results

  const fetchProgress = async () => {
    if (!user || !id) return;
    try {
        const token = await window.Clerk?.session?.getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${id}/progress`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setCompletedChapters(new Set<string>(data.completedChapters.map((id: any) => String(id))));
        }
    } catch (e) {
        console.error("Failed to fetch progress", e);
    }
  };

  const markChapterComplete = async (chapterId: string) => {
    try {
        const token = await window.Clerk?.session?.getToken();
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${id}/chapters/${chapterId}/complete`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setCompletedChapters(prev => new Set(prev).add(chapterId));
    } catch (e) {
        console.error("Failed to mark complete", e);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
        try {
            // 1. Fetch Course Info
            const courseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${id}`);
            const courseData = await courseRes.json();
            setCourse(courseData);

            // 2. Fetch Curriculum
            const curriculumRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${id}/curriculum`);
            const curriculumData = await curriculumRes.json();
            setSyllabus(curriculumData);

            // 3. Fetch Progress
            if (user) {
                await fetchProgress();
            }

            // 4. Determine Active Chapter
            const chapterIdParam = searchParams.get('chapterId');
            let foundChapter = null;

            if (chapterIdParam) {
                // Find specific chapter
                for (const section of curriculumData) {
                    const found = section.chapters.find((c: any) => c._id === chapterIdParam);
                    if (found) {
                        foundChapter = found;
                        break;
                    }
                }
            }
            
            // Default to first chapter
            if (!foundChapter && curriculumData.length > 0 && curriculumData[0].chapters.length > 0) {
                foundChapter = curriculumData[0].chapters[0];
            }

            if (foundChapter) {
                setActiveChapter(foundChapter);
                // Ensure the section containing the active chapter is expanded
                const parentSection = curriculumData.find((s: any) => s.chapters.some((c: any) => c._id === foundChapter._id));
                if (parentSection) {
                    setExpandedSections(new Set([parentSection._id]));
                }
            }
            
            setLoading(false);
        } catch (err) {
            console.error("Error fetching course content:", err);
            setLoading(false);
        }
    };

    fetchData();
  }, [id, user]);

  // Handle Chapter Selection
  const handleChapterSelect = (chapter: any) => {
    setActiveChapter(chapter);
    // Reset Quiz State
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizResults([]);
    
    // Update URL without refresh
    router.push(`/courses/${id}/learn?chapterId=${chapter._id}`, { scroll: false });
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
    } else {
        newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleVideoEnded = () => {
    if (activeChapter) {
        markChapterComplete(activeChapter._id);
    }
  };

  // Handle side effects when active chapter changes
  useEffect(() => {
    if (!activeChapter) return;

    if (activeChapter.type === 'pdf' || activeChapter.type === 'text') {
        // Optional: Add a small delay so it doesn't feel instant/broken if they mistakenly clicked
        const timer = setTimeout(() => {
            markChapterComplete(activeChapter._id);
        }, 1000);
        return () => clearTimeout(timer);
    }
    
    // If it's a quiz, check if we have a previous attempt
    if (activeChapter.type === 'quiz') {
        const fetchAttempt = async () => {
            try {
                const token = await window.Clerk?.session?.getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${id}/chapters/${activeChapter._id}/quiz/attempt`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    console.log("[Frontend] Quiz attempt fetch:", data);
                    if (data.attempt) {
                        console.log("[Frontend] Restoring attempt:", data.attempt);
                        setQuizAnswers(data.attempt.answers || {});
                        setQuizScore(data.attempt.score);
                        setQuizResults(data.attempt.results);
                        setQuizSubmitted(true); // Show results view
                    } else {
                        console.log("[Frontend] No previous attempt found.");
                    }
                }
            } catch (e) {
                console.error("Failed to fetch quiz attempt", e);
            }
        };
        fetchAttempt();
    }
  }, [activeChapter, id]);

  const navigateToNext = () => {
    if (!activeChapter || !syllabus) return;

    // Find current indices
    for (let sIdx = 0; sIdx < syllabus.length; sIdx++) {
        const section = syllabus[sIdx];
        const cIdx = section.chapters.findIndex((c: any) => c._id === activeChapter._id);
        
        if (cIdx !== -1) {
            // Found current chapter
            if (cIdx < section.chapters.length - 1) {
                // Next chapter in same section
                handleChapterSelect(section.chapters[cIdx + 1]);
                return;
            } else if (sIdx < syllabus.length - 1) {
                // First chapter of next section
                const nextSection = syllabus[sIdx + 1];
                if (nextSection.chapters.length > 0) {
                    handleChapterSelect(nextSection.chapters[0]);
                    // Auto-expand next section
                    setExpandedSections(prev => new Set(prev).add(nextSection._id));
                    return;
                }
            }
        }
    }
  };

  const navigateToPrevious = () => {
    if (!activeChapter || !syllabus) return;

    // Find current indices
    for (let sIdx = 0; sIdx < syllabus.length; sIdx++) {
        const section = syllabus[sIdx];
        const cIdx = section.chapters.findIndex((c: any) => c._id === activeChapter._id);
        
        if (cIdx !== -1) {
            // Found current chapter
            if (cIdx > 0) {
                // Previous chapter in same section
                handleChapterSelect(section.chapters[cIdx - 1]);
                return;
            } else if (sIdx > 0) {
                // Last chapter of previous section
                const prevSection = syllabus[sIdx - 1];
                if (prevSection.chapters.length > 0) {
                    handleChapterSelect(prevSection.chapters[prevSection.chapters.length - 1]);
                    // Auto-expand prev section
                    setExpandedSections(prev => new Set(prev).add(prevSection._id));
                    return;
                }
            }
        }
    }
  };

  const isFirstChapter = () => {
      if (!activeChapter || !syllabus.length) return true;
      const firstSection = syllabus[0];
      if (!firstSection.chapters.length) return true;
      return activeChapter._id === firstSection.chapters[0]._id;
  };

  const isLastChapter = () => {
      if (!activeChapter || !syllabus.length) return true;
      const lastSection = syllabus[syllabus.length - 1];
      if (!lastSection.chapters.length) return true;
      return activeChapter._id === lastSection.chapters[lastSection.chapters.length - 1]._id;
  };

  const handleQuizAnswer = (qIdx: number, oIdx: number) => {
      if (quizSubmitted) return;
      setQuizAnswers(prev => ({
          ...prev,
          [qIdx]: oIdx
      }));
  };

  const handleQuizSubmit = async () => {
      if (!activeChapter) return;
      
      try {
          const token = await window.Clerk?.session?.getToken();
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${id}/chapters/${activeChapter._id}/quiz/submit`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ answers: quizAnswers })
          });
          
          if (res.ok) {
              const data = await res.json();
              setQuizScore(data.score);
              setQuizResults(data.results);
              setQuizSubmitted(true);
              
              console.log('[Frontend] Quiz Passed. Active Chapter ID:', activeChapter._id);
              console.log('[Frontend] Server returned completedChapters:', data.completedChapters);

              if (data.passed) {
                  // Use server data if available, or fall back to optimistic update
                  if (data.completedChapters) {
                      // Ensure everything is a string
                      const newSet = new Set<string>(data.completedChapters.map((id: any) => String(id)));
                      console.log('[Frontend] VALID STATE UPDATE. New Set size:', newSet.size);
                      setCompletedChapters(newSet);
                  } else {
                      setCompletedChapters(prev => new Set(prev).add(activeChapter._id));
                  }
              }
          }
      } catch (err) {
          console.error("Error submitting quiz:", err);
      }
  };

  if (loading) {
     return (
        <div className="flex h-screen items-center justify-center bg-slate-900">
             <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
     );
  }

  if (!course) {
      return <div>Course not found</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
        {/* Left Sidebar - Curriculum */}
        <div 
            className={`
                fixed inset-y-0 left-0 z-30 w-80 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0
            `}
        >
            <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-slate-50">
                <Link href="/dashboard/student/courses" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                </Link>
            </div>
            
            <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 space-y-4">
                <h2 className="font-bold text-lg text-slate-800 px-2">{course.title}</h2>
                <div className="space-y-4">
                    {syllabus.map((section) => (
                        <div key={section._id} className="border-b border-slate-100 pb-2 last:border-0">
                             <button 
                                onClick={() => toggleSection(section._id)}
                                className="w-full flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 mt-4 hover:text-slate-800 transition-colors"
                             >
                                <span className="text-left">{section.title}</span>
                                <svg 
                                    className={`w-4 h-4 transform transition-transform ${expandedSections.has(section._id) ? 'rotate-180' : ''}`} 
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                             </button>
                             
                             {expandedSections.has(section._id) && (
                                 <div className="space-y-1 mt-2">
                                    {section.chapters.map((chapter: any) => (
                                        <button
                                            key={chapter._id}
                                            onClick={() => handleChapterSelect(chapter)}
                                            className={`
                                                w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all group
                                                ${activeChapter?._id === chapter._id 
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <span className="text-lg opacity-70 flex-shrink-0">
                                                    {chapter.type === 'video' && '🎥'}
                                                    {chapter.type === 'text' && '📄'}
                                                    {chapter.type === 'quiz' && '❓'}
                                                    {chapter.type === 'pdf' && 'fw'}
                                                </span>
                                                <span className="text-left line-clamp-1">{chapter.title}</span>
                                            </div>
                                            {completedChapters.has(chapter._id) && (
                                                <div className={`p-1 rounded-full ${activeChapter?._id === chapter._id ? 'bg-white/20' : 'bg-green-100'} flex-shrink-0`}>
                                                    <svg className={`w-3 h-3 ${activeChapter?._id === chapter._id ? 'text-white' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                 </div>
                             )}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
            {/* Top Bar (Mobile Toggle) */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between md:hidden">
                 <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 text-slate-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                 </button>
                 <span className="font-bold text-slate-800 truncate">{course.title}</span>
            </div>

            {/* Content View */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-2 md:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {activeChapter ? (
                    <div className="w-full mx-auto h-full">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[92vh] flex flex-col">
                            {/* Content Header removed as per request */}


                            {/* Actual Content Render */}
                            <div className="p-2 md:px-2 md:py-4 flex-1 flex flex-col min-h-0">
                                {activeChapter.type === 'video' && (
                                     <div className="flex-1 min-h-[70vh] bg-black rounded-xl overflow-hidden shadow-lg relative">
                                        {activeChapter.content ? (
                                             <video 
                                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${activeChapter.content}`} 
                                                controls 
                                                className="w-full h-full object-contain"
                                                autoPlay={false}
                                                onEnded={handleVideoEnded}
                                             />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-white/50">
                                                No video source available
                                            </div>
                                        )}
                                     </div>
                                )}

                                {activeChapter.type === 'pdf' && (
                                     <div className="flex-1 w-full h-full">
                                         {activeChapter.content ? (
                                             <iframe 
                                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${activeChapter.content}`} 
                                                className="w-full h-full min-h-[80vh]"
                                                title="PDF Viewer"
                                             />
                                         ) : (
                                             <div className="flex items-center justify-center h-full text-slate-400">
                                                 PDF content unavailable
                                             </div>
                                         )}
                                     </div>
                                )}

                                {activeChapter.type === 'quiz' && (
                                     <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-6 overflow-y-auto min-h-0">
                                         <h3 className="font-bold text-xl mb-4">Quiz: {activeChapter.title}</h3>
                                         
                                         {activeChapter.questions && activeChapter.questions.length > 0 ? (
                                             <div className="space-y-6">
                                                 {activeChapter.questions.map((q: any, i: number) => {
                                                     const result = quizResults.find((r: any) => r.questionIndex === i);
                                                     const isCorrect = result?.isCorrect;
                                                     const correctAnswer = result?.correctAnswer;
                                                     
                                                     return (
                                                         <div key={i} className={`p-4 rounded-lg border shadow-sm ${quizSubmitted ? (isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-white border-slate-200'}`}>
                                                             <p className="font-bold text-slate-800 mb-3">{i + 1}. {q.question}</p>
                                                             <div className="space-y-2">
                                                                 {q.options.map((option: string, oIdx: number) => (
                                                                     <label 
                                                                        key={oIdx} 
                                                                        className={`
                                                                            flex items-center space-x-3 p-2 rounded-md border transition-colors cursor-pointer
                                                                            ${!quizSubmitted && 'hover:bg-slate-50 hover:border-slate-200 border-transparent'}
                                                                            ${quizSubmitted && oIdx === correctAnswer ? 'bg-green-100 border-green-300' : ''}
                                                                            ${quizSubmitted && quizAnswers[i] === oIdx && oIdx !== correctAnswer ? 'bg-red-100 border-red-300' : ''}
                                                                        `}
                                                                     >
                                                                         <input 
                                                                            type="radio" 
                                                                            name={`question-${i}`} 
                                                                            checked={quizAnswers[i] === oIdx}
                                                                            onChange={() => handleQuizAnswer(i, oIdx)}
                                                                            disabled={quizSubmitted}
                                                                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 disabled:opacity-50"
                                                                         />
                                                                         <span className="text-slate-700">{option}</span>
                                                                     </label>
                                                                 ))}
                                                             </div>
                                                             {quizSubmitted && !isCorrect && (
                                                                 <p className="mt-2 text-sm text-red-600 font-medium">Correct answer: {q.options[correctAnswer]}</p>
                                                             )}
                                                         </div>
                                                     );
                                                 })}
                                                 
                                                 {!quizSubmitted ? (
                                                     <div className="pt-4">
                                                         <button 
                                                            onClick={handleQuizSubmit}
                                                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                                         >
                                                             Submit Quiz
                                                         </button>
                                                     </div>
                                                 ) : (
                                                     <div className="pt-4 flex items-center gap-4">
                                                         <div className="text-lg font-bold">
                                                             Score: <span className={quizScore! >= activeChapter.questions.length / 2 ? 'text-green-600' : 'text-orange-500'}>
                                                                 {quizScore} / {activeChapter.questions.length}
                                                             </span>
                                                         </div>
                                                         <button 
                                                            onClick={() => {
                                                                setQuizSubmitted(false);
                                                                setQuizAnswers({});
                                                                setQuizScore(null);
                                                                setQuizResults([]);
                                                            }}
                                                            className="px-4 py-2 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                                         >
                                                             Retake Quiz
                                                         </button>
                                                         {!isLastChapter() && (
                                                             <button 
                                                                onClick={navigateToNext}
                                                                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                                             >
                                                                 Continue
                                                             </button>
                                                         )}
                                                     </div>
                                                 )}
                                             </div>
                                         ) : (
                                             <div className="flex flex-col items-center justify-center h-full py-12 text-slate-500">
                                                 <p className="mb-2">No questions found for this quiz.</p>
                                             </div>
                                         )}
                                     </div>
                                )}

                                {activeChapter.type === 'text' && (
                                    <div className="prose prose-slate max-w-none w-full bg-white p-4 rounded-xl">
                                        <div className="whitespace-pre-wrap min-h-[200px]">{activeChapter.content || "No text content available."}</div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Navigation Buttons - Moved Inside */}
                            <div className="flex justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                                <button 
                                    onClick={navigateToPrevious}
                                    disabled={isFirstChapter()}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ← Previous Lesson
                                </button>
                                <button 
                                    onClick={navigateToNext}
                                    disabled={isLastChapter()}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next Lesson →
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-slate-500">
                        Select a chapter to begin learning
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
