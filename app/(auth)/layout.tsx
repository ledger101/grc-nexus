// app/(auth)/layout.tsx
// Unauthenticated pages shell — provides paper background, centered layout.
// NO auth check here — middleware handles all redirects before layouts render.
// Server Component (no 'use client').
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-paper flex items-center justify-center p-4">
      {children}
    </main>
  )
}
