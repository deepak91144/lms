'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ManageCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [activeTab, setActiveTab] = useState<'basic' | 'curriculum'>('curriculum');
  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  
  // Section creation
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  
  // Chapter creation
  const [addingChapterToSection, setAddingChapterToSection] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterType, setNewChapterType] = useState("text");

  // Chapter editing
  const [editingChapter, setEditingChapter] = useState<any>(null); // { id, sectionId, title, type, content, isFree }
  const [editFile, setEditFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCourse();
    fetchCurriculum();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
        const res = await fetch(`http://localhost:8000/api/courses/${courseId}`);
        const data = await res.json();
        setCourse(data);
    } catch (err) {
        console.error(err);
    }
  };

  const fetchCurriculum = async () => {
    try {
        const res = await fetch(`http://localhost:8000/api/courses/${courseId}/curriculum`);
        const data = await res.json();
        setSections(data);
    } catch (err) {
        console.error(err);
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;

    try {
        await fetch(`http://localhost:8000/api/courses/${courseId}/sections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newSectionTitle })
        });
        setNewSectionTitle("");
        setIsAddingSection(false);
        fetchCurriculum();
    } catch (err) {
        console.error(err);
    }
  };

  const handleAddChapter = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    try {
        await fetch(`http://localhost:8000/api/courses/${courseId}/sections/${sectionId}/chapters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title: newChapterTitle,
                type: newChapterType
            })
        });
        setNewChapterTitle("");
        setAddingChapterToSection(null);
        fetchCurriculum();
    } catch (err) {
        console.error(err);
    }
  };

  const handleUpdateChapter = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingChapter) return;

      try {
        const formData = new FormData();
        formData.append('title', editingChapter.title);
        formData.append('type', editingChapter.type);
        formData.append('isFree', String(editingChapter.isFree));
        
        if (editingChapter.content && !editFile) {
             formData.append('content', editingChapter.content);
        }

        if (editFile) {
            formData.append('video', editFile);
        }

        const res = await fetch(`http://localhost:8000/api/courses/${courseId}/sections/${editingChapter.sectionId}/chapters/${editingChapter._id}`, {
            method: 'PUT',
            body: formData, // No Content-Type header needed for FormData
        });

        if (res.ok) {
            setEditingChapter(null);
            setEditFile(null);
            fetchCurriculum();
        } else {
            console.error("Failed to update chapter");
        }
      } catch (err) {
          console.error(err);
      }
  };

  const openEditChapter = (chapter: any, sectionId: string) => {
      setEditingChapter({ ...chapter, sectionId });
      setEditFile(null);
  };

  if (!course) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 h-16 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.push('/dashboard/instructor/courses')} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            &larr; Back
        </button>
        <span className="text-xl font-bold truncate max-w-md">{course.title}</span>
        <div className="flex gap-2 ml-4 text-sm">
            <button 
                onClick={() => setActiveTab('basic')}
                className={`px-3 py-1 rounded-lg ${activeTab === 'basic' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                Basic Info
            </button>
            <button 
                onClick={() => setActiveTab('curriculum')}
                className={`px-3 py-1 rounded-lg ${activeTab === 'curriculum' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                Curriculum
            </button>
        </div>
      </nav>

      <main className="container mx-auto p-8 max-w-4xl">
        {activeTab === 'basic' && (
            <div className="bg-white dark:bg-slate-950 p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold mb-4">Course Details</h2>
                <p>Edit Title, Description, Category etc.</p>
                <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <p className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">{course.description}</p>
                </div>
            </div>
        )}

        {activeTab === 'curriculum' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Course Content</h2>
                    <button 
                        onClick={() => setIsAddingSection(true)} 
                        className="text-blue-600 font-medium hover:underline"
                    >
                        + Add Section
                    </button>
                </div>

                {isAddingSection && (
                    <form onSubmit={handleAddSection} className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-blue-200 dark:border-blue-900 shadow-sm">
                        <label className="block text-sm font-medium mb-1">New Section Title</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newSectionTitle}
                                onChange={(e) => setNewSectionTitle(e.target.value)}
                                className="flex-1 p-2 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                                placeholder="e.g. Introduction"
                                autoFocus
                            />
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add</button>
                            <button type="button" onClick={() => setIsAddingSection(false)} className="px-4 py-2 text-slate-500">Cancel</button>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {sections.map((section) => (
                        <div key={section._id} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2">
                                    <span className="text-slate-400">::</span> {section.title}
                                </h3>
                                <button 
                                    onClick={() => setAddingChapterToSection(section._id)}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    + Add Chapter
                                </button>
                            </div>
                            
                            <div className="p-2 space-y-2">
                                {section.chapters.length === 0 && (
                                    <p className="text-center text-slate-400 text-sm py-4">No chapters yet</p>
                                )}
                                {section.chapters.map((chapter: any) => (
                                    <div key={chapter._id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg group">
                                        <div className="text-slate-400">
                                            {chapter.type === 'video' ? '🎥' : chapter.type === 'quiz' ? '❓' : '📄'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{chapter.title}</div>
                                            {chapter.content && (
                                                <div className="text-xs text-slate-500 truncate max-w-xs">{chapter.content}</div>
                                            )}
                                        </div>
                                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                                            {chapter.isFree ? 'Free Preview' : 'Paid'}
                                        </span>
                                        <button 
                                            onClick={() => openEditChapter(chapter, section._id)}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                ))}

                                {addingChapterToSection === section._id && (
                                    <form onSubmit={(e) => handleAddChapter(e, section._id)} className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                        <div className="grid gap-3">
                                            <input 
                                                type="text" 
                                                value={newChapterTitle}
                                                onChange={(e) => setNewChapterTitle(e.target.value)}
                                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                                                placeholder="Chapter Title"
                                                autoFocus
                                            />
                                            <div className="flex justify-between items-center">
                                                <select
                                                    value={newChapterType}
                                                    onChange={(e) => setNewChapterType(e.target.value)}
                                                    className="p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                                                >
                                                    <option value="text">Text / Article</option>
                                                    <option value="video">Video</option>
                                                    <option value="quiz">Quiz</option>
                                                </select>
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => setAddingChapterToSection(null)} className="text-sm text-slate-500">Cancel</button>
                                                    <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg">Save Chapter</button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>

      {/* Edit Chapter Modal */}
      {editingChapter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-950 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Edit Chapter Content</h3>
                    <button onClick={() => setEditingChapter(null)} className="text-slate-500 hover:text-slate-700">&times;</button>
                </div>
                <form onSubmit={handleUpdateChapter} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input 
                            type="text" 
                            value={editingChapter.title}
                            onChange={(e) => setEditingChapter({...editingChapter, title: e.target.value})}
                            className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="flex-1">
                             <label className="block text-sm font-medium mb-1">Type</label>
                             <select 
                                value={editingChapter.type}
                                onChange={(e) => setEditingChapter({...editingChapter, type: e.target.value})}
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                            >
                                <option value="text">Text / Article</option>
                                <option value="video">Video</option>
                                <option value="quiz">Quiz</option>
                            </select>
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={editingChapter.isFree || false}
                                    onChange={(e) => setEditingChapter({...editingChapter, isFree: e.target.checked})}
                                    className="rounded border-slate-300"
                                />
                                <span className="text-sm">Free Preview</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Content</label>
                        {editingChapter.type === 'video' ? (
                            <div className="space-y-3">
                                <div className="p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-center bg-slate-50 dark:bg-slate-900">
                                    <label className="block cursor-pointer">
                                        <span className="text-blue-600 block mb-1">Choose Video File</span>
                                        <input 
                                            type="file" 
                                            accept="video/*" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if(file) setEditFile(file);
                                            }}
                                        />
                                        <span className="text-xs text-slate-500">
                                            {editFile ? editFile.name : (editingChapter.content ? "Current: " + editingChapter.content : "No file selected")}
                                        </span>
                                    </label>
                                </div>
                                <div className="text-xs text-slate-400 text-center">- OR -</div>
                                <input 
                                    type="text" 
                                    placeholder="External Video URL (YouTube/Vimeo)"
                                    value={(!editFile && editingChapter.content) || ''}
                                    onChange={(e) => setEditingChapter({...editingChapter, content: e.target.value})}
                                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                                />
                            </div>
                        ) : (
                            <textarea 
                                value={editingChapter.content || ''}
                                onChange={(e) => setEditingChapter({...editingChapter, content: e.target.value})}
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-transparent h-32"
                                placeholder="Enter chapter content here..."
                            />
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setEditingChapter(null)} className="px-4 py-2 text-slate-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
