# 分析ドメイン - データモデル詳細

## 1. データモデル詳細

### 1.1 AwakeningLevelModel

```dart
class AwakeningLevelModel extends AwakeningLevelEntity {
  AwakeningLevelModel({
    required int score,
    required List<String> factors,
    required List<AwakeningTrendPoint> trend,
    required String description,
  }) : super(
    score: score,
    factors: factors,
    trend: trend,
    description: description,
  );
  
  factory AwakeningLevelModel.fromJson(Map<String, dynamic> json) {
    return AwakeningLevelModel(
      score: json['score'],
      factors: List<String>.from(json['factors']),
      trend: (json['trend'] as List)
          .map((point) => AwakeningTrendPoint.fromJson(point))
          .toList(),
      description: json['description'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'score': score,
      'factors': factors,
      'trend': trend.map((point) => point.toJson()).toList(),
      'description': description,
    };
  }
}

class AwakeningTrendPoint {
  final DateTime date;
  final int score;
  
  AwakeningTrendPoint({
    required this.date,
    required this.score,
  });
  
  factory AwakeningTrendPoint.fromJson(Map<String, dynamic> json) {
    return AwakeningTrendPoint(
      date: DateTime.parse(json['date']),
      score: json['score'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'date': date.toIso8601String(),
      'score': score,
    };
  }
}
```

### 1.2 InsightModel

```dart
enum InsightType {
  behavioral,
  contentPreference,
  socialInteraction,
  learningPattern,
  spiritualTrend,
  lifecyclePattern
}

class InsightModel extends InsightEntity {
  InsightModel({
    required String id,
    required String content,
    required InsightType type,
    required int importance,
    required List<String> evidenceKeys,
    required Map<String, dynamic> evidenceData,
    required DateTime generatedAt,
  }) : super(
    id: id,
    content: content,
    type: type,
    importance: importance,
    evidenceKeys: evidenceKeys,
    evidenceData: evidenceData,
    generatedAt: generatedAt,
  );
  
  factory InsightModel.fromJson(Map<String, dynamic> json) {
    return InsightModel(
      id: json['id'],
      content: json['content'],
      type: InsightType.values.firstWhere(
          (e) => e.toString().split('.').last == json['type'],
          orElse: () => InsightType.behavioral),
      importance: json['importance'],
      evidenceKeys: List<String>.from(json['evidence_keys']),
      evidenceData: json['evidence_data'],
      generatedAt: DateTime.parse(json['generated_at']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'type': type.toString().split('.').last,
      'importance': importance,
      'evidence_keys': evidenceKeys,
      'evidence_data': evidenceData,
      'generated_at': generatedAt.toIso8601String(),
    };
  }
}
```

### 1.3 NextActionModel

```dart
enum ActionType {
  appFeature,
  content,
  event,
  lifestyle,
  learning,
  social
}

enum ActionStatus {
  suggested,
  inProgress,
  completed,
  skipped
}

class NextActionModel extends NextActionEntity {
  NextActionModel({
    required String id,
    required String title,
    required String description,
    required ActionType actionType,
    required List<String> expectedOutcomes,
    required ActionStatus status,
    required DateTime suggestedAt,
    DateTime? completedAt,
    String? resourceUrl,
    String? eventId,
    String? postId,
    String? userId,
  }) : super(
    id: id,
    title: title,
    description: description,
    actionType: actionType,
    expectedOutcomes: expectedOutcomes,
    status: status,
    suggestedAt: suggestedAt,
    completedAt: completedAt,
    resourceUrl: resourceUrl,
    eventId: eventId,
    postId: postId,
    userId: userId,
  );
  
  factory NextActionModel.fromJson(Map<String, dynamic> json) {
    return NextActionModel(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      actionType: ActionType.values.firstWhere(
          (e) => e.toString().split('.').last == json['action_type'],
          orElse: () => ActionType.appFeature),
      expectedOutcomes: List<String>.from(json['expected_outcomes']),
      status: ActionStatus.values.firstWhere(
          (e) => e.toString().split('.').last == json['status'],
          orElse: () => ActionStatus.suggested),
      suggestedAt: DateTime.parse(json['suggested_at']),
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'])
          : null,
      resourceUrl: json['resource_url'],
      eventId: json['event_id'],
      postId: json['post_id'],
      userId: json['user_id'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'action_type': actionType.toString().split('.').last,
      'expected_outcomes': expectedOutcomes,
      'status': status.toString().split('.').last,
      'suggested_at': suggestedAt.toIso8601String(),
      'completed_at': completedAt?.toIso8601String(),
      'resource_url': resourceUrl,
      'event_id': eventId,
      'post_id': postId,
      'user_id': userId,
    };
  }
}
```

### 1.4 ActivityDataModel

```dart
class ActivityDataModel extends ActivityDataEntity {
  ActivityDataModel({
    required String userId,
    required Map<String, int> counts,
    required Map<String, double> engagementMetrics,
    required List<TimeSeriesPoint> timeSeriesData,
    required DateTime startDate,
    required DateTime endDate,
  }) : super(
    userId: userId,
    counts: counts,
    engagementMetrics: engagementMetrics,
    timeSeriesData: timeSeriesData,
    startDate: startDate,
    endDate: endDate,
  );
  
  factory ActivityDataModel.fromJson(Map<String, dynamic> json) {
    return ActivityDataModel(
      userId: json['user_id'],
      counts: Map<String, int>.from(json['counts']),
      engagementMetrics: Map<String, double>.from(json['engagement_metrics']),
      timeSeriesData: (json['time_series_data'] as List)
          .map((point) => TimeSeriesPoint.fromJson(point))
          .toList(),
      startDate: DateTime.parse(json['start_date']),
      endDate: DateTime.parse(json['end_date']),
    );
  }
  
  Map<String, dynamic> toJson() {
    final Map<String, int> countsJson = {};
    counts.forEach((key, value) {
      countsJson[key] = value;
    });
    
    final List<Map<String, dynamic>> timeSeriesJson = 
        timeSeriesData.map((point) => point.toJson()).toList();
    
    return {
      'counts': countsJson,
      'engagement_metrics': engagementMetrics,
      'time_series_data': timeSeriesJson,
      'start_date': startDate.toIso8601String(),
      'end_date': endDate.toIso8601String(),
    };
  }
}

class TimeSeriesPoint {
  final DateTime date;
  final double value;
  
  TimeSeriesPoint({
    required this.date,
    required this.value,
  });
  
  factory TimeSeriesPoint.fromJson(Map<String, dynamic> json) {
    return TimeSeriesPoint(
      date: DateTime.parse(json['date']),
      value: json['value'].toDouble(),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'date': date.toIso8601String(),
      'value': value,
    };
  }
}

enum ActivityType {
  post,
  comment,
  like,
  highlight,
  view,
  search,
  event,
  profile
}
```