import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Input } from '../components/ui/Input';
import Post from '../components/post/Post';
import { Feather } from '@expo/vector-icons';

// Temporary sample data
const SAMPLE_SEARCH_RESULTS = [
  {
    id: '1',
    user: {
      id: 'user1',
      name: 'John Doe',
      username: 'johndoe',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
    },
    content: 'Exploring new places in Tokyo today! #travel #japan',
    images: ['https://picsum.photos/500/300?random=1'],
    createdAt: '2023-05-10T09:24:00Z',
    likes: 24,
    comments: 5,
  },
  {
    id: '2',
    user: {
      id: 'user2',
      name: 'Jane Smith',
      username: 'janesmith',
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
    },
    content: 'Amazing sunset at the beach! 🌅 #sunset #beach',
    images: ['https://picsum.photos/500/300?random=2'],
    createdAt: '2023-05-09T18:30:00Z',
    likes: 42,
    comments: 8,
  },
  {
    id: '3',
    user: {
      id: 'user3',
      name: 'Alex Johnson',
      username: 'alexj',
      avatarUrl: 'https://i.pravatar.cc/150?img=8',
    },
    content: 'Trying out a new recipe for dinner tonight. #cooking #foodie',
    images: ['https://picsum.photos/500/300?random=3'],
    createdAt: '2023-05-08T19:15:00Z',
    likes: 18,
    comments: 3,
  },
];

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(SAMPLE_SEARCH_RESULTS);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Show loading indicator for better UX
    if (query.length > 2) {
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        // In a real app, you would fetch search results from an API
        // For now, we'll just filter our sample data based on the query
        const filteredResults = SAMPLE_SEARCH_RESULTS.filter(post => 
          post.content.toLowerCase().includes(query.toLowerCase()) ||
          post.user.name.toLowerCase().includes(query.toLowerCase()) ||
          post.user.username.toLowerCase().includes(query.toLowerCase())
        );
        
        setResults(filteredResults);
        setLoading(false);
      }, 500);
    } else if (query.length === 0) {
      // Reset to default when query is cleared
      setResults(SAMPLE_SEARCH_RESULTS);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="search" size={48} color="#A0AEC0" />
      <Text style={styles.emptyStateTitle}>No results found</Text>
      <Text style={styles.emptyStateText}>
        Try searching for posts, users, or hashtags
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search posts, users, or hashtags..."
          value={searchQuery}
          onChangeText={handleSearch}
          leftIcon={<Feather name="search" size={16} color="#718096" />}
          clearButton
        />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0070F3" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Post post={item} />}
          contentContainerStyle={styles.content}
          ListEmptyComponent={renderEmptyState}
        />
      )}
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
});