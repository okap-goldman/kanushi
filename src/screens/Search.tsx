import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { AISearchBar } from '../components/search/AISearchBar';
import { AIChat } from '../components/ai/AIChat';
import { Post } from '../components/post/Post';
import { EventCard } from '../components/events/EventCard';
import { ProductCard } from '../components/shop/ProductCard';
import { SearchResults } from '../lib/aiChatService';
import { Feather } from '@expo/vector-icons';

export const Search = () => {
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  
  const handleSearchResults = (results: SearchResults) => {
    setSearchResults(results);
  };

  const handleAIChatPress = () => {
    setShowAIChat(true);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="search" size={48} color="#A0AEC0" />
      <Text style={styles.emptyStateTitle}>検索結果がありません</Text>
      <Text style={styles.emptyStateText}>
        投稿、ユーザー、ハッシュタグを検索してみてください
      </Text>
    </View>
  );

  const renderSearchResults = () => {
    if (!searchResults) {
      return (
        <View style={styles.welcomeState}>
          <Feather name="search" size={48} color="#A0AEC0" />
          <Text style={styles.welcomeTitle}>何をお探しですか？</Text>
          <Text style={styles.welcomeText}>
            上の検索バーから検索するか、AIチャットで質問してください
          </Text>
        </View>
      );
    }

    const sections = [];

    if (searchResults.posts.length > 0) {
      sections.push({
        title: '投稿',
        data: searchResults.posts,
        type: 'post',
      });
    }

    if (searchResults.events.length > 0) {
      sections.push({
        title: 'イベント',
        data: searchResults.events,
        type: 'event',
      });
    }

    if (searchResults.products.length > 0) {
      sections.push({
        title: '商品',
        data: searchResults.products,
        type: 'product',
      });
    }

    if (sections.length === 0) {
      return renderEmptyState();
    }

    return (
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item, section }) => {
          switch (section.type) {
            case 'post':
              return (
                <View testID="search-results">
                  <Post
                    author={{
                      id: item.user_id,
                      name: item.user?.name || 'ユーザー',
                      image: item.user?.avatar_url || '',
                    }}
                    content={item.content}
                    caption={item.content}
                    mediaType="text"
                    postId={item.id}
                    tags={[]}
                  />
                </View>
              );
            case 'event':
              return (
                <View testID="search-results">
                  <EventCard
                    event={{
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      startDate: item.start_date,
                      endDate: item.end_date,
                      location: item.location,
                      imageUrl: item.image_url,
                      attendeeCount: item.attendee_count || 0,
                    }}
                    onPress={() => {}}
                  />
                </View>
              );
            case 'product':
              return (
                <View testID="search-results">
                  <ProductCard
                    product={{
                      id: item.id,
                      name: item.name,
                      description: item.description,
                      price: item.price,
                      imageUrl: item.image_url,
                      stockQuantity: item.stock_quantity,
                    }}
                    onPress={() => {}}
                  />
                </View>
              );
            default:
              return null;
          }
        }}
        contentContainerStyle={styles.content}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>検索</Text>
      </View>
      
      <AISearchBar
        onSearchResults={handleSearchResults}
        onAIChatPress={handleAIChatPress}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070F3" />
        </View>
      ) : (
        renderSearchResults()
      )}

      <AIChat
        isVisible={showAIChat}
        onClose={() => setShowAIChat(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  welcomeState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F7FAFC',
  },
});