import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  Mic, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  Play,
  Pause,
  Square,
  RotateCcw,
  Home,
  Volume2,
  AlertCircle,
  MicOff
} from 'lucide-react'
import { blink } from '@/blink/client'

interface SpeakingQuestion {
  id: string
  title: string
  type: 'independent' | 'integrated'
  prompt: string
  preparationTime: number
  responseTime: number
  difficulty: 'easy' | 'medium' | 'hard'
  tips: string[]
  sampleResponse?: string
}

// Mock speaking questions data - will be replaced with database queries
const mockQuestions: SpeakingQuestion[] = [
  {
    id: 's1',
    title: 'Personal Preference',
    type: 'independent',
    prompt: 'Some people prefer to work in a team environment, while others prefer to work independently. Which do you prefer and why? Use specific reasons and examples to support your answer.',
    preparationTime: 15,
    responseTime: 45,
    difficulty: 'easy',
    tips: [
      'State your preference clearly',
      'Give 2-3 specific reasons',
      'Use personal examples',
      'Speak clearly and at a steady pace'
    ],
    sampleResponse: 'I prefer working in a team environment for several reasons. First, collaboration allows for diverse perspectives and creative solutions that I might not think of alone. For example, in my marketing class project, my teammate suggested using social media analytics, which significantly improved our campaign results. Second, working with others helps me develop communication and leadership skills that are valuable in any career. Finally, team environments provide motivation and accountability - when others depend on my contributions, I tend to be more focused and productive.'
  },
  {
    id: 's2',
    title: 'Campus Life',
    type: 'independent',
    prompt: 'Your university is planning to build a new facility on campus. Some students think it should be a new library, while others think it should be a recreation center. Which option do you support and why?',
    preparationTime: 15,
    responseTime: 45,
    difficulty: 'medium',
    tips: [
      'Choose one option and stick to it',
      'Provide logical reasons',
      'Consider the needs of all students',
      'Use specific examples'
    ]
  },
  {
    id: 's3',
    title: 'Academic Reading Integration',
    type: 'integrated',
    prompt: 'The reading passage discusses the concept of "flow state" in psychology. The professor in the lecture provides additional examples of how flow state affects performance. Summarize the main points from both sources and explain how the examples support the concept.',
    preparationTime: 30,
    responseTime: 60,
    difficulty: 'hard',
    tips: [
      'Summarize key points from reading',
      'Include lecture examples',
      'Show connections between sources',
      'Organize your response clearly'
    ]
  }
]

export function SpeakingPractice() {
  const navigate = useNavigate()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [user, setUser] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, { audioBlob: Blob | null, duration: number }>>({})
  const [showResults, setShowResults] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(30 * 60) // 30 minutes
  const [sessionStarted, setSessionStarted] = useState(false)
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [preparationTime, setPreparationTime] = useState(0)
  const [responseTime, setResponseTime] = useState(0)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [hasPermission, setHasPermission] = useState(false)
  const [permissionError, setPermissionError] = useState('')
  
  // Playback states
  const [playingResponse, setPlayingResponse] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({})

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  // Request microphone permission
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setHasPermission(true)
        stream.getTracks().forEach(track => track.stop()) // Stop the stream immediately
      } catch (error) {
        setPermissionError('Microphone access is required for speaking practice. Please allow microphone access and refresh the page.')
        setHasPermission(false)
      }
    }

    if (sessionStarted) {
      requestPermission()
    }
  }, [sessionStarted])

  // Timer effect
  useEffect(() => {
    if (!sessionStarted || showResults) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setShowResults(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionStarted, showResults])

  const startResponseTimer = useCallback(() => {
    const currentQuestion = mockQuestions[currentQuestionIndex]
    setResponseTime(currentQuestion.responseTime)
  }, [currentQuestionIndex])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setResponseTime(0)
    }
  }, [isRecording])

  // Preparation timer
  useEffect(() => {
    if (!isPreparing) return

    const timer = setInterval(() => {
      setPreparationTime((prev) => {
        if (prev <= 1) {
          setIsPreparing(false)
          startResponseTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isPreparing, startResponseTimer])

  // Response timer
  useEffect(() => {
    if (!isRecording && responseTime === 0) return

    const timer = setInterval(() => {
      setResponseTime((prev) => {
        if (prev <= 1) {
          stopRecording()
          return 0
        }
        return prev - 1
      })
      
      if (isRecording) {
        setRecordingDuration((prev) => prev + 1)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [responseTime, isRecording, stopRecording])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const startPreparation = () => {
    const currentQuestion = mockQuestions[currentQuestionIndex]
    setPreparationTime(currentQuestion.preparationTime)
    setIsPreparing(true)
  }

  const startRecording = async () => {
    if (!hasPermission) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setResponses(prev => ({
          ...prev,
          [currentQuestion.id]: {
            audioBlob,
            duration: recordingDuration
          }
        }))
        
        // Create audio element for playback
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        setAudioElements(prev => ({
          ...prev,
          [currentQuestion.id]: audio
        }))

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)
    } catch (error) {
      console.error('Error starting recording:', error)
      setPermissionError('Failed to start recording. Please check your microphone.')
    }
  }

  const playResponse = (questionId: string) => {
    const audio = audioElements[questionId]
    if (audio) {
      if (playingResponse === questionId) {
        audio.pause()
        audio.currentTime = 0
        setPlayingResponse(null)
      } else {
        // Stop any currently playing audio
        Object.values(audioElements).forEach(a => {
          a.pause()
          a.currentTime = 0
        })
        
        audio.play()
        setPlayingResponse(questionId)
        
        audio.onended = () => {
          setPlayingResponse(null)
        }
      }
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setIsPreparing(false)
      setIsRecording(false)
      setPreparationTime(0)
      setResponseTime(0)
      setRecordingDuration(0)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setIsPreparing(false)
      setIsRecording(false)
      setPreparationTime(0)
      setResponseTime(0)
      setRecordingDuration(0)
    }
  }

  const handleSubmit = () => {
    setShowResults(true)
    setIsRecording(false)
    setIsPreparing(false)
  }

  const handleRestart = () => {
    setCurrentQuestionIndex(0)
    setResponses({})
    setShowResults(false)
    setTimeRemaining(30 * 60)
    setSessionStarted(false)
    setIsPreparing(false)
    setIsRecording(false)
    setPreparationTime(0)
    setResponseTime(0)
    setRecordingDuration(0)
    setAudioElements({})
    setPlayingResponse(null)
  }

  const currentQuestion = mockQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / mockQuestions.length) * 100
  const completedResponses = Object.keys(responses).length

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
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Speaking Practice Session</CardTitle>
              <CardDescription>
                Practice your speaking skills with independent and integrated tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Session Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Questions:</span>
                      <span className="font-medium">{mockQuestions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Limit:</span>
                      <span className="font-medium">30 minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Task Types:</span>
                      <span className="font-medium">Independent & Integrated</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Instructions</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Read each prompt carefully</li>
                    <li>• Use preparation time to organize thoughts</li>
                    <li>• Speak clearly and at a steady pace</li>
                    <li>• Record your complete response</li>
                  </ul>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This practice requires microphone access to record your responses. 
                  Please allow microphone permissions when prompted.
                </AlertDescription>
              </Alert>
              
              <Separator />
              <div className="flex justify-center">
                <Button 
                  onClick={() => setSessionStarted(true)}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Start Speaking Practice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Speaking Practice Complete!</CardTitle>
              <CardDescription>
                Review your responses and get feedback on your speaking performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">{completedResponses}/{mockQuestions.length}</div>
                <div className="text-gray-600">
                  Responses recorded
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Response Review</h3>
                {mockQuestions.map((question, index) => {
                  const response = responses[question.id]
                  const hasResponse = !!response
                  
                  return (
                    <Card key={question.id} className={`border-l-4 ${
                      hasResponse ? 'border-l-purple-500' : 'border-l-gray-300'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">Question {index + 1}</h4>
                            <p className="text-sm text-gray-500">{question.title}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={hasResponse ? "default" : "secondary"}>
                              {hasResponse ? 'Recorded' : 'No Response'}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {question.type}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{question.prompt}</p>
                        
                        {hasResponse && (
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => playResponse(question.id)}
                            >
                              {playingResponse === question.id ? (
                                <Pause className="h-4 w-4 mr-2" />
                              ) : (
                                <Play className="h-4 w-4 mr-2" />
                              )}
                              {playingResponse === question.id ? 'Pause' : 'Play'} Response
                            </Button>
                            <span className="text-sm text-gray-600">
                              Duration: {formatTime(response.duration)}
                            </span>
                          </div>
                        )}
                        
                        {question.sampleResponse && (
                          <div className="mt-3 p-3 bg-blue-50 rounded text-blue-800">
                            <span className="font-medium">Sample Response: </span>
                            <p className="text-sm mt-1">{question.sampleResponse}</p>
                          </div>
                        )}
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
                <Mic className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Speaking Practice</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-sm">
                <span className="text-gray-600">Progress: </span>
                <span className="font-medium">{currentQuestionIndex + 1}/{mockQuestions.length}</span>
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
          {/* Question Prompt */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{currentQuestion.title}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="capitalize">
                      {currentQuestion.difficulty}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {currentQuestion.type}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {currentQuestion.prompt}
                  </p>
                </div>

                {/* Tips */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-900">Speaking Tips:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {currentQuestion.tips.map((tip, index) => (
                      <li key={index}>• {tip}</li>
                    ))}
                  </ul>
                </div>

                {/* Permission Error */}
                {permissionError && (
                  <Alert variant="destructive">
                    <MicOff className="h-4 w-4" />
                    <AlertDescription>{permissionError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recording Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {currentQuestionIndex + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timer Display */}
                <div className="text-center">
                  {isPreparing && (
                    <div>
                      <div className="text-2xl font-bold text-amber-600 mb-1">
                        {formatTime(preparationTime)}
                      </div>
                      <div className="text-sm text-gray-600">Preparation Time</div>
                    </div>
                  )}
                  
                  {responseTime > 0 && !isPreparing && (
                    <div>
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {formatTime(responseTime)}
                      </div>
                      <div className="text-sm text-gray-600">Response Time</div>
                    </div>
                  )}
                  
                  {isRecording && (
                    <div className="mt-2">
                      <div className="text-lg font-medium text-red-600">
                        Recording: {formatTime(recordingDuration)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Control Buttons */}
                <div className="space-y-3">
                  {!isPreparing && !isRecording && responseTime === 0 && (
                    <Button
                      onClick={startPreparation}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      disabled={!hasPermission}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Start Preparation ({currentQuestion.preparationTime}s)
                    </Button>
                  )}

                  {responseTime > 0 && !isRecording && (
                    <Button
                      onClick={startRecording}
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={!hasPermission}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </Button>
                  )}

                  {isRecording && (
                    <Button
                      onClick={stopRecording}
                      className="w-full bg-gray-600 hover:bg-gray-700"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                  )}

                  {responses[currentQuestion.id] && (
                    <Button
                      onClick={() => playResponse(currentQuestion.id)}
                      variant="outline"
                      className="w-full"
                    >
                      {playingResponse === currentQuestion.id ? (
                        <Pause className="h-4 w-4 mr-2" />
                      ) : (
                        <Volume2 className="h-4 w-4 mr-2" />
                      )}
                      {playingResponse === currentQuestion.id ? 'Pause' : 'Play'} Response
                    </Button>
                  )}
                </div>
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
                  
                  {currentQuestionIndex === mockQuestions.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Submit Test
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={currentQuestionIndex === mockQuestions.length - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
                
                <div className="text-center text-sm text-gray-600">
                  <span>{completedResponses}/{mockQuestions.length} responses recorded</span>
                </div>
              </CardContent>
            </Card>

            {/* Question overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Question Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {mockQuestions.map((_, index) => (
                    <Button
                      key={index}
                      variant={currentQuestionIndex === index ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        responses[mockQuestions[index].id] 
                          ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200' 
                          : ''
                      }`}
                      onClick={() => {
                        setCurrentQuestionIndex(index)
                        setIsPreparing(false)
                        setIsRecording(false)
                        setPreparationTime(0)
                        setResponseTime(0)
                        setRecordingDuration(0)
                      }}
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