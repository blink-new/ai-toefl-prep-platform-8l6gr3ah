import { blink } from '@/blink/client';

// Backend API endpoints
const API_ENDPOINTS = {
  questions: 'https://8l6gr3ah--questions.functions.blink.new',
  aiGrading: 'https://8l6gr3ah--ai-grading.functions.blink.new',
  testSessions: 'https://8l6gr3ah--test-sessions.functions.blink.new',
  payments: 'https://8l6gr3ah--payments.functions.blink.new',
  analytics: 'https://8l6gr3ah--analytics.functions.blink.new'
};

// Helper function to make authenticated API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const user = await blink.auth.me();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.id}`, // Using user ID as token for simplicity
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Questions API
export const questionsAPI = {
  // Get questions for a specific section
  getQuestions: async (section: string, options: {
    difficulty?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    const params = new URLSearchParams();
    if (options.difficulty) params.append('difficulty', options.difficulty);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    return apiCall(`${API_ENDPOINTS.questions}/questions/${section}?${params}`);
  },

  // Get random questions for practice
  getRandomQuestions: async (section: string, count: number = 5) => {
    return apiCall(`${API_ENDPOINTS.questions}/questions/random/${section}?count=${count}`);
  },

  // Get question bank statistics
  getStats: async () => {
    return apiCall(`${API_ENDPOINTS.questions}/questions/stats`);
  }
};

// AI Grading API
export const gradingAPI = {
  // Grade a user's answer
  gradeAnswer: async (gradingRequest: {
    questionId: string;
    questionType: 'reading' | 'listening' | 'speaking' | 'writing';
    userAnswer: string;
    correctAnswer?: string;
    audioUrl?: string;
    rubric?: any;
  }) => {
    return apiCall(API_ENDPOINTS.aiGrading, {
      method: 'POST',
      body: JSON.stringify(gradingRequest)
    });
  }
};

// Test Sessions API
export const sessionsAPI = {
  // Create a new test session
  createSession: async (sessionData: {
    userId: string;
    type: 'practice' | 'full_test';
    section: string;
    questionIds: string[];
    timeLimit: number;
  }) => {
    return apiCall(`${API_ENDPOINTS.testSessions}/sessions`, {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  },

  // Get session details
  getSession: async (sessionId: string) => {
    return apiCall(`${API_ENDPOINTS.testSessions}/sessions/${sessionId}`);
  },

  // Submit answer for a question
  submitAnswer: async (sessionId: string, answerData: {
    questionId: string;
    answer: string;
    timeSpent: number;
  }) => {
    return apiCall(`${API_ENDPOINTS.testSessions}/sessions/${sessionId}/answer`, {
      method: 'PUT',
      body: JSON.stringify(answerData)
    });
  },

  // Complete test session
  completeSession: async (sessionId: string) => {
    return apiCall(`${API_ENDPOINTS.testSessions}/sessions/${sessionId}/complete`, {
      method: 'POST'
    });
  },

  // Get user's test sessions
  getUserSessions: async (userId: string, options: {
    limit?: number;
    offset?: number;
  } = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    return apiCall(`${API_ENDPOINTS.testSessions}/sessions/user/${userId}?${params}`);
  },

  // Get user progress
  getProgress: async (userId: string, section?: string) => {
    const params = section ? `?section=${section}` : '';
    return apiCall(`${API_ENDPOINTS.testSessions}/progress/${userId}${params}`);
  }
};

// Payments API
export const paymentsAPI = {
  // Get available subscription plans
  getPlans: async () => {
    return apiCall(`${API_ENDPOINTS.payments}/plans`);
  },

  // Create subscription
  subscribe: async (subscriptionData: {
    userId: string;
    planId: string;
    paypalOrderId: string;
  }) => {
    return apiCall(`${API_ENDPOINTS.payments}/subscribe`, {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
    });
  },

  // Get user's subscription
  getSubscription: async (userId: string) => {
    return apiCall(`${API_ENDPOINTS.payments}/subscription/${userId}`);
  },

  // Cancel subscription
  cancelSubscription: async (userId: string) => {
    return apiCall(`${API_ENDPOINTS.payments}/subscription/${userId}/cancel`, {
      method: 'POST'
    });
  },

  // Reactivate subscription
  reactivateSubscription: async (userId: string, paypalOrderId: string) => {
    return apiCall(`${API_ENDPOINTS.payments}/subscription/${userId}/reactivate`, {
      method: 'POST',
      body: JSON.stringify({ paypalOrderId })
    });
  },

  // Get usage statistics
  getUsage: async (userId: string) => {
    return apiCall(`${API_ENDPOINTS.payments}/subscription/${userId}/usage`);
  }
};

// Analytics API
export const analyticsAPI = {
  // Track analytics event
  trackEvent: async (eventData: {
    userId: string;
    eventType: string;
    eventData: any;
    sessionId?: string;
  }) => {
    return apiCall(`${API_ENDPOINTS.analytics}/events`, {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  },

  // Get user analytics
  getAnalytics: async (userId: string, timeframe: string = '30d') => {
    return apiCall(`${API_ENDPOINTS.analytics}/analytics/${userId}?timeframe=${timeframe}`);
  },

  // Get section analytics
  getSectionAnalytics: async (userId: string, section?: string, timeframe: string = '30d') => {
    const params = new URLSearchParams({ timeframe });
    if (section) params.append('section', section);
    
    return apiCall(`${API_ENDPOINTS.analytics}/analytics/${userId}/sections?${params}`);
  },

  // Get progress over time
  getProgressOverTime: async (userId: string, section?: string, timeframe: string = '30d') => {
    const params = new URLSearchParams({ timeframe });
    if (section) params.append('section', section);
    
    return apiCall(`${API_ENDPOINTS.analytics}/analytics/${userId}/progress?${params}`);
  },

  // Get personalized recommendations
  getRecommendations: async (userId: string) => {
    return apiCall(`${API_ENDPOINTS.analytics}/analytics/${userId}/recommendations`);
  },

  // Get dashboard summary
  getDashboardSummary: async (userId: string) => {
    return apiCall(`${API_ENDPOINTS.analytics}/analytics/${userId}/dashboard`);
  }
};

// Convenience functions for common operations
export const api = {
  // Start a practice session
  startPracticeSession: async (section: string, difficulty?: string, questionCount: number = 5) => {
    const user = await blink.auth.me();
    if (!user) throw new Error('User not authenticated');

    // Get random questions
    const { questions } = await questionsAPI.getRandomQuestions(section, questionCount);
    
    // Create session
    const timeLimit = questionCount * 120; // 2 minutes per question
    const { session } = await sessionsAPI.createSession({
      userId: user.id,
      type: 'practice',
      section,
      questionIds: questions.map((q: any) => q.id),
      timeLimit
    });

    // Track analytics
    await analyticsAPI.trackEvent({
      userId: user.id,
      eventType: 'session_started',
      eventData: { section, questionCount, difficulty },
      sessionId: session.id
    });

    return { session, questions };
  },

  // Submit answer and get AI feedback
  submitAnswerWithGrading: async (sessionId: string, questionId: string, answer: string, question: any, timeSpent: number) => {
    const user = await blink.auth.me();
    if (!user) throw new Error('User not authenticated');

    // Submit answer to session
    await sessionsAPI.submitAnswer(sessionId, {
      questionId,
      answer,
      timeSpent
    });

    // Get AI grading
    const grading = await gradingAPI.gradeAnswer({
      questionId,
      questionType: question.type,
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      audioUrl: question.audioUrl
    });

    // Track analytics
    await analyticsAPI.trackEvent({
      userId: user.id,
      eventType: 'question_answered',
      eventData: {
        questionId,
        section: question.type,
        difficulty: question.difficulty,
        score: grading.score,
        timeSpent,
        correct: grading.percentage === 100
      },
      sessionId
    });

    return grading;
  },

  // Complete session and get comprehensive results
  completeSessionWithAnalytics: async (sessionId: string) => {
    const user = await blink.auth.me();
    if (!user) throw new Error('User not authenticated');

    // Complete session
    const result = await sessionsAPI.completeSession(sessionId);

    // Track completion
    await analyticsAPI.trackEvent({
      userId: user.id,
      eventType: 'session_completed',
      eventData: {
        sessionId,
        totalScore: result.totalScore,
        averageScore: result.averageScore,
        questionsAnswered: Object.keys(result.session.answers).length
      },
      sessionId
    });

    return result;
  }
};

export default api;