import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface Subscription {
  id: string;
  userId: string;
  status: 'active' | 'inactive' | 'trial' | 'cancelled' | 'expired';
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  paypalSubscriptionId?: string;
  trialEndDate?: string;
  autoRenew: boolean;
}

interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  trialDays: number;
}

// Available subscription plans
const plans: PaymentPlan[] = [
  {
    id: 'toefl_monthly',
    name: 'TOEFL Prep Monthly',
    description: 'Full access to all TOEFL preparation materials',
    amount: 10.00,
    currency: 'USD',
    interval: 'monthly',
    features: [
      'Unlimited practice questions',
      'AI-powered grading and feedback',
      'Full-length practice tests',
      'Progress tracking and analytics',
      'Speaking practice with voice recording',
      'Writing practice with detailed feedback',
      'Mobile app access'
    ],
    trialDays: 7
  },
  {
    id: 'toefl_yearly',
    name: 'TOEFL Prep Yearly',
    description: 'Full access with 2 months free',
    amount: 100.00,
    currency: 'USD',
    interval: 'yearly',
    features: [
      'All monthly plan features',
      '2 months free (save $20)',
      'Priority customer support',
      'Advanced analytics',
      'Personalized study plans'
    ],
    trialDays: 14
  }
];

// In-memory storage (in production, this would be a database)
const subscriptions = new Map<string, Subscription>();
const userSubscriptions = new Map<string, string>(); // userId -> subscriptionId

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

    // GET /plans - Get available subscription plans
    if (method === 'GET' && path === '/plans') {
      return new Response(JSON.stringify({ plans }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // POST /subscribe - Create subscription (PayPal integration)
    if (method === 'POST' && path === '/subscribe') {
      const { userId, planId, paypalOrderId } = await req.json();
      
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        return new Response(JSON.stringify({ error: 'Invalid plan' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // In a real implementation, verify PayPal payment here
      const verified = await verifyPayPalPayment(paypalOrderId);
      if (!verified) {
        return new Response(JSON.stringify({ error: 'Payment verification failed' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startDate = new Date();
      const endDate = new Date();
      
      if (plan.interval === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscription: Subscription = {
        id: subscriptionId,
        userId,
        status: 'active',
        planId: plan.id,
        planName: plan.name,
        amount: plan.amount,
        currency: plan.currency,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        paypalSubscriptionId: paypalOrderId,
        autoRenew: true
      };

      subscriptions.set(subscriptionId, subscription);
      userSubscriptions.set(userId, subscriptionId);

      return new Response(JSON.stringify({ 
        success: true, 
        subscription,
        message: 'Subscription created successfully'
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // GET /subscription/:userId - Get user's subscription
    if (method === 'GET' && path.startsWith('/subscription/')) {
      const userId = path.split('/')[2];
      const subscriptionId = userSubscriptions.get(userId);
      
      if (!subscriptionId) {
        return new Response(JSON.stringify({ 
          subscription: null,
          status: 'no_subscription'
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const subscription = subscriptions.get(subscriptionId);
      if (!subscription) {
        return new Response(JSON.stringify({ 
          subscription: null,
          status: 'subscription_not_found'
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Check if subscription is expired
      const now = new Date();
      const endDate = new Date(subscription.endDate);
      
      if (now > endDate && subscription.status === 'active') {
        subscription.status = 'expired';
        subscriptions.set(subscriptionId, subscription);
      }

      return new Response(JSON.stringify({ 
        subscription,
        isActive: subscription.status === 'active' && now <= endDate
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // POST /subscription/:userId/cancel - Cancel subscription
    if (method === 'POST' && path.includes('/cancel')) {
      const userId = path.split('/')[2];
      const subscriptionId = userSubscriptions.get(userId);
      
      if (!subscriptionId) {
        return new Response(JSON.stringify({ error: 'No active subscription found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const subscription = subscriptions.get(subscriptionId);
      if (!subscription) {
        return new Response(JSON.stringify({ error: 'Subscription not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Cancel with PayPal (in real implementation)
      if (subscription.paypalSubscriptionId) {
        await cancelPayPalSubscription(subscription.paypalSubscriptionId);
      }

      subscription.status = 'cancelled';
      subscription.autoRenew = false;
      subscriptions.set(subscriptionId, subscription);

      return new Response(JSON.stringify({ 
        success: true,
        subscription,
        message: 'Subscription cancelled successfully'
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // POST /subscription/:userId/reactivate - Reactivate subscription
    if (method === 'POST' && path.includes('/reactivate')) {
      const userId = path.split('/')[2];
      const { paypalOrderId } = await req.json();
      
      const subscriptionId = userSubscriptions.get(userId);
      if (!subscriptionId) {
        return new Response(JSON.stringify({ error: 'No subscription found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const subscription = subscriptions.get(subscriptionId);
      if (!subscription) {
        return new Response(JSON.stringify({ error: 'Subscription not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Verify new payment
      const verified = await verifyPayPalPayment(paypalOrderId);
      if (!verified) {
        return new Response(JSON.stringify({ error: 'Payment verification failed' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Reactivate subscription
      subscription.status = 'active';
      subscription.autoRenew = true;
      subscription.paypalSubscriptionId = paypalOrderId;
      
      // Extend end date
      const plan = plans.find(p => p.id === subscription.planId);
      if (plan) {
        const newEndDate = new Date();
        if (plan.interval === 'monthly') {
          newEndDate.setMonth(newEndDate.getMonth() + 1);
        } else {
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        }
        subscription.endDate = newEndDate.toISOString();
      }

      subscriptions.set(subscriptionId, subscription);

      return new Response(JSON.stringify({ 
        success: true,
        subscription,
        message: 'Subscription reactivated successfully'
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // POST /webhook/paypal - Handle PayPal webhooks
    if (method === 'POST' && path === '/webhook/paypal') {
      const webhookData = await req.json();
      
      // Handle different PayPal webhook events
      switch (webhookData.event_type) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await handleSubscriptionActivated(webhookData);
          break;
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await handleSubscriptionCancelled(webhookData);
          break;
        case 'BILLING.SUBSCRIPTION.EXPIRED':
          await handleSubscriptionExpired(webhookData);
          break;
        case 'PAYMENT.SALE.COMPLETED':
          await handlePaymentCompleted(webhookData);
          break;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // GET /subscription/:userId/usage - Get usage statistics
    if (method === 'GET' && path.includes('/usage')) {
      const userId = path.split('/')[2];
      
      // Mock usage data - in real implementation, this would come from database
      const usage = {
        questionsAttempted: Math.floor(Math.random() * 500) + 100,
        practiceTestsTaken: Math.floor(Math.random() * 20) + 5,
        studyTimeMinutes: Math.floor(Math.random() * 3000) + 500,
        currentStreak: Math.floor(Math.random() * 30) + 1,
        monthlyLimit: 1000,
        remainingQuestions: 1000 - (Math.floor(Math.random() * 500) + 100)
      };

      return new Response(JSON.stringify({ usage }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Error in payments function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});

// PayPal integration functions (mock implementations)
async function verifyPayPalPayment(orderId: string): Promise<boolean> {
  // In real implementation, this would verify the payment with PayPal API
  console.log(`Verifying PayPal payment: ${orderId}`);
  return true; // Mock success
}

async function cancelPayPalSubscription(subscriptionId: string): Promise<boolean> {
  // In real implementation, this would cancel the subscription with PayPal API
  console.log(`Cancelling PayPal subscription: ${subscriptionId}`);
  return true; // Mock success
}

// Webhook handlers
async function handleSubscriptionActivated(webhookData: any) {
  console.log('Subscription activated:', webhookData);
  // Update subscription status in database
}

async function handleSubscriptionCancelled(webhookData: any) {
  console.log('Subscription cancelled:', webhookData);
  // Update subscription status in database
}

async function handleSubscriptionExpired(webhookData: any) {
  console.log('Subscription expired:', webhookData);
  // Update subscription status in database
}

async function handlePaymentCompleted(webhookData: any) {
  console.log('Payment completed:', webhookData);
  // Process successful payment
}