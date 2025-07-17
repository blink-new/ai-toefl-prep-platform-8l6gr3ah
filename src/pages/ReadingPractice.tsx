import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Home,
  Loader2
} from 'lucide-react'
import { blink } from '@/blink/client'
import { api } from '@/services/api'

interface Question {
  id: string
  passage: string
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  type: string
}

interface SessionData {
  session: any;
  questions: Question[];
}

export function ReadingPractice() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(20 * 60) // 20 minutes
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [gradingResults, setGradingResults] = useState<Record<string, any>>({})

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  // Timer effect
  useEffect(() => {
    if (!sessionStarted || showResults || !sessionData) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionStarted, showResults, sessionData])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleAnswerSelect = async (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))

    // Submit answer and get AI grading if we have session data
    if (sessionData && sessionData.session) {
      try {
        const question = sessionData.questions.find(q => q.id === questionId)
        if (question) {
          const timeSpent = 60 // Mock time spent - in real app, track actual time
          const grading = await api.submitAnswerWithGrading(
            sessionData.session.id,
            questionId,
            answer,
            question,
            timeSpent
          )
          
          setGradingResults(prev => ({
            ...prev,
            [questionId]: grading
          }))
        }
      } catch (error) {
        console.error('Error submitting answer:', error)
      }
    }
  }

  const handleNext = () => {
    if (sessionData && currentQuestionIndex < sessionData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (sessionData && sessionData.session) {
      try {
        setLoading(true)
        await api.completeSessionWithAnalytics(sessionData.session.id)
        setShowResults(true)
      } catch (error) {
        console.error('Error completing session:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const calculateScore = () => {
    if (!sessionData) return 0
    let correct = 0
    sessionData.questions.forEach(question => {
      const grading = gradingResults[question.id]
      if (grading && grading.percentage === 100) {
        correct++
      }
    })
    return Math.round((correct / sessionData.questions.length) * 100)
  }

  const handleRestart = async () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setShowResults(false)
    setTimeRemaining(20 * 60)
    setSessionStarted(false)
    setSessionData(null)
    setGradingResults({})
  }

  const startSession = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const data = await api.startPracticeSession('reading', undefined, 5)
      setSessionData(data)
      setTimeRemaining(data.session.timeRemaining)
      setSessionStarted(true)
    } catch (error) {
      console.error('Error starting session:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = sessionData?.questions[currentQuestionIndex]
  const progress = sessionData ? ((currentQuestionIndex + 1) / sessionData.questions.length) * 100 : 0
  const answeredQuestions = Object.keys(selectedAnswers).length

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>You need to be signed in to practice</CardDescription>
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

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Reading Practice Session</CardTitle>
              <CardDescription>
                Test your reading comprehension skills with academic passages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Session Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Questions:</span>
                      <span className="font-medium">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Limit:</span>
                      <span className="font-medium">10 minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className="font-medium">Mixed</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Instructions</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Read each passage carefully</li>
                    <li>• Answer all questions based on the passage</li>
                    <li>• You can navigate between questions</li>
                    <li>• Submit when ready or when time expires</li>
                  </ul>
                </div>
              </div>
              <Separator />
              <div className="flex justify-center">
                <Button 
                  onClick={startSession}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    'Start Practice Session'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (showResults) {
    const score = calculateScore()
    const correctAnswers = sessionData ? sessionData.questions.filter(q => {
      const grading = gradingResults[q.id]
      return grading && grading.percentage === 100
    }).length : 0

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                score >= 80 ? 'bg-green-100' : score >= 60 ? 'bg-amber-100' : 'bg-red-100'
              }`}>
                <CheckCircle className={`h-8 w-8 ${
                  score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'
                }`} />
              </div>
              <CardTitle className="text-2xl">Practice Session Complete!</CardTitle>
              <CardDescription>
                Here's how you performed on this reading practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">{score}%</div>
                <div className="text-gray-600">
                  {correctAnswers} out of {sessionData?.questions.length || 0} questions correct
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Question Review</h3>
                {sessionData?.questions.map((question, index) => {
                  const userAnswer = selectedAnswers[question.id]
                  const grading = gradingResults[question.id]
                  const isCorrect = grading && grading.percentage === 100
                  
                  return (
                    <Card key={question.id} className={`border-l-4 ${
                      isCorrect ? 'border-l-green-500' : 'border-l-red-500'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">Question {index + 1}</h4>
                          <Badge variant={isCorrect ? "default" : "destructive"}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{question.question}</p>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="font-medium">Your answer: </span>
                            <span className={userAnswer ? '' : 'text-gray-400'}>
                              {userAnswer || 'Not answered'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Correct answer: </span>
                            <span className="text-green-600">{question.correctAnswer}</span>
                          </div>
                          {grading && grading.feedback && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800">
                              <span className="font-medium">AI Feedback: </span>
                              {grading.feedback}
                            </div>
                          )}
                          {!isCorrect && question.explanation && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800">
                              <span className="font-medium">Explanation: </span>
                              {question.explanation}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleRestart} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Practice Again
                </Button>
                <Button onClick={() => navigate('/dashboard')}>
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with timer and progress */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Reading Practice</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-sm">
                <span className="text-gray-600">Progress: </span>
                <span className="font-medium">{currentQuestionIndex + 1}/{sessionData?.questions.length || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className={`font-mono font-medium ${
                  timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="mt-3" />
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Passage */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Reading Passage</span>
                  <Badge variant="outline" className="capitalize">
                    {currentQuestion.difficulty}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {currentQuestion.passage}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {currentQuestionIndex + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-medium text-gray-900">
                  {currentQuestion.question}
                </p>
                
                <RadioGroup
                  value={selectedAnswers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <RadioGroupItem 
                        value={option} 
                        id={`option-${index}`}
                        className="mt-1"
                      />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="text-sm leading-relaxed cursor-pointer flex-1"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  {currentQuestionIndex === (sessionData?.questions.length || 1) - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Test'
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={currentQuestionIndex === (sessionData?.questions.length || 1) - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
                
                <div className="text-center text-sm text-gray-600">
                  <span>{answeredQuestions}/{sessionData?.questions.length || 0} questions answered</span>
                </div>
              </CardContent>
            </Card>

            {/* Question overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Question Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {sessionData?.questions.map((_, index) => (
                    <Button
                      key={index}
                      variant={currentQuestionIndex === index ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        selectedAnswers[sessionData.questions[index].id] 
                          ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200' 
                          : ''
                      }`}
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}