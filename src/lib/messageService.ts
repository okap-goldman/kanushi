import type { ApiResponse } from './data';
import { supabase } from './supabase';

// Define types for the messaging feature
export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  last_message?: Message;
  created_at: string;
  updated_at: string;
  unread_count: number;
  display_name?: string;
  display_image?: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  created_at: string;
  is_admin: boolean;
  last_read_at: string;
  user: {
    id: string;
    name: string;
    image: string;
    username?: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  content_type: 'text' | 'image' | 'video' | 'audio';
  media_url?: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    name: string;
    image: string;
  };
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    image: string;
  };
}

/**
 * Get all conversations for the current user
 * @param current_user_id The ID of the current user
 */
export const getConversations = async (
  current_user_id: string
): Promise<ApiResponse<Conversation[]>> => {
  try {
    // Get all conversations that the current user is a part of
    const { data: participantData, error: participantError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        last_read_at
      `)
      .eq('user_id', current_user_id);

    if (participantError) {
      throw participantError;
    }

    if (!participantData || participantData.length === 0) {
      return { data: [], error: null };
    }

    const conversationIds = participantData.map((p) => p.conversation_id);
    const lastReadMap = participantData.reduce((acc: Record<string, string>, p) => {
      acc[p.conversation_id] = p.last_read_at;
      return acc;
    }, {});

    // Get all conversations with participants and their user profiles
    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          user:profiles(id, name, image, username)
        )
      `)
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (conversationsError) {
      throw conversationsError;
    }

    // For each conversation, get the latest message
    const conversationsWithLastMessage = await Promise.all(
      conversationsData.map(async (conversation) => {
        // Get the latest message for this conversation
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles(id, name, image)
          `)
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (messagesError) {
          throw messagesError;
        }

        // Count unread messages
        const { count, error: countError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .eq('is_read', false)
          .neq('user_id', current_user_id)
          .filter('created_at', 'gt', lastReadMap[conversation.id] || '1970-01-01');

        if (countError) {
          throw countError;
        }

        // Format participants
        const formattedParticipants = conversation.participants.map((participant: any) => ({
          ...participant,
          user: participant.user[0] || {
            id: 'unknown',
            name: 'Unknown User',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
          },
        }));

        // Find other participants (not the current user)
        const otherParticipants = formattedParticipants.filter(
          (p: ConversationParticipant) => p.user_id !== current_user_id
        );

        // Format the last message if it exists
        const lastMessage =
          messagesData && messagesData.length > 0
            ? {
                ...messagesData[0],
                sender: messagesData[0].sender[0] || {
                  id: 'unknown',
                  name: 'Unknown User',
                  image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
                },
              }
            : undefined;

        return {
          ...conversation,
          participants: formattedParticipants,
          last_message: lastMessage,
          unread_count: count || 0,
          // For display in the UI, use other participant's name/image for 1:1 chats
          display_name:
            otherParticipants.length === 1
              ? otherParticipants[0].user.name
              : formattedParticipants.map((p: any) => p.user.name).join(', '),
          display_image:
            otherParticipants.length === 1
              ? otherParticipants[0].user.image
              : 'https://api.dicebear.com/7.x/avataaars/svg?seed=group',
        };
      })
    );

    return { data: conversationsWithLastMessage as Conversation[], error: null };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get a single conversation with all its messages
 * @param conversation_id The ID of the conversation
 * @param current_user_id The ID of the current user (needed to mark messages as read)
 * @param limit Optional limit for the number of messages to fetch (default 50)
 * @param before_timestamp Optional timestamp to fetch messages before a certain time
 */
export const getConversation = async (
  conversation_id: string,
  current_user_id: string,
  limit = 50,
  before_timestamp?: string
): Promise<ApiResponse<{ conversation: Conversation; messages: Message[]; has_more: boolean }>> => {
  try {
    // Get the conversation
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          user:profiles(id, name, image, username)
        )
      `)
      .eq('id', conversation_id)
      .single();

    if (conversationError) {
      throw conversationError;
    }

    // Format participants
    const formattedParticipants = conversationData.participants.map((participant: any) => ({
      ...participant,
      user: participant.user[0] || {
        id: 'unknown',
        name: 'Unknown User',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
      },
    }));

    // Build the query for messages
    let messagesQuery = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(id, name, image),
        reactions:message_reactions(
          *,
          user:profiles(id, name, image)
        )
      `)
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false }) // Important: Start with most recent
      .limit(limit);

    // Add timestamp filter if provided (for pagination)
    if (before_timestamp) {
      messagesQuery = messagesQuery.lt('created_at', before_timestamp);
    }

    // Execute the query
    const { data: messagesData, error: messagesError } = await messagesQuery;

    if (messagesError) {
      throw messagesError;
    }

    // Get one more message to check if there are more
    const { count, error: countError } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversation_id)
      .lt(
        'created_at',
        before_timestamp ||
          messagesData[messagesData.length - 1]?.created_at ||
          new Date().toISOString()
      )
      .limit(1);

    // Determine if there are more messages to load
    const hasMore = (count || 0) > 0;

    // Format messages and reverse to get chronological order
    const formattedMessages = messagesData
      .map((message: any) => ({
        ...message,
        sender: message.sender[0] || {
          id: 'unknown',
          name: 'Unknown User',
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
        },
        reactions: message.reactions.map((reaction: any) => ({
          ...reaction,
          user: reaction.user[0] || {
            id: 'unknown',
            name: 'Unknown User',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
          },
        })),
      }))
      .reverse(); // Reverse to get chronological order

    // Mark all messages as read for the current user
    const { error: readError } = await supabase.rpc('mark_conversation_as_read', {
      conversation_id_param: conversation_id,
      user_id_param: current_user_id,
    });

    if (readError) {
      console.error('Error marking messages as read:', readError);
      // Continue execution even if we fail to mark messages as read
    }

    // Find other participants (not the current user)
    const otherParticipants = formattedParticipants.filter(
      (p: ConversationParticipant) => p.user_id !== current_user_id
    );

    const conversation = {
      ...conversationData,
      participants: formattedParticipants,
      unread_count: 0, // We've just read all messages
      // For display in the UI, use other participant's name/image for 1:1 chats
      display_name:
        otherParticipants.length === 1
          ? otherParticipants[0].user.name
          : formattedParticipants.map((p: any) => p.user.name).join(', '),
      display_image:
        otherParticipants.length === 1
          ? otherParticipants[0].user.image
          : 'https://api.dicebear.com/7.x/avataaars/svg?seed=group',
    };

    return {
      data: {
        conversation: conversation as Conversation,
        messages: formattedMessages as Message[],
        has_more: hasMore,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Send a new message in a conversation
 * @param message The message to send
 */
export const sendMessage = async (
  message: Omit<Message, 'id' | 'created_at' | 'updated_at' | 'sender' | 'reactions'>
): Promise<ApiResponse<Message>> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: message.conversation_id,
        user_id: message.user_id,
        content: message.content,
        content_type: message.content_type,
        media_url: message.media_url,
        is_read: false,
      })
      .select(`
        *,
        sender:profiles(id, name, image)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Format the message response
    const formattedMessage = {
      ...data,
      sender: data.sender[0] || {
        id: 'unknown',
        name: 'Unknown User',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
      },
      reactions: [],
    } as Message;

    return { data: formattedMessage, error: null };
  } catch (error) {
    console.error('Error sending message:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Create a new direct conversation between two users
 * @param user1_id The first user's ID (usually the current user)
 * @param user2_id The second user's ID
 */
export const createDirectConversation = async (
  user1_id: string,
  user2_id: string
): Promise<ApiResponse<{ conversation_id: string }>> => {
  try {
    // Use the Supabase function to create or get existing conversation
    const { data, error } = await supabase.rpc('create_direct_conversation', {
      user1_id,
      user2_id,
    });

    if (error) {
      throw error;
    }

    return { data: { conversation_id: data }, error: null };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * React to a message with an emoji
 * @param message_id The ID of the message to react to
 * @param user_id The ID of the user reacting
 * @param reaction The emoji reaction
 */
export const reactToMessage = async (
  message_id: string,
  user_id: string,
  reaction: string
): Promise<ApiResponse<MessageReaction>> => {
  try {
    // Check if the reaction already exists
    const { data: existingReaction, error: checkError } = await supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', message_id)
      .eq('user_id', user_id)
      .eq('reaction', reaction)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    // If the reaction exists, remove it (toggle behavior)
    if (existingReaction) {
      const { error: deleteError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (deleteError) {
        throw deleteError;
      }

      return { data: null, error: null }; // Return null to indicate removal
    }

    // Otherwise, add the new reaction
    const { data, error } = await supabase
      .from('message_reactions')
      .insert({
        message_id,
        user_id,
        reaction,
      })
      .select(`
        *,
        user:profiles(id, name, image)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Format the reaction response
    const formattedReaction = {
      ...data,
      user: data.user[0] || {
        id: 'unknown',
        name: 'Unknown User',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
      },
    } as MessageReaction;

    return { data: formattedReaction, error: null };
  } catch (error) {
    console.error('Error reacting to message:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Create a new group conversation
 * @param creator_id The ID of the user creating the group
 * @param participant_ids Array of user IDs to include in the group
 */
export const createGroupConversation = async (
  creator_id: string,
  participant_ids: string[]
): Promise<ApiResponse<{ conversation_id: string }>> => {
  try {
    // First, create a new conversation
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (conversationError) {
      throw conversationError;
    }

    const conversation_id = conversationData.id;

    // Add all participants, including the creator as an admin
    const participantsToInsert = [
      {
        conversation_id,
        user_id: creator_id,
        is_admin: true,
      },
      ...participant_ids
        .filter((id) => id !== creator_id)
        .map((user_id) => ({
          conversation_id,
          user_id,
          is_admin: false,
        })),
    ];

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participantsToInsert);

    if (participantsError) {
      throw participantsError;
    }

    return { data: { conversation_id }, error: null };
  } catch (error) {
    console.error('Error creating group conversation:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Delete a message (soft delete)
 * @param message_id The ID of the message to delete
 * @param user_id The ID of the user deleting the message (for permission check)
 */
export const deleteMessage = async (
  message_id: string,
  user_id: string
): Promise<ApiResponse<boolean>> => {
  try {
    // Check if the user is the sender of the message
    const { data: messageData, error: checkError } = await supabase
      .from('messages')
      .select('user_id')
      .eq('id', message_id)
      .single();

    if (checkError) {
      throw checkError;
    }

    if (messageData.user_id !== user_id) {
      throw new Error('You are not authorized to delete this message');
    }

    // Soft delete the message by setting deleted_at
    const { error: deleteError } = await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', message_id);

    if (deleteError) {
      throw deleteError;
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error deleting message:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get a list of users for starting a new conversation
 * @param search_term Optional search term to filter users
 * @param current_user_id The ID of the current user (to exclude from results)
 */
export const getAvailableUsers = async (
  search_term?: string,
  current_user_id?: string
): Promise<ApiResponse<ConversationParticipant['user'][]>> => {
  try {
    let query = supabase.from('profiles').select('id, name, image, username');

    // Filter out the current user if provided
    if (current_user_id) {
      query = query.neq('id', current_user_id);
    }

    // Apply search filter if provided
    if (search_term) {
      query = query.or(`name.ilike.%${search_term}%,username.ilike.%${search_term}%`);
    }

    const { data, error } = await query.order('name');

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching available users:', error);
    return { data: null, error: error as Error };
  }
};
