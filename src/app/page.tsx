'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { getFileUrl } from "@/lib/utils";

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  instructorName?: string;
  image?: string;
  isPublished: boolean;
  createdAt: string;
  averageRating?: number;
  ratingsCount?: number;
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/published`)
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching courses:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 md:py-32 px-4 text-center">
          <div className="container mx-auto max-w-4xl space-y-8">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Unlock Your Potential with <br />
              <span className="text-blue-600">AI-Powered Learning</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Create, sell, and manage courses with our multi-tenant LMS. Empowered by advanced LLMs to provide personalized tutoring and real-time feedback.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/sign-up"
                className="h-12 px-8 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-105"
              >
                Start Teaching Free
              </Link>
              <Link
                href="#courses"
                className="h-12 px-8 rounded-full border border-slate-300 dark:border-slate-700 font-semibold flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Courses Section */}
        <section id="courses" className="py-24 bg-white dark:bg-slate-950 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Featured Courses</h2>
              <p className="text-slate-600 dark:text-slate-400">Explore our collection of expert-led courses</p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-4"></div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2">No courses available yet</h3>
                <p className="text-slate-600 dark:text-slate-400">Check back soon for new courses!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course) => (
                  <Link
                    href={`/courses/${course._id}`}
                    key={course._id}
                    className="group relative flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Course Image */}
                    <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800">
                      {course.image ? (
                          <img 
                              src={getFileUrl(course.image)} 
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                          </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                      
                      <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-slate-700 dark:text-slate-200 text-xs font-bold rounded-full uppercase tracking-wider shadow-sm">
                              {course.category}
                          </span>
                      </div>
                    </div>

                    <div className="relative p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {course.title}
                      </h3>

                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2">
                        {course.description}
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                            {course.instructorName ? course.instructorName.charAt(0) : '?'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 dark:text-slate-500 font-medium">Instructor</span>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              {course.instructorName || 'Unknown'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                             <div className="flex items-center text-yellow-400">
                                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                     <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                 </svg>
                             </div>
                             <span className="text-xs font-bold text-slate-700 dark:text-slate-300 pt-0.5">
                                 {course.averageRating ? course.averageRating.toFixed(1) : 'New'}
                             </span>
                             {course.ratingsCount ? (
                                 <span className="text-xs text-slate-500 dark:text-slate-500 pt-0.5">
                                     ({course.ratingsCount})
                                 </span>
                             ) : null}
                        </div>
                        
                        <div className="text-blue-600 dark:text-blue-400 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Everything you need to succeed</h2>
              <p className="text-slate-600 dark:text-slate-400">Powerful features tailored for educators and businesses.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">AI Socratic Tutor</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Engage students with an AI that asks guiding questions rather than just giving answers, fostering critical thinking.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Multi-Tenant Architecture</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Host multiple organizations or schools on a single platform with complete data isolation and custom branding.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Real-time Analytics</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                </p>
              </div>

              {/* Feature 4 - Students */}
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">For Students</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Interactive learning with quizzes, progress tracking, and AI-powered study assistance.
                </p>
              </div>

              {/* Feature 5 - Instructors */}
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">For Instructors</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Easy-to-use course builder with support for video, text, PDF content, and automated grading.
                </p>
              </div>

              {/* Feature 6 - Business */}
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <div className="h-12 w-12 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">For Business</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  White-label solution with custom branding, domain mapping, and advanced analytics.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center">
        <div className="container mx-auto px-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} LLM LMS Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
