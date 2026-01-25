'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, SignInButton } from '@clerk/nextjs';

export default function CourseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [course, setCourse] = useState<any>(null);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userFeedback, setUserFeedback] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const handleStartLearning = () => {
    if (isSignedIn) {
        router.push('/dashboard');
    }
  };

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
        try {
            // Fetch course details
            const courseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${id}`);
            const courseData = await courseRes.json();
            setCourse(courseData);

            // Fetch curriculum
            const curriculumRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${id}/curriculum`);
            const curriculumData = await curriculumRes.json();
            setSyllabus(curriculumData);
            
            setLoading(false);
        } catch (err) {
            console.error("Error fetching data:", err);
            setLoading(false);
        }
    };

    fetchData();

    // Check enrollment and rating if logged in
    if (isSignedIn && id) {
        const checkEnrollment = async () => {
            try {
                const token = await window.Clerk?.session?.getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${id}/progress`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setIsEnrolled(true);
                    // Fetch rating
                    const ratingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${id}/my-rating`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (ratingRes.ok) {
                        const ratingData = await ratingRes.json();
                        setUserRating(ratingData.rating || 0);
                        setUserFeedback(ratingData.feedback || '');
                    }
                }
            } catch (e) {
                console.error("Error checking enrollment:", e);
            }
        };
        checkEnrollment();
    }
  }, [id, isSignedIn]);

  const submitRating = async (rating: number) => {
      try {
          setIsSubmittingRating(true);
          const token = await window.Clerk?.session?.getToken();
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${id}/rate`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ rating, feedback: userFeedback })
          });
          
          if (res.ok) {
              const data = await res.json();
              setUserRating(data.rating);
              // Refresh course data to show updated avg
              const courseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${id}`);
              const courseData = await courseRes.json();
              setCourse(courseData);
          }
          setIsSubmittingRating(false);
      } catch (e) {
          console.error("Error submitting rating:", e);
          setIsSubmittingRating(false);
      }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
         <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
          <Link href="/#courses" className="text-blue-600 hover:underline">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
         <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="font-bold text-xl text-slate-800">LMS Platform</Link>
             <Link href="/#courses" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Back to Courses
            </Link>
         </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Course Header Card */}
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wide">
                            {course.category}
                        </span>
                        <span className="text-sm text-slate-500 font-medium flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {course.instructorName}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                        {course.title}
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed mb-8">
                        {course.description}
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
    {!isSignedIn ? (
                        <Link 
                            href="/sign-up?intent=student" 
                            onClick={() => {
                                if (typeof window !== 'undefined') {
                                    sessionStorage.setItem('portal_intent', 'student');
                                    sessionStorage.setItem('enroll_intent', id as string);
                                }
                            }}
                            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
                                Start Learning Now
                        </Link>
                    ) : (
                        <button 
                            onClick={async () => {
                                // Enroll immediately
                                try {
                                    const token = await window.Clerk?.session?.getToken();
                                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${id}/enroll`, {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${token}`
                                        }
                                    });
                                    router.push('/dashboard/student/courses');
                                } catch (e) {
                                    console.error("Enrollment failed", e);
                                    // Fallback
                                    router.push('/dashboard/student/courses');
                                }
                            }}
                            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
                            Start Learning Now
                        </button>
                    )}
                    <a href="#syllabus" className="px-8 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-center">
                        View Syllabus
                    </a>
                </div>
            </div>
            
            {/* Rating Section - Only for enrolled users */}
            {isEnrolled && (
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-bold mb-6 text-slate-900">Rate this Course</h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => submitRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <svg 
                                        className={`w-10 h-10 ${
                                            (hoverRating || userRating) >= star ? 'text-yellow-400' : 'text-slate-200'
                                        }`} 
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </button>
                            ))}
                            <span className="ml-4 text-slate-600 font-medium">
                                {userRating > 0 ? `You rated: ${userRating} stars` : 'Select a rating'}
                            </span>
                        </div>
                        
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Your Review (Optional)
                            </label>
                            <div className="flex gap-2">
                                <textarea
                                    value={userFeedback}
                                    onChange={(e) => setUserFeedback(e.target.value)}
                                    placeholder="Tell us what you thought about this course..."
                                    className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-24"
                                />
                                {userFeedback && (
                                    <button
                                        onClick={() => submitRating(userRating)}
                                        disabled={isSubmittingRating || userRating === 0}
                                        className="px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmittingRating ? 'Saving...' : 'Save'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Syllabus Section */}
            <div id="syllabus" className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold mb-8 text-slate-900">Course Syllabus</h2>
                
                {syllabus.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        No curriculum content available yet.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {syllabus.map((section) => (
                            <div key={section._id} className="border border-slate-200 rounded-2xl overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center">
                                    <span>{section.title}</span>
                                    <span className="text-xs text-slate-500 font-normal uppercase tracking-wider">{section.chapters ? section.chapters.length : 0} Lectures</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {section.chapters && section.chapters.map((chapter: any) => (
                                        <div key={chapter._id} className="px-6 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                                            <div className="text-xl">
                                                {chapter.type === 'video' && '🎥'}
                                                {chapter.type === 'text' && '📄'}
                                                {chapter.type === 'quiz' && '❓'}
                                                {chapter.type === 'pdf' && 'fw'}
                                            </div>
                                            <span className="text-slate-700 font-medium">{chapter.title}</span>
                                            {chapter.isFree && (
                                                <span className="ml-auto text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                                    Free Preview
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {(!section.chapters || section.chapters.length === 0) && (
                                        <div className="px-6 py-4 text-sm text-slate-400 italic">
                                            No chapters in this section.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
