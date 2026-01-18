'use client';

import { useState } from 'react';

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

interface CourseSidebarProps {
  sections: Section[];
  selectedChapterId: string | null;
  onChapterSelect: (chapter: Chapter, sectionId: string) => void;
  courseTitle: string;
}

export default function CourseSidebar({ 
  sections, 
  selectedChapterId, 
  onChapterSelect,
  courseTitle 
}: CourseSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map(s => s._id))
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getChapterIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'quiz': return '❓';
      case 'pdf': return '📄';
      default: return '📄';
    }
  };

  const totalChapters = sections.reduce((acc, section) => acc + section.chapters.length, 0);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2 className="font-bold text-lg mb-1 line-clamp-2">{courseTitle}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {sections.length} {sections.length === 1 ? 'Section' : 'Sections'} · {totalChapters} {totalChapters === 1 ? 'Chapter' : 'Chapters'}
        </p>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto">
        {sections.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            <p className="text-sm">No content yet</p>
          </div>
        ) : (
          <div className="py-2">
            {sections.map((section, sectionIndex) => (
              <div key={section._id} className="mb-1">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section._id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-slate-400 text-sm font-medium shrink-0">
                      {sectionIndex + 1}
                    </span>
                    <span className="font-semibold text-sm truncate">
                      {section.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400">
                      {section.chapters.length}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        expandedSections.has(section._id) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Chapters List */}
                {expandedSections.has(section._id) && (
                  <div className="bg-slate-50/50 dark:bg-slate-900/50">
                    {section.chapters.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-slate-400 text-center">
                        No chapters
                      </p>
                    ) : (
                      section.chapters.map((chapter, chapterIndex) => (
                        <button
                          key={chapter._id}
                          onClick={() => onChapterSelect(chapter, section._id)}
                          className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                            selectedChapterId === chapter._id
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                              : 'pl-4'
                          }`}
                        >
                          <span className="text-slate-400 text-xs mt-0.5 shrink-0">
                            {sectionIndex + 1}.{chapterIndex + 1}
                          </span>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm">{getChapterIcon(chapter.type)}</span>
                              <span className={`text-sm font-medium truncate ${
                                selectedChapterId === chapter._id
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : ''
                              }`}>
                                {chapter.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {chapter.isFree && (
                                <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                                  Free
                                </span>
                              )}
                              {chapter.content && chapter.type === 'video' && (
                                <span className="text-xs px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                                  ✓ Video
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
