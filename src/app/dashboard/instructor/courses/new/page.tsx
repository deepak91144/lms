'use client';

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateCoursePage() {
  const { user } = useUser();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('instructorId', user.id);
        if (thumbnail) {
            formData.append('thumbnail', thumbnail);
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses`, {
            method: 'POST',
            body: formData, // fetch automatically sets Content-Type to multipart/form-data
        });

        if (res.ok) {
            router.push('/dashboard/instructor/courses');
        } else {
            console.error("Failed to create course");
        }
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 h-16 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            &larr; Back
        </button>
        <h1 className="text-xl font-bold">Create New Course</h1>
      </nav>
      
      <main className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Course Thumbnail</label>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2">
                             {thumbnail ? (
                                <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                     </svg>
                                     {thumbnail.name}
                                </div>
                             ) : (
                                <>
                                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm text-slate-500">Click to upload thumbnail</span>
                                    <span className="text-xs text-slate-400">(JPG, PNG, WebP)</span>
                                </>
                             )}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Course Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                        placeholder="e.g. Introduction to React"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                        placeholder="What will students learn?"
                        rows={4}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                         className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                         required
                    >
                        <option value="">Select a category</option>
                        <option value="development">Development</option>
                        <option value="business">Business</option>
                        <option value="design">Design</option>
                        <option value="marketing">Marketing</option>
                    </select>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Course'}
                    </button>
                </div>
            </form>
        </div>
      </main>
    </div>
  );
}
