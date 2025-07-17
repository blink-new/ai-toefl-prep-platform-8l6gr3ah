import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface GradingRequest {
  questionId: string;
  questionType: 'reading' | 'listening' | 'speaking' | 'writing';
  userAnswer: string;
  correctAnswer?: string;
  audioUrl?: string;
  rubric?: any;
}

interface GradingResponse {
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  detailedAnalysis: {
    grammar?: number;
    vocabulary?: number;
    pronunciation?: number;
    fluency?: number;
    coherence?: number;
    taskResponse?: number;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const gradingRequest: GradingRequest = await req.json();
    const { questionType, userAnswer, correctAnswer, audioUrl } = gradingRequest;

    let gradingResult: GradingResponse;

    switch (questionType) {
      case 'reading':
      case 'listening':
        gradingResult = await gradeMultipleChoice(userAnswer, correctAnswer!);
        break;
      case 'speaking':
        gradingResult = await gradeSpeaking(audioUrl!);
        break;
      case 'writing':
        gradingResult = await gradeWriting(userAnswer);
        break;
      default:
        throw new Error('Invalid question type');
    }

    return new Response(JSON.stringify(gradingResult), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Error in AI grading:', error);
    return new Response(JSON.stringify({ error: 'Grading failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});

async function gradeMultipleChoice(userAnswer: string, correctAnswer: string): Promise<GradingResponse> {
  const isCorrect = userAnswer === correctAnswer;
  const score = isCorrect ? 10 : 0;
  
  return {
    score,
    maxScore: 10,
    percentage: isCorrect ? 100 : 0,
    feedback: isCorrect 
      ? "Excellent! You selected the correct answer." 
      : `Incorrect. The correct answer is: "${correctAnswer}". Review the passage carefully to understand why this is the best choice.`,
    strengths: isCorrect ? ["Accurate comprehension", "Good analytical skills"] : [],
    improvements: isCorrect ? [] : ["Reading comprehension", "Critical analysis", "Attention to detail"],
    detailedAnalysis: {
      taskResponse: isCorrect ? 100 : 0
    }
  };
}

async function gradeSpeaking(audioUrl: string): Promise<GradingResponse> {
  // In a real implementation, this would use speech recognition and AI analysis
  // For now, we'll simulate AI grading with realistic feedback
  
  const mockScores = {
    pronunciation: Math.floor(Math.random() * 30) + 70, // 70-100
    fluency: Math.floor(Math.random() * 30) + 65, // 65-95
    vocabulary: Math.floor(Math.random() * 25) + 70, // 70-95
    grammar: Math.floor(Math.random() * 25) + 70, // 70-95
    coherence: Math.floor(Math.random() * 20) + 75 // 75-95
  };

  const averageScore = Math.round(
    (mockScores.pronunciation + mockScores.fluency + mockScores.vocabulary + 
     mockScores.grammar + mockScores.coherence) / 5
  );

  const strengths = [];
  const improvements = [];

  if (mockScores.pronunciation >= 85) strengths.push("Clear pronunciation");
  else improvements.push("Work on pronunciation clarity");

  if (mockScores.fluency >= 80) strengths.push("Good speaking fluency");
  else improvements.push("Practice speaking more smoothly");

  if (mockScores.vocabulary >= 85) strengths.push("Rich vocabulary usage");
  else improvements.push("Expand vocabulary range");

  if (mockScores.grammar >= 85) strengths.push("Accurate grammar");
  else improvements.push("Review grammar structures");

  if (mockScores.coherence >= 85) strengths.push("Well-organized response");
  else improvements.push("Improve response organization");

  return {
    score: Math.round(averageScore * 0.3), // Convert to 30-point scale
    maxScore: 30,
    percentage: averageScore,
    feedback: generateSpeakingFeedback(averageScore, mockScores),
    strengths,
    improvements,
    detailedAnalysis: mockScores
  };
}

async function gradeWriting(userAnswer: string): Promise<GradingResponse> {
  // Simulate AI analysis of writing
  const wordCount = userAnswer.split(/\s+/).length;
  const sentences = userAnswer.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const scores = {
    taskResponse: Math.min(100, Math.max(60, 70 + (wordCount > 150 ? 20 : 0))),
    coherence: Math.min(100, Math.max(65, 75 + (sentences.length > 3 ? 15 : 0))),
    vocabulary: Math.min(100, Math.max(70, 80 + (wordCount > 200 ? 10 : 0))),
    grammar: Math.min(100, Math.max(65, 75 + Math.floor(Math.random() * 20)))
  };

  const averageScore = Math.round(
    (scores.taskResponse + scores.coherence + scores.vocabulary + scores.grammar) / 4
  );

  const strengths = [];
  const improvements = [];

  if (wordCount >= 250) strengths.push("Adequate length and development");
  else improvements.push("Develop ideas more fully with more details");

  if (scores.coherence >= 80) strengths.push("Good organization and flow");
  else improvements.push("Improve paragraph structure and transitions");

  if (scores.vocabulary >= 85) strengths.push("Varied vocabulary usage");
  else improvements.push("Use more sophisticated vocabulary");

  if (scores.grammar >= 80) strengths.push("Generally accurate grammar");
  else improvements.push("Review grammar and sentence structures");

  return {
    score: Math.round(averageScore * 0.3), // Convert to 30-point scale
    maxScore: 30,
    percentage: averageScore,
    feedback: generateWritingFeedback(averageScore, scores, wordCount),
    strengths,
    improvements,
    detailedAnalysis: scores
  };
}

function generateSpeakingFeedback(averageScore: number, scores: any): string {
  if (averageScore >= 90) {
    return "Excellent speaking performance! Your response demonstrates strong fluency, clear pronunciation, and effective communication. Continue practicing to maintain this high level.";
  } else if (averageScore >= 80) {
    return "Good speaking performance with clear communication. Focus on the areas marked for improvement to reach the next level.";
  } else if (averageScore >= 70) {
    return "Satisfactory speaking performance. Your main ideas come through, but there's room for improvement in fluency and clarity.";
  } else {
    return "Your speaking needs significant improvement. Focus on pronunciation, fluency, and organizing your thoughts more clearly.";
  }
}

function generateWritingFeedback(averageScore: number, scores: any, wordCount: number): string {
  let feedback = "";
  
  if (averageScore >= 90) {
    feedback = "Excellent writing! Your essay demonstrates strong task response, clear organization, and sophisticated language use.";
  } else if (averageScore >= 80) {
    feedback = "Good writing with clear ideas and generally effective communication.";
  } else if (averageScore >= 70) {
    feedback = "Satisfactory writing that addresses the task with some effectiveness.";
  } else {
    feedback = "Your writing needs improvement in several areas.";
  }

  if (wordCount < 150) {
    feedback += " Your response is too short - aim for at least 250 words to fully develop your ideas.";
  } else if (wordCount > 400) {
    feedback += " Your response is quite long - focus on being more concise while maintaining depth.";
  }

  return feedback;
}