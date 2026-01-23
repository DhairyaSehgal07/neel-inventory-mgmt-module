import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 font-sans dark:from-black dark:to-zinc-950">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-16 sm:px-8">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50 sm:text-5xl md:text-6xl lg:text-7xl">
              Neelkanthrubbermills
            </h1>
            <h2 className="text-2xl font-semibold leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-3xl md:text-4xl">
              Inventory Management
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-xl">
            Streamline your inventory operations with our comprehensive management system.
            Track, manage, and optimize your stock with ease.
          </p>
          <div className="pt-4">
            <Button asChild size="lg" className="text-lg px-8 py-6 h-auto">
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
