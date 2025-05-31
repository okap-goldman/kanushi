# Stripe React Native セットアップガイド

## 概要

KanushiアプリでStripe決済を有効にするための手順です。現在はモック実装が動作していますが、実際の決済を処理するためには以下の手順が必要です。

## 1. Stripe React Native SDKのインストール

```bash
npm install @stripe/stripe-react-native
```

### iOS追加設定

```bash
cd ios && pod install
```

### Android追加設定

`android/app/src/main/java/.../MainApplication.java` に以下を追加：

```java
import com.reactnativestripesdk.StripeSdkPackage;

@Override
protected List<ReactPackage> getPackages() {
  return Arrays.<ReactPackage>asList(
    new MainReactPackage(),
    new StripeSdkPackage() // この行を追加
  );
}
```

## 2. 環境変数の設定

`.env` ファイルに以下を追加：

```env
# Stripe設定
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Apple Pay用（iOS）
APPLE_MERCHANT_ID=merchant.com.kanushi.app
```

## 3. コード修正

### StripeProviderの修正

`src/components/providers/StripeProvider.tsx` を以下のように修正：

```typescript
import { StripeProvider } from '@stripe/stripe-react-native';
import { env } from '../../lib/env';

export function AppStripeProvider({ children }: { children: React.ReactNode }) {
  return (
    <StripeProvider
      publishableKey={env.STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier={env.APPLE_MERCHANT_ID}
      urlScheme="kanushi"
    >
      {children}
    </StripeProvider>
  );
}
```

### stripeReactNativeServiceの修正

`src/lib/stripeReactNativeService.ts` を以下のように修正：

```typescript
import { usePaymentSheet } from '@stripe/stripe-react-native';

class StripeReactNativeService {
  // usePaymentSheet hookを使用するようにコンストラクタを修正
  constructor() {
    // React Hook Rules に従い、コンポーネント内で使用する
  }
}

// または、カスタムフックとして実装
export function useStripePayment() {
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  
  // 決済処理のロジック
}
```

## 4. サーバーサイド実装

### PaymentIntent作成API

Express.jsを使用した例：

```javascript
app.post('/create-payment-intent', async (req, res) => {
  const { amount, currency = 'jpy', metadata } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      client_secret: paymentIntent.client_secret,
      id: paymentIntent.id,
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});
```

### Webhook設定

```javascript
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // イベントの処理
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      // 注文ステータスの更新
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});
```

## 5. Apple Pay設定（iOS）

### 1. Apple Developerアカウントでの設定

1. Apple Developer Consoleでアプリを登録
2. Merchant IDを作成
3. Apple Pay capabilityを有効化

### 2. Xcode設定

1. プロジェクトのCapabilitiesでApple Payを有効化
2. Merchant IDを設定

### 3. Stripe ダッシュボード設定

1. StripeダッシュボードでApple Pay Domainを追加
2. Apple Pay証明書をアップロード

## 6. テスト

### テストカード番号

- 成功: 4242424242424242
- 失敗: 4000000000000002
- 3D Secure: 4000000000003220

### Apple Pay テスト

- iOS Simulatorでテストアカウントを設定
- テスト用のクレジットカードを追加

## 7. 本番環境デプロイ

1. 本番用のStripeキーに変更
2. Webhookエンドポイントの設定
3. Apple Pay本番証明書の設定
4. セキュリティ監査の実施

## トラブルシューティング

### よくある問題

1. **PaymentSheetが表示されない**
   - Stripe Providerが正しく設定されているか確認
   - publishableKeyが正しく設定されているか確認

2. **Apple Payが利用できない**
   - デバイスがApple Payに対応しているか確認
   - Merchant IDが正しく設定されているか確認

3. **Webhookが動作しない**
   - エンドポイントのURLが正しいか確認
   - Webhook署名検証が正しく設定されているか確認

## 参考リンク

- [Stripe React Native Documentation](https://docs.stripe.com/sdks/react-native)
- [Stripe Testing Guide](https://docs.stripe.com/testing)
- [Apple Pay Integration Guide](https://docs.stripe.com/apple-pay)