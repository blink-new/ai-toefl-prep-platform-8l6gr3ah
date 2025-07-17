export interface User {
  id: string
  email: string
  displayName?: string
  subscriptionStatus: 'active' | 'inactive' | 'trial'
  subscriptionExpiry?: string
}

export interface Question {
  id: string
  type: 'reading' | 'listening' | 'speaking' | 'writing'
  difficulty: 'easy' | 'medium' | 'hard'
  content: string
  options?: string[]
  correctAnswer?: string
  audioUrl?: string
  timeLimit: number
  points: number
}

export interface TestSession {
  id: string
  userId: string
  type: 'practice' | 'full_test'
  section: 'reading' | 'listening' | 'speaking' | 'writing' | 'full'
  questions: Question[]
  answers: Record<string, any>
  score?: number
  feedback?: string
  startedAt: string
  completedAt?: string
  timeRemaining: number
}

export interface Progress {
  userId: string
  section: string
  totalQuestions: number
  correctAnswers: number
  averageScore: number
  lastPracticed: string
  weakAreas: string[]
  recommendations: string[]
}