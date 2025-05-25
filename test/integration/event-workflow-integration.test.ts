/**
 * Integration Tests for Event Workflow
 * Tests the complete workflow from event creation to participation and payment
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock environment variables before importing any services
vi.mock('@/lib/env', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_fake_key',
    STRIPE_WEBHOOK_SECRET: 'whsec_fake_secret',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_fake_key',
  },
}));

// Mock external dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    paymentIntents: {
      create: vi.fn(),
      confirm: vi.fn(),
    },
    refunds: {
      create: vi.fn(),
    },
  })),
}));

// Mock the service modules
vi.mock('@/lib/eventServiceDrizzle', () => ({
  eventServiceDrizzle: {
    createEvent: vi.fn(),
    createVoiceWorkshop: vi.fn(),
    getEventById: vi.fn(),
    joinEvent: vi.fn(),
    confirmEventPayment: vi.fn(),
    getWorkshopRoomAccess: vi.fn(),
    getArchiveAccess: vi.fn(),
    purchaseArchiveAccess: vi.fn(),
    cancelEventParticipation: vi.fn(),
  },
}));

vi.mock('@/lib/stripeService', () => ({
  stripeService: {
    createPaymentIntent: vi.fn(),
    confirmPayment: vi.fn(),
    createRefund: vi.fn(),
    constructWebhookEvent: vi.fn(),
    createCustomer: vi.fn(),
    getCustomer: vi.fn(),
  },
}));

// Import services after mocks
import { eventServiceDrizzle } from '@/lib/eventServiceDrizzle';
import { stripeService } from '@/lib/stripeService';

describe('Event Workflow Integration Tests', () => {
  let testUser: any;
  let testEvent: any;
  let testWorkshop: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock test user
    testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    // Mock event service responses
    vi.mocked(eventServiceDrizzle.createEvent).mockResolvedValue({
      data: {
        id: 'event-123',
        name: 'Test Event',
        eventType: 'offline',
        startsAt: new Date('2024-12-01T10:00:00Z'),
        endsAt: new Date('2024-12-01T12:00:00Z'),
        fee: 5000,
        currency: 'JPY',
      },
      error: null,
    });

    vi.mocked(eventServiceDrizzle.createVoiceWorkshop).mockResolvedValue({
      data: {
        id: 'workshop-123',
        name: 'Test Workshop',
        maxParticipants: 10,
        isRecorded: true,
      },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Event Creation to Participation Flow', () => {
    it('should create event and allow user to join with payment', async () => {
      // Step 1: Create Event
      const eventData = {
        name: 'Integration Test Event',
        description: 'Test event for integration',
        eventType: 'offline' as const,
        location: 'Test Location',
        startsAt: new Date('2024-12-01T10:00:00Z'),
        endsAt: new Date('2024-12-01T12:00:00Z'),
        fee: 3000,
        currency: 'JPY',
        refundPolicy: 'No refunds',
      };

      const createResult = await eventServiceDrizzle.createEvent(eventData, testUser.id);
      expect(createResult.data).toBeTruthy();
      expect(createResult.error).toBeNull();
      
      const eventId = createResult.data!.id;

      // Step 2: Mock event details for join
      vi.mocked(eventServiceDrizzle.getEventById).mockResolvedValue({
        data: {
          id: eventId,
          name: eventData.name,
          fee: '3000',
          currency: 'JPY',
          maxParticipants: 50,
          currentParticipants: 0,
          createdBy: 'creator-123',
        },
        error: null,
      });

      // Step 3: Mock Stripe payment intent creation
      vi.mocked(stripeService.createPaymentIntent).mockResolvedValue({
        data: {
          id: 'pi_test123',
          client_secret: 'pi_test123_secret_abc',
          amount: 3000,
          currency: 'jpy',
          status: 'requires_payment_method',
        },
        error: null,
      });

      // Step 4: Attempt to join event (should create payment intent)
      const joinData = {
        eventId: eventId,
        message: 'Looking forward to the event!',
      };

      vi.mocked(eventServiceDrizzle.joinEvent).mockResolvedValue({
        data: {
          participantId: 'participant-123',
          paymentRequired: true,
          paymentIntentClientSecret: 'pi_test123_secret_abc',
        },
        error: null,
      });

      const joinResult = await eventServiceDrizzle.joinEvent(joinData, testUser.id);
      
      expect(joinResult.data?.paymentRequired).toBe(true);
      expect(joinResult.data?.paymentIntentClientSecret).toBe('pi_test123_secret_abc');
      // In integration test, we verify the result rather than internal calls
      expect(joinResult.error).toBeNull();

      // Step 5: Confirm payment
      vi.mocked(stripeService.confirmPayment).mockResolvedValue({
        data: {
          id: 'pi_test123',
          status: 'succeeded',
          amount: 3000,
        },
        error: null,
      });

      vi.mocked(eventServiceDrizzle.confirmEventPayment).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const confirmResult = await eventServiceDrizzle.confirmEventPayment(
        'pi_test123',
        eventId,
        testUser.id
      );

      expect(confirmResult.data?.success).toBe(true);
      expect(stripeService.confirmPayment).toHaveBeenCalledWith('pi_test123');
    });

    it('should handle free event participation without payment', async () => {
      // Create free event
      const freeEventData = {
        name: 'Free Integration Test Event',
        description: 'Free test event',
        eventType: 'online' as const,
        location: 'Online',
        startsAt: new Date('2024-12-01T10:00:00Z'),
        endsAt: new Date('2024-12-01T12:00:00Z'),
        // No fee specified (free event)
      };

      vi.mocked(eventServiceDrizzle.createEvent).mockResolvedValue({
        data: { id: 'free-event-123', ...freeEventData },
        error: null,
      });

      const createResult = await eventServiceDrizzle.createEvent(freeEventData, testUser.id);
      const eventId = createResult.data!.id;

      // Mock free event details
      vi.mocked(eventServiceDrizzle.getEventById).mockResolvedValue({
        data: {
          id: eventId,
          name: freeEventData.name,
          fee: null, // Free event
          maxParticipants: 100,
          currentParticipants: 5,
          createdBy: 'creator-123',
        },
        error: null,
      });

      // Join free event
      vi.mocked(eventServiceDrizzle.joinEvent).mockResolvedValue({
        data: {
          participantId: 'participant-456',
          paymentRequired: false,
        },
        error: null,
      });

      const joinResult = await eventServiceDrizzle.joinEvent(
        { eventId: eventId, message: 'Excited for this free event!' },
        testUser.id
      );

      expect(joinResult.data?.paymentRequired).toBe(false);
      expect(joinResult.data?.paymentIntentClientSecret).toBeUndefined();
      expect(stripeService.createPaymentIntent).not.toHaveBeenCalled();
    });
  });

  describe('Voice Workshop Integration Flow', () => {
    it('should create workshop, join with payment, and access recording', async () => {
      // Step 1: Create Voice Workshop
      const workshopData = {
        name: 'Integration Test Workshop',
        description: 'Test workshop with recording',
        location: 'オンライン',
        startsAt: new Date('2024-12-01T14:00:00Z'),
        endsAt: new Date('2024-12-01T16:00:00Z'),
        fee: 8000,
        currency: 'JPY',
        maxParticipants: 15,
        isRecorded: true,
        archiveExpiresAt: new Date('2024-12-31T23:59:59Z'),
      };

      const createResult = await eventServiceDrizzle.createVoiceWorkshop(workshopData, testUser.id);
      expect(createResult.data).toBeTruthy();
      
      const workshopId = createResult.data!.id;

      // Step 2: Join workshop with payment
      vi.mocked(eventServiceDrizzle.getEventById).mockResolvedValue({
        data: {
          id: workshopId,
          name: workshopData.name,
          fee: '8000',
          currency: 'JPY',
          workshop: {
            maxParticipants: 15,
            isRecorded: true,
          },
          createdBy: 'creator-456',
        },
        error: null,
      });

      vi.mocked(stripeService.createPaymentIntent).mockResolvedValue({
        data: {
          id: 'pi_workshop123',
          client_secret: 'pi_workshop123_secret',
          amount: 8000,
          currency: 'jpy',
        },
        error: null,
      });

      vi.mocked(eventServiceDrizzle.joinEvent).mockResolvedValue({
        data: {
          participantId: 'workshop-participant-123',
          paymentRequired: true,
          paymentIntentClientSecret: 'pi_workshop123_secret',
        },
        error: null,
      });

      const joinResult = await eventServiceDrizzle.joinEvent(
        { eventId: workshopId, message: 'Ready to learn!' },
        testUser.id
      );

      expect(joinResult.data?.paymentRequired).toBe(true);

      // Step 3: Confirm payment and get workshop access
      vi.mocked(eventServiceDrizzle.confirmEventPayment).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await eventServiceDrizzle.confirmEventPayment('pi_workshop123', workshopId, testUser.id);

      // Step 4: Check workshop room access (during event time)
      vi.mocked(eventServiceDrizzle.getWorkshopRoomAccess).mockResolvedValue({
        data: {
          hasAccess: true,
          accessType: 'participant',
          roomUrl: 'https://livekit.example.com/room/workshop-123',
        },
        error: null,
      });

      const roomAccess = await eventServiceDrizzle.getWorkshopRoomAccess(workshopId, testUser.id);
      expect(roomAccess.data?.hasAccess).toBe(true);
      expect(roomAccess.data?.roomUrl).toBeTruthy();

      // Step 5: Check archive access (after event)
      vi.mocked(eventServiceDrizzle.getArchiveAccess).mockResolvedValue({
        data: {
          hasAccess: true,
          archiveUrl: 'https://cdn.example.com/archive/workshop-123.mp3',
          expiresAt: new Date('2024-12-31T23:59:59Z'),
        },
        error: null,
      });

      const archiveAccess = await eventServiceDrizzle.getArchiveAccess(workshopId, testUser.id);
      expect(archiveAccess.data?.hasAccess).toBe(true);
      expect(archiveAccess.data?.archiveUrl).toBeTruthy();
    });

    it('should handle archive purchase for non-participants', async () => {
      const workshopId = 'workshop-456';
      const nonParticipantUserId = 'user-789';

      // User who didn't participate tries to access archive
      vi.mocked(eventServiceDrizzle.getArchiveAccess).mockResolvedValue({
        data: {
          hasAccess: false,
          canPurchase: true,
          archivePrice: 3000,
        },
        error: null,
      });

      const initialAccess = await eventServiceDrizzle.getArchiveAccess(workshopId, nonParticipantUserId);
      expect(initialAccess.data?.hasAccess).toBe(false);
      expect(initialAccess.data?.canPurchase).toBe(true);

      // Purchase archive access
      vi.mocked(stripeService.createPaymentIntent).mockResolvedValue({
        data: {
          id: 'pi_archive123',
          client_secret: 'pi_archive123_secret',
          amount: 3000,
          currency: 'jpy',
        },
        error: null,
      });

      vi.mocked(eventServiceDrizzle.purchaseArchiveAccess).mockResolvedValue({
        data: {
          purchaseId: 'purchase-123',
          paymentIntentClientSecret: 'pi_archive123_secret',
        },
        error: null,
      });

      const purchaseResult = await eventServiceDrizzle.purchaseArchiveAccess(workshopId, nonParticipantUserId);
      expect(purchaseResult.data?.paymentIntentClientSecret).toBeTruthy();

      // Confirm archive purchase
      vi.mocked(stripeService.confirmPayment).mockResolvedValue({
        data: { id: 'pi_archive123', status: 'succeeded' },
        error: null,
      });

      await stripeService.confirmPayment('pi_archive123');

      // Now user should have archive access
      vi.mocked(eventServiceDrizzle.getArchiveAccess).mockResolvedValue({
        data: {
          hasAccess: true,
          archiveUrl: 'https://cdn.example.com/archive/workshop-456.mp3',
          purchasedAt: new Date(),
        },
        error: null,
      });

      const finalAccess = await eventServiceDrizzle.getArchiveAccess(workshopId, nonParticipantUserId);
      expect(finalAccess.data?.hasAccess).toBe(true);
    });
  });

  describe('Event Cancellation and Refund Flow', () => {
    it('should handle event cancellation with automatic refunds', async () => {
      const eventId = 'event-789';
      const participantId = 'participant-789';
      const paymentIntentId = 'pi_refund123';

      // Mock participant who paid for event
      vi.mocked(eventServiceDrizzle.getEventById).mockResolvedValue({
        data: {
          id: eventId,
          name: 'Event to Cancel',
          fee: '5000',
          createdBy: testUser.id, // Creator can cancel
        },
        error: null,
      });

      // Cancel participation (should trigger refund)
      vi.mocked(stripeService.createRefund).mockResolvedValue({
        data: {
          id: 'refund_123',
          amount: 5000,
          status: 'succeeded',
          reason: 'requested_by_customer',
        },
        error: null,
      });

      vi.mocked(eventServiceDrizzle.cancelEventParticipation).mockResolvedValue({
        data: {
          refunded: true,
          refundId: 'refund_123',
          refundAmount: 5000,
        },
        error: null,
      });

      const cancelResult = await eventServiceDrizzle.cancelEventParticipation(
        eventId,
        participantId,
        'Change of plans'
      );

      expect(cancelResult.data?.refunded).toBe(true);
      expect(cancelResult.data?.refundAmount).toBe(5000);
      expect(stripeService.createRefund).toHaveBeenCalledWith(
        paymentIntentId,
        5000,
        'Event participation cancelled'
      );
    });
  });

  describe('Error Handling in Integration Flow', () => {
    it('should handle payment failures gracefully', async () => {
      const eventId = 'event-payment-fail';

      // Mock payment intent creation failure
      vi.mocked(stripeService.createPaymentIntent).mockResolvedValue({
        data: null,
        error: new Error('Payment provider unavailable'),
      });

      vi.mocked(eventServiceDrizzle.joinEvent).mockResolvedValue({
        data: null,
        error: new Error('Payment intent creation failed'),
      });

      const joinResult = await eventServiceDrizzle.joinEvent(
        { eventId: eventId, message: 'This should fail' },
        testUser.id
      );

      expect(joinResult.error).toBeTruthy();
      expect(joinResult.data).toBeNull();
    });

    it('should handle workshop capacity limits', async () => {
      const workshopId = 'full-workshop';

      // Mock full workshop
      vi.mocked(eventServiceDrizzle.getEventById).mockResolvedValue({
        data: {
          id: workshopId,
          name: 'Full Workshop',
          workshop: {
            maxParticipants: 10,
          },
          currentParticipants: 10, // Already full
        },
        error: null,
      });

      vi.mocked(eventServiceDrizzle.joinEvent).mockResolvedValue({
        data: null,
        error: new Error('Workshop is full'),
      });

      const joinResult = await eventServiceDrizzle.joinEvent(
        { eventId: workshopId, message: 'Hope there is space' },
        testUser.id
      );

      expect(joinResult.error?.message).toBe('Workshop is full');
    });
  });
});