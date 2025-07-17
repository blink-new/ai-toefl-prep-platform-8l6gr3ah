import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: string;
  eventData: any;
  timestamp: string;
  sessionId?: string;
}

interface UserAnalytics {
  userId: string;
  totalSessions: number;
  totalQuestions: number;
  averageScore: number;
  timeSpent: number;
  lastActive: string;
  strongestSection: string;
  weakestSection: string;
  improvementRate: number;
  streakDays: number;
}

interface SectionAnalytics {
  section: string;
  totalAttempts: number;
  averageScore: number;
  averageTimePerQuestion: number;
  difficultyBreakdown: {
    easy: { attempts: number; averageScore: number };
    medium: { attempts: number; averageScore: number };
    hard: { attempts: number; averageScore: number };
  };
  commonMistakes: string[];
  improvementTrend: number[];
}

// In-memory storage (in production, this would be a database)
const analyticsEvents = new Map<string, AnalyticsEvent[]>();
const userAnalytics = new Map<string, UserAnalytics>();

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;

    // POST /events - Track analytics event
    if (method === 'POST' && path === '/events') {
      const { userId, eventType, eventData, sessionId } = await req.json();
      
      const event: AnalyticsEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        eventType,
        eventData,
        timestamp: new Date().toISOString(),
        sessionId
      };

      // Store event
      if (!analyticsEvents.has(userId)) {
        analyticsEvents.set(userId, []);
      }
      analyticsEvents.get(userId)!.push(event);

      // Update user analytics
      await updateUserAnalytics(userId, event);

      return new Response(JSON.stringify({ success: true, eventId: event.id }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // GET /analytics/:userId - Get user analytics
    if (method === 'GET' && path.startsWith('/analytics/')) {
      const userId = path.split('/')[2];
      const timeframe = url.searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, all
      
      const analytics = await getUserAnalytics(userId, timeframe);
      
      return new Response(JSON.stringify({ analytics }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // GET /analytics/:userId/sections - Get section-specific analytics
    if (method === 'GET' && path.includes('/sections')) {
      const userId = path.split('/')[2];
      const section = url.searchParams.get('section');
      const timeframe = url.searchParams.get('timeframe') || '30d';
      
      const sectionAnalytics = await getSectionAnalytics(userId, section, timeframe);
      
      return new Response(JSON.stringify({ analytics: sectionAnalytics }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // GET /analytics/:userId/progress - Get progress over time
    if (method === 'GET' && path.includes('/progress')) {
      const userId = path.split('/')[2];
      const section = url.searchParams.get('section');
      const timeframe = url.searchParams.get('timeframe') || '30d';
      
      const progressData = await getProgressOverTime(userId, section, timeframe);
      
      return new Response(JSON.stringify({ progress: progressData }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // GET /analytics/:userId/recommendations - Get personalized recommendations
    if (method === 'GET' && path.includes('/recommendations')) {
      const userId = path.split('/')[2];
      
      const recommendations = await getPersonalizedRecommendations(userId);
      
      return new Response(JSON.stringify({ recommendations }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // GET /analytics/:userId/dashboard - Get dashboard summary
    if (method === 'GET' && path.includes('/dashboard')) {
      const userId = path.split('/')[2];
      
      const dashboardData = await getDashboardSummary(userId);
      
      return new Response(JSON.stringify({ dashboard: dashboardData }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Error in analytics function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});

async function updateUserAnalytics(userId: string, event: AnalyticsEvent) {
  let analytics = userAnalytics.get(userId);
  
  if (!analytics) {
    analytics = {
      userId,
      totalSessions: 0,
      totalQuestions: 0,
      averageScore: 0,
      timeSpent: 0,
      lastActive: event.timestamp,
      strongestSection: 'reading',
      weakestSection: 'speaking',
      improvementRate: 0,
      streakDays: 1
    };
  }

  // Update based on event type
  switch (event.eventType) {
    case 'session_started':
      analytics.totalSessions++;
      break;
    case 'question_answered':
      analytics.totalQuestions++;
      if (event.eventData.score) {
        const currentTotal = analytics.averageScore * (analytics.totalQuestions - 1);
        analytics.averageScore = (currentTotal + event.eventData.score) / analytics.totalQuestions;
      }
      break;
    case 'time_spent':
      analytics.timeSpent += event.eventData.minutes || 0;
      break;
  }

  analytics.lastActive = event.timestamp;
  userAnalytics.set(userId, analytics);
}

async function getUserAnalytics(userId: string, timeframe: string): Promise<UserAnalytics | null> {
  const analytics = userAnalytics.get(userId);
  if (!analytics) return null;

  // Filter events by timeframe
  const events = analyticsEvents.get(userId) || [];
  const filteredEvents = filterEventsByTimeframe(events, timeframe);

  // Calculate analytics based on filtered events
  const calculatedAnalytics = calculateAnalyticsFromEvents(filteredEvents, analytics);
  
  return calculatedAnalytics;
}

async function getSectionAnalytics(userId: string, section: string | null, timeframe: string): Promise<SectionAnalytics[]> {
  const events = analyticsEvents.get(userId) || [];
  const filteredEvents = filterEventsByTimeframe(events, timeframe);

  const sections = section ? [section] : ['reading', 'listening', 'speaking', 'writing'];
  
  return sections.map(sec => {
    const sectionEvents = filteredEvents.filter(e => 
      e.eventData.section === sec || e.eventType.includes(sec)
    );

    return {
      section: sec,
      totalAttempts: sectionEvents.filter(e => e.eventType === 'question_answered').length,
      averageScore: calculateAverageScore(sectionEvents),
      averageTimePerQuestion: calculateAverageTime(sectionEvents),
      difficultyBreakdown: calculateDifficultyBreakdown(sectionEvents),
      commonMistakes: identifyCommonMistakes(sectionEvents),
      improvementTrend: calculateImprovementTrend(sectionEvents)
    };
  });
}

async function getProgressOverTime(userId: string, section: string | null, timeframe: string) {
  const events = analyticsEvents.get(userId) || [];
  const filteredEvents = filterEventsByTimeframe(events, timeframe);

  // Group events by day/week based on timeframe
  const groupedData = groupEventsByPeriod(filteredEvents, timeframe);
  
  return groupedData.map(group => ({
    date: group.date,
    averageScore: calculateAverageScore(group.events),
    questionsAnswered: group.events.filter(e => e.eventType === 'question_answered').length,
    timeSpent: group.events.reduce((sum, e) => sum + (e.eventData.timeSpent || 0), 0),
    section: section || 'all'
  }));
}

async function getPersonalizedRecommendations(userId: string): Promise<string[]> {
  const analytics = userAnalytics.get(userId);
  const events = analyticsEvents.get(userId) || [];
  
  const recommendations = [];

  if (!analytics) {
    return ['Start with a practice session to get personalized recommendations'];
  }

  // Score-based recommendations
  if (analytics.averageScore < 60) {
    recommendations.push('Focus on fundamental concepts before attempting practice tests');
    recommendations.push('Review basic grammar and vocabulary');
  } else if (analytics.averageScore < 80) {
    recommendations.push('Practice with timed exercises to improve speed and accuracy');
    recommendations.push('Focus on your weakest section: ' + analytics.weakestSection);
  } else {
    recommendations.push('Take full-length practice tests to maintain your high performance');
    recommendations.push('Focus on advanced strategies and time optimization');
  }

  // Activity-based recommendations
  const daysSinceLastActive = Math.floor(
    (Date.now() - new Date(analytics.lastActive).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastActive > 3) {
    recommendations.push('Practice more regularly - aim for daily sessions');
  }

  if (analytics.streakDays < 7) {
    recommendations.push('Build a consistent study habit - try to practice every day');
  }

  // Time-based recommendations
  if (analytics.timeSpent < 300) { // Less than 5 hours total
    recommendations.push('Increase your study time for better results');
  }

  return recommendations.slice(0, 5);
}

async function getDashboardSummary(userId: string) {
  const analytics = userAnalytics.get(userId);
  const events = analyticsEvents.get(userId) || [];
  
  if (!analytics) {
    return {
      totalSessions: 0,
      totalQuestions: 0,
      averageScore: 0,
      timeSpent: 0,
      streakDays: 0,
      recentActivity: [],
      sectionScores: {},
      weeklyProgress: []
    };
  }

  // Recent activity (last 10 events)
  const recentActivity = events
    .filter(e => e.eventType === 'session_completed')
    .slice(-10)
    .map(e => ({
      date: e.timestamp,
      section: e.eventData.section,
      score: e.eventData.score,
      questionsAnswered: e.eventData.questionsAnswered
    }));

  // Section scores
  const sectionScores = ['reading', 'listening', 'speaking', 'writing'].reduce((acc, section) => {
    const sectionEvents = events.filter(e => e.eventData.section === section);
    acc[section] = calculateAverageScore(sectionEvents);
    return acc;
  }, {} as Record<string, number>);

  // Weekly progress (last 7 days)
  const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayEvents = events.filter(e => {
      const eventDate = new Date(e.timestamp);
      return eventDate.toDateString() === date.toDateString();
    });
    
    return {
      date: date.toISOString().split('T')[0],
      questionsAnswered: dayEvents.filter(e => e.eventType === 'question_answered').length,
      averageScore: calculateAverageScore(dayEvents),
      timeSpent: dayEvents.reduce((sum, e) => sum + (e.eventData.timeSpent || 0), 0)
    };
  }).reverse();

  return {
    totalSessions: analytics.totalSessions,
    totalQuestions: analytics.totalQuestions,
    averageScore: Math.round(analytics.averageScore),
    timeSpent: analytics.timeSpent,
    streakDays: analytics.streakDays,
    recentActivity,
    sectionScores,
    weeklyProgress
  };
}

// Helper functions
function filterEventsByTimeframe(events: AnalyticsEvent[], timeframe: string): AnalyticsEvent[] {
  const now = new Date();
  let cutoffDate = new Date();

  switch (timeframe) {
    case '7d':
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      cutoffDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      cutoffDate.setDate(now.getDate() - 90);
      break;
    case 'all':
      cutoffDate = new Date(0);
      break;
  }

  return events.filter(e => new Date(e.timestamp) >= cutoffDate);
}

function calculateAnalyticsFromEvents(events: AnalyticsEvent[], baseAnalytics: UserAnalytics): UserAnalytics {
  const questionEvents = events.filter(e => e.eventType === 'question_answered');
  const sessionEvents = events.filter(e => e.eventType === 'session_completed');

  return {
    ...baseAnalytics,
    totalSessions: sessionEvents.length,
    totalQuestions: questionEvents.length,
    averageScore: calculateAverageScore(questionEvents),
    timeSpent: events.reduce((sum, e) => sum + (e.eventData.timeSpent || 0), 0)
  };
}

function calculateAverageScore(events: AnalyticsEvent[]): number {
  const scoreEvents = events.filter(e => e.eventData.score !== undefined);
  if (scoreEvents.length === 0) return 0;
  
  const totalScore = scoreEvents.reduce((sum, e) => sum + e.eventData.score, 0);
  return Math.round(totalScore / scoreEvents.length);
}

function calculateAverageTime(events: AnalyticsEvent[]): number {
  const timeEvents = events.filter(e => e.eventData.timeSpent !== undefined);
  if (timeEvents.length === 0) return 0;
  
  const totalTime = timeEvents.reduce((sum, e) => sum + e.eventData.timeSpent, 0);
  return Math.round(totalTime / timeEvents.length);
}

function calculateDifficultyBreakdown(events: AnalyticsEvent[]) {
  const difficulties = ['easy', 'medium', 'hard'];
  
  return difficulties.reduce((acc, difficulty) => {
    const difficultyEvents = events.filter(e => e.eventData.difficulty === difficulty);
    acc[difficulty] = {
      attempts: difficultyEvents.length,
      averageScore: calculateAverageScore(difficultyEvents)
    };
    return acc;
  }, {} as any);
}

function identifyCommonMistakes(events: AnalyticsEvent[]): string[] {
  // Mock implementation - in real app, this would analyze incorrect answers
  const mistakes = [
    'Misunderstanding main ideas',
    'Vocabulary gaps',
    'Time management issues',
    'Grammar errors',
    'Pronunciation difficulties'
  ];
  
  return mistakes.slice(0, 3);
}

function calculateImprovementTrend(events: AnalyticsEvent[]): number[] {
  // Group events by week and calculate average scores
  const weeklyScores = [];
  const weeks = 4; // Last 4 weeks
  
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    
    const weekEvents = events.filter(e => {
      const eventDate = new Date(e.timestamp);
      return eventDate >= weekStart && eventDate < weekEnd;
    });
    
    weeklyScores.unshift(calculateAverageScore(weekEvents));
  }
  
  return weeklyScores;
}

function groupEventsByPeriod(events: AnalyticsEvent[], timeframe: string) {
  const grouped = new Map<string, AnalyticsEvent[]>();
  
  events.forEach(event => {
    const date = new Date(event.timestamp);
    let key: string;
    
    if (timeframe === '7d') {
      key = date.toISOString().split('T')[0]; // Daily
    } else {
      // Weekly grouping for longer timeframes
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(event);
  });
  
  return Array.from(grouped.entries()).map(([date, events]) => ({
    date,
    events
  }));
}