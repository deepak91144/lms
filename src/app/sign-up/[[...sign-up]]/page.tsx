'use client';

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent');
  const redirectUrl = intent === 'student' ? '/dashboard?role=student' : '/dashboard';

  useEffect(() => {
    if (intent) {
      sessionStorage.setItem('portal_intent', intent);
    }
  }, [intent]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <SignUp forceRedirectUrl={redirectUrl} />
    </div>
  );
}
