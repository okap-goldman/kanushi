import { MaterialIcons } from '@expo/vector-icons';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useToast } from '../../hooks/use-toast';
import { type SearchResults, aiChatService } from '../../lib/aiChatService';

interface AISearchBarProps {
  onSearchResults: (results: SearchResults) => void;
  onAIChatPress: () => void;
  suggestions?: string[];
  debounceDelay?: number;
}

export const AISearchBar: React.FC<AISearchBarProps> = ({
  onSearchResults,
  onAIChatPress,
  suggestions = [],
  debounceDelay = 300,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      setIsLoading(true);
      try {
        const results = await aiChatService.searchContent(query);
        onSearchResults(results);
      } catch (error) {
        toast({
          title: '検索に失敗しました',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [onSearchResults, toast]
  );

  const handleSearchSubmit = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
    performSearch(searchQuery);
    setShowSuggestions(false);
  }, [searchQuery, debounceTimer, performSearch]);

  const handleTextChange = useCallback(
    (text: string) => {
      setSearchQuery(text);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      if (debounceDelay > 0 && text.trim()) {
        const timer = setTimeout(() => {
          performSearch(text);
        }, debounceDelay);
        setDebounceTimer(timer);
      }
    },
    [debounceDelay, debounceTimer, performSearch]
  );

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setShowSuggestions(false);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  }, [debounceTimer]);

  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      setSearchQuery(suggestion);
      setShowSuggestions(false);
      performSearch(suggestion);
    },
    [performSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="検索...（AIに聞く）"
          value={searchQuery}
          onChangeText={handleTextChange}
          onSubmitEditing={handleSearchSubmit}
          onFocus={() => setShowSuggestions(true)}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            testID="clear-search-button"
            style={styles.clearButton}
          >
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
        {isLoading && (
          <ActivityIndicator
            testID="search-loading"
            size="small"
            color="#666"
            style={styles.loadingIndicator}
          />
        )}
        <TouchableOpacity onPress={onAIChatPress} testID="ai-chat-button" style={styles.aiButton}>
          <MaterialIcons name="chat" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(item)}
              >
                <MaterialIcons name="history" size={16} color="#666" />
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    marginHorizontal: 15,
    marginVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  loadingIndicator: {
    marginHorizontal: 10,
  },
  aiButton: {
    padding: 5,
    marginLeft: 10,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 10,
    maxHeight: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
});
