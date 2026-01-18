'use client';

import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSyncing, setIsSyncing] = useState(true);
  const [dbUser, setDbUser] = useState<any>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const syncUser = async () => {
      console.log('Dashboard Sync - SearchParams:', searchParams.toString());
      console.log('Dashboard Sync - Role param:', searchParams.get('role'));
      if (!user) return;

      try {
        const token = await window.Clerk?.session?.getToken();
        
        // Check for intent in URL first, then sessionStorage
        let intentRole = searchParams.get('role');
        if (!intentRole && typeof window !== 'undefined') {
            const storedIntent = sessionStorage.getItem('portal_intent');
            if (storedIntent === 'student') {
                intentRole = 'student';
                // Clear it so it doesn't stick forever
                sessionStorage.removeItem('portal_intent');
            }
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            // clerkId is now extracted from token on server
            email: user.emailAddresses[0].emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            role: intentRole, // Pass role if present (e.g. from sign-up intent)
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.role === 'pending') {
            router.push('/onboarding');
          } else {
            setDbUser(data);
            setIsSyncing(false);

            // Handle pending enrollment from sessionStorage
            if (typeof window !== 'undefined') {
                const enrollCourseId = sessionStorage.getItem('enroll_intent');
                if (enrollCourseId) {
                    sessionStorage.removeItem('enroll_intent');
                    // Perform background enrollment
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${enrollCourseId}/enroll`, {
                        method: 'POST',
                        headers: {
                             'Authorization': `Bearer ${token}`
                        }
                    }).then(() => {
                        // Redirect to student courses if that was the intent
                         router.push('/dashboard/student/courses');
                    }).catch(console.error);
                }
            }
          }
        } else {
          const errText = await res.text();
          console.error("Failed to sync user:", errText);
          setSyncError(`API Error ${res.status}: ${errText}`);
          setIsSyncing(false);
        }
      } catch (err: any) {
        console.error(err);
        setSyncError(`Network Error: ${err.message}`);
        setIsSyncing(false);
      }
    };

    if (isLoaded && user) {
      syncUser();
    } else if (isLoaded && !user) {
      router.push('/');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || isSyncing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] bg-blue-100/50 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] bg-purple-100/50 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/60 sticky top-0">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-xl font-bold text-white">L</span>
                </div>
                <h1 className="text-xl font-bold text-slate-800">
                    LMS Dashboard
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 tracking-wide">
                    {dbUser?.role ? dbUser.role.replace('_', ' ').toUpperCase() : 'USER'}
                </div>
                <UserButton afterSignOutUrl="/" appearance={{
                    elements: {
                        avatarBox: "w-10 h-10 ring-2 ring-white hover:ring-slate-200 transition-all shadow-sm"
                    }
                }}/>
            </div>
        </div>
      </nav>
      
      <main className="relative container mx-auto p-6 md:p-12 z-10">
        {/* Hero Section */}
        <div className="mb-12 space-y-3">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{user?.firstName}</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium max-w-2xl">
                Ready to manage your content? Here's what's happening today.
            </p>
        </div>

        {/* Sync Error Alert */}
        {syncError && (
             <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-center gap-3 shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {syncError}
            </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-3 gap-8">
            
            {/* Tenant Admin Actions */}
            {dbUser?.role === 'tenant_admin' && (
                <>
                    <DashboardCard 
                        title="Instructors" 
                        description="Invite and manage instructors for your school."
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                        color="blue"
                        onClick={() => router.push('/dashboard/instructors')}
                    />
                    <DashboardCard 
                        title="Courses" 
                        description="Create and manage your course catalog."
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                        color="purple"
                        onClick={() => {}} // TODO: Add link
                    />
                    <DashboardCard 
                        title="School Settings" 
                        description="Configure branding and platform settings."
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />}
                        color="emerald"
                        onClick={() => {}} // TODO: Add link
                    />
                </>
            )}

            {/* Instructor Actions */}
            {dbUser?.role === 'instructor' && (
                <>
                    <DashboardCard 
                        title="Create Course" 
                        description="Start building your new course content."
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                        color="indigo"
                        onClick={() => router.push('/dashboard/instructor/courses/new')}
                    />
                     <DashboardCard 
                        title="My Courses" 
                        description="View and manage your courses."
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
                        color="rose"
                        onClick={() => router.push('/dashboard/instructor/courses')}
                    />
                     <DashboardCard 
                        title="My Profile" 
                        description="Manage your instructor profile and bio."
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
                        color="amber"
                        onClick={() => router.push('/dashboard/instructor/profile')} 
                    />
                </>
            )}

            {/* Student Actions */}
            {dbUser?.role === 'student' && (
                <>
                    <DashboardCard 
                        title="My Learning" 
                        description="Access your enrolled courses and progress."
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                        color="indigo"
                        onClick={() => router.push('/dashboard/student/courses')}
                    />
                     <DashboardCard 
                        title="Browse Courses" 
                        description="Explore new topics and skills."
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />}
                        color="blue"
                        onClick={() => router.push('/#courses')}
                    />
                </>
            )}

            {/* Fallback / Debug Info */}
            {!['tenant_admin', 'instructor', 'student'].includes(dbUser?.role) && (
                 <div className="md:col-span-3 p-8 bg-white border border-yellow-200 rounded-3xl shadow-sm">
                    <h3 className="text-xl font-bold text-yellow-600 mb-2">No Role Assigned</h3>
                    <p className="text-slate-500 mb-6">Your account is active but hasn't been assigned a specific role yet.</p>
                     <button 
                        onClick={async () => {
                            if (!user) return;
                            try {
                                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/onboard`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ clerkId: user.id, role: 'instructor' })
                                });
                                window.location.reload();
                            } catch (e) { console.error(e); }
                        }}
                        className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-yellow-500/30"
                    >
                        Switch to Instructor Mode
                    </button>
                    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-500 overflow-auto">
                        DEBUG: {JSON.stringify(dbUser, null, 2)}
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

function DashboardCard({ title, description, icon, color, onClick }: { 
    title: string; 
    description: string; 
    icon: React.ReactNode; 
    color: string;
    onClick: () => void;
}) {
    // Map minimal colors to tailwind classes
    const colors: any = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'group-hover:ring-blue-500', icon: 'bg-blue-100 text-blue-600' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'group-hover:ring-purple-500', icon: 'bg-purple-100 text-purple-600' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'group-hover:ring-emerald-500', icon: 'bg-emerald-100 text-emerald-600' },
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'group-hover:ring-indigo-500', icon: 'bg-indigo-100 text-indigo-600' },
        rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'group-hover:ring-rose-500', icon: 'bg-rose-100 text-rose-600' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'group-hover:ring-amber-500', icon: 'bg-amber-100 text-amber-600' },
    };
    
    const theme = colors[color] || colors.blue;

    return (
        <div 
            onClick={onClick}
            className={`group relative p-8 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden`}
        >
            <div className="relative z-10">
                <div className={`w-14 h-14 mb-6 rounded-2xl ${theme.icon} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}>
                     <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {icon}
                    </svg>
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-slate-800 group-hover:text-slate-900 transition-colors">
                    {title}
                </h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                    {description}
                </p>
                
                {/* Arrow Icon */}
                <div className={`mt-6 flex items-center text-sm font-bold ${theme.text} opacity-80 group-hover:opacity-100 transition-all`}>
                    <span>Open Dashboard</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </div>
            </div>
        </div>
    )
}
