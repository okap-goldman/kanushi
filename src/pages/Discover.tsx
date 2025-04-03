import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnalysisSection } from "@/components/discover/AnalysisSection";
import { RegionalActivitySection } from "@/components/discover/RegionalActivitySection";
import { EventsSection } from "@/components/discover/EventsSection";
import { RecommendedPostsSection } from "@/components/discover/RecommendedPostsSection";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Section = "main" | "analysis" | "regional" | "events" | "recommended";

export default function Discover() {
  const [currentSection, setCurrentSection] = useState<Section>("main");

  const renderSection = () => {
    if (currentSection !== "main") {
      const sectionComponents = {
        analysis: AnalysisSection,
        regional: RegionalActivitySection,
        events: EventsSection,
        recommended: RecommendedPostsSection
      };
      const Component = sectionComponents[currentSection];
      return (
        <Card className="p-4 md:p-6">
          <Component />
        </Card>
      );
    }

    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
            <Card 
              className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setCurrentSection("analysis")}
            >
              <h2 className="text-lg font-semibold mb-2">分析</h2>
              <p className="text-sm text-muted-foreground">
                あなたの目醒め状況を分析し、アドバイスを提供します
              </p>
            </Card>

            <Card 
              className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setCurrentSection("regional")}
            >
              <h2 className="text-lg font-semibold mb-2">地域毎の活動状況</h2>
              <p className="text-sm text-muted-foreground">
                各地域での活動状況や注目のイベントをチェック
              </p>
            </Card>

            <Card 
              className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setCurrentSection("events")}
            >
              <h2 className="text-lg font-semibold mb-2">イベント</h2>
              <p className="text-sm text-muted-foreground">
                目醒め人が企画するイベントを探す・企画する
              </p>
            </Card>

            <Card 
              className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setCurrentSection("recommended")}
            >
              <h2 className="text-lg font-semibold mb-2">おすすめ投稿</h2>
              <p className="text-sm text-muted-foreground">
                あなたにおすすめの投稿をピックアップ
              </p>
            </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="container pb-24 pt-4 space-y-6">
      <div className="flex items-center gap-4">
        {currentSection !== "main" && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCurrentSection("main")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-2xl font-bold">
          {currentSection === "main" ? "発見" : ""}
        </h1>
      </div>
      
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-6 pb-8">
          {renderSection()}
        </div>
      </ScrollArea>
    </div>
  );
}