import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RegionCharacteristics } from "./RegionCharacteristics";
import { RegionEvents } from "./RegionEvents";
import { RegionPeople } from "./RegionPeople";
import { RegionSpecialties } from "./RegionSpecialties";

interface RegionDetailViewProps {
  open: boolean;
  onClose: () => void;
  region: string;
}

const REGIONS_DATA = {
  "北海道・東北": {
    description: "大自然の中での瞑想と気づき",
    activeUsers: "234",
    features: {
      characteristics: "広大な大地と豊かな自然に恵まれた地域。パワースポットが多く点在し、特に阿寒湖や出羽三山は古くから修験道の聖地として知られています。",
      specialties: [
        "オーガニック野菜",
        "天然水晶",
        "浄化用の岩塩",
        "瞑想用クッション（地元職人作）"
      ],
      people: [
        {
          name: "山田悟道",
          role: "瞑想指導者",
          description: "20年以上の瞑想経験を持つ。自然と調和した生活を提唱。"
        },
        {
          name: "鈴木癒子",
          role: "ヒーラー",
          description: "地元の薬草を使用したヒーリングを実践。"
        }
      ]
    }
  },
  "関東": {
    description: "都市部でのマインドフルネス実践",
    activeUsers: "567",
    features: {
      characteristics: "現代的なスピリチュアリティの中心地。都会の中でも静寂を見出し、新しい気づきの形を模索しています。",
      specialties: [
        "オリジナル瞑想アプリ",
        "チャクラ調整ジュエリー",
        "都市型瞑想スペース",
        "デジタルデトックスリトリート"
      ],
      people: [
        {
          name: "佐藤明視",
          role: "マインドフルネス講師",
          description: "企業向けマインドフルネスプログラムを展開。"
        },
        {
          name: "田中波動",
          role: "エネルギーワーカー",
          description: "都市部のエネルギー浄化を専門とする。"
        }
      ]
    }
  },
  "中部": {
    description: "伝統と現代的な目醒めの融合",
    activeUsers: "345",
    features: {
      characteristics: "日本アルプスの麓に位置し、古来からの修験道と現代的なスピリチュアリティが融合する地域。",
      specialties: [
        "パワーストーン",
        "浄化用の竹炭",
        "瞑想用和紙",
        "オリジナル香"
      ],
      people: [
        {
          name: "中村修験",
          role: "修験道師",
          description: "現代的な解釈で修験道を伝える。"
        },
        {
          name: "小林瞑想",
          role: "瞑想指導者",
          description: "山岳瞑想プログラムを主催。"
        }
      ]
    }
  },
  "近畿": {
    description: "古都での精神性の探求",
    activeUsers: "456",
    features: {
      characteristics: "古都の歴史的な寺社仏閣と現代的なスピリチュアリティが調和する地域。伝統的な瞑想法を現代に活かす取り組みが盛ん。",
      specialties: [
        "伝統的な瞑想具",
        "お香",
        "和紙製マインドフルネスノート",
        "瞑想用座布団"
      ],
      people: [
        {
          name: "西田禅心",
          role: "禅僧",
          description: "現代人向けの禅プログラムを提供。"
        },
        {
          name: "木村気付",
          role: "気功師",
          description: "古都のエネルギーを活用したヒーリングを実践。"
        }
      ]
    }
  },
  "中国・四国": {
    description: "地域に根ざした心の癒し",
    activeUsers: "234",
    features: {
      characteristics: "豊かな自然と温泉に恵まれた地域。地域の伝統的な癒しの文化と現代的なヒーリングが融合。",
      specialties: [
        "ヒーリング用クリスタル",
        "地元産ハーブティー",
        "瞑想用クッション",
        "自然音CD"
      ],
      people: [
        {
          name: "高橋自然",
          role: "自然療法士",
          description: "地域の自然を活用したヒーリングプログラムを提供。"
        },
        {
          name: "松本癒し",
          role: "音楽セラピスト",
          description: "自然音を使ったヒーリング音楽を制作。"
        }
      ]
    }
  },
  "九州・沖縄": {
    description: "島々のエネルギーと調和",
    activeUsers: "345",
    features: {
      characteristics: "南国特有のエネルギーと島々の神秘的なパワースポットが点在する地域。独自のスピリチュアル文化を育んでいます。",
      specialties: [
        "浄化用の塩",
        "南国ハーブ",
        "シーグラス瞑想ツール",
        "島藍染めヨガマット"
      ],
      people: [
        {
          name: "島田波動",
          role: "シャーマン",
          description: "島々の伝統的な癒しの技法を継承。"
        },
        {
          name: "城間祈り",
          role: "祈祷師",
          description: "伝統的な祈りの文化を現代に伝える。"
        }
      ]
    }
  }
};

export function RegionDetailView({ open, onClose, region }: RegionDetailViewProps) {
  // Don't proceed if there's no region selected
  if (!region) return null;
  
  const regionData = REGIONS_DATA[region as keyof typeof REGIONS_DATA];

  if (!regionData) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0">
        <ScrollArea className="h-[80vh]">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{region}の目醒め情報</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="hover:bg-destructive/10 transition-colors"
              >
                <X className="w-5 h-5" />
                <span className="sr-only">閉じる</span>
              </Button>
            </div>

            <div className="space-y-8">
              <RegionCharacteristics characteristics={regionData.features.characteristics} />
              <RegionEvents />
              <RegionPeople people={regionData.features.people} />
              <RegionSpecialties specialties={regionData.features.specialties} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
