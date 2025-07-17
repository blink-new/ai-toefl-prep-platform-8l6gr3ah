import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface TestSession {
  id: string;
  userId: string;
  type: 'practice' | 'full_test';
  section: 'reading' | 'listening' | 'speaking' | 'writing' | 'full';
  questions: string[];
  answers: Record<string, any>;
  scores: Record<string, number>;
  feedback: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  timeRemaining: number;
  totalTime: number;
  status: 'in_progress' | 'completed' | 'abandoned';
}

interface UserProgress {
  userId: string;
  section: string;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  lastPracticed: string;
  weakAreas: string[];
  recommendations: string[];
  sessionsCompleted: number;
  totalTimeSpent: number;
}

// In-memory storage (in production, this would be a database)
const testSessions = new Map<string, TestSession>();
const userProgress = new Map<string, UserProgress>();

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;

    // POST /sessions - Create new test session
    if (method === 'POST' && path === '/sessions') {
      const { userId, type, section, questionIds, timeLimit } = await req.json();
      
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session: TestSession = {
        id: sessionId,
        userId,
        type,
        section,
        questions: questionIds,
        answers: {},
        scores: {},
        feedback: {},
        startedAt: new Date().toISOString(),
        timeRemaining: timeLimit,
        totalTime: timeLimit,
        status: 'in_progress'
      };

      testSessions.set(sessionId, session);

      return new Response(JSON.stringify({ session }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // GET /sessions/:sessionId - Get session details
    if (method === 'GET' && path.startsWith('/sessions/')) {
      const sessionId = path.split('/')[2];
      const session = testSessions.get(sessionId);

      if (!session) {
        return new Response(JSON.stringify({ error: 'Session not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      return new Response(JSON.stringify({ session }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // PUT /sessions/:sessionId/answer - Submit answer for a question
    if (method === 'PUT' && path.includes('/answer')) {
      const sessionId = path.split('/')[2];
      const { questionId, answer, timeSpent } = await req.json();
      
      const session = testSessions.get(sessionId);
      if (!session) {
        return new Response(JSON.stringify({ error: 'Session not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Update session with answer
      session.answers[questionId] = {
        answer,
        timeSpent,
        submittedAt: new Date().toISOString()
      };

      // Update time remaining
      session.timeRemaining = Math.max(0, session.timeRemaining - timeSpent);

      testSessions.set(sessionId, session);

      return new Response(JSON.stringify({ success: true, session }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // POST /sessions/:sessionId/complete - Complete test session
    if (method === 'POST' && path.includes('/complete')) {
      const sessionId = path.split('/')[2];
      const session = testSessions.get(sessionId);

      if (!session) {
        return new Response(JSON.stringify({ error: 'Session not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Mark session as completed
      session.completedAt = new Date().toISOString();
      session.status = 'completed';

      // Calculate overall score
      const scores = Object.values(session.scores);
      const totalScore = scores.reduce((sum, score) => sum + score, 0);
      const averageScore = scores.length > 0 ? totalScore / scores.length : 0;

      // Update user progress
      await updateUserProgress(session.userId, session.section, session, averageScore);

      testSessions.set(sessionId, session);

      return new Response(JSON.stringify({ 
        success: true, 
        session,
        totalScore,
        averageScore: Math.round(averageScore)
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // GET /progress/:userId - Get user progress
    if (method === 'GET' && path.startsWith('/progress/')) {
      const userId = path.split('/')[2];
      const section = url.searchParams.get('section');

      if (section) {
        const progressKey = `${userId}_${section}`;
        const progress = userProgress.get(progressKey) || createDefaultProgress(userId, section);
        
        return new Response(JSON.stringify({ progress }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } else {
        // Get progress for all sections
        const sections = ['reading', 'listening', 'speaking', 'writing'];
        const allProgress = sections.map(sec => {
          const progressKey = `${userId}_${sec}`;
          return userProgress.get(progressKey) || createDefaultProgress(userId, sec);
        });

        return new Response(JSON.stringify({ progress: allProgress }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // GET /sessions/user/:userId - Get user's test sessions
    if (method === 'GET' && path.startsWith('/sessions/user/')) {
      const userId = path.split('/')[3];
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      const userSessions = Array.from(testSessions.values())
        .filter(session => session.userId === userId)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(offset, offset + limit);

      return new Response(JSON.stringify({ 
        sessions: userSessions,
        total: userSessions.length 
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Error in test sessions function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});

async function updateUserProgress(userId: string, section: string, session: TestSession, averageScore: number) {
  const progressKey = `${userId}_${section}`;
  let progress = userProgress.get(progressKey) || createDefaultProgress(userId, section);

  // Update statistics
  progress.totalQuestions += session.questions.length;
  progress.sessionsCompleted += 1;
  progress.totalTimeSpent += (session.totalTime - session.timeRemaining);
  progress.lastPracticed = new Date().toISOString();

  // Calculate correct answers
  const correctCount = Object.values(session.scores).filter(score => score > 0).length;
  progress.correctAnswers += correctCount;

  // Update average score
  const totalSessions = progress.sessionsCompleted;
  progress.averageScore = ((progress.averageScore * (totalSessions - 1)) + averageScore) / totalSessions;

  // Analyze weak areas and generate recommendations
  progress.weakAreas = analyzeWeakAreas(session, averageScore);
  progress.recommendations = generateRecommendations(progress, section);

  userProgress.set(progressKey, progress);
}

function createDefaultProgress(userId: string, section: string): UserProgress {
  return {
    userId,
    section,
    totalQuestions: 0,
    correctAnswers: 0,
    averageScore: 0,
    lastPracticed: new Date().toISOString(),
    weakAreas: [],
    recommendations: [],
    sessionsCompleted: 0,
    totalTimeSpent: 0
  };
}

function analyzeWeakAreas(session: TestSession, averageScore: number): string[] {
  const weakAreas = [];

  if (averageScore < 70) {
    weakAreas.push('Overall comprehension');
  }

  // Analyze time management
  const timeUsed = session.totalTime - session.timeRemaining;
  const timePerQuestion = timeUsed / session.questions.length;
  
  if (timePerQuestion > 120) { // More than 2 minutes per question
    weakAreas.push('Time management');
  }

  // Section-specific analysis
  switch (session.section) {
    case 'reading':
      if (averageScore < 75) {
        weakAreas.push('Reading comprehension', 'Vocabulary');
      }
      break;
    case 'listening':
      if (averageScore < 75) {
        weakAreas.push('Listening comprehension', 'Note-taking');
      }
      break;
    case 'speaking':
      if (averageScore < 75) {
        weakAreas.push('Pronunciation', 'Fluency', 'Organization');
      }
      break;
    case 'writing':
      if (averageScore < 75) {
        weakAreas.push('Grammar', 'Vocabulary', 'Essay structure');
      }
      break;
  }

  return weakAreas;
}

function generateRecommendations(progress: UserProgress, section: string): string[] {
  const recommendations = [];

  // General recommendations based on performance
  if (progress.averageScore < 60) {
    recommendations.push('Focus on fundamental skills before attempting practice tests');
    recommendations.push('Review basic grammar and vocabulary');
  } else if (progress.averageScore < 80) {
    recommendations.push('Practice regularly with timed exercises');
    recommendations.push('Focus on weak areas identified in your sessions');
  } else {
    recommendations.push('Take full-length practice tests to maintain your level');
    recommendations.push('Focus on advanced strategies and time optimization');
  }

  // Section-specific recommendations
  switch (section) {
    case 'reading':
      recommendations.push('Practice skimming and scanning techniques');
      recommendations.push('Build academic vocabulary through reading');
      break;
    case 'listening':
      recommendations.push('Practice with various accents and speaking speeds');
      recommendations.push('Improve note-taking strategies');
      break;
    case 'speaking':
      recommendations.push('Record yourself speaking and analyze pronunciation');
      recommendations.push('Practice organizing responses with clear structure');
      break;
    case 'writing':
      recommendations.push('Study essay templates and practice timed writing');
      recommendations.push('Focus on grammar accuracy and sentence variety');
      break;
  }

  // Frequency-based recommendations
  const daysSinceLastPractice = Math.floor(
    (Date.now() - new Date(progress.lastPracticed).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastPractice > 3) {
    recommendations.push('Practice more frequently - aim for daily sessions');
  }

  return recommendations.slice(0, 5); // Limit to 5 recommendations
}