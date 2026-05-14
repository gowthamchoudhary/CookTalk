import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f0e8] px-6 text-center text-[#1a1a1a]">
          <p className="text-7xl">🍳</p>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Something spilled.</h1>
          <p className="mt-3 max-w-sm text-sm text-[#888]">Go back home and start a fresh cooking session.</p>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="mt-8 rounded-2xl bg-[#2d4a1e] px-8 py-4 font-semibold text-white"
          >
            Back Home
          </button>
        </main>
      )
    }

    return this.props.children
  }
}
