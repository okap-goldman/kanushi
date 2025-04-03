import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Post } from "@/components/Post";
import { ApiTest } from "@/components/ApiTest";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SAMPLE_POSTS = [
  {
    author: {
      name: "Shota | 宇宙くん",
      image: "https://cdn.peraichi.com/userData/5e92b452-dcb8-4abc-a728-72d20a0000fe/img/660caeff26c50/original.jpg",
      id: "@uchu_kun__shota"
    },
    content: `僕の朝のルーティーン
    
朝起きて、まずは自分の部屋にご挨拶します✨

部屋を神殿として扱っているので♪

家はもちろんですが、特に自分の部屋のエネルギーは、自分の心の深いところと繋がってるので、扱い方を丁寧にするのがお勧めです🏠

部屋の状態と、心の裏側はとても似た姿をしています❤️`,
    mediaType: "text" as const,
  },
  {
    author: {
      name: "Kanako | スピリチュアルヒーラー",
      image: "https://kuripura.s3.us-east-1.amazonaws.com/Kanako.jpg",
      id: "@nkmrknk694"
    },
    content: "https://kuripura.s3.us-east-1.amazonaws.com/image.jpg",
    caption: `🃏11月のカードリーディング🃏

各々のなかの正義がはっきりさせる。
自分はどうしたいのか、
どう生きてどう在りたいのか。
私の中の大切なものってなんだっけ？
そこがハッキリしてないと
この先どうしたらいいのかが分からなくなりやすい。
誰かが決めてくれることじゃない。
慈愛を自分自身に向け、
内に秘めたものととことん向き合う時期。

各々の中の正義がハッキリしてくるからこそ
言い方ものの伝え方をより丁寧に。
自分の中から溢れ出る情熱や熱量を
相手の中にも正義があることを踏まえた上で
いかに丁寧に誠実に表現していくかがポイント。
傷ついた、傷付けられた、といったような被害者意識から抜けていくこと、
目の前で起きる全てのことは
自分が映し出してるといった意識、
ある種の責任感をもって生きていくことも大切。

迷いがある、自信がない、
人を信じられないとかいってる場合じゃないし
優柔不断してる場合じゃない。
（迷いのカードが3枚も出てます🫨）

自分自身のなりたい姿は
あなたがあなたのために、
強く決め切ることから始まります。

前田慶次（私の最推しｷﾀｰ‼︎）からのメッセージ

〜自己を放て〜
「偽りのないそのままの君の素直な気持ちが俺は聞きたいんだ」

おわり

ちょっといつもと違う読み方をしてみた！！

ワンドとソード、大アルカナがおおく
たくさんの人たちにとって
本当に分岐点なんだなぁといった印象…
本当の自分を嘘偽りなく
生き切ると決め切った方たちの情熱ワンド。
迷いを断ち切ろうとしてる方たちのソード。

ちょっとというか、やっぱりというか
強め厳しめのメッセージだったかな🫨

私もより一層、誠実に丁寧に
自分と一致して生きていくこと、
その行動をためらわないこと徹底していきます⭐️`,
    mediaType: "image" as const,
  },
  {
    author: {
      name: "かずぴー⭐︎ 【泉谷 和久】",
      image: "https://kuripura.s3.us-east-1.amazonaws.com/kazup.jpg",
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
      name: "Shota | 宇宙くん",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
      id: "@uchu_kun__shota"
    },
    content: "https://mcdn.podbean.com/mf/web/ph7adzrxywrxv7it/bbygr.m4a",
    caption: "ただバスケを見た話。笑",
    mediaType: "audio" as const,
  },
  {
    author: {
      name: "内なる光",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
      id: "@inner_light"
    },
    content: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    caption: "この動画から多くの気づきを得ました。皆さんにもシェアしたいと思います。",
    mediaType: "video" as const,
  },
];

const Index = () => {
  const [timelineType, setTimelineType] = useState<"family" | "watch">("family");
  const [showWatchConfirm, setShowWatchConfirm] = useState(false);

  const handleTimelineChange = (type: "family" | "watch") => {
    if (type === "watch") {
      setShowWatchConfirm(true);
    } else {
      setTimelineType(type);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <ApiTest />
        </div>

        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={timelineType === "family" ? "default" : "outline"}
            onClick={() => handleTimelineChange("family")}
          >
            ファミリー
          </Button>
          <Button
            variant={timelineType === "watch" ? "default" : "outline"}
            onClick={() => handleTimelineChange("watch")}
          >
            ウォッチ
          </Button>
        </div>

        <div className="space-y-4 max-w-xl mx-auto">
          {SAMPLE_POSTS.map((post, index) => (
            <Post key={index} {...post} />
          ))}
        </div>
      </main>

      <AlertDialog open={showWatchConfirm} onOpenChange={setShowWatchConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ウォッチタイムラインの表示</AlertDialogTitle>
            <AlertDialogDescription>
              ウォッチタイムラインを表示しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setTimelineType("watch");
                setShowWatchConfirm(false);
              }}
            >
              表示する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;