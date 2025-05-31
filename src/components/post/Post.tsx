import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { PostActions } from './PostActions';
import { PostComments } from './PostComments';
import { PostContent } from './PostContent';
import { PostHeader } from './PostHeader';

interface PostProps {
  author: {
    name: string;
    image: string;
    id: string;
  };
  content: string;
  caption?: string;
  mediaType: string;
  postId: string;
  tags?: { id: string; name: string }[];
}

export function Post({ author, content, caption, mediaType, postId, tags = [] }: PostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showFullPost, setShowFullPost] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const fetchComments = async () => {
    if (!showComments) return;

    setIsLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comment')
        .select(`
          *,
          profile:user_id (id, display_name, profile_image_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  return (
    <Card style={styles.card}>
      <PostHeader author={author} />

      <TouchableOpacity
        onPress={() => mediaType !== 'text' && mediaType !== 'audio' && setShowFullPost(true)}
        disabled={mediaType === 'text' || mediaType === 'audio'}
      >
        <PostContent
          content={content}
          caption={caption}
          mediaType={mediaType}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          postId={postId}
          authorName={author.name}
        />
      </TouchableOpacity>

      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.map((tag) => (
            <Text key={tag.id} style={styles.tag}>
              #{tag.name}
            </Text>
          ))}
        </View>
      )}

      <PostActions postId={postId} onComment={() => setShowComments(true)} />

      <Modal
        visible={showComments}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowComments(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <PostComments
              postId={postId}
              comments={comments}
              isLoading={isLoadingComments}
              onCommentAdded={fetchComments}
              onClose={() => setShowComments(false)}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFullPost}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFullPost(false)}
      >
        <View style={styles.fullPostContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowFullPost(false)}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <View style={styles.fullPostContent}>
            <PostContent
              content={content}
              mediaType={mediaType}
              isExpanded={true}
              setIsExpanded={setIsExpanded}
              postId={postId}
              authorName={author.name}
            />

            <View style={styles.fullPostDetails}>
              <PostHeader author={author} />

              {caption && <Text style={styles.caption}>{caption}</Text>}

              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag) => (
                    <Text key={tag.id} style={styles.tag}>
                      #{tag.name}
                    </Text>
                  ))}
                </View>
              )}

              <PostActions
                postId={postId}
                onComment={() => {
                  setShowFullPost(false);
                  setShowComments(true);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 8,
  },
  tag: {
    fontSize: 12,
    backgroundColor: '#ECFDF5', // Emerald-50
    color: '#10B981', // Emerald-500
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '60%',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#CBD5E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  fullPostContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: -2,
  },
  fullPostContent: {
    flex: 1,
  },
  fullPostDetails: {
    padding: 16,
  },
  caption: {
    fontSize: 14,
    color: '#1A202C',
    marginTop: 8,
    marginBottom: 12,
  },
});
