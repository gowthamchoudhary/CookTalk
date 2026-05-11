import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

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
    console.error('VoiceChef error boundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-6 text-center text-white">
          <p className="text-5xl">🍳</p>
          <h1 className="mt-6 text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 max-w-md text-gray-400">An unexpected error happened. You can go back home and try again.</p>
          <Link
            to="/"
            className="mt-8 rounded-full bg-orange-500 px-8 py-3 font-semibold text-white transition hover:bg-orange-400"
          >
            Go back home
          </Link>
        </div>
      )
    }

    return this.props.children
  }
}
