'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CourseSidebar from '@/components/course/CourseSidebar';
import ContentRenderer from '@/components/course/ContentRenderer';

interface Chapter {
  _id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'pdf';
  content: string;
  isFree: boolean;
  order: number;
}

interface Section {
  _id: string;
  title: string;
  order: number;
  chapters: Chapter[];
}

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  isPublished: boolean;
}

export default function ViewCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      // Fetch course details
      const courseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}`);
      const courseData = await courseRes.json();
      setCourse(courseData);

      // Fetch curriculum
      const curriculumRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/curriculum`);
      const curriculumData = await curriculumRes.json();
      setSections(curriculumData);

      // Auto-select first chapter if available
      if (curriculumData.length > 0 && curriculumData[0].chapters.length > 0) {
        setSelectedChapter(curriculumData[0].chapters[0]);
        setSelectedSectionId(curriculumData[0]._id);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching course data:', err);
      setLoading(false);
    }
  };

  const handleChapterSelect = (chapter: Chapter, sectionId: string) => {
    setSelectedChapter(chapter);
    setSelectedSectionId(sectionId);
  };

  const getAllChapters = () => {
    const allChapters: Array<{ chapter: Chapter; sectionId: string; sectionTitle: string }> = [];
    sections.forEach(section => {
      section.chapters.forEach(chapter => {
        allChapters.push({
          chapter,
          sectionId: section._id,
          sectionTitle: section.title
        });
      });
    });
    return allChapters;
  };

  const handlePrevious = () => {
    const allChapters = getAllChapters();
    const currentIndex = allChapters.findIndex(item => item.chapter._id === selectedChapter?._id);
    if (currentIndex > 0) {
      const prev = allChapters[currentIndex - 1];
      setSelectedChapter(prev.chapter);
      setSelectedSectionId(prev.sectionId);
    }
  };

  const handleNext = () => {
    const allChapters = getAllChapters();
    const currentIndex = allChapters.findIndex(item => item.chapter._id === selectedChapter?._id);
    if (currentIndex < allChapters.length - 1) {
      const next = allChapters[currentIndex + 1];
      setSelectedChapter(next.chapter);
      setSelectedSectionId(next.sectionId);
    }
  };

  const getCurrentChapterInfo = () => {
    const allChapters = getAllChapters();
    const currentIndex = allChapters.findIndex(item => item.chapter._id === selectedChapter?._id);
    
    if (currentIndex === -1) {
      return {
        sectionTitle: '',
        chapterNumber: '',
        hasPrevious: false,
        hasNext: false
      };
    }

    const current = allChapters[currentIndex];
    const sectionIndex = sections.findIndex(s => s._id === current.sectionId);
    const chapterIndex = sections[sectionIndex].chapters.findIndex(c => c._id === current.chapter._id);

    return {
      sectionTitle: current.sectionTitle,
      chapterNumber: `Section ${sectionIndex + 1}, Chapter ${chapterIndex + 1}`,
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex < allChapters.length - 1
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Course not found</h2>
          <button
            onClick={() => router.push('/dashboard/instructor/courses')}
            className="text-blue-600 hover:underline"
          >
            ← Back to courses
          </button>
        </div>
      </div>
    );
  }

  const chapterInfo = getCurrentChapterInfo();

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center gap-4 shrink-0">
        <button
          onClick={() => router.push(`/dashboard/instructor/courses/${courseId}`)}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
        >
          ← Back to Manage
        </button>
        
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg truncate">Preview: {course.title}</h1>
        </div>

        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          course.isPublished 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
        }`}>
          {course.isPublished ? '✓ Published' : 'Draft'}
        </span>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } lg:w-80 shrink-0 transition-all duration-300 overflow-hidden`}>
          <CourseSidebar
            sections={sections}
            selectedChapterId={selectedChapter?._id || null}
            onChapterSelect={handleChapterSelect}
            courseTitle={course.title}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <ContentRenderer
            chapter={selectedChapter}
            sectionTitle={chapterInfo.sectionTitle}
            chapterNumber={chapterInfo.chapterNumber}
            onPrevious={handlePrevious}
            onNext={handleNext}
            hasPrevious={chapterInfo.hasPrevious}
            hasNext={chapterInfo.hasNext}
          />
        </div>
      </div>
    </div>
  );
}
