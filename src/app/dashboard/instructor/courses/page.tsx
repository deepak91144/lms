'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MyCoursesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
        console.log("Fetching courses for:", user.id);
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/my-courses?instructorId=${user.id}`)
            .then(async res => {
                if (!res.ok) {
                    console.error("API Error:", res.status);
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to fetch');
                }
                return res.json();
            })
            .then(data => {
                console.log("Courses fetched:", data);
                setCourses(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }
  }, [isLoaded, user]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                &larr; Dashboard
            </button>
            <h1 className="text-xl font-bold">My Courses</h1>
        </div>
        <button 
            onClick={() => router.push('/dashboard/instructor/courses/new')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
            + Create New
        </button>
      </nav>
      
      <main className="container mx-auto p-8">
        {/* Debug Info */}
        <div className="mb-8 p-4 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono overflow-auto">
            <p><strong>Instructor ID (Clerk):</strong> {user?.id}</p>
            <p><strong>Courses Found:</strong> {courses.length}</p>
            <details>
                <summary className="cursor-pointer">Raw Data</summary>
                <pre>{JSON.stringify(courses, null, 2)}</pre>
            </details>
        </div>

        {loading ? (
             <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
             </div>
        ) : courses.length === 0 ? (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No courses yet</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Create your first course to get started.</p>
                <button 
                    onClick={() => router.push('/dashboard/instructor/courses/new')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    Create Course
                </button>
            </div>
        ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <div key={course._id} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-blue-500 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold rounded-full uppercase">
                                {course.category}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${course.isPublished ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                                {course.isPublished ? 'Published' : 'Draft'}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">{course.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4">
                            {course.description}
                        </p>
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button 
                                onClick={() => router.push(`/dashboard/instructor/courses/${course._id}`)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                Manage &rarr;
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
