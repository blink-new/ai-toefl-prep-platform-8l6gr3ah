import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { LandingPage } from '@/pages/LandingPage'
import { Dashboard } from '@/pages/Dashboard'
import { PracticeOverview } from '@/pages/PracticeOverview'
import { ReadingPractice } from '@/pages/ReadingPractice'
import { ListeningPractice } from '@/pages/ListeningPractice'
import { SpeakingPractice } from '@/pages/SpeakingPractice'
import { Toaster } from '@/components/ui/toaster'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Placeholder routes - will be implemented next */}
            <Route path="/practice" element={<PracticeOverview />} />
            <Route path="/practice/reading" element={<ReadingPractice />} />
            <Route path="/practice/listening" element={<ListeningPractice />} />
            <Route path="/practice/speaking" element={<SpeakingPractice />} />
            <Route path="/practice/:section" element={<div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-bold">Section Practice - Coming Soon</h1></div>} />
            <Route path="/full-test" element={<div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-bold">Full Test - Coming Soon</h1></div>} />
            <Route path="/progress" element={<div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-bold">Progress Analytics - Coming Soon</h1></div>} />
            <Route path="/subscription" element={<div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-bold">Subscription Management - Coming Soon</h1></div>} />
            <Route path="/profile" element={<div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-bold">Profile Settings - Coming Soon</h1></div>} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  )
}

export default App