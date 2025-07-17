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
  TrendingUp, 
  Clock, 
  Target,
  Play,
  BarChart3,
  Calendar,
  Award,
  Loader2
} from 'lucide-react'
import { blink } from '@/blink/client'
import { analyticsAPI } from '@/services/api'

export function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
      
      // Load dashboard data when user is authenticated
      if (state.user && !state.isLoading) {
        loadDashboardData(state.user.id)
      }
    })
    return unsubscribe
  }, [])

  const loadDashboardData = async (userId: string) => {
    try {
      setDataLoading(true)
      const data = await analyticsAPI.getDashboardSummary(userId)
      setDashboardData(data.dashboard)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Use mock data as fallback
      setDashboardData({
        totalSessions: 12,
        totalQuestions: 140,
        averageScore: 78,
        timeSpent: 480,
        streakDays: 7,
        recentActivity: [
          { section: 'Reading', score: 88, date: '2 hours ago', type: 'practice' },
          { section: 'Listening', score: 75, date: '1 day ago', type: 'practice' },
          { section: 'Writing', score: 82, date: '2 days ago', type: 'practice' },
          { section: 'Full Test', score: 79, date: '3 days ago', type: 'full_test' }
        ],
        sectionScores: {
          reading: 85,
          listening: 78,
          speaking: 72,
          writing: 80
        },
        weeklyProgress: []
      })
    } finally {
      setDataLoading(false)
    }
  }

  // Use real data or fallback to mock data
  const progressData = dashboardData ? {
    reading: { completed: Math.floor(dashboardData.totalQuestions * 0.3), total: 100, score: dashboardData.sectionScores.reading || 85 },
    listening: { completed: Math.floor(dashboardData.totalQuestions * 0.25), total: 100, score: dashboardData.sectionScores.listening || 78 },
    speaking: { completed: Math.floor(dashboardData.totalQuestions * 0.2), total: 100, score: dashboardData.sectionScores.speaking || 72 },
    writing: { completed: Math.floor(dashboardData.totalQuestions * 0.25), total: 100, score: dashboardData.sectionScores.writing || 80 }
  } : {
    reading: { completed: 45, total: 100, score: 85 },
    listening: { completed: 32, total: 100, score: 78 },
    speaking: { completed: 28, total: 100, score: 72 },
    writing: { completed: 35, total: 100, score: 80 }
  }

  const recentActivity = dashboardData?.recentActivity || [
    { section: 'Reading', score: 88, date: '2 hours ago', type: 'practice' },
    { section: 'Listening', score: 75, date: '1 day ago', type: 'practice' },
    { section: 'Writing', score: 82, date: '2 days ago', type: 'practice' },
    { section: 'Full Test', score: 79, date: '3 days ago', type: 'full_test' }
  ]

  const sections = [
    {
      id: 'reading',
      title: 'Reading',
      icon: BookOpen,
      description: 'Academic passages and comprehension',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      progress: progressData.reading,
      route: '/practice/reading'
    },
    {
      id: 'listening',
      title: 'Listening',
      icon: Headphones,
      description: 'Audio lectures and conversations',
      color: 'bg-green-50 text-green-600 border-green-200',
      progress: progressData.listening,
      route: '/practice/listening'
    },
    {
      id: 'speaking',
      title: 'Speaking',
      icon: Mic,
      description: 'Voice recording and pronunciation',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      progress: progressData.speaking,
      route: '/practice/speaking'
    },
    {
      id: 'writing',
      title: 'Writing',
      icon: PenTool,
      description: 'Essay tasks and grammar',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      progress: progressData.writing,
      route: '/practice/writing'
    }
  ]

  const overallScore = dashboardData?.averageScore || Math.round(
    (progressData.reading.score + progressData.listening.score + 
     progressData.speaking.score + progressData.writing.score) / 4
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
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
            <CardDescription>You need to be signed in to access your dashboard</CardDescription>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.displayName || 'Student'}!
          </h1>
          <p className="text-gray-600">
            Continue your TOEFL preparation journey. You're doing great!
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Score</p>
                  <p className="text-2xl font-bold text-gray-900">{overallScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Questions Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.values(progressData).reduce((sum, section) => sum + section.completed, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Study Streak</p>
                  <p className="text-2xl font-bold text-gray-900">7 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-amber-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Best Score</p>
                  <p className="text-2xl font-bold text-gray-900">88</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Practice Sections */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Practice Sections</h2>
              <Button asChild variant="outline">
                <Link to="/full-test">
                  <Play className="h-4 w-4 mr-2" />
                  Take Full Test
                </Link>
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {sections.map((section) => (
                <Card key={section.id} className={`hover:shadow-lg transition-shadow border-2 ${section.color}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <section.icon className="h-6 w-6 mr-3" />
                        <div>
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {section.progress.score}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Progress</span>
                          <span>{section.progress.completed}/{section.progress.total}</span>
                        </div>
                        <Progress 
                          value={(section.progress.completed / section.progress.total) * 100} 
                          className="h-2"
                        />
                      </div>
                      <Button asChild className="w-full">
                        <Link to={section.route}>
                          Continue Practice
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{activity.section}</p>
                        <p className="text-xs text-gray-500">{activity.date}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={activity.score >= 80 ? "default" : activity.score >= 70 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {activity.score}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.type === 'full_test' ? 'Full Test' : 'Practice'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Study Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Today's Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Complete 5 Reading questions</span>
                    <Badge variant="outline" className="text-xs">3/5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Practice Speaking for 15 min</span>
                    <Badge variant="outline" className="text-xs">0/15</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Review Writing feedback</span>
                    <Badge variant="secondary" className="text-xs">Done</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/progress">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Progress Report
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/subscription">
                    <Target className="h-4 w-4 mr-2" />
                    Manage Subscription
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