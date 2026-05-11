import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PageFade } from './components/PageFade'
import CookMode from './pages/CookMode'
import DoneScreen from './pages/DoneScreen'
import Landing from './pages/Landing'
import PersonaPicker from './pages/PersonaPicker'
import RecipeEntry from './pages/RecipeEntry'
import RecipePreview from './pages/RecipePreview'

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppProvider>
          <Routes>
            <Route path="/" element={<PageFade><Landing /></PageFade>} />
            <Route path="/recipe" element={<PageFade><RecipeEntry /></PageFade>} />
            <Route path="/preview" element={<PageFade><RecipePreview /></PageFade>} />
            <Route path="/persona" element={<PageFade><PersonaPicker /></PageFade>} />
            <Route path="/cook" element={<PageFade><CookMode /></PageFade>} />
            <Route path="/done" element={<PageFade><DoneScreen /></PageFade>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
