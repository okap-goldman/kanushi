import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface PostActionsProps {
  postId: string;
  onComment: () => void;
}

export function PostActions({ postId, onComment }: PostActionsProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    // Check if the user has liked this post
    const checkLikeStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('likes')
          .select()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error) throw error;
        setLiked(!!data);
      } catch (err) {
        console.error('Error checking like status:', err);
      }
    };

    // Get like count
    const getLikeCount = async () => {
      try {
        const { count, error } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
          
        if (error) throw error;
        setLikeCount(count || 0);
      } catch (err) {
        console.error('Error getting like count:', err);
      }
    };

    // Get comment count
    const getCommentCount = async () => {
      try {
        const { count, error } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
          
        if (error) throw error;
        setCommentCount(count || 0);
      } catch (err) {
        console.error('Error getting comment count:', err);
      }
    };

    checkLikeStatus();
    getLikeCount();
    getCommentCount();
  }, [postId, user]);

  const handleLike = async () => {
    if (!user) return;
    
    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        if (error) throw error;
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
            created_at: new Date().toISOString(),
          });
          
        if (error) throw error;
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
          <Feather 
            name={liked ? 'heart' : 'heart'} 
            size={22} 
            color={liked ? '#E53E3E' : '#64748B'} 
            style={liked ? styles.filledHeart : undefined}
          />
          <Text style={styles.actionText}>{likeCount > 0 ? likeCount : ''}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onComment} style={styles.actionButton}>
          <Feather name="message-circle" size={22} color="#64748B" />
          <Text style={styles.actionText}>{commentCount > 0 ? commentCount : ''}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Feather name="share" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 6,
  },
  filledHeart: {
    // Style for filled heart icon
  },
});