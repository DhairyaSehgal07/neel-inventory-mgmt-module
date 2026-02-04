import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <main className="max-w-3xl w-full">
        <div className="text-center space-y-12">
          {/* Logo/Brand Area */}
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6">
              <svg
                className="w-8 h-8 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-foreground">
              Neelkanthrubbermills
            </h1>
          </div>

          {/* Tagline */}
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-medium text-muted-foreground">
              Inventory Management
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Streamline your operations with intelligent stock tracking and real-time insights
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-6">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200"
            >
              Get Started
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          </div>

          {/* Optional: Feature highlights */}
          <div className="grid grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto text-sm">
            <div className="space-y-2">
              <div className="text-foreground font-medium">Real-time</div>
              <div className="text-muted-foreground">Live tracking</div>
            </div>
            <div className="space-y-2">
              <div className="text-foreground font-medium">Efficient</div>
              <div className="text-muted-foreground">Optimize stock</div>
            </div>
            <div className="space-y-2">
              <div className="text-foreground font-medium">Reliable</div>
              <div className="text-muted-foreground">Always accurate</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
