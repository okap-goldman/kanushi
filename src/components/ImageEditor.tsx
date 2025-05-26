import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  TextInput,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { Button } from './ui/Button';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
}

interface ImageEditorProps {
  imageUri: string;
  onSave: (editedImageUri: string) => void;
  onCancel: () => void;
}

const COLORS = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
const FONT_SIZES = [12, 16, 20, 24, 32, 40, 48];

export default function ImageEditor({ imageUri, onSave, onCancel }: ImageEditorProps) {
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const [newText, setNewText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedFontSize, setSelectedFontSize] = useState(24);
  const viewShotRef = useRef<ViewShot>(null);

  const addTextOverlay = () => {
    if (newText.trim()) {
      const newOverlay: TextOverlay = {
        id: Date.now().toString(),
        text: newText,
        x: screenWidth / 2 - 50,
        y: screenHeight / 2 - 100,
        color: selectedColor,
        fontSize: selectedFontSize,
        fontWeight: 'normal',
      };
      setTextOverlays([...textOverlays, newOverlay]);
      setNewText('');
      setIsAddingText(false);
      setSelectedOverlay(newOverlay.id);
    }
  };

  const updateOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays(overlays =>
      overlays.map(overlay =>
        overlay.id === id ? { ...overlay, ...updates } : overlay
      )
    );
  };

  const deleteOverlay = (id: string) => {
    setTextOverlays(overlays => overlays.filter(overlay => overlay.id !== id));
    setSelectedOverlay(null);
  };

  const handleSave = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
        onSave(uri);
      } else {
        // Fallback to original image if capture fails
        onSave(imageUri);
      }
    } catch (error) {
      console.error('Error capturing edited image:', error);
      // Fallback to original image
      onSave(imageUri);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
          <Feather name="x" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>画像を編集</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Feather name="check" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ViewShot ref={viewShotRef} style={styles.canvas} options={{ format: 'jpg', quality: 0.9 }}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        
        {textOverlays.map(overlay => (
          <DraggableText
            key={overlay.id}
            overlay={overlay}
            isSelected={selectedOverlay === overlay.id}
            onSelect={() => setSelectedOverlay(overlay.id)}
            onUpdate={(updates) => updateOverlay(overlay.id, updates)}
          />
        ))}
      </ViewShot>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.toolbar}
      >
        {isAddingText ? (
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={newText}
              onChangeText={setNewText}
              placeholder="テキストを入力"
              autoFocus
              onSubmitEditing={addTextOverlay}
            />
            <TouchableOpacity onPress={addTextOverlay} style={styles.addButton}>
              <Feather name="plus-circle" size={24} color="#0070F3" />
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarContent}>
            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => setIsAddingText(true)}
            >
              <Feather name="type" size={24} color="#0070F3" />
              <Text style={styles.toolButtonText}>テキスト追加</Text>
            </TouchableOpacity>
            
            {selectedOverlay && (
              <>
                <View style={styles.separator} />
                <TouchableOpacity
                  style={styles.toolButton}
                  onPress={() => {
                    const overlay = textOverlays.find(o => o.id === selectedOverlay);
                    if (overlay) {
                      updateOverlay(selectedOverlay, {
                        fontWeight: overlay.fontWeight === 'bold' ? 'normal' : 'bold'
                      });
                    }
                  }}
                >
                  <Feather name="bold" size={24} color="#0070F3" />
                  <Text style={styles.toolButtonText}>太字</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.toolButton}
                  onPress={() => deleteOverlay(selectedOverlay)}
                >
                  <Feather name="trash-2" size={24} color="#FF0000" />
                  <Text style={[styles.toolButtonText, { color: '#FF0000' }]}>削除</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        )}

        {selectedOverlay && (
          <View style={styles.stylePanel}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
              {COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorOption, { backgroundColor: color }]}
                  onPress={() => {
                    updateOverlay(selectedOverlay, { color });
                    setSelectedColor(color);
                  }}
                />
              ))}
            </ScrollView>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizePicker}>
              {FONT_SIZES.map(size => (
                <TouchableOpacity
                  key={size}
                  style={styles.sizeOption}
                  onPress={() => {
                    updateOverlay(selectedOverlay, { fontSize: size });
                    setSelectedFontSize(size);
                  }}
                >
                  <Text style={styles.sizeText}>{size}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

interface DraggableTextProps {
  overlay: TextOverlay;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextOverlay>) => void;
}

function DraggableText({ overlay, isSelected, onSelect, onUpdate }: DraggableTextProps) {
  const translateX = useSharedValue(overlay.x);
  const translateY = useSharedValue(overlay.y);
  const scale = useSharedValue(1);

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      'worklet';
    },
    onActive: (event) => {
      'worklet';
      translateX.value = event.translationX + overlay.x;
      translateY.value = event.translationY + overlay.y;
    },
    onEnd: () => {
      'worklet';
      onUpdate({
        x: translateX.value,
        y: translateY.value,
      });
    },
  });

  const pinchGestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      'worklet';
      scale.value = event.scale;
    },
    onEnd: () => {
      'worklet';
      scale.value = withSpring(1);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <PanGestureHandler onGestureEvent={panGestureHandler}>
      <Animated.View style={[styles.draggableContainer, animatedStyle]}>
        <PinchGestureHandler onGestureEvent={pinchGestureHandler}>
          <Animated.View>
            <TouchableOpacity onPress={onSelect}>
              <Text
                style={[
                  styles.overlayText,
                  {
                    color: overlay.color,
                    fontSize: overlay.fontSize,
                    fontWeight: overlay.fontWeight,
                  },
                  isSelected && styles.selectedText,
                ]}
              >
                {overlay.text}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#000000',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  canvas: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  toolbar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    maxHeight: 200,
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toolButton: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  toolButtonText: {
    fontSize: 12,
    color: '#0070F3',
    marginTop: 4,
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  addButton: {
    marginLeft: 12,
  },
  stylePanel: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
  },
  colorPicker: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  sizePicker: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  sizeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
  },
  sizeText: {
    fontSize: 14,
    color: '#4B5563',
  },
  draggableContainer: {
    position: 'absolute',
  },
  overlayText: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  selectedText: {
    borderWidth: 2,
    borderColor: '#0070F3',
    borderStyle: 'dashed',
    padding: 4,
  },
});