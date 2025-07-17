import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Headphones, 
  Mic, 
  PenTool, 
  Play,
  Clock,
  Target,
  TrendingUp,
  Star
} from 'lucide-react'
import { blink } from '@/blink/client'

export function PracticeOverview() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Mock progress data - will be replaced with real data from database
  const progressData = {
    reading: { completed: 45, total: 100, score: 85, timeSpent: 120 },
    listening: { completed: 32, total: 100, score: 78, timeSpent: 95 },
    speaking: { completed: 28, total: 100, score: 72, timeSpent: 80 },
    writing: { completed: 35, total: 100, score: 80, timeSpent: 110 }
  }

  const sections = [
    {
      id: 'reading',
      title: 'Reading Comprehension',
      icon: BookOpen,
      description: 'Academic passages with comprehension questions',
      color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
      progress: progressData.reading,
      route: '/practice/reading',
      features: ['Academic passages', 'Multiple choice questions', 'Detailed explanations', 'Timed practice'],
      available: true
    },
    {
      id: 'listening',
      title: 'Listening Comprehension',
      icon: Headphones,
      description: 'Audio lectures and conversations with questions',
      color: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
      progress: progressData.listening,
      route: '/practice/listening',
      features: ['Audio lectures', 'Conversations', 'Note-taking practice', 'Replay controls'],
      available: true
    },
    {
      id: 'speaking',
      title: 'Speaking Practice',
      icon: Mic,
      description: 'Voice recording tasks with AI pronunciation analysis',
      color: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100',
      progress: progressData.speaking,
      route: '/practice/speaking',
      features: ['Voice recording', 'Pronunciation analysis', 'Fluency feedback', 'Speaking templates'],
      available: true
    },
    {
      id: 'writing',
      title: 'Writing Tasks',
      icon: PenTool,
      description: 'Essay tasks with grammar and structure feedback',
      color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100',
      progress: progressData.writing,
      route: '/practice/writing',
      features: ['Essay writing', 'Grammar analysis', 'Structure feedback', 'Sample responses'],
      available: false
    }
  ]

  const overallStats = {
    totalQuestions: Object.values(progressData).reduce((sum, section) => sum + section.completed, 0),
    averageScore: Math.round(Object.values(progressData).reduce((sum, section) => sum + section.score, 0) / 4),
    totalTime: Object.values(progressData).reduce((sum, section) => sum + section.timeSpent, 0),
    completionRate: Math.round(Object.values(progressData).reduce((sum, section) => sum + (section.completed / section.total), 0) / 4 * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading practice sections...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>You need to be signed in to access practice sections</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => blink.auth.login()} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            TOEFL Practice Sections
          </h1>
          <p className="text-gray-600">
            Choose a section to practice and improve your TOEFL skills
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{overallStats.averageScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Questions Done</p>
                  <p className="text-2xl font-bold text-gray-900">{overallStats.totalQuestions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Study Time</p>
                  <p className="text-2xl font-bold text-gray-900">{overallStats.totalTime}m</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-amber-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion</p>
                  <p className="text-2xl font-bold text-gray-900">{overallStats.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Practice Sections */}
        <div className="grid lg:grid-cols-2 gap-8">
          {sections.map((section) => (
            <Card key={section.id} className={`hover:shadow-lg transition-all duration-300 border-2 ${section.color}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <section.icon className="h-8 w-8 mr-4" />
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription className="mt-1">{section.description}</CardDescription>
                    </div>
                  </div>
                  {!section.available && (
                    <Badge variant="secondary">Coming Soon</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Progress</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        Score: {section.progress.score}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {section.progress.completed}/{section.progress.total}
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(section.progress.completed / section.progress.total) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Features */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {section.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-600">
                        <div className="w-1.5 h-1.5 bg-current rounded-full mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-gray-600">Time spent: </span>
                    <span className="font-medium">{section.progress.timeSpent}m</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Best score: </span>
                    <span className="font-medium">{section.progress.score}</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  {section.available ? (
                    <Button asChild className="w-full">
                      <Link to={section.route}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Practice
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      Coming Soon
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="h-5 w-5 mr-2 text-blue-600" />
                  Full Practice Test
                </CardTitle>
                <CardDescription>
                  Take a complete TOEFL simulation with all four sections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/full-test">
                    Start Full Test
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Progress Report
                </CardTitle>
                <CardDescription>
                  View detailed analytics and track your improvement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/progress">
                    View Progress
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-purple-600" />
                  Study Plan
                </CardTitle>
                <CardDescription>
                  Get personalized recommendations for your preparation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/study-plan">
                    View Study Plan
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}