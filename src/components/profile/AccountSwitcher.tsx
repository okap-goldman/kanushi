import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { authService } from '../../lib/authService';
import type { AccountInfo } from '../../lib/authService';

interface AccountSwitcherProps {
  visible: boolean;
  onClose: () => void;
  onAddAccount?: () => void;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
  visible,
  onClose,
  onAddAccount,
}) => {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // アカウント一覧取得
  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { accounts, error } = await authService.getAccounts();
      if (error) {
        setError(error.message);
      } else {
        setAccounts(accounts);
      }
    } catch (err) {
      setError('アカウント情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // アカウント切替
  const handleSwitchAccount = async (accountId: string) => {
    try {
      await authService.switchAccount(accountId);
      onClose();
    } catch (err) {
      Alert.alert('エラー', 'アカウント切替に失敗しました');
    }
  };

  // アカウント追加
  const handleAddAccount = () => {
    // アカウント上限チェック
    if (accounts.length >= 5) {
      Alert.alert('エラー', 'アカウントは最大5つまで作成できます');
      return;
    }
    
    if (onAddAccount) {
      onAddAccount();
      onClose();
    }
  };

  // コンポーネントマウント時にアカウント一覧取得
  useEffect(() => {
    if (visible) {
      fetchAccounts();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>アカウント切替</Text>
          
          {isLoading ? (
            <Text>読み込み中...</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <FlatList
              data={accounts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.accountItem}
                  onPress={() => handleSwitchAccount(item.id)}
                >
                  <Text style={styles.accountName}>{item.profile.displayName}</Text>
                  {item.isActive && (
                    <CheckCircle 
                      size={20} 
                      color="#4CAF50" 
                      testID="active-account-indicator"
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          )}
          
          <TouchableOpacity
            style={[
              styles.addButton,
              accounts.length >= 5 && styles.disabledButton
            ]}
            onPress={handleAddAccount}
            disabled={accounts.length >= 5}
          >
            <Text style={styles.addButtonText}>アカウントを追加</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountName: {
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 5,
    padding: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginVertical: 15,
  },
});

export default AccountSwitcher;