// src/components/__tests__/AccountSwitcher.test.tsx
describe('AccountSwitcher Component', () => {
  it('アカウント一覧が正しく表示される', async () => {
    // Given
    const mockAccounts = [
      { id: 'acc1', profile: { displayName: 'アカウント1' }, isActive: true },
      { id: 'acc2', profile: { displayName: 'アカウント2' }, isActive: false }
    ];
    jest.spyOn(accountService, 'getAccounts').mockResolvedValue(mockAccounts);

    // When
    render(<AccountSwitcher visible={true} onClose={jest.fn()} />);

    // Then
    await waitFor(() => {
      expect(screen.getByText('アカウント1')).toBeOnTheScreen();
      expect(screen.getByText('アカウント2')).toBeOnTheScreen();
    });
  });

  it('アクティブアカウントにチェックマークが表示される', async () => {
    // Given
    const mockAccounts = [
      { id: 'acc1', profile: { displayName: 'アカウント1' }, isActive: true },
      { id: 'acc2', profile: { displayName: 'アカウント2' }, isActive: false }
    ];
    jest.spyOn(accountService, 'getAccounts').mockResolvedValue(mockAccounts);

    // When
    render(<AccountSwitcher visible={true} onClose={jest.fn()} />);

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('active-account-indicator')).toBeOnTheScreen();
    });
  });

  it('アカウント選択で切替が実行される', async () => {
    // Given
    const mockSwitchAccount = jest.fn().mockResolvedValue({});
    jest.spyOn(accountService, 'switchAccount').mockImplementation(mockSwitchAccount);

    render(<AccountSwitcher visible={true} onClose={jest.fn()} />);

    // When
    const account2 = await screen.findByText('アカウント2');
    fireEvent.press(account2);

    // Then
    expect(mockSwitchAccount).toHaveBeenCalledWith('acc2');
  });

  it('アカウント追加ボタンで新規アカウント作成フローが開始される', async () => {
    // Given
    const mockOnAddAccount = jest.fn();
    render(<AccountSwitcher visible={true} onClose={jest.fn()} onAddAccount={mockOnAddAccount} />);

    // When
    const addButton = screen.getByText('アカウントを追加');
    fireEvent.press(addButton);

    // Then
    expect(mockOnAddAccount).toHaveBeenCalled();
  });

  it('5アカウント制限時にアカウント追加ボタンが無効になる', async () => {
    // Given
    const mockAccounts = Array(5).fill(null).map((_, i) => ({
      id: `acc${i + 1}`,
      profile: { displayName: `アカウント${i + 1}` },
      isActive: i === 0
    }));
    jest.spyOn(accountService, 'getAccounts').mockResolvedValue(mockAccounts);

    // When
    render(<AccountSwitcher visible={true} onClose={jest.fn()} />);

    // Then
    await waitFor(() => {
      const addButton = screen.getByText('アカウントを追加');
      expect(addButton).toBeDisabled();
    });
  });
});