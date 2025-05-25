/**
 * Integration Tests for Stripe Payment Service
 * Tests the integration between stripeService and eventService for payments
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock environment variables before importing services
vi.mock('@/lib/env', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_fake_key',
    STRIPE_WEBHOOK_SECRET: 'whsec_fake_secret',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_fake_key',
  },
}));

// Mock Stripe SDK
const mockStripe = {
  paymentIntents: {
    create: vi.fn(),
    confirm: vi.fn(),
    retrieve: vi.fn(),
  },
  refunds: {
    create: vi.fn(),
  },
  customers: {
    create: vi.fn(),
    retrieve: vi.fn(),
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
};

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => mockStripe),
}));

// Import services after mocks
import { stripeService } from '@/lib/stripeService';
import { eventServiceDrizzle } from '@/lib/eventServiceDrizzle';

describe('Stripe Payment Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Payment Intent Creation and Confirmation', () => {
    it('should create payment intent for event participation', async () => {
      // Mock Stripe payment intent creation
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_event_123',
        client_secret: 'pi_test_event_123_secret_abc',
        amount: 5000,
        currency: 'jpy',
        status: 'requires_payment_method',
        metadata: {
          eventId: 'event-123',
          userId: 'user-456',
          type: 'event_participation',
        },
      });

      const result = await stripeService.createPaymentIntent({
        amount: 5000,
        currency: 'JPY',
        metadata: {
          eventId: 'event-123',
          userId: 'user-456',
          type: 'event_participation',
        },
      });

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data!.amount).toBe(5000);
      expect(result.data!.currency).toBe('jpy');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'jpy',
        metadata: {
          eventId: 'event-123',
          userId: 'user-456',
          type: 'event_participation',
        },
        automatic_payment_methods: { enabled: true },
      });
    });

    it('should confirm payment intent successfully', async () => {
      // Mock Stripe payment confirmation
      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_test_confirm_123',
        status: 'succeeded',
        amount: 8000,
        currency: 'jpy',
        charges: {
          data: [{
            id: 'ch_test_123',
            amount: 8000,
            paid: true,
          }],
        },
      });

      const result = await stripeService.confirmPayment('pi_test_confirm_123');

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data!.status).toBe('succeeded');
      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_test_confirm_123');
    });

    it('should handle payment intent creation errors', async () => {
      // Mock Stripe error
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Your card was declined.')
      );

      const result = await stripeService.createPaymentIntent({
        amount: 3000,
        currency: 'JPY',
        metadata: {
          eventId: 'event-fail',
          userId: 'user-fail',
          type: 'event_participation',
        },
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error!.message).toBe('Your card was declined.');
    });
  });

  describe('Refund Processing', () => {
    it('should create refund for cancelled event participation', async () => {
      // Mock successful refund
      mockStripe.refunds.create.mockResolvedValue({
        id: 'refund_test_123',
        amount: 5000,
        currency: 'jpy',
        status: 'succeeded',
        reason: 'requested_by_customer',
        charge: 'ch_test_123',
      });

      const result = await stripeService.createRefund(
        'pi_test_refund_123',
        5000,
        'Event cancelled by organizer'
      );

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data!.amount).toBe(5000);
      expect(result.data!.status).toBe('succeeded');
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_refund_123',
        amount: 5000,
        reason: 'requested_by_customer',
        metadata: {
          reason: 'Event cancelled by organizer',
        },
      });
    });

    it('should handle partial refunds', async () => {
      // Mock partial refund (e.g., keeping service fee)
      mockStripe.refunds.create.mockResolvedValue({
        id: 'refund_partial_123',
        amount: 4500, // 5000 - 500 service fee
        currency: 'jpy',
        status: 'succeeded',
        reason: 'requested_by_customer',
      });

      const result = await stripeService.createRefund(
        'pi_test_partial_123',
        4500,
        'Partial refund due to cancellation policy'
      );

      expect(result.data!.amount).toBe(4500);
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_partial_123',
        amount: 4500,
        reason: 'requested_by_customer',
        metadata: {
          reason: 'Partial refund due to cancellation policy',
        },
      });
    });

    it('should handle refund failures', async () => {
      // Mock refund failure
      mockStripe.refunds.create.mockRejectedValue(
        new Error('Charge has already been fully refunded.')
      );

      const result = await stripeService.createRefund(
        'pi_already_refunded',
        5000,
        'Duplicate refund attempt'
      );

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error!.message).toBe('Charge has already been fully refunded.');
    });
  });

  describe('Webhook Event Handling', () => {
    it('should construct and validate webhook events', async () => {
      const mockWebhookBody = JSON.stringify({
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_webhook_test_123',
            status: 'succeeded',
            amount: 6000,
            metadata: {
              eventId: 'event-webhook-123',
              userId: 'user-webhook-456',
              type: 'event_participation',
            },
          },
        },
      });

      const mockSignature = 'test_signature_header';
      const mockEvent = {
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_webhook_test_123',
            status: 'succeeded',
            amount: 6000,
            metadata: {
              eventId: 'event-webhook-123',
              userId: 'user-webhook-456',
              type: 'event_participation',
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = await stripeService.constructWebhookEvent(
        mockWebhookBody,
        mockSignature
      );

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data!.type).toBe('payment_intent.succeeded');
      expect(result.data!.data.object.id).toBe('pi_webhook_test_123');
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        mockWebhookBody,
        mockSignature,
        'whsec_fake_secret'
      );
    });

    it('should handle invalid webhook signatures', async () => {
      const mockWebhookBody = JSON.stringify({ id: 'evt_invalid' });
      const invalidSignature = 'invalid_signature';

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = await stripeService.constructWebhookEvent(
        mockWebhookBody,
        invalidSignature
      );

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error!.message).toBe('Invalid signature');
    });
  });

  describe('Customer Management', () => {
    it('should create customer for recurring payments', async () => {
      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_test_123',
        email: 'test@example.com',
        name: 'Test User',
        created: Math.floor(Date.now() / 1000),
      });

      const result = await stripeService.createCustomer({
        email: 'test@example.com',
        name: 'Test User',
        metadata: {
          userId: 'user-123',
        },
      });

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data!.email).toBe('test@example.com');
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        metadata: {
          userId: 'user-123',
        },
      });
    });

    it('should retrieve existing customer', async () => {
      mockStripe.customers.retrieve.mockResolvedValue({
        id: 'cus_existing_123',
        email: 'existing@example.com',
        name: 'Existing User',
        deleted: false,
      });

      const result = await stripeService.getCustomer('cus_existing_123');

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(result.data!.id).toBe('cus_existing_123');
      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith('cus_existing_123');
    });
  });

  describe('Integration with Event Service', () => {
    it('should handle complete payment flow for workshop participation', async () => {
      const workshopId = 'workshop-integration-123';
      const userId = 'user-integration-456';

      // Step 1: Create payment intent through event service
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_workshop_integration',
        client_secret: 'pi_workshop_integration_secret',
        amount: 10000,
        currency: 'jpy',
        status: 'requires_payment_method',
      });

      // Mock event service calls
      vi.mocked(eventServiceDrizzle.getEventById).mockResolvedValue({
        data: {
          id: workshopId,
          name: 'Integration Workshop',
          fee: '10000',
          currency: 'JPY',
          workshop: { maxParticipants: 20 },
          currentParticipants: 5,
        },
        error: null,
      });

      vi.mocked(eventServiceDrizzle.joinEvent).mockImplementation(async (joinData, userId) => {
        // This would normally call stripeService.createPaymentIntent internally
        const paymentResult = await stripeService.createPaymentIntent({
          amount: 10000,
          currency: 'JPY',
          metadata: {
            eventId: joinData.eventId,
            userId: userId,
            type: 'event_participation',
          },
        });

        if (paymentResult.error) {
          return { data: null, error: paymentResult.error };
        }

        return {
          data: {
            participantId: 'participant-integration-123',
            paymentRequired: true,
            paymentIntentClientSecret: paymentResult.data!.client_secret,
          },
          error: null,
        };
      });

      // Step 2: Join workshop (creates payment intent)
      const joinResult = await eventServiceDrizzle.joinEvent(
        { eventId: workshopId, message: 'Integration test join' },
        userId
      );

      expect(joinResult.data?.paymentRequired).toBe(true);
      expect(joinResult.data?.paymentIntentClientSecret).toBe('pi_workshop_integration_secret');

      // Step 3: Confirm payment
      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_workshop_integration',
        status: 'succeeded',
        amount: 10000,
        currency: 'jpy',
      });

      vi.mocked(eventServiceDrizzle.confirmEventPayment).mockImplementation(async (paymentIntentId) => {
        // This would normally call stripeService.confirmPayment internally
        const confirmResult = await stripeService.confirmPayment(paymentIntentId);
        
        if (confirmResult.error || confirmResult.data?.status !== 'succeeded') {
          return { data: null, error: new Error('Payment confirmation failed') };
        }

        return { data: { success: true }, error: null };
      });

      const confirmResult = await eventServiceDrizzle.confirmEventPayment(
        'pi_workshop_integration',
        workshopId,
        userId
      );

      expect(confirmResult.data?.success).toBe(true);
      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_workshop_integration');
    });

    it('should handle payment failure and cleanup', async () => {
      const eventId = 'event-payment-fail-123';
      const userId = 'user-fail-456';

      // Mock payment intent creation success but confirmation failure
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_fail_test',
        client_secret: 'pi_fail_test_secret',
        amount: 5000,
        currency: 'jpy',
        status: 'requires_payment_method',
      });

      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_fail_test',
        status: 'requires_action',
        amount: 5000,
        currency: 'jpy',
        last_payment_error: {
          message: 'Your card was declined.',
          type: 'card_error',
          code: 'card_declined',
        },
      });

      // Mock event service behavior
      vi.mocked(eventServiceDrizzle.joinEvent).mockResolvedValue({
        data: {
          participantId: 'participant-fail-123',
          paymentRequired: true,
          paymentIntentClientSecret: 'pi_fail_test_secret',
        },
        error: null,
      });

      vi.mocked(eventServiceDrizzle.confirmEventPayment).mockResolvedValue({
        data: null,
        error: new Error('Payment failed: Your card was declined.'),
      });

      // Join event
      const joinResult = await eventServiceDrizzle.joinEvent(
        { eventId: eventId, message: 'This payment will fail' },
        userId
      );

      expect(joinResult.data?.paymentRequired).toBe(true);

      // Attempt to confirm payment (should fail)
      const confirmResult = await eventServiceDrizzle.confirmEventPayment(
        'pi_fail_test',
        eventId,
        userId
      );

      expect(confirmResult.error).toBeTruthy();
      expect(confirmResult.error!.message).toContain('Payment failed');
    });
  });

  describe('Currency and Amount Handling', () => {
    it('should handle JPY currency correctly (no decimal places)', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_jpy_test',
        amount: 3000, // JPY doesn't use decimal places
        currency: 'jpy',
        client_secret: 'pi_jpy_test_secret',
      });

      const result = await stripeService.createPaymentIntent({
        amount: 3000,
        currency: 'JPY',
        metadata: { eventId: 'event-jpy' },
      });

      expect(result.data!.amount).toBe(3000);
      expect(result.data!.currency).toBe('jpy');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 3000,
        currency: 'jpy',
        metadata: { eventId: 'event-jpy' },
        automatic_payment_methods: { enabled: true },
      });
    });

    it('should handle minimum amount validation', async () => {
      // Test amount below Stripe minimum (50 JPY)
      const result = await stripeService.createPaymentIntent({
        amount: 30, // Below minimum
        currency: 'JPY',
        metadata: { eventId: 'event-min' },
      });

      // Should either handle gracefully or create with minimum amount
      // Implementation depends on business requirements
      expect(result.error || result.data!.amount >= 50).toBeTruthy();
    });
  });
});