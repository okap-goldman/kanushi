/**
 * プロフィールタブモジュール
 * 
 * ユーザープロフィールのタブ付きセクションを提供します。
 * メディア、音声、テキスト、ハイライト、イベントなどの異なるコンテンツタイプを
 * 整理して表示します。
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Post } from "@/components/Post";
import { SAMPLE_POSTS } from "@/lib/data";

/**
 * プロフィールタブコンポーネントのプロパティ型定義
 * 
 * @typedef {Object} ProfileTabsProps
 * @property {string} selectedTab - 現在選択されているタブの識別子
 * @property {Function} setSelectedPost - 投稿が選択されたときに呼び出されるコールバック関数
 * @property {Function} [setSelectedShopItem] - ショップアイテムが選択されたときに呼び出されるオプションのコールバック関数
 */
interface ProfileTabsProps {
  selectedTab: string;
  setSelectedPost: (post: PostType) => void;
  setSelectedShopItem?: (item: PostType) => void;
}

/**
 * 投稿データの型定義
 * 
 * @typedef {Object} PostType
 * @property {Object} author - 投稿者情報
 * @property {string} author.name - 投稿者名
 * @property {string} author.image - 投稿者のプロフィール画像URL
 * @property {string} author.id - 投稿者のID
 * @property {string} content - 投稿内容（テキストまたはメディアのURL）
 * @property {string} [caption] - オプションの画像や動画のキャプション
 * @property {"text" | "image" | "video" | "audio"} mediaType - 投稿のメディアタイプ
 */
type PostType = {
  author: {
    name: string;
    image: string;
    id: string;
  };
  content: string;
  caption?: string;
  mediaType: "text" | "image" | "video" | "audio";
};

/**
 * プロフィールタブコンポーネント
 * 
 * ユーザープロフィールの異なるコンテンツタイプを表示するためのタブインターフェースを提供します。
 * メディア、音声、テキスト、ハイライト、イベントなどのタブが含まれています。
 * 各タブは関連するコンテンツタイプのデータを表示します。
 * 
 * @param {ProfileTabsProps} props - コンポーネントのプロパティ
 * @param {string} props.selectedTab - 現在選択されているタブ
 * @param {Function} props.setSelectedPost - 投稿が選択されたときのハンドラー関数
 * @returns {JSX.Element} プロフィールタブコンポーネント
 */
export function ProfileTabs({ selectedTab, setSelectedPost }: ProfileTabsProps) {
  return (
    <Tabs defaultValue={selectedTab} className="mt-8">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="media">メディア</TabsTrigger>
        <TabsTrigger value="audio">音声</TabsTrigger>
        <TabsTrigger value="text">テキスト</TabsTrigger>
        <TabsTrigger value="highlights">ハイライト</TabsTrigger>
        <TabsTrigger value="events">イベント</TabsTrigger>
      </TabsList>

      <TabsContent value="media" className="mt-4">
        <div className="grid grid-cols-3 gap-1">
          {SAMPLE_POSTS.filter((post: PostType) => post.mediaType === "image").map((post, index) => (
            <Card 
              key={index} 
              className="aspect-square overflow-hidden cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <img
                src={post.content}
                alt=""
                className="w-full h-full object-cover"
              />
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="audio" className="mt-4">
        <div className="space-y-4">
          {SAMPLE_POSTS.filter((post: PostType) => post.mediaType === "audio").map((post, index) => (
            <Card key={index} className="p-4">
              <iframe
                width="100%"
                height="300"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src={post.content}
                className="rounded-md"
              />
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="text" className="mt-4">
        <div className="space-y-4">
          {SAMPLE_POSTS.filter((post: PostType) => post.mediaType === "text").map((post, index) => (
            <div key={index} onClick={() => setSelectedPost(post)}>
              <Post {...post} />
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="highlights" className="mt-4">
        <div className="space-y-4">
          {SAMPLE_POSTS.map((post, index) => (
            <Post key={index} {...post} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="events" className="mt-4">
        <Card className="p-4">
          <h3 className="font-medium">瞑想ワークショップ</h3>
          <p className="text-sm text-muted-foreground">2024年4月1日 14:00-16:00</p>
          <p className="mt-2">心の平安を見つける瞑想の基礎を学びましょう。</p>
        </Card>
      </TabsContent>
    </Tabs>
  );
}