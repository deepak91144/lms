'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StudentCoursesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !user) {
        router.push('/');
        return;
    }

    const fetchEnrolledCourses = async () => {
        try {
            const token = await window.Clerk?.session?.getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/student/enrolled`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (user) {
        fetchEnrolledCourses();
    }
  }, [user, isLoaded, router]);

  if (loading) {
     return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/dashboard" className="font-bold text-xl text-slate-800">LMS Dashboard</Link>
                <div className="flex items-center gap-4">
                     <span className="text-sm font-medium text-slate-600">Student Mode</span>
                </div>
            </div>
        </nav>

        <main className="container mx-auto p-6 md:p-12">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-slate-900">My Learning</h1>
                <Link href="/#courses" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Browse More Courses
                </Link>
            </div>

            {courses.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No courses yet</h3>
                    <p className="text-slate-500 mb-6">You haven't enrolled in any courses yet.</p>
                    <Link href="/#courses" className="text-blue-600 hover:underline font-medium">
                        Explore Courses
                    </Link>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div key={course._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-40 bg-slate-200 relative">
                                {/* Placeholder for course image */}
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                    <span className="text-4xl">📚</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md uppercase">
                                        {course.category}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{course.title}</h3>
                                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{course.description}</p>
                                
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                                        <span>Progress</span>
                                        <span>{course.progress || 0}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                                            style={{ width: `${course.progress || 0}%` }}
                                        />
                                    </div>
                                </div>

                                <Link 
                                    href={`/courses/${course._id}/learn`}
                                    className="mt-6 block w-full py-3 text-center bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                                >
                                    Continue Learning
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    </div>
  );
}
