'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { getFileUrl } from '@/lib/utils';

export default function ManageCoursePage() {
  const params = useParams();
  const router = useRouter();
  const confirm = useConfirm().confirm;
  const courseId = params.id as string;
  const [activeTab, setActiveTab] = useState<'basic' | 'curriculum'>('curriculum');
  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };
  
  // Chapter creation state
  const [addingChapterToSection, setAddingChapterToSection] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterType, setNewChapterType] = useState("text");
  const [newChapterContent, setNewChapterContent] = useState("");
  const [newChapterFile, setNewChapterFile] = useState<File | null>(null);
  
  // Chapter editing state
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [editChapterTitle, setEditChapterTitle] = useState("");
  const [editChapterIsFree, setEditChapterIsFree] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Course editing state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("development");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCourse();
    fetchCurriculum();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}`);
        const data = await res.json();
        setCourse(data);
        setEditTitle(data.title);
        setEditDescription(data.description);
        setEditCategory(data.category);
    } catch (err) {
        console.error(err);
    }
  };

  const fetchCurriculum = async () => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/curriculum`);
        const data = await res.json();
        setSections(data);
    } catch (err) {
        console.error(err);
    }
  };

  useEffect(() => {
    if (sections.length > 0) {
        setExpandedSections(new Set([sections[0]._id]));
    }
  }, [sections]);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;

    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/sections`, {
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

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<{question: string, options: string[], correctAnswer: number}[]>([{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]);

  const handleAddChapter = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    try {
        const formData = new FormData();
        formData.append('title', newChapterTitle);
        formData.append('type', newChapterType);
        
        if (newChapterType === 'text' && newChapterContent) {
            formData.append('content', newChapterContent);
        } else if ((newChapterType === 'video' || newChapterType === 'pdf') && newChapterFile) {
            formData.append('file', newChapterFile);
        } else if (newChapterType === 'quiz') {
            formData.append('questions', JSON.stringify(quizQuestions));
        }

        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/sections/${sectionId}/chapters`, {
            method: 'POST',
            body: formData // Fetch automatically sets Content-Type to multipart/form-data
        });
        setNewChapterTitle("");
        setNewChapterContent("");
        setNewChapterFile(null);
        setQuizQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]); // Reset quiz structure
        setAddingChapterToSection(null);
        fetchCurriculum();
    } catch (err) {
        console.error(err);
    }
  };

  const handleEditChapter = (chapter: any, sectionId: string) => {
    setEditingChapter({ ...chapter, sectionId });
    setEditChapterTitle(chapter.title);
    setEditChapterIsFree(chapter.isFree);
    // Populate quiz questions if available, otherwise default blank
    if (chapter.type === 'quiz' && chapter.questions && chapter.questions.length > 0) {
        setQuizQuestions(chapter.questions);
    } else {
        setQuizQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
    }
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const handleUpdateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapter) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('title', editChapterTitle);
    formData.append('isFree', editChapterIsFree.toString());
    
    if (editingChapter.type === 'quiz') {
        formData.append('questions', JSON.stringify(quizQuestions));
    }
    
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    try {
      // Use XMLHttpRequest for upload progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setEditingChapter(null);
          setSelectedFile(null);
          setUploadProgress(0);
          setIsUploading(false);
          fetchCurriculum();
        } else {
          console.error('Upload failed:', xhr.responseText);
          setIsUploading(false);
        }
      });

      xhr.addEventListener('error', () => {
        console.error('Upload error');
        setIsUploading(false);
      });

      xhr.open('PUT', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/sections/${editingChapter.sectionId}/chapters/${editingChapter._id}`);
      xhr.send(formData);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  const handlePublishToggle = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/publish`, {
        method: 'PUT',
      });
      
      if (res.ok) {
        await fetchCourse(); // Refresh course data
      } else {
        console.error('Failed to toggle publish status');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteChapter = async (e: React.MouseEvent, chapterId: string, sectionId: string) => {
    e.stopPropagation(); // Prevent triggering section toggle or edit
    
    const isConfirmed = await confirm({
        title: "Delete Chapter",
        message: "Are you sure you want to delete this chapter? This action cannot be undone.",
        isDestructive: true
    });

    if (!isConfirmed) return;

    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/sections/${sectionId}/chapters/${chapterId}`, {
            method: 'DELETE',
        });
        fetchCurriculum();
    } catch (err) {
        console.error(err);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const formData = new FormData();
        formData.append('title', editTitle);
        formData.append('description', editDescription);
        formData.append('category', editCategory);
        if (thumbnail) {
            formData.append('thumbnail', thumbnail);
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (res.ok) {
            const updatedCourse = await res.json();
            setCourse(updatedCourse);
            setThumbnail(null);
            // Optional: User feedback could be better than alert, but alert is functional for now
            // alert("Course updated successfully!"); 
        } else {
            console.error('Failed to update course');
        }
    } catch (err) {
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  };

  if (!course) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 h-16 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/instructor/courses')} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            &larr; Back
        </button>
        <span className="text-xl font-bold truncate max-w-md">{course.title}</span>
        
        {/* Publication Status Badge */}
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${course.isPublished ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          {course.isPublished ? '✓ Published' : 'Draft'}
        </span>
        
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
        
        {/* View Course and Publish/Unpublish Buttons */}
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/view`)}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            👁️ View Course
          </button>
          <button
            onClick={handlePublishToggle}
            disabled={isPublishing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              course.isPublished 
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isPublishing ? 'Processing...' : course.isPublished ? 'Unpublish' : 'Publish Course'}
          </button>
        </div>
      </nav>

      <main className="container mx-auto p-8 max-w-4xl">
        {activeTab === 'basic' && (
            <div className="bg-white dark:bg-slate-950 p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold mb-6">Course Basic Information</h2>
                <form onSubmit={handleUpdateCourse} className="space-y-6">
                    {/* Thumbnail Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Course Thumbnail</label>
                        <div className="flex items-start gap-6">
                             {/* Current Image Preview */}
                             <div className="w-40 h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                                {thumbnail ? (
                                    <img 
                                        src={URL.createObjectURL(thumbnail)} 
                                        alt="Preview" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : course.image ? (
                                    <img 
                                        src={getFileUrl(course.image)} 
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <span className="text-2xl">🖼️</span>
                                    </div>
                                )}
                             </div>
                             
                             {/* Upload Input */}
                             <div className="flex-1">
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-1">
                                         <p className="text-sm font-medium text-blue-600">Click to upload new thumbnail</p>
                                         <p className="text-xs text-slate-500">JPG, PNG, WebP recommended</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Course Title</label>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                                rows={5}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select 
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                            >
                                <option value="development">Development</option>
                                <option value="business">Business</option>
                                <option value="design">Design</option>
                                <option value="marketing">Marketing</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
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

                <div className="space-y-6">
                    {sections.map((section) => (
                        <div key={section._id} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                            <div 
                                onClick={() => toggleSection(section._id)}
                                className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center cursor-pointer select-none group"
                            >
                                <h3 className="font-bold flex items-center gap-3 text-lg">
                                    <span className={`transition-transform duration-200 ${expandedSections.has(section._id) ? 'rotate-180' : ''} text-slate-400 group-hover:text-blue-500`}>
                                        ▼
                                    </span>
                                    {section.title}
                                    <span className="text-xs font-normal text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                        {section.chapters.length} items
                                    </span>
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setAddingChapterToSection(section._id);
                                            // Ensure section is expanded when adding chapter
                                            if (!expandedSections.has(section._id)) {
                                                toggleSection(section._id);
                                            }
                                        }}
                                        className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg font-medium transition-colors"
                                    >
                                        + Add Chapter
                                    </button>
                                </div>
                            </div>
                            
                            {expandedSections.has(section._id) && (
                                <div className="p-4 bg-white dark:bg-slate-950 animate-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-3">
                                        {section.chapters.length === 0 && (
                                            <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                                <p className="text-slate-400 mb-2">This section is empty</p>
                                                <button 
                                                    onClick={() => setAddingChapterToSection(section._id)}
                                                    className="text-blue-600 text-sm font-medium hover:underline"
                                                >
                                                    Add your first chapter
                                                </button>
                                            </div>
                                        )}
                                        {section.chapters.map((chapter: any) => (
                                            <div key={chapter._id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group">
                                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-xl shadow-sm">
                                                    {chapter.type === 'video' ? '🎥' : chapter.type === 'pdf' ? '📄' : chapter.type === 'quiz' ? '❓' : '📝'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{chapter.title}</span>
                                                        {chapter.isFree && (
                                                            <span className="text-[10px] text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                                                Free
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                                        <span className="capitalize">{chapter.type}</span>
                                                        {chapter.content && (chapter.type === 'video' || chapter.type === 'pdf') && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                                    ✓ Content Uploaded
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleEditChapter(chapter, section._id)}
                                                    className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDeleteChapter(e, chapter._id, section._id)}
                                                    className="px-3 py-1.5 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ))}

                                        {addingChapterToSection === section._id && (
                                            <div className="mt-4 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 animate-in fade-in zoom-in-95 duration-200">
                                                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-4 uppercase tracking-wide">New Chapter</h4>
                                                <form onSubmit={(e) => handleAddChapter(e, section._id)}>
                                                    <div className="grid gap-4">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Title</label>
                                                            <input 
                                                                type="text" 
                                                                value={newChapterTitle}
                                                                onChange={(e) => setNewChapterTitle(e.target.value)}
                                                                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                                                                placeholder="e.g., Introduction to Neural Networks"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        
                                                        <div className="grid md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Type</label>
                                                                <select
                                                                    value={newChapterType}
                                                                    onChange={(e) => {
                                                                        setNewChapterType(e.target.value);
                                                                        setNewChapterContent("");
                                                                        setNewChapterFile(null);
                                                                    }}
                                                                    className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                                >
                                                                    <option value="text">Text / Article</option>
                                                                    <option value="video">Video</option>
                                                                    <option value="pdf">PDF Document</option>
                                                                    <option value="quiz">Quiz</option>
                                                                </select>
                                                            </div>

                                                            <div className="flex items-end">
                                                                {newChapterType === 'text' ? (
                                                                    <div className="w-full">
                                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Content (Optional)</label>
                                                                        <input 
                                                                            type="text"
                                                                            value={newChapterContent}
                                                                            onChange={(e) => setNewChapterContent(e.target.value)}
                                                                            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                                            placeholder="Brief summary..."
                                                                        />
                                                                    </div>
                                                                ) : newChapterType === 'quiz' ? (
                                                                    <div className="w-full space-y-4">
                                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Quiz Questions</label>
                                                                        {quizQuestions.map((q, qIdx) => (
                                                                            <div key={qIdx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                                                                <div className="flex justify-between mb-2">
                                                                                    <span className="text-sm font-bold">Question {qIdx + 1}</span>
                                                                                    {quizQuestions.length > 1 && (
                                                                                        <button type="button" onClick={() => {
                                                                                            const newQuestions = [...quizQuestions];
                                                                                            newQuestions.splice(qIdx, 1);
                                                                                            setQuizQuestions(newQuestions);
                                                                                        }} className="text-red-500 text-xs hover:underline">Remove</button>
                                                                                    )}
                                                                                </div>
                                                                                <input 
                                                                                    type="text"
                                                                                    value={q.question}
                                                                                    onChange={(e) => {
                                                                                        const newQuestions = [...quizQuestions];
                                                                                        newQuestions[qIdx].question = e.target.value;
                                                                                        setQuizQuestions(newQuestions);
                                                                                    }}
                                                                                    className="w-full p-2 mb-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                                                                                    placeholder="Enter question text"
                                                                                />
                                                                                <div className="space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                                                                    {q.options.map((opt, optIdx) => (
                                                                                        <div key={optIdx} className="flex items-center gap-2">
                                                                                            <input 
                                                                                                type="radio" 
                                                                                                name={`correct-${qIdx}`}
                                                                                                checked={q.correctAnswer === optIdx}
                                                                                                onChange={() => {
                                                                                                    const newQuestions = [...quizQuestions];
                                                                                                    newQuestions[qIdx].correctAnswer = optIdx;
                                                                                                    setQuizQuestions(newQuestions);
                                                                                                }}
                                                                                            />
                                                                                            <input 
                                                                                                type="text"
                                                                                                value={opt}
                                                                                                onChange={(e) => {
                                                                                                    const newQuestions = [...quizQuestions];
                                                                                                    newQuestions[qIdx].options[optIdx] = e.target.value;
                                                                                                    setQuizQuestions(newQuestions);
                                                                                                }}
                                                                                                className="flex-1 p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                                                                                                placeholder={`Option ${optIdx + 1}`}
                                                                                            />
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        <button type="button" onClick={() => setQuizQuestions([...quizQuestions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }])} className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                                                            + Add Question
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-full">
                                                                         <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">File (Optional)</label>
                                                                         <input
                                                                            type="file"
                                                                            accept={newChapterType === 'video' ? "video/*" : "application/pdf"}
                                                                            onChange={(e) => e.target.files && setNewChapterFile(e.target.files[0])}
                                                                            className="hidden"
                                                                            id={`new-chapter-file-${section._id}`}
                                                                        />
                                                                        <label 
                                                                            htmlFor={`new-chapter-file-${section._id}`} 
                                                                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                                                        >
                                                                            <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                                                                                {newChapterFile ? newChapterFile.name : `Select ${newChapterType === 'video' ? 'Video' : 'PDF'}`}
                                                                            </span>
                                                                            <span className="text-xl">
                                                                                {newChapterType === 'video' ? '🎥' : '📄'}
                                                                            </span>
                                                                        </label>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-3 justify-end pt-2">
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setAddingChapterToSection(null)} 
                                                                className="px-4 py-2 text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button 
                                                                type="submit" 
                                                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm shadow-blue-200 dark:shadow-blue-900/20 transition-all hover:scale-[1.02]"
                                                            >
                                                                Save Chapter
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>

      {/* Chapter Edit Modal */}
      {editingChapter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Edit Chapter</h2>
              <button 
                onClick={() => setEditingChapter(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateChapter} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Chapter Title</label>
                <input
                  type="text"
                  value={editChapterTitle}
                  onChange={(e) => setEditChapterTitle(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                  placeholder="Enter chapter title"
                />
              </div>

              {/* Chapter Type Display */}
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  {editingChapter.type === 'video' ? '🎥 Video' : editingChapter.type === 'pdf' ? '📄 PDF' : editingChapter.type === 'quiz' ? '❓ Quiz' : '📝 Text'}
                </div>
              </div>

              {/* File Upload (Video or PDF) */}
              {(editingChapter.type === 'video' || editingChapter.type === 'pdf') && (
                <div>
                  <label className="block text-sm font-medium mb-2">{editingChapter.type === 'video' ? 'Video Content' : 'PDF Document'}</label>
                  
                  {/* Current Content */}
                  {editingChapter.content && !selectedFile && (
                    <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Current file:</p>
                      {editingChapter.type === 'video' ? (
                        <video 
                            src={getFileUrl(editingChapter.content)} 
                            controls 
                            className="w-full rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-blue-600">
                            <span>📄</span>
                            <a href={getFileUrl(editingChapter.content)} target="_blank" rel="noopener noreferrer" className="underline">View current PDF</a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* File Input */}
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept={editingChapter.type === 'video' ? "video/*" : "application/pdf"}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="text-4xl mb-2">{editingChapter.type === 'video' ? '🎥' : '📄'}</div>
                      <p className="text-sm font-medium mb-1">
                        {selectedFile ? selectedFile.name : `Click to upload new ${editingChapter.type === 'video' ? 'video' : 'PDF'}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {editingChapter.type === 'video' ? 'MP4, WebM formats' : 'PDF files only'}
                      </p>
                    </label>
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Uploading...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quiz Editor */}
              {editingChapter.type === 'quiz' && (
                  <div className="space-y-4">
                      <label className="block text-sm font-medium mb-2">Quiz Questions</label>
                      {quizQuestions.map((q, qIdx) => (
                          <div key={qIdx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                              <div className="flex justify-between mb-2">
                                  <span className="text-sm font-bold">Question {qIdx + 1}</span>
                                  {quizQuestions.length > 1 && (
                                      <button type="button" onClick={() => {
                                          const newQuestions = [...quizQuestions];
                                          newQuestions.splice(qIdx, 1);
                                          setQuizQuestions(newQuestions);
                                      }} className="text-red-500 text-xs hover:underline">Remove</button>
                                  )}
                              </div>
                              <input 
                                  type="text"
                                  value={q.question}
                                  onChange={(e) => {
                                      const newQuestions = [...quizQuestions];
                                      newQuestions[qIdx].question = e.target.value;
                                      setQuizQuestions(newQuestions);
                                  }}
                                  className="w-full p-2 mb-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                                  placeholder="Enter question text"
                              />
                              <div className="space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                  {q.options.map((opt, optIdx) => (
                                      <div key={optIdx} className="flex items-center gap-2">
                                          <input 
                                              type="radio" 
                                              name={`edit-correct-${qIdx}`}
                                              checked={q.correctAnswer === optIdx}
                                              onChange={() => {
                                                  const newQuestions = [...quizQuestions];
                                                  newQuestions[qIdx].correctAnswer = optIdx;
                                                  setQuizQuestions(newQuestions);
                                              }}
                                          />
                                          <input 
                                              type="text"
                                              value={opt}
                                              onChange={(e) => {
                                                  const newQuestions = [...quizQuestions];
                                                  newQuestions[qIdx].options[optIdx] = e.target.value;
                                                  setQuizQuestions(newQuestions);
                                              }}
                                              className="flex-1 p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                                              placeholder={`Option ${optIdx + 1}`}
                                          />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                      <button type="button" onClick={() => setQuizQuestions([...quizQuestions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }])} className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          + Add Question
                      </button>
                  </div>
              )}

              {/* Free Preview Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={editChapterIsFree}
                  onChange={(e) => setEditChapterIsFree(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <label htmlFor="isFree" className="text-sm font-medium cursor-pointer">
                  Free Preview (accessible without enrollment)
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingChapter(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
