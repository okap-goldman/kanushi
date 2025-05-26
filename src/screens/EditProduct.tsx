import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ecService, Product } from '../lib/ecService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';

export default function EditProduct() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { productId, product: initialProduct } = route.params || {};
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    image: null as any,
    imageUrl: '',
  });

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        title: initialProduct.title || '',
        description: initialProduct.description || '',
        price: initialProduct.price?.toString() || '',
        stock: initialProduct.stock?.toString() || '',
        image: null,
        imageUrl: initialProduct.image_url || '',
      });
    } else if (productId) {
      // Fetch product data if not provided
      fetchProduct();
    }
  }, [initialProduct, productId]);

  const fetchProduct = async () => {
    try {
      const product = await ecService.getProductById(productId);
      setFormData({
        title: product.title || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        image: null,
        imageUrl: product.image_url || '',
      });
    } catch (error) {
      Alert.alert('エラー', '商品データの取得に失敗しました');
      navigation.goBack();
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!result.granted) {
      Alert.alert('権限エラー', '画像を選択するには権限が必要です');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setFormData({ ...formData, image: pickerResult.assets[0] });
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    if (!result.granted) {
      Alert.alert('権限エラー', 'カメラを使用するには権限が必要です');
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setFormData({ ...formData, image: pickerResult.assets[0] });
    }
  };

  const handleImageSelection = () => {
    Alert.alert(
      '商品画像を変更',
      '画像の選択方法を選んでください',
      [
        { text: 'カメラで撮影', onPress: takePhoto },
        { text: 'ライブラリから選択', onPress: pickImage },
        { text: 'キャンセル', style: 'cancel' },
      ]
    );
  };

  const validateForm = () => {
    if (!formData.imageUrl && !formData.image) {
      Alert.alert('エラー', '商品画像を選択してください');
      return false;
    }
    if (!formData.title.trim()) {
      Alert.alert('エラー', '商品名を入力してください');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('エラー', '商品説明を入力してください');
      return false;
    }
    const price = parseInt(formData.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('エラー', '正しい価格を入力してください');
      return false;
    }
    const stock = parseInt(formData.stock);
    if (isNaN(stock) || stock < 0) {
      Alert.alert('エラー', '正しい在庫数を入力してください');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user?.id) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    setLoading(true);
    try {
      // Create update data
      const updateData: any = {
        id: productId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseInt(formData.price),
        stock: parseInt(formData.stock),
        currency: 'JPY',
      };

      // Add new image if selected
      if (formData.image) {
        updateData.image_file = {
          uri: formData.image.uri,
          type: formData.image.type || 'image/jpeg',
          name: `product_${Date.now()}.jpg`,
        };
      } else {
        updateData.image_url = formData.imageUrl;
      }

      await ecService.updateProduct(user.id, updateData);

      Alert.alert(
        '成功',
        '商品を更新しました',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('エラー', '商品の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentImageUri = () => {
    if (formData.image) {
      return formData.image.uri;
    }
    return formData.imageUrl;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.title}>商品を編集</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Image selection */}
          <View style={styles.section}>
            <Label style={styles.label}>商品画像 *</Label>
            <TouchableOpacity
              style={styles.imageSelector}
              onPress={handleImageSelection}
            >
              {getCurrentImageUri() ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: getCurrentImageUri() }} style={styles.selectedImage} />
                  <View style={styles.imageOverlay}>
                    <Feather name="camera" size={32} color="#FFFFFF" />
                    <Text style={styles.changeImageText}>画像を変更</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="camera" size={48} color="#CBD5E0" />
                  <Text style={styles.imagePlaceholderText}>画像を選択</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Title input */}
          <View style={styles.section}>
            <Label htmlFor="title" style={styles.label}>
              商品名 *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="例: ハンドメイドアクセサリー"
              style={styles.input}
            />
          </View>

          {/* Description input */}
          <View style={styles.section}>
            <Label htmlFor="description" style={styles.label}>
              商品説明 *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="商品の特徴、素材、サイズなどを詳しく記載してください"
              style={styles.textarea}
              numberOfLines={5}
            />
          </View>

          {/* Price input */}
          <View style={styles.section}>
            <Label htmlFor="price" style={styles.label}>
              価格 (円) *
            </Label>
            <Input
              id="price"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text.replace(/[^0-9]/g, '') })}
              placeholder="1000"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          {/* Stock input */}
          <View style={styles.section}>
            <Label htmlFor="stock" style={styles.label}>
              在庫数 *
            </Label>
            <Input
              id="stock"
              value={formData.stock}
              onChangeText={(text) => setFormData({ ...formData, stock: text.replace(/[^0-9]/g, '') })}
              placeholder="10"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              onPress={handleSubmit}
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? '更新中...' : '変更を保存する'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
  },
  textarea: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imageSelector: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F7FAFC',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  changeImageText: {
    marginTop: 8,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 16,
    color: '#718096',
  },
  buttonContainer: {
    marginTop: 32,
  },
  submitButton: {
    width: '100%',
    paddingVertical: 16,
  },
});