'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from "next/navigation";

interface DashboardContentProps {
  onSyncComplete: (user: any) => void;
  onSyncError: (error: string) => void;
}

export default function DashboardSync({ onSyncComplete, onSyncError }: DashboardContentProps) {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

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
            onSyncComplete(data);

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
          onSyncError(`API Error ${res.status}: ${errText}`);
        }
      } catch (err: any) {
        console.error(err);
        onSyncError(`Network Error: ${err.message}`);
      }
    };

    if (isLoaded && user) {
      syncUser();
    } else if (isLoaded && !user) {
      router.push('/');
    }
  }, [isLoaded, user, router, searchParams]);

  return null;
}
