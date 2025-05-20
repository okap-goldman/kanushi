import { supabase } from './supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string;
  location: string | null;
  location_details: {
    address?: string;
    latitude?: number;
    longitude?: number;
    place_id?: string;
    venue_name?: string;
  } | null;
  is_online: boolean;
  online_url: string | null;
  max_participants: number | null;
  price: number;
  currency: string;
  registration_deadline: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_published: boolean;
  is_cancelled: boolean;
  category: string | null;
  privacy_level: 'public' | 'friends' | 'private';
  refund_policy: string | null;
  event_hash: string;
  participant_count?: number;
  creator_profile?: {
    id: string;
    username: string;
    avatar_url?: string;
    display_name?: string;
  };
  user_participation_status?: 'attending' | 'interested' | 'declined' | null;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: 'attending' | 'interested' | 'declined';
  payment_status: 'paid' | 'pending' | 'refunded' | null;
  payment_amount: number | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    avatar_url?: string;
    display_name?: string;
  };
}

export interface EventCohost {
  id: string;
  event_id: string;
  user_id: string;
  permissions: string[];
  created_at: string;
  profile?: {
    username: string;
    avatar_url?: string;
    display_name?: string;
  };
}

export interface EventComment {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    avatar_url?: string;
    display_name?: string;
  };
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  location_details?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    place_id?: string;
    venue_name?: string;
  };
  is_online: boolean;
  online_url?: string;
  max_participants?: number;
  price?: number;
  currency?: string;
  registration_deadline?: string;
  cover_image_url?: string;
  is_published?: boolean;
  category?: string;
  privacy_level?: 'public' | 'friends' | 'private';
  refund_policy?: string;
}

export interface EventsFilter {
  search?: string;
  category?: string;
  is_online?: boolean;
  start_date?: string;
  end_date?: string;
  location?: string;
  price_range?: [number, number];
  attending_user_id?: string;
  created_by_user_id?: string;
  limit?: number;
  page?: number;
}

const generateEventHash = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

export const eventService = {
  // Create a new event
  async createEvent(eventData: CreateEventRequest): Promise<{ event: Event | null; error: PostgrestError | null }> {
    const user = supabase.auth.getUser();
    if (!user) {
      return { event: null, error: { message: 'User not authenticated', details: '', hint: '', code: '403' } };
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        created_by: (await user).data.user?.id,
        event_hash: generateEventHash()
      })
      .select()
      .single();

    return { event: data as Event, error };
  },

  // Get an event by ID
  async getEvent(eventId: string): Promise<{ event: Event | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        creator_profile:profiles(id, username, avatar_url, display_name),
        participant_count:event_participants(count)
      `)
      .eq('id', eventId)
      .single();

    // If successful, also check if the current user is participating
    if (data && !error) {
      const user = supabase.auth.getUser();
      if (user) {
        const { data: participationData } = await supabase
          .from('event_participants')
          .select('status')
          .eq('event_id', eventId)
          .eq('user_id', (await user).data.user?.id)
          .single();

        if (participationData) {
          (data as Event).user_participation_status = participationData.status as 'attending' | 'interested' | 'declined';
        }
      }
    }

    return { event: data as Event, error };
  },

  // Get an event by its unique hash
  async getEventByHash(eventHash: string): Promise<{ event: Event | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        creator_profile:profiles(id, username, avatar_url, display_name),
        participant_count:event_participants(count)
      `)
      .eq('event_hash', eventHash)
      .single();

    return { event: data as Event, error };
  },

  // Update an event
  async updateEvent(eventId: string, updates: Partial<CreateEventRequest>): Promise<{ event: Event | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    return { event: data as Event, error };
  },

  // Delete an event
  async deleteEvent(eventId: string): Promise<{ success: boolean; error: PostgrestError | null }> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    return { success: !error, error };
  },

  // Get a list of events
  async getEvents(filters: EventsFilter = {}): Promise<{ events: Event[]; count: number | null; error: PostgrestError | null }> {
    let query = supabase
      .from('events')
      .select(`
        *,
        creator_profile:profiles(id, username, avatar_url, display_name),
        participant_count:event_participants(count)
      `, { count: 'exact' });

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.is_online !== undefined) {
      query = query.eq('is_online', filters.is_online);
    }
    
    if (filters.start_date) {
      query = query.gte('start_datetime', filters.start_date);
    }
    
    if (filters.end_date) {
      query = query.lte('end_datetime', filters.end_date);
    }
    
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    
    if (filters.price_range) {
      query = query.gte('price', filters.price_range[0]).lte('price', filters.price_range[1]);
    }
    
    if (filters.attending_user_id) {
      query = query.eq('event_participants.user_id', filters.attending_user_id);
    }
    
    if (filters.created_by_user_id) {
      query = query.eq('created_by', filters.created_by_user_id);
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    
    query = query.order('start_datetime', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    return { events: data as Event[], count, error };
  },

  // Get upcoming events
  async getUpcomingEvents(limit: number = 10): Promise<{ events: Event[]; error: PostgrestError | null }> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        creator_profile:profiles(id, username, avatar_url, display_name),
        participant_count:event_participants(count)
      `)
      .gte('start_datetime', now)
      .eq('is_published', true)
      .eq('is_cancelled', false)
      .order('start_datetime', { ascending: true })
      .limit(limit);

    return { events: data as Event[], error };
  },

  // Get events by user (either created or participating)
  async getUserEvents(userId: string, type: 'created' | 'attending' | 'interested' = 'attending'): Promise<{ events: Event[]; error: PostgrestError | null }> {
    if (type === 'created') {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          creator_profile:profiles(id, username, avatar_url, display_name),
          participant_count:event_participants(count)
        `)
        .eq('created_by', userId)
        .order('start_datetime', { ascending: false });

      return { events: data as Event[], error };
    } else {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          creator_profile:profiles(id, username, avatar_url, display_name),
          participant_count:event_participants(count),
          event_participants!inner(status, user_id)
        `)
        .eq('event_participants.user_id', userId)
        .eq('event_participants.status', type)
        .order('start_datetime', { ascending: false });

      return { events: data as Event[], error };
    }
  },

  // Join an event
  async joinEvent(eventId: string, status: 'attending' | 'interested' = 'attending'): Promise<{ participation: EventParticipant | null; error: PostgrestError | null }> {
    const user = supabase.auth.getUser();
    if (!user) {
      return { participation: null, error: { message: 'User not authenticated', details: '', hint: '', code: '403' } };
    }

    const userId = (await user).data.user?.id;

    // Check if already participating
    const { data: existingParticipation } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (existingParticipation) {
      // Update existing participation
      const { data, error } = await supabase
        .from('event_participants')
        .update({ status })
        .eq('id', existingParticipation.id)
        .select()
        .single();

      return { participation: data as EventParticipant, error };
    } else {
      // Create new participation
      const { data, error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: userId,
          status
        })
        .select()
        .single();

      return { participation: data as EventParticipant, error };
    }
  },

  // Leave an event
  async leaveEvent(eventId: string): Promise<{ success: boolean; error: PostgrestError | null }> {
    const user = supabase.auth.getUser();
    if (!user) {
      return { success: false, error: { message: 'User not authenticated', details: '', hint: '', code: '403' } };
    }

    const { error } = await supabase
      .from('event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', (await user).data.user?.id);

    return { success: !error, error };
  },

  // Get event participants
  async getEventParticipants(eventId: string, status?: 'attending' | 'interested'): Promise<{ participants: EventParticipant[]; error: PostgrestError | null }> {
    let query = supabase
      .from('event_participants')
      .select(`
        *,
        profile:profiles(username, avatar_url, display_name)
      `)
      .eq('event_id', eventId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    return { participants: data as EventParticipant[], error };
  },

  // Add a co-host to an event
  async addEventCohost(eventId: string, userId: string, permissions: string[] = ['edit', 'manage_participants']): Promise<{ cohost: EventCohost | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from('event_cohosts')
      .insert({
        event_id: eventId,
        user_id: userId,
        permissions
      })
      .select()
      .single();

    return { cohost: data as EventCohost, error };
  },

  // Remove a co-host from an event
  async removeEventCohost(eventId: string, userId: string): Promise<{ success: boolean; error: PostgrestError | null }> {
    const { error } = await supabase
      .from('event_cohosts')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    return { success: !error, error };
  },

  // Get cohosts for an event
  async getEventCohosts(eventId: string): Promise<{ cohosts: EventCohost[]; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from('event_cohosts')
      .select(`
        *,
        profile:profiles(username, avatar_url, display_name)
      `)
      .eq('event_id', eventId);

    return { cohosts: data as EventCohost[], error };
  },

  // Add a comment to an event
  async addEventComment(eventId: string, content: string): Promise<{ comment: EventComment | null; error: PostgrestError | null }> {
    const user = supabase.auth.getUser();
    if (!user) {
      return { comment: null, error: { message: 'User not authenticated', details: '', hint: '', code: '403' } };
    }

    const { data, error } = await supabase
      .from('event_comments')
      .insert({
        event_id: eventId,
        user_id: (await user).data.user?.id,
        content
      })
      .select()
      .single();

    return { comment: data as EventComment, error };
  },

  // Get comments for an event
  async getEventComments(eventId: string): Promise<{ comments: EventComment[]; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from('event_comments')
      .select(`
        *,
        profile:profiles(username, avatar_url, display_name)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    return { comments: data as EventComment[], error };
  },

  // Get categories for events
  async getEventCategories(): Promise<{ categories: string[]; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from('event_tags')
      .select('name')
      .order('name', { ascending: true });

    return { 
      categories: data ? data.map(tag => tag.name) : [], 
      error 
    };
  }
};