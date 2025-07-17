import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { 
  Clock, 
  Headphones, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Home,
  Volume2,
  VolumeX
} from 'lucide-react'
import { blink } from '@/blink/client'

interface ListeningQuestion {
  id: string
  title: string
  audioUrl: string
  transcript: string
  duration: number
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'lecture' | 'conversation'
}

// Mock listening questions data - will be replaced with database queries
const mockQuestions: ListeningQuestion[] = [
  {
    id: 'l1',
    title: 'Biology Lecture: Photosynthesis',
    audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder audio
    transcript: `Professor: Today we're going to discuss photosynthesis, one of the most important biological processes on Earth. Photosynthesis is the process by which plants, algae, and some bacteria convert light energy, usually from the sun, into chemical energy stored in glucose molecules.

The process occurs in two main stages: the light-dependent reactions and the light-independent reactions, also known as the Calvin cycle. The light-dependent reactions take place in the thylakoids of chloroplasts, where chlorophyll absorbs light energy and converts it into chemical energy in the form of ATP and NADPH.

Student: Professor, could you explain what happens to the oxygen that's produced?

Professor: Excellent question! The oxygen is actually a byproduct of the light-dependent reactions. When water molecules are split to provide electrons for the process, oxygen is released as a waste product. This oxygen is what we breathe, making photosynthesis essential for most life on Earth.

The Calvin cycle, on the other hand, uses the ATP and NADPH produced in the first stage to convert carbon dioxide into glucose. This process doesn't directly require light, which is why it's called light-independent, though it does depend on the products of the light-dependent reactions.`,
    duration: 180,
    question: 'According to the professor, what is the main purpose of the light-dependent reactions in photosynthesis?',
    options: [
      'To convert carbon dioxide into glucose',
      'To produce oxygen for breathing',
      'To convert light energy into chemical energy (ATP and NADPH)',
      'To split water molecules'
    ],
    correctAnswer: 'To convert light energy into chemical energy (ATP and NADPH)',
    explanation: 'The professor clearly states that in the light-dependent reactions, "chlorophyll absorbs light energy and converts it into chemical energy in the form of ATP and NADPH."',
    difficulty: 'medium',
    type: 'lecture'
  },
  {
    id: 'l2',
    title: 'Student Conversation: Course Registration',
    audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder audio
    transcript: `Student: Hi, I'm having trouble with my course registration. I'm trying to sign up for Advanced Statistics, but the system says I don't meet the prerequisites.

Advisor: Let me check your transcript. I see you've completed Introduction to Statistics with a B+, which should be sufficient. Have you also taken Calculus II?

Student: Yes, I took that last semester and got an A-. I thought that would be enough.

Advisor: It should be. Sometimes the system doesn't update immediately. Let me override the prerequisite check for you. Advanced Statistics is a challenging course, though. Professor Martinez expects students to have a strong foundation in both statistics and calculus.

Student: I feel prepared for it. I've been working as a research assistant, and I've been using statistical software regularly.

Advisor: That's great experience. The course covers advanced topics like multivariate analysis and regression modeling. Since you have practical experience, you should do well. I'll register you now, and you'll get a confirmation email within an hour.

Student: Thank you so much! When does the class meet?

Advisor: Tuesdays and Thursdays from 2 to 3:30 PM in the Mathematics building, room 205.`,
    duration: 120,
    question: 'What problem was the student experiencing with course registration?',
    options: [
      'The class was full',
      'The system indicated missing prerequisites',
      'The course was cancelled',
      'The student had a scheduling conflict'
    ],
    correctAnswer: 'The system indicated missing prerequisites',
    explanation: 'The student explicitly states "I\'m trying to sign up for Advanced Statistics, but the system says I don\'t meet the prerequisites."',
    difficulty: 'easy',
    type: 'conversation'
  },
  {
    id: 'l3',
    title: 'Art History Lecture: Renaissance Painting',
    audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder audio
    transcript: `Professor: The Renaissance period, spanning roughly from the 14th to the 17th century, marked a revolutionary change in artistic expression. Artists began to move away from the flat, symbolic style of medieval art toward more realistic representations.

One of the key innovations was the development of linear perspective, which allowed artists to create the illusion of three-dimensional space on a two-dimensional surface. Brunelleschi is often credited with discovering the mathematical principles of perspective in the early 15th century.

Leonardo da Vinci exemplified the Renaissance ideal of the artist-scientist. His notebooks contain detailed anatomical studies, engineering designs, and artistic techniques. His painting technique, particularly his use of sfumato - the subtle gradation of tones without harsh outlines - created an unprecedented sense of realism.

Student: How did this differ from earlier painting styles?

Professor: Medieval paintings were primarily symbolic and religious in nature. Figures were often depicted in a hierarchical scale, where important religious figures were shown larger than others, regardless of their actual spatial relationship. The Renaissance brought a focus on humanism, naturalism, and the individual.

The use of oil paints, which became popular during this period, also allowed for greater detail and more vibrant colors than the tempera paints used previously.`,
    duration: 200,
    question: 'According to the professor, what was a key characteristic of medieval painting that Renaissance artists moved away from?',
    options: [
      'The use of oil paints',
      'Detailed anatomical studies',
      'Flat, symbolic style with hierarchical scale',
      'Mathematical principles of perspective'
    ],
    correctAnswer: 'Flat, symbolic style with hierarchical scale',
    explanation: 'The professor explains that Renaissance artists "began to move away from the flat, symbolic style of medieval art" and describes how medieval paintings used "hierarchical scale" where important figures were shown larger regardless of spatial relationship.',
    difficulty: 'medium',
    type: 'lecture'
  }
]

export function ListeningPractice() {
  const navigate = useNavigate()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [user, setUser] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(25 * 60) // 25 minutes
  const [sessionStarted, setSessionStarted] = useState(false)
  
  // Audio controls
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState([75])
  const [isMuted, setIsMuted] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

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

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentQuestionIndex])

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume[0] / 100
    }
  }, [volume, isMuted])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setIsPlaying(false)
      setCurrentTime(0)
      setShowTranscript(false)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setIsPlaying(false)
      setCurrentTime(0)
      setShowTranscript(false)
    }
  }

  const handleSubmit = () => {
    setShowResults(true)
    setIsPlaying(false)
  }

  const calculateScore = () => {
    let correct = 0
    mockQuestions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correct++
      }
    })
    return Math.round((correct / mockQuestions.length) * 100)
  }

  const handleRestart = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setShowResults(false)
    setTimeRemaining(25 * 60)
    setSessionStarted(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setShowTranscript(false)
  }

  const currentQuestion = mockQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / mockQuestions.length) * 100
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
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Listening Practice Session</CardTitle>
              <CardDescription>
                Test your listening comprehension with academic lectures and conversations
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
                      <span className="font-medium">25 minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Content:</span>
                      <span className="font-medium">Lectures & Conversations</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Instructions</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Listen to each audio clip carefully</li>
                    <li>• You can replay audio multiple times</li>
                    <li>• Take notes while listening</li>
                    <li>• Answer questions based on what you heard</li>
                  </ul>
                </div>
              </div>
              <Separator />
              <div className="flex justify-center">
                <Button 
                  onClick={() => setSessionStarted(true)}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Start Listening Practice
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
    const correctAnswers = mockQuestions.filter(q => selectedAnswers[q.id] === q.correctAnswer).length

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
              <CardTitle className="text-2xl">Listening Practice Complete!</CardTitle>
              <CardDescription>
                Here's how you performed on this listening practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">{score}%</div>
                <div className="text-gray-600">
                  {correctAnswers} out of {mockQuestions.length} questions correct
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Question Review</h3>
                {mockQuestions.map((question, index) => {
                  const userAnswer = selectedAnswers[question.id]
                  const isCorrect = userAnswer === question.correctAnswer
                  
                  return (
                    <Card key={question.id} className={`border-l-4 ${
                      isCorrect ? 'border-l-green-500' : 'border-l-red-500'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">Question {index + 1}</h4>
                            <p className="text-sm text-gray-500">{question.title}</p>
                          </div>
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
                          {!isCorrect && (
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
                <Headphones className="h-5 w-5 text-green-600" />
                <span className="font-medium">Listening Practice</span>
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
          {/* Audio Player */}
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
                {/* Audio Element */}
                <audio
                  ref={audioRef}
                  src={currentQuestion.audioUrl}
                  preload="metadata"
                />

                {/* Audio Controls */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Button
                      onClick={handlePlayPause}
                      size="lg"
                      className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700"
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6 ml-1" />
                      )}
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={1}
                      onValueChange={handleSeek}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Slider
                      value={volume}
                      max={100}
                      step={1}
                      onValueChange={setVolume}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600 w-8">{volume[0]}%</span>
                  </div>
                </div>

                {/* Transcript Toggle */}
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="mb-4"
                  >
                    {showTranscript ? 'Hide' : 'Show'} Transcript
                  </Button>
                  
                  {showTranscript && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Transcript:</h4>
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {currentQuestion.transcript}
                      </div>
                    </div>
                  )}
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
                  
                  {currentQuestionIndex === mockQuestions.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      className="bg-green-600 hover:bg-green-700"
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
                  <span>{answeredQuestions}/{mockQuestions.length} questions answered</span>
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
                        selectedAnswers[mockQuestions[index].id] 
                          ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200' 
                          : ''
                      }`}
                      onClick={() => {
                        setCurrentQuestionIndex(index)
                        setIsPlaying(false)
                        setCurrentTime(0)
                        setShowTranscript(false)
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