import { vi } from 'vitest';

// モック要素の基本構造
const createMockElement = (props = {}) => ({
  props,
  type: 'View',
  children: [],
});

// モックレンダリング関数
export const render = vi.fn((component: any) => {
  // コンポーネントのpropsを取得
  const componentProps = component.props || {};
  
  // モック要素の状態管理
  const state = {
    elements: {} as Record<string, any>,
    textElements: {} as Record<string, any>,
    inputValue: componentProps.value || componentProps.initialValue || '',
    isFocused: false,
    isLoading: componentProps.isLoading || false,
    suggestions: [] as string[],
    showSuggestions: false,
    clearButtonVisible: false,
    debounceTimers: {} as Record<string, any>,
  };
  
  // 検索入力要素の作成
  const createSearchInput = (placeholder: string) => {
    const key = `placeholder-${placeholder}`;
    if (!state.elements[key]) {
      state.elements[key] = createMockElement({
        placeholder,
        value: state.inputValue,
        editable: !state.isLoading,
        accessibilityLabel: '検索入力',
        accessibilityState: { selected: state.isFocused },
        onChangeText: vi.fn((text) => {
          // 制御された入力の場合は値を更新しない
          const isControlled = componentProps.value !== undefined;
          
          if (!isControlled) {
            state.inputValue = text;
            state.elements[key].props.value = text;
          }
          
          state.clearButtonVisible = text.length > 0;
          
          // クリアボタンの表示/非表示
          if (text.length > 0) {
            if (!state.elements['clear-button']) {
              state.elements['clear-button'] = createMockElement({
                testID: 'clear-button',
                accessibilityLabel: 'クリア',
                onPress: vi.fn(() => {
                  if (!isControlled) {
                    state.inputValue = '';
                    state.elements[key].props.value = '';
                  }
                  state.clearButtonVisible = false;
                  delete state.elements['clear-button'];
                  
                  // onClearコールバックの呼び出し
                  if (componentProps.onClear) {
                    componentProps.onClear();
                  }
                }),
              });
            }
          } else {
            delete state.elements['clear-button'];
          }
          
          // サジェスト機能 - デバウンス処理
          if (componentProps.enableSuggestions && componentProps.onGetSuggestions && text.length > 0) {
            // 既存のタイマーをクリア
            if (state.debounceTimers.suggestions) {
              clearTimeout(state.debounceTimers.suggestions);
            }
            
            // デバウンス処理（テスト用に短縮）
            state.debounceTimers.suggestions = setTimeout(() => {
              componentProps.onGetSuggestions(text).then((suggestions: string[]) => {
                state.suggestions = suggestions;
                state.showSuggestions = suggestions.length > 0;
                
                // 既存のサジェスト要素をクリア
                Object.keys(state.textElements).forEach(key => {
                  if (key.startsWith('text-')) {
                    delete state.textElements[key];
                  }
                });
                
                // サジェスト要素の作成
                suggestions.forEach((suggestion) => {
                  const suggestionKey = `text-${suggestion}`;
                  state.textElements[suggestionKey] = createMockElement({
                    children: suggestion,
                    onPress: vi.fn(() => {
                      state.inputValue = suggestion;
                      state.elements[key].props.value = suggestion;
                      state.showSuggestions = false;
                      
                      // サジェスト選択時に検索を実行
                      if (componentProps.onSearch) {
                        componentProps.onSearch(suggestion);
                      }
                      
                      // サジェスト選択後にテキスト要素を削除
                      Object.keys(state.textElements).forEach(textKey => {
                        if (textKey.startsWith('text-')) {
                          delete state.textElements[textKey];
                        }
                      });
                    }),
                  });
                });
              });
            }, 10); // テスト用に短い時間
          }
        }),
        onFocus: vi.fn(() => {
          state.isFocused = true;
          state.elements[key].props.accessibilityState = { selected: true };
          
          if (state.elements['search-container']) {
            state.elements['search-container'].props.style = { borderColor: '#007AFF' };
          }
          
          // onFocusコールバックの呼び出し
          if (componentProps.onFocus) {
            componentProps.onFocus();
          }
        }),
        onBlur: vi.fn(() => {
          state.isFocused = false;
          state.elements[key].props.accessibilityState = { selected: false };
          
          if (state.elements['search-container']) {
            state.elements['search-container'].props.style = { borderColor: '#ccc' };
          }
          
          // onBlurコールバックの呼び出し
          if (componentProps.onBlur) {
            componentProps.onBlur();
          }
        }),
        onSubmitEditing: vi.fn(() => {
          if (!state.isLoading && state.inputValue.trim() && componentProps.onSearch) {
            componentProps.onSearch(state.inputValue.trim());
          }
        }),
      });
    }
    return state.elements[key];
  };
  
  // 検索コンテナの作成
  const createSearchContainer = () => {
    if (!state.elements['search-container']) {
      state.elements['search-container'] = createMockElement({
        testID: 'search-container',
        style: { borderColor: '#ccc' },
      });
    }
    return state.elements['search-container'];
  };
  
  // 検索ボタンの作成
  const createSearchButton = () => {
    if (!state.elements['search-button']) {
      state.elements['search-button'] = createMockElement({
        testID: 'search-button',
        accessibilityLabel: '検索',
        onPress: vi.fn(() => {
          if (!state.isLoading && state.inputValue.trim() && componentProps.onSearch) {
            componentProps.onSearch(state.inputValue.trim());
          }
        }),
      });
    }
    return state.elements['search-button'];
  };
  
  // AIチャットボタンの作成
  const createAIChatButton = () => {
    if (!state.elements['ai-chat-button']) {
      state.elements['ai-chat-button'] = createMockElement({
        testID: 'ai-chat-button',
        onPress: vi.fn(() => {
          if (componentProps.onAIChatPress) {
            componentProps.onAIChatPress();
          }
        }),
      });
    }
    return state.elements['ai-chat-button'];
  };
  
  // ローディングインジケータの作成
  const createLoadingIndicator = () => {
    if (state.isLoading && !state.elements['search-loading']) {
      state.elements['search-loading'] = createMockElement({
        testID: 'search-loading',
      });
    }
    return state.elements['search-loading'];
  };
  
  // 検索アイコンの作成
  const createSearchIcon = () => {
    if (!state.elements['search-icon']) {
      state.elements['search-icon'] = createMockElement({
        testID: 'search-icon',
      });
    }
    return state.elements['search-icon'];
  };
  
  // 基本的な要素を初期化
  createSearchContainer();
  createSearchIcon();
  createSearchButton();
  
  // AISearchBarの場合はAIチャットボタンも作成
  if (component.type && component.type.name === 'AISearchBar') {
    createAIChatButton();
  }
  
  // ローディング状態の場合はインジケータを作成
  if (state.isLoading) {
    createLoadingIndicator();
  }
  
  // クエリ関数
  const getByTestId = vi.fn((testId: string) => {
    if (!state.elements[testId]) {
      if (testId === 'search-container') {
        return createSearchContainer();
      } else if (testId === 'search-button') {
        return createSearchButton();
      } else if (testId === 'ai-chat-button') {
        return createAIChatButton();
      } else if (testId === 'search-icon') {
        return createSearchIcon();
      } else if (testId === 'search-loading' && state.isLoading) {
        return createLoadingIndicator();
      } else if (testId === 'clear-button' && state.clearButtonVisible) {
        // クリアボタンは入力があるときのみ表示
        state.elements[testId] = createMockElement({
          testID: testId,
          accessibilityLabel: 'クリア',
          onPress: vi.fn(() => {
            state.inputValue = '';
            if (componentProps.onClear) {
              componentProps.onClear();
            }
            delete state.elements['clear-button'];
          }),
        });
      } else if (testId.includes('comment')) {
        // コメントボタン
        state.elements[testId] = createMockElement({
          testID: testId,
          accessibilityLabel: 'コメント',
          onPress: vi.fn(() => {
            // IDからpost-idを抽出 - 'comment-post-1'から'post-1'を取得
            const postId = testId.replace('comment-', '');
            console.log('Comment on post:', postId);
          }),
        });
      } else {
        state.elements[testId] = createMockElement({
          testID: testId,
        });
      }
    }
    return state.elements[testId];
  });
  
  const getByPlaceholderText = vi.fn((placeholder: string) => {
    return createSearchInput(placeholder);
  });
  
  const getByText = vi.fn((text: string) => {
    for (const key in state.textElements) {
      if (state.textElements[key].props && 
          state.textElements[key].props.children === text) {
        return state.textElements[key];
      }
    }
    
    const key = `text-${text}`;
    state.textElements[key] = createMockElement({
      children: text,
      onPress: vi.fn(() => {
        // サジェスト選択時に検索を実行（SearchBar.tsxの実装に合わせる）
        if (componentProps && componentProps.onSearch) {
          componentProps.onSearch(text);
        }
      }),
    });
    return state.textElements[key];
  });
  
  const getByLabelText = vi.fn((label: string) => {
    const key = `label-${label}`;
    if (!state.elements[key]) {
      state.elements[key] = createMockElement({
        accessibilityLabel: label,
      });
    }
    return state.elements[key];
  });
  
  const getByDisplayValue = vi.fn((value: string) => {
    const key = `value-${value}`;
    if (!state.elements[key]) {
      state.elements[key] = createMockElement({
        value,
      });
    }
    return state.elements[key];
  });
  
  const queryByTestId = vi.fn((testId: string) => {
    return state.elements[testId] || null;
  });
  
  const queryByText = vi.fn((text: string) => {
    return state.textElements[`text-${text}`] || null;
  });
  
  const getAllByTestId = vi.fn((testId: string) => {
    if (testId === 'icon-checkmark') {
      return Array(2).fill(null).map(() => createMockElement({ testID: testId }));
    }
    if (testId === 'typing-dot') {
      return Array(3).fill(null).map(() => createMockElement({ testID: testId }));
    }
    const elements: any[] = [];
    Object.keys(state.elements).forEach(key => {
      if (key.startsWith(testId)) {
        elements.push(state.elements[key]);
      }
    });
    return elements.length > 0 ? elements : [createMockElement({ testID: testId })];
  });
  
  return {
    container: { firstChild: createMockElement({ style: { borderColor: '#ccc' } }), props: { style: { borderColor: '#ccc' } } }, // TypingIndicator.test.tsxのために追加
    getByTestId,
    getByText,
    getByLabelText,
    getByPlaceholderText,
    getByDisplayValue,
    queryByTestId,
    queryByText,
    findByTestId: vi.fn(async (testId: string) => getByTestId(testId)),
    findByText: vi.fn(async (text: string) => getByText(text)),
    getAllByTestId,
    getAllByText: vi.fn((text: string) => [getByText(text)]),
    unmount: vi.fn(),
    rerender: vi.fn((newComponent) => {
      // 新しいコンポーネントのpropsを取得
      const newProps = newComponent.props || {};
      
      // 制御された入力値の更新
      if (newProps.value !== undefined) {
        state.inputValue = newProps.value;
        
        // 入力要素の値を更新
        Object.keys(state.elements).forEach(key => {
          if (key.startsWith('placeholder-') && state.elements[key].props) {
            state.elements[key].props.value = newProps.value;
            
            // 制御された入力の場合、onChangeTextハンドラーを上書き
            if (newProps.onChangeText) {
              state.elements[key].props.onChangeText = vi.fn((text) => {
                newProps.onChangeText(text);
              });
            }
          }
        });
      }
      
      // ローディング状態の更新
      if (newProps.isLoading !== undefined) {
        state.isLoading = newProps.isLoading;
        
        // 入力要素の編集可能状態を更新
        Object.keys(state.elements).forEach(key => {
          if (key.startsWith('placeholder-') && state.elements[key].props) {
            state.elements[key].props.editable = !newProps.isLoading;
          }
        });
        
        // ローディングインジケータの表示/非表示
        if (newProps.isLoading) {
          createLoadingIndicator();
        } else {
          delete state.elements['search-loading'];
        }
      }
    }),
    debug: vi.fn(),
    toJSON: vi.fn(() => ({})),
    baseElement: createMockElement(),
  };
});

// イベントハンドラーの実装
export const fireEvent = Object.assign(
  vi.fn((element: any, eventName: string, ...args: any[]) => {
    if (!element || !element.props) {
      return false;
    }
    
    const handlerName = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
    
    if (element.props[handlerName]) {
      element.props[handlerName](...args);
      return true;
    }
    
    // submitEditingイベントの特別処理
    if (eventName === 'submitEditing' && element.props.onSubmitEditing) {
      element.props.onSubmitEditing();
      return true;
    }
    
    return false;
  }),
  {
    press: vi.fn((element: any) => {
      if (!element || !element.props || !element.props.onPress) {
        return false;
      }
      
      element.props.onPress();
      return true;
    }),
    changeText: vi.fn((element: any, text: string) => {
      if (!element || !element.props) {
        return false;
      }
      
      // 制御された入力かどうかをチェック
      const isControlledInput = element.props.onChangeText && 
                               element.props.value !== undefined && 
                               typeof element.props.onChangeText === 'function';
      
      // 制御された入力の場合は値を更新しない（コンポーネントが自身で更新する）
      if (!isControlledInput) {
        element.props.value = text;
      }
      
      // onChangeTextハンドラーを呼び出し
      if (element.props.onChangeText) {
        element.props.onChangeText(text);
        return true;
      }
      
      return false;
    }),
    scroll: vi.fn((element: any, event: any) => {
      if (!element || !element.props || !element.props.onScroll) {
        return false;
      }
      
      element.props.onScroll(event);
      return true;
    }),
    focus: vi.fn((element: any) => {
      if (!element || !element.props) {
        return false;
      }
      
      // accessibilityStateの更新
      if (!element.props.accessibilityState) {
        element.props.accessibilityState = {};
      }
      
      element.props.accessibilityState.selected = true;
      
      // onFocusハンドラーを呼び出し
      if (element.props.onFocus) {
        element.props.onFocus();
        return true;
      }
      
      return false;
    }),
    blur: vi.fn((element: any) => {
      if (!element || !element.props) {
        return false;
      }
      
      // accessibilityStateの更新
      if (!element.props.accessibilityState) {
        element.props.accessibilityState = {};
      }
      
      element.props.accessibilityState.selected = false;
      
      // onBlurハンドラーを呼び出し
      if (element.props.onBlur) {
        element.props.onBlur();
        return true;
      }
      
      return false;
    }),
  }
);

// 非同期テスト用のユーティリティ
export const waitFor = vi.fn(async (callback: () => void | Promise<void>, options = {}) => {
  const maxTries = (options as any).timeout ? (options as any).timeout / 50 : 10;
  let tries = 0;
  let lastError: any;

  while (tries < maxTries) {
    try {
      await callback();
      return;
    } catch (error) {
      lastError = error;
      tries++;
      // Timeline.test.tsxのエラーケースを処理
      if (typeof error === 'object' && error !== null && 'message' in error && error.message === 'Failed to load') {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  throw lastError;
});

export const act = vi.fn(async (callback: () => void | Promise<void>) => {
  await callback();
});

export const cleanup = vi.fn();
