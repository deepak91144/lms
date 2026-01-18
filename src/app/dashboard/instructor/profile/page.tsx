'use client';

import { useUser } from "@clerk/nextjs";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <h1 className="text-3xl font-bold mb-8 text-slate-900">My Profile</h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <div className="px-8 pb-8">
                <div className="relative -mt-16 mb-6">
                    <img 
                        src={user?.imageUrl} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-2xl border-4 border-white shadow-md relative z-10 bg-white"
                    />
                </div>
                
                <h2 className="text-2xl font-bold mb-1">{user?.fullName}</h2>
                <p className="text-slate-500 mb-6">{user?.primaryEmailAddress?.emailAddress}</p>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">First Name</label>
                        <p className="font-medium text-slate-700">{user?.firstName}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Last Name</label>
                        <p className="font-medium text-slate-700">{user?.lastName}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">User ID</label>
                        <p className="font-mono text-sm text-slate-500">{user?.id}</p>
                    </div>
                     <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Last Sign In</label>
                        <p className="text-sm text-slate-500">{user?.lastSignInAt?.toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
