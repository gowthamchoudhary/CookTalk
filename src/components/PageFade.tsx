import type { ReactNode } from 'react'

export function PageFade({ children }: { children: ReactNode }) {
  return <div className="animate-fade-in min-h-screen">{children}</div>
}
