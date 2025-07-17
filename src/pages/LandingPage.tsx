import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Brain, 
  Target, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  Star,
  Headphones,
  Mic,
  PenTool,
  BarChart3,
  Zap
} from 'lucide-react'
import { blink } from '@/blink/client'

export function LandingPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Grading',
      description: 'Get instant, accurate feedback on your performance with our advanced AI grading system.'
    },
    {
      icon: Target,
      title: 'Personalized Learning',
      description: 'Adaptive difficulty and personalized study plans based on your strengths and weaknesses.'
    },
    {
      icon: BookOpen,
      title: '100+ Questions Per Section',
      description: 'Extensive question bank covering all TOEFL sections with realistic test scenarios.'
    },
    {
      icon: Clock,
      title: 'Full Practice Tests',
      description: 'Complete TOEFL simulations with authentic timing and test conditions.'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Detailed analytics and progress reports to monitor your improvement over time.'
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      description: 'Real-time scoring and detailed explanations to accelerate your learning.'
    }
  ]

  const sections = [
    {
      icon: BookOpen,
      title: 'Reading',
      description: 'Academic passages with comprehension questions',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: Headphones,
      title: 'Listening',
      description: 'Audio lectures and conversations with questions',
      color: 'bg-green-50 text-green-600'
    },
    {
      icon: Mic,
      title: 'Speaking',
      description: 'Voice recording tasks with AI pronunciation analysis',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      icon: PenTool,
      title: 'Writing',
      description: 'Essay tasks with grammar and structure feedback',
      color: 'bg-amber-50 text-amber-600'
    }
  ]

  const stats = [
    { label: 'Practice Questions', value: '400+' },
    { label: 'Success Rate', value: '95%' },
    { label: 'Average Score Improvement', value: '+25 points' },
    { label: 'Study Time Saved', value: '60%' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-100">
              AI-Powered TOEFL Preparation
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Master the TOEFL with
              <span className="text-blue-600 block">AI-Powered Precision</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Get personalized feedback, practice with 400+ questions, and achieve your target score 
              with our intelligent TOEFL preparation platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <Button 
                  onClick={() => blink.auth.login()} 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Start Free Trial'}
                </Button>
              )}
              <div className="text-sm text-gray-500">
                <span className="font-medium">$10/month</span> • Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOEFL Sections */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Master All Four TOEFL Sections
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive practice for every part of the TOEFL test with AI-powered feedback
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sections.map((section, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-full ${section.color} flex items-center justify-center mx-auto mb-4`}>
                    <section.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {section.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our AI Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced technology meets proven teaching methods for optimal TOEFL preparation
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="container mx-auto px-4">
          <div className="text-center text-white mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Get unlimited access to all features for one low monthly price
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <Card className="border-0 shadow-2xl">
              <CardHeader className="text-center pb-8">
                <div className="flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-amber-400 fill-current" />
                  <Star className="h-6 w-6 text-amber-400 fill-current" />
                  <Star className="h-6 w-6 text-amber-400 fill-current" />
                  <Star className="h-6 w-6 text-amber-400 fill-current" />
                  <Star className="h-6 w-6 text-amber-400 fill-current" />
                </div>
                <CardTitle className="text-2xl">Premium Plan</CardTitle>
                <div className="text-4xl font-bold text-blue-600 mt-4">
                  $10<span className="text-lg text-gray-600">/month</span>
                </div>
                <CardDescription className="text-gray-600 mt-2">
                  Everything you need to ace the TOEFL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    'Unlimited practice questions',
                    'AI-powered grading & feedback',
                    'Full-length practice tests',
                    'Progress tracking & analytics',
                    'Personalized study plans',
                    'All four TOEFL sections',
                    'Mobile & desktop access',
                    'Cancel anytime'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6">
                  {user ? (
                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                      <Link to="/subscription">Manage Subscription</Link>
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => blink.auth.login()} 
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Start Free Trial'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Achieve Your Target TOEFL Score?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have improved their TOEFL scores with our AI-powered platform
          </p>
          {user ? (
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
              <Link to="/dashboard">Continue Learning</Link>
            </Button>
          ) : (
            <Button 
              onClick={() => blink.auth.login()} 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Get Started Today'}
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}