import type { ApiResponse } from './data';
import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email?: string;
  bio?: string;
  image?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  location: string;
  capacity?: number;
  current_participants?: number;
  image_url?: string;
  organizer_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExtendedEvent extends Event {
  location_details?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    place_id?: string;
    venue_name?: string;
  } | null;
  is_online?: boolean;
  online_url?: string | null;
  max_participants?: number | null;
  price?: number;
  currency?: string;
  registration_deadline?: string | null;
  cover_image_url?: string | null;
  is_published?: boolean;
  is_cancelled?: boolean;
  category?: string | null;
  privacy_level?: 'public' | 'friends' | 'private';
  refund_policy?: string | null;
  event_hash?: string;
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
  start_date: string;
  end_date?: string;
  location?: string;
  location_details?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    place_id?: string;
    venue_name?: string;
  };
  is_online?: boolean;
  online_url?: string;
  max_participants?: number;
  price?: number;
  currency?: string;
  registration_deadline?: string;
  cover_image_url?: string;
  image_url?: string;
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
  async createEvent(eventData: CreateEventRequest): Promise<ApiResponse<ExtendedEvent>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          start_date: eventData.start_date,
          end_date: eventData.end_date,
          location: eventData.location,
          image_url: eventData.image_url || eventData.cover_image_url,
          organizer_id: user.id,
          // Extended fields if your schema supports them
          location_details: eventData.location_details,
          is_online: eventData.is_online,
          online_url: eventData.online_url,
          max_participants: eventData.max_participants,
          price: eventData.price,
          currency: eventData.currency,
          registration_deadline: eventData.registration_deadline,
          cover_image_url: eventData.cover_image_url,
          is_published: eventData.is_published !== false,
          category: eventData.category,
          privacy_level: eventData.privacy_level || 'public',
          refund_policy: eventData.refund_policy,
          event_hash: generateEventHash(),
        })
        .select()
        .single();

      if (error) throw error;

      return { data: data as ExtendedEvent, error: null };
    } catch (error) {
      console.error('Error creating event:', error);
      return { data: null, error: error as Error };
    }
  },

  // Get an event by ID
  async getEvent(eventId: string): Promise<ApiResponse<ExtendedEvent>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(id, username, image, name)
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;

      // Check if the current user is participating
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && data) {
        const { data: participationData } = await supabase
          .from('event_participants')
          .select('status')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .single();

        if (participationData) {
          (data as ExtendedEvent).user_participation_status = participationData.status as
            | 'attending'
            | 'interested'
            | 'declined';
        }
      }

      // Count participants
      const { count } = await supabase
        .from('event_participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'attending');

      const formattedEvent = {
        ...data,
        organizer: data.organizer || { id: '', name: 'Unknown', username: '' },
        attendees_count: count || 0,
        participant_count: count || 0,
      } as ExtendedEvent;

      return { data: formattedEvent, error: null };
    } catch (error) {
      console.error('Error fetching event:', error);
      return { data: null, error: error as Error };
    }
  },

  // Get an event by its unique hash
  async getEventByHash(eventHash: string): Promise<ApiResponse<ExtendedEvent>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(id, username, image, name)
        `)
        .eq('event_hash', eventHash)
        .single();

      if (error) throw error;

      return { data: data as ExtendedEvent, error: null };
    } catch (error) {
      console.error('Error fetching event by hash:', error);
      return { data: null, error: error as Error };
    }
  },

  // Update an event
  async updateEvent(
    eventId: string,
    updates: Partial<CreateEventRequest>
  ): Promise<ApiResponse<ExtendedEvent>> {
    try {
      const updateData: any = {};

      // Map fields that might have different names
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.start_date !== undefined) updateData.start_date = updates.start_date;
      if (updates.end_date !== undefined) updateData.end_date = updates.end_date;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.image_url !== undefined) updateData.image_url = updates.image_url;
      if (updates.cover_image_url !== undefined)
        updateData.cover_image_url = updates.cover_image_url;

      // Extended fields
      if (updates.location_details !== undefined)
        updateData.location_details = updates.location_details;
      if (updates.is_online !== undefined) updateData.is_online = updates.is_online;
      if (updates.online_url !== undefined) updateData.online_url = updates.online_url;
      if (updates.max_participants !== undefined)
        updateData.max_participants = updates.max_participants;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.currency !== undefined) updateData.currency = updates.currency;
      if (updates.registration_deadline !== undefined)
        updateData.registration_deadline = updates.registration_deadline;
      if (updates.is_published !== undefined) updateData.is_published = updates.is_published;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.privacy_level !== undefined) updateData.privacy_level = updates.privacy_level;
      if (updates.refund_policy !== undefined) updateData.refund_policy = updates.refund_policy;

      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as ExtendedEvent, error: null };
    } catch (error) {
      console.error('Error updating event:', error);
      return { data: null, error: error as Error };
    }
  },

  // Delete an event
  async deleteEvent(eventId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting event:', error);
      return { data: false, error: error as Error };
    }
  },

  // Get a list of events
  async getEvents(
    filters: EventsFilter = {}
  ): Promise<ApiResponse<{ events: ExtendedEvent[]; count: number | null }>> {
    try {
      let query = supabase.from('events').select(
        `
          *,
          organizer:profiles!events_organizer_id_fkey(id, username, image, name)
        `,
        { count: 'exact' }
      );

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
        query = query.gte('start_date', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('end_date', filters.end_date);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.price_range) {
        query = query.gte('price', filters.price_range[0]).lte('price', filters.price_range[1]);
      }

      if (filters.created_by_user_id) {
        query = query.eq('organizer_id', filters.created_by_user_id);
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      query = query.order('start_date', { ascending: true }).range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const formattedEvents = (data || []).map((event) => ({
        ...event,
        organizer: event.organizer || { id: '', name: 'Unknown', username: '' },
        attendees_count: 0,
      })) as ExtendedEvent[];

      return { data: { events: formattedEvents, count }, error: null };
    } catch (error) {
      console.error('Error fetching events:', error);
      return { data: null, error: error as Error };
    }
  },

  // Get upcoming events
  async getUpcomingEvents(limit = 10): Promise<ApiResponse<ExtendedEvent[]>> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(id, username, image, name)
        `)
        .gte('start_date', now)
        .order('start_date', { ascending: true })
        .limit(limit);

      if (error) throw error;

      const formattedEvents = (data || []).map((event) => ({
        ...event,
        organizer: event.organizer || { id: '', name: 'Unknown', username: '' },
        attendees_count: 0,
      })) as ExtendedEvent[];

      return { data: formattedEvents, error: null };
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return { data: null, error: error as Error };
    }
  },

  // Get events by user (either created or participating)
  async getUserEvents(
    userId: string,
    type: 'created' | 'attending' | 'interested' = 'attending'
  ): Promise<ApiResponse<ExtendedEvent[]>> {
    try {
      if (type === 'created') {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            organizer:profiles!events_organizer_id_fkey(id, username, image, name)
          `)
          .eq('organizer_id', userId)
          .order('start_date', { ascending: false });

        if (error) throw error;

        const formattedEvents = (data || []).map((event) => ({
          ...event,
          organizer: event.organizer || { id: '', name: 'Unknown', username: '' },
          attendees_count: 0,
        })) as ExtendedEvent[];

        return { data: formattedEvents, error: null };
      } else {
        const { data, error } = await supabase
          .from('event_participants')
          .select(`
            event:events(
              *,
              organizer:profiles!events_organizer_id_fkey(id, username, image, name)
            )
          `)
          .eq('user_id', userId)
          .eq('status', type);

        if (error) throw error;

        const formattedEvents = (data || []).map((item) => ({
          ...item.event,
          organizer: item.event?.organizer || { id: '', name: 'Unknown', username: '' },
          attendees_count: 0,
        })) as ExtendedEvent[];

        return { data: formattedEvents, error: null };
      }
    } catch (error) {
      console.error('Error fetching user events:', error);
      return { data: null, error: error as Error };
    }
  },

  // Join an event
  async joinEvent(
    eventId: string,
    status: 'attending' | 'interested' = 'attending'
  ): Promise<ApiResponse<EventParticipant>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if already participating
      const { data: existingParticipation } = await supabase
        .from('event_participants')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (existingParticipation) {
        // Update existing participation
        const { data, error } = await supabase
          .from('event_participants')
          .update({ status })
          .eq('id', existingParticipation.id)
          .select()
          .single();

        if (error) throw error;

        return { data: data as EventParticipant, error: null };
      } else {
        // Create new participation
        const { data, error } = await supabase
          .from('event_participants')
          .insert({
            event_id: eventId,
            user_id: user.id,
            status,
          })
          .select()
          .single();

        if (error) throw error;

        return { data: data as EventParticipant, error: null };
      }
    } catch (error) {
      console.error('Error joining event:', error);
      return { data: null, error: error as Error };
    }
  },

  // Leave an event
  async leaveEvent(eventId: string): Promise<ApiResponse<boolean>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      console.error('Error leaving event:', error);
      return { data: false, error: error as Error };
    }
  },

  // Get event participants
  async getEventParticipants(
    eventId: string,
    status?: 'attending' | 'interested'
  ): Promise<ApiResponse<EventParticipant[]>> {
    try {
      let query = supabase
        .from('event_participants')
        .select(`
          *,
          profile:profiles(username, image, name)
        `)
        .eq('event_id', eventId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedParticipants = (data || []).map((participant) => ({
        ...participant,
        profile: participant.profile
          ? {
              username: participant.profile.username || '',
              avatar_url: participant.profile.image,
              display_name: participant.profile.name,
            }
          : undefined,
      })) as EventParticipant[];

      return { data: formattedParticipants, error: null };
    } catch (error) {
      console.error('Error fetching event participants:', error);
      return { data: null, error: error as Error };
    }
  },

  // Get event categories
  async getEventCategories(): Promise<ApiResponse<string[]>> {
    try {
      // If you have a separate event_tags table
      const { data: tagData, error: tagError } = await supabase
        .from('event_tags')
        .select('name')
        .order('name', { ascending: true });

      if (!tagError && tagData) {
        return { data: tagData.map((tag) => tag.name), error: null };
      }

      // Otherwise, get unique categories from events
      const { data, error } = await supabase
        .from('events')
        .select('category')
        .not('category', 'is', null)
        .order('category', { ascending: true });

      if (error) throw error;

      // Get unique categories
      const categories = [...new Set((data || []).map((event) => event.category))].filter(Boolean);

      return { data: categories, error: null };
    } catch (error) {
      console.error('Error fetching event categories:', error);
      return { data: null, error: error as Error };
    }
  },
};
