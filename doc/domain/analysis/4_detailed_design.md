# 分析ドメイン詳細設計

この詳細設計ドキュメントは、以下の複数のファイルに分割されています。各セクションの詳細については、対応するファイルを参照してください。

## 目次

1. [アーキテクチャ概要](architecture_overview.md)
   - プレゼンテーション層
   - ドメイン層
   - データ層
   - バックエンドAPI構成

2. [データモデル詳細](data_models.md)
   - AwakeningLevelModel
   - InsightModel
   - NextActionModel
   - ActivityDataModel

3. [リポジトリとデータソース詳細](repositories_and_datasources.md)
   - リポジトリインターフェース
   - リポジトリ実装
   - データソース詳細

4. [バックエンドAPI実装](backend_api.md)
   - ドメイン層 - エンティティとバリューオブジェクト
   - インフラストラクチャ層 - リポジトリ実装
   - プレゼンテーション層 - APIルート

5. [シーケンス図](sequence_diagrams.md)
   - パーソナルインサイト生成プロセス
   - パーソナライズドコンテンツ推奨プロセス
   - 次のステップ提案プロセス
   - 目醒め度評価更新プロセス
   - データプライバシー管理プロセス