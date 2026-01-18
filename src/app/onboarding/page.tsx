'use client';

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [role, setRole] = useState<'instructor' | 'tenant_admin' | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setLoading(true);
    try {
      const token = await window.Clerk?.session?.getToken();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          // clerkId is extracted from token
          role,
          tenantName: role === 'tenant_admin' ? tenantName : undefined,
          tenantSlug: role === 'tenant_admin' ? tenantSlug : undefined,
        }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        console.error("Onboarding failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-950 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-center">
          How do you plan to use the platform?
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole('tenant_admin')}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                role === 'tenant_admin'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  : 'border-slate-200 dark:border-slate-800 hover:border-blue-400'
              }`}
            >
              <span className="block text-lg font-semibold mb-1">Business Entity</span>
              <span className="text-sm text-slate-500">I want to manage a school</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('instructor')} // Was 'student'
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                role === 'instructor'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  : 'border-slate-200 dark:border-slate-800 hover:border-blue-400'
              }`}
            >
              <span className="block text-lg font-semibold mb-1">Instructor</span>
              <span className="text-sm text-slate-500">I want to teach</span>
            </button>
          </div>

          {role === 'tenant_admin' && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-sm font-medium mb-1">Business / School Name</label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                  placeholder="e.g. Acme Business"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL Slug</label>
                <input
                  type="text"
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                  placeholder="e.g. acme-business"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!role || loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting up...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
