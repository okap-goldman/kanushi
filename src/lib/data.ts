/**
 * データモジュール
 * 
 * アプリケーションで使用するサンプルデータやモックデータを提供します。
 * 開発やテスト環境で使用するためのデータ構造が定義されています。
 */

/**
 * サンプル投稿データ
 * 
 * テスト用の投稿データの配列です。テキスト、画像、音声などの
 * 異なるメディアタイプの投稿サンプルが含まれています。
 */
export const SAMPLE_POSTS = [
  {
    author: {
      name: "かずぴー⭐︎ 【泉谷 和久】",
      image: "https://picsum.photos/567",
      id: "@kazu993_ascensionlife"
    },
    content: `11/22は婚姻のみの予定でしたが、
なんと風の時代学校の仲間達がサプライズセレモニーを開いてくださりました😭✨

誰かのこと本当の家族みたいだって思うようになるなんて、
半年前には考えたこともなかったです。
青梅に来て生まれ変わったなぁ。。

一人ひとりの仲間たちから、本当にたくさんの愛を受け取りながら毎日生きています。
お互いに気付き合いながら、最善に向かっていけるこの生き方が大好きです。
あなたがくれた愛が、僕を成長させてくれました。

僕は僕の在り方を通して、
いただいた豊かさを循環させ続けます。

いつも命を使って僕と関わってくださり、ありがとうございます。`,
    mediaType: "text" as const,
  },
  {
    author: {
      name: "かずぴー⭐︎ 【泉谷 和久】",
      image: "https://picsum.photos/678",
      id: "@kazu993_ascensionlife"
    },
    content: "https://mcdn.podbean.com/mf/web/5i9agca8msffjcfv/6b592.m4a",
    caption: "今日の瞑想音声です。心の平安を見つける瞑想の基礎について解説しています。",
    mediaType: "audio" as const,
  },
  {
    author: {
      name: "かずぴー⭐︎ 【泉谷 和久】",
      image: "https://picsum.photos/678",
      id: "@kazu993_ascensionlife"
    },
    content: "https://picsum.photos/890",
    caption: `今日の瞑想風景🌟 

宇宙とつながる特別な時間を過ごしました。
静寂の中で感じる無限の可能性。
みなさんも、自分だけの特別な瞑想空間を
見つけてみてください✨

#瞑想 #スピリチュアル #宇宙 #気づき`,
    mediaType: "image" as const,
  }
];

/**
 * ウォッチ投稿データ
 * 
 * ウォッチフィード用のサンプル投稿データです。
 * 複数のユーザーからの投稿を模したデータが含まれています。
 */
export const WATCH_POSTS = [
  {
    author: {
      name: "スピリチュアルヒーラー | 美咲",
      image: "https://picsum.photos/654",
      id: "@misaki_healer"
    },
    content: `瞑想の効果について、科学的な視点から解説します📚

最近の研究によると、定期的な瞑想は:
・ストレス軽減
・集中力向上
・免疫力アップ
・睡眠の質改善

などの効果があることが分かっています。

瞑想は特別なものではなく、誰でも始められる心の習慣です。
まずは1日5分から始めてみませんか？

#マインドフルネス #瞑想効果 #セルフケア`,
    mediaType: "text" as const,
  },
  {
    author: {
      name: "心理カウンセラー | 山田太郎",
      image: "https://picsum.photos/765",
      id: "@yamada_counselor"
    },
    content: "https://picsum.photos/876",
    caption: `今日のワークショップの様子です🌿

「自己肯定感を高める」をテーマに、
グループワークを行いました。

参加者の皆さんの気づきや変化に
心を打たれる瞬間がたくさんありました。

次回は来月開催予定です！
ご興味ある方はDMください📩

#セルフケア #メンタルヘルス #カウンセリング`,
    mediaType: "image" as const,
  },
  {
    author: {
      name: "ヨガインストラクター | 佐藤美咲",
      image: "https://picsum.photos/543",
      id: "@misaki_yoga"
    },
    content: "https://mcdn.podbean.com/mf/web/example123/yoga_meditation.m4a",
    caption: "朝のヨガ瞑想ガイド🧘‍♀️ 心と体を整える20分間のセッションです。",
    mediaType: "audio" as const,
  }
];

/**
 * ウォッチデータ
 * 
 * ウォッチ機能の統計データを提供するオブジェクトです。
 * カウント数とラベルが含まれています。
 */
export const WATCH_DATA = {
  count: 450,
  label: "ウォッチ"
};

/**
 * ファミリーデータ
 * 
 * ファミリー（フォロワー）機能の統計データを提供するオブジェクトです。
 * カウント数とラベルが含まれています。
 */
export const FAMILY_DATA = {
  count: 1200,
  label: "ファミリー"
};

/**
 * ハイライトデータ
 * 
 * ユーザープロフィールに表示されるハイライトイベントのサンプルデータです。
 * イベントのタイトル、日付、説明、画像URLが含まれています。
 */
export const HIGHLIGHTS = [
  {
    title: "瞑想ワークショップ",
    date: "2024年3月15日",
    description: "心の平安を見つける瞑想の基礎を学ぶワークショップを開催しました。",
    image: "https://picsum.photos/987"
  },
  {
    title: "風の時代学校",
    date: "2024年2月20日",
    description: "仲間たちと共に学び、成長する特別な時間を過ごしました。",
    image: "https://picsum.photos/654"
  }
];