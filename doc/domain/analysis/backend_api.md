# 分析ドメイン - バックエンドAPI実装

## 1. バックエンドAPI実装 (TypeScript)

分析ドメインのバックエンドAPIはTypeScriptで「フィーチャファースト構成」に基づいて実装します。
以下にコード例を示します。

### 1.1 ドメイン層 - エンティティとバリューオブジェクト

```typescript
// src/features/analysis/domain/entities/Analysis.ts
export type AnalysisId = string;

export class Analysis {
  constructor(
    public readonly id: AnalysisId,
    public readonly userId: string,
    public readonly awakeningLevel: AwakeningLevel,
    public readonly insights: Insight[],
    public readonly nextActions: NextAction[],
    public readonly analysisDate: Date = new Date()
  ) {}
}

// src/features/analysis/domain/entities/AwakeningLevel.ts
export class AwakeningLevel {
  constructor(
    public readonly score: number,
    public readonly factors: string[],
    public readonly trend: AwakeningTrendPoint[],
    public readonly description: string
  ) {
    // スコアの範囲をバリデーション
    if (score < 0 || score > 100) {
      throw new Error('目醒め度スコアは0〜100の範囲である必要があります');
    }
  }
}

export class AwakeningTrendPoint {
  constructor(
    public readonly date: Date,
    public readonly score: number
  ) {}
}

// src/features/analysis/domain/entities/Insight.ts
export type InsightId = string;

export enum InsightType {
  BEHAVIORAL = 'behavioral',
  CONTENT_PREFERENCE = 'contentPreference',
  SOCIAL_INTERACTION = 'socialInteraction',
  LEARNING_PATTERN = 'learningPattern',
  SPIRITUAL_TREND = 'spiritualTrend',
  LIFECYCLE_PATTERN = 'lifecyclePattern'
}

export class Insight {
  constructor(
    public readonly id: InsightId,
    public readonly content: string,
    public readonly type: InsightType,
    public readonly importance: number,
    public readonly evidenceKeys: string[],
    public readonly evidenceData: Record<string, any>,
    public readonly generatedAt: Date = new Date()
  ) {
    // 重要度の範囲をバリデーション
    if (importance < 1 || importance > 10) {
      throw new Error('洞察の重要度は1〜10の範囲である必要があります');
    }
  }
}

// src/features/analysis/domain/entities/NextAction.ts
export type NextActionId = string;

export enum ActionType {
  APP_FEATURE = 'appFeature',
  CONTENT = 'content',
  EVENT = 'event',
  LIFESTYLE = 'lifestyle',
  LEARNING = 'learning',
  SOCIAL = 'social'
}

export enum ActionStatus {
  SUGGESTED = 'suggested',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped'
}

export class NextAction {
  constructor(
    public readonly id: NextActionId,
    public readonly title: string,
    public readonly description: string,
    public readonly actionType: ActionType,
    public readonly expectedOutcomes: string[],
    public readonly status: ActionStatus,
    public readonly suggestedAt: Date,
    public readonly completedAt?: Date,
    public readonly resourceUrl?: string,
    public readonly eventId?: string,
    public readonly postId?: string,
    public readonly userId?: string
  ) {}
}
```

### 1.2 インフラストラクチャ層 - リポジトリ実装

```typescript
// src/features/analysis/infrastructure/analysisPrismaRepo.ts
import { PrismaClient } from '@prisma/client';
import { AnalysisRepository } from '../domain/repository';
import { Analysis, AnalysisId } from '../domain/entities/Analysis';
import { AwakeningLevel, AwakeningTrendPoint } from '../domain/entities/AwakeningLevel';
import { Insight, InsightId, InsightType } from '../domain/entities/Insight';
import { NextAction, NextActionId, ActionType, ActionStatus } from '../domain/entities/NextAction';
import { NotFoundError } from '../../../shared/errors/notFoundError';

export class AnalysisPrismaRepository implements AnalysisRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAnalysisById(id: AnalysisId): Promise<Analysis | null> {
    const data = await this.prisma.analysis.findUnique({
      where: { id },
      include: {
        awakeningLevel: {
          include: {
            trend: true
          }
        },
        insights: true,
        nextActions: true
      }
    });

    if (!data) return null;

    return this._mapToDomain(data);
  }

  async getAnalysisByUserId(userId: string): Promise<Analysis | null> {
    const data = await this.prisma.analysis.findFirst({
      where: { userId },
      orderBy: { analysisDate: 'desc' },
      include: {
        awakeningLevel: {
          include: {
            trend: true
          }
        },
        insights: true,
        nextActions: true
      }
    });

    if (!data) return null;

    return this._mapToDomain(data);
  }

  private _mapToDomain(data: any): Analysis {
    const trendPoints = data.awakeningLevel.trend.map((t: any) => new AwakeningTrendPoint(
      t.date,
      t.score
    ));

    const awakeningLevel = new AwakeningLevel(
      data.awakeningLevel.score,
      data.awakeningLevel.factors,
      trendPoints,
      data.awakeningLevel.description
    );

    const insights = data.insights.map((i: any) => new Insight(
      i.id,
      i.content,
      i.type as InsightType,
      i.importance,
      i.evidenceKeys,
      i.evidenceData,
      i.generatedAt
    ));

    const nextActions = data.nextActions.map((a: any) => this._mapToNextActionDomain(a));

    return new Analysis(
      data.id,
      data.userId,
      awakeningLevel,
      insights,
      nextActions,
      data.analysisDate
    );
  }

  private _mapToNextActionDomain(data: any): NextAction {
    return new NextAction(
      data.id,
      data.title,
      data.description,
      data.actionType as ActionType,
      data.expectedOutcomes,
      data.status as ActionStatus,
      data.suggestedAt,
      data.completedAt,
      data.resourceUrl,
      data.eventId,
      data.postId,
      data.userId
    );
  }
}
```

### 1.3 プレゼンテーション層 - APIルート

```typescript
// src/features/analysis/presentation/analysisRoutes.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AnalysisPrismaRepository } from '../infrastructure/analysisPrismaRepo';
import { GetAnalysis } from '../application/getAnalysis';
import { GetAwakeningLevel } from '../application/getAwakeningLevel';
import { GetInsights } from '../application/getInsights';
import { CompleteNextAction } from '../application/completeNextAction';
import { authenticate } from '../../../middleware/auth';
import { InsightType } from '../domain/entities/Insight';

const prisma = new PrismaClient();
const analysisRepo = new AnalysisPrismaRepository(prisma);

// ユースケースのインスタンス化
const getAnalysis = new GetAnalysis(analysisRepo);
const getAwakeningLevel = new GetAwakeningLevel(analysisRepo);
const getInsights = new GetInsights(analysisRepo);
const completeNextAction = new CompleteNextAction(analysisRepo);

export const analysisRoutes = Router();

// 認証ミドルウェアを適用
analysisRoutes.use(authenticate);

// 分析データ全体を取得
analysisRoutes.get('/', async (req, res) => {
  try {
    const userId = req.user.id; // 認証済みユーザーID
    const analysis = await getAnalysis.execute(userId);
    
    if (!analysis) {
      return res.status(404).json({ message: '分析データが見つかりません' });
    }
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('分析データ取得エラー:', error);
    res.status(500).json({ 
      message: '分析データの取得に失敗しました',
      error: error instanceof Error ? error.message : '未知のエラー'
    });
  }
});

// 目醒め度データを取得
analysisRoutes.get('/awakening-level', async (req, res) => {
  try {
    const userId = req.user.id;
    const awakeningLevel = await getAwakeningLevel.execute(userId);
    
    if (!awakeningLevel) {
      return res.status(404).json({ message: '目醒め度データが見つかりません' });
    }
    
    res.status(200).json(awakeningLevel);
  } catch (error) {
    console.error('目醒め度データ取得エラー:', error);
    res.status(500).json({ 
      message: '目醒め度データの取得に失敗しました',
      error: error instanceof Error ? error.message : '未知のエラー'
    });
  }
});

// 洞察データを取得
analysisRoutes.get('/insights', async (req, res) => {
  try {
    const userId = req.user.id;
    const typeParam = req.query.type as string;
    
    // 特定タイプの洞察のみ取得するフィルタリングを許可
    let type: InsightType | undefined;
    if (typeParam && Object.values(InsightType).includes(typeParam as InsightType)) {
      type = typeParam as InsightType;
    }
    
    const insights = await getInsights.execute(userId, type);
    
    res.status(200).json(insights);
  } catch (error) {
    console.error('洞察データ取得エラー:', error);
    res.status(500).json({ 
      message: '洞察データの取得に失敗しました',
      error: error instanceof Error ? error.message : '未知のエラー'
    });
  }
});

// 次のステップ提案を完了としてマーク
analysisRoutes.post('/next-actions/:actionId/complete', async (req, res) => {
  try {
    const userId = req.user.id;
    const { actionId } = req.params;
    
    const success = await completeNextAction.execute(actionId, userId);
    
    if (success) {
      res.status(200).json({ message: 'アクションが完了として記録されました' });
    } else {
      res.status(404).json({ message: '指定されたアクションが見つかりません' });
    }
  } catch (error) {
    console.error('アクション完了記録エラー:', error);
    res.status(500).json({ 
      message: 'アクションの完了記録に失敗しました',
      error: error instanceof Error ? error.message : '未知のエラー'
    });
  }
});
```