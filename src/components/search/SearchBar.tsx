import { Feather } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  initialValue?: string;
  value?: string;
  isLoading?: boolean;
  enableSuggestions?: boolean;
  onGetSuggestions?: (query: string) => Promise<string[]>;
  debounceDelay?: number;
}

export function SearchBar({
  onSearch,
  onClear,
  onFocus,
  onBlur,
  placeholder = '検索...',
  initialValue = '',
  value: controlledValue,
  isLoading = false,
  enableSuggestions = false,
  onGetSuggestions,
  debounceDelay = 300,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<TextInput>(null);

  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChangeText = (text: string) => {
    if (controlledValue === undefined) {
      setInternalValue(text);
    }

    // Handle suggestions with debounce
    if (enableSuggestions && onGetSuggestions && text.trim()) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const results = await onGetSuggestions(text);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to get suggestions:', error);
          setSuggestions([]);
        }
      }, debounceDelay);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = () => {
    const trimmedValue = value.trim();
    if (trimmedValue && !isLoading) {
      onSearch(trimmedValue);
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    setSuggestions([]);
    setShowSuggestions(false);
    onClear?.();
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (controlledValue === undefined) {
      setInternalValue(suggestion);
    }
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <View style={styles.container}>
        <View
          style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}
          testID="search-container"
        >
          <Feather
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
            testID="search-icon"
          />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={value}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSearch}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!isLoading}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="検索入力"
            accessibilityState={{ selected: isFocused }}
          />
          {isLoading && (
            <ActivityIndicator
              size="small"
              color="#666"
              style={styles.loadingIndicator}
              testID="search-loading"
            />
          )}
          {value.length > 0 && !isLoading && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              testID="clear-button"
              accessibilityLabel="クリア"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={18} color="#666" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleSearch}
            style={styles.searchButton}
            testID="search-button"
            accessibilityLabel="検索"
            disabled={isLoading || !value.trim()}
          >
            <Text
              style={[
                styles.searchButtonText,
                (isLoading || !value.trim()) && styles.searchButtonTextDisabled,
              ]}
            >
              検索
            </Text>
          </TouchableOpacity>
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    width: '100%',
  },
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchContainerFocused: {
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  searchButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  searchButtonTextDisabled: {
    opacity: 0.5,
  },
  loadingIndicator: {
    marginHorizontal: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
});
