# 分析ドメイン - アーキテクチャ概要

## 1. アーキテクチャ概要

分析ドメインは、クリーンアーキテクチャに基づき以下の層に分けて実装します。

### プレゼンテーション層
- **画面（Screens）**
  - AnalysisScreen
  - AwakeningLevelScreen
  - InsightsScreen
  - NextActionsScreen
  - RecommendationsScreen
  - ActivityDashboardScreen

- **ビューモデル（ViewModels）**
  - AnalysisViewModel
  - AwakeningLevelViewModel
  - InsightsViewModel
  - NextActionsViewModel
  - RecommendationsViewModel
  - ActivityDashboardViewModel

- **ウィジェット（Widgets）**
  - AwakeningLevelIndicator
  - InsightCard
  - NextActionCard
  - RecommendedPostCard
  - ActivityChart
  - DataInsightPanel

### ドメイン層
- **エンティティ（Entities）**
  - AnalysisEntity
  - AwakeningLevelEntity
  - InsightEntity
  - NextActionEntity
  - RecommendationEntity
  - ActivityDataEntity

- **リポジトリインターフェース（Repository Interfaces）**
  - IAnalysisRepository
  - IUserActivityRepository
  - IRecommendationRepository

- **ユースケース（Use Cases）**
  - GetAnalysisUseCase
  - GetAwakeningLevelUseCase
  - GetInsightsUseCase
  - GetNextActionsUseCase
  - GetRecommendationsUseCase
  - GetActivityDataUseCase
  - CompleteNextActionUseCase
  - ProvideAnalysisFeedbackUseCase

### データ層
- **リポジトリ実装（Repository Implementations）**
  - AnalysisRepository
  - UserActivityRepository
  - RecommendationRepository

- **データソース（Data Sources）**
  - AnalysisRemoteDataSource
  - UserActivityRemoteDataSource
  - RecommendationRemoteDataSource
  - AnalysisLocalDataSource
  - UserActivityLogService

- **モデル（Models）**
  - AnalysisModel
  - AwakeningLevelModel
  - InsightModel
  - NextActionModel
  - RecommendationModel
  - ActivityDataModel

### バックエンドAPI (TypeScript)

バックエンドは「フィーチャファースト構成」で実装し、分析ドメインの機能を以下の層に分けて構築します。

- **ドメイン層（domain）** - ビジネス概念
  - entities
  - valueObjects
  - repository.ts

- **アプリケーション層（application）** - ユースケース
  - getAnalysis.ts
  - getAwakeningLevel.ts
  - getInsights.ts
  - getNextActions.ts

- **インフラストラクチャ層（infrastructure）** - 外部サービス実装
  - analysisPrismaRepo.ts

- **プレゼンテーション層（presentation）** - APIルート
  - analysisRoutes.ts