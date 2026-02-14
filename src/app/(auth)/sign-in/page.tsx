import { Suspense } from 'react';
import { SignIn } from '@/components/sign-in';

function SignInFallback() {
  return (
    <div className="h-[340px] w-full max-w-md animate-pulse rounded-lg border bg-card" />
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<SignInFallback />}>
        <SignIn />
      </Suspense>
    </div>
  );
}