import { BarChart, LightbulbIcon, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { AnalysisDetailView } from "./AnalysisDetailView";

export function AnalysisSection() {
  const [showDetailView, setShowDetailView] = useState(false);

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-8 pr-4">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-pink-500" />
              <h2 className="text-lg font-semibold">あなたのクローズアップ</h2>
            </div>
            <Badge variant="secondary">更新: 今日</Badge>
          </div>

          <div className="space-y-6 bg-pink-50/50 p-6 rounded-lg">
            <div>
              <h3 className="font-medium mb-2">直近の目醒めのサマリー</h3>
              <p className="text-muted-foreground">
                最近、あなたは「家族との対話」に目が向き始めています。特に以下の点で成長が見られます：
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2 text-muted-foreground">
                <li>家族との対話時間が増加傾向</li>
                <li>感情表現がより豊かに</li>
                <li>相手の立場に立った考え方の増加</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">目醒めの提案</h3>
              <p className="text-muted-foreground mb-3">こんなチャレンジはいかがでしょう？</p>
              <div className="space-y-3">
                <Card className="p-4 bg-pink-50 border-pink-100 hover:bg-pink-100/50 transition-colors cursor-pointer">
                  <h4 className="font-medium text-pink-600">苦手な親戚に手紙を書いてみる</h4>
                  <p className="text-sm text-pink-600/80 mt-1">
                    直接の対話が難しい場合、手紙から始めるのもよい方法です
                  </p>
                </Card>
                <Card className="p-4 bg-purple-50 border-purple-100 hover:bg-purple-100/50 transition-colors cursor-pointer">
                  <h4 className="font-medium text-purple-600">家族との食事時間を設定する</h4>
                  <p className="text-sm text-purple-600/80 mt-1">
                    週に1回でも、ゆっくりと話せる時間を作ってみましょう
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold">全体のクローズアップ</h2>
            </div>
            <Badge variant="secondary">過去30日の傾向</Badge>
          </div>

          <div className="space-y-6 bg-blue-50/50 p-6 rounded-lg">
            <div>
              <h3 className="font-medium">みんなの気づきのトレンド</h3>
              <p className="text-muted-foreground">
                多くの人が以下のような点に気づき始めています：
              </p>
            </div>
            
            <div className="space-y-3">
              <Card className="p-4 bg-blue-100/50 border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                <h4 className="font-medium text-blue-900">家族との関係</h4>
                <p className="text-sm text-blue-900/80 mt-1">
                  コミュニケーションの質を高めることに注目が集まっています
                </p>
              </Card>
              
              <Card className="p-4 bg-indigo-100/50 border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer">
                <h4 className="font-medium text-indigo-900">苦手なことへの向き合い方</h4>
                <p className="text-sm text-indigo-900/80 mt-1">
                  小さなステップから始める方法が支持されています
                </p>
              </Card>
              
              <Card className="p-4 bg-violet-100/50 border-violet-200 hover:bg-violet-100 transition-colors cursor-pointer">
                <h4 className="font-medium text-violet-900">自己理解の深化</h4>
                <p className="text-sm text-violet-900/80 mt-1">
                  感情の変化を観察し、理解を深める取り組みが増えています
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <AnalysisDetailView 
        open={showDetailView} 
        onClose={() => setShowDetailView(false)} 
      />
    </ScrollArea>
  );
}