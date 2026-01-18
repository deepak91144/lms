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
  }, [id]);

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
