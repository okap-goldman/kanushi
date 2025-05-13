import { Heart, MessageSquare, Flame } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface PostActionsProps {
  postId: string;
  onComment: () => void;
}

export function PostActions({ postId, onComment }: PostActionsProps) {
  const [liked, setLiked] = useState(false);
  const [kuratta, setKuratta] = useState(false);
  const [kurattaText, setKurattaText] = useState("");
  const [showKurattaDialog, setShowKurattaDialog] = useState(false);

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 group"
        onClick={() => setLiked(!liked)}
      >
        <Heart 
          className={cn(
            "h-5 w-5 transition-all duration-300 ease-in-out",
            liked && "fill-red-500 text-red-500 scale-125 animate-heartBeat"
          )} 
        />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2"
        onClick={onComment}
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => !kuratta && setShowKurattaDialog(true)}
        disabled={kuratta}
      >
        <Flame className={`h-5 w-5 ${kuratta ? "fill-orange-500 text-orange-500" : ""}`} />
      </Button>

      <Dialog open={showKurattaDialog} onOpenChange={setShowKurattaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>どんなことが魂に響きましたか？</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="どんなことが魂に響きましたか？自由に入力してください"
              value={kurattaText}
              onChange={(e) => setKurattaText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button
              onClick={() => {
                if (kurattaText.trim()) {
                  setKuratta(true);
                  setShowKurattaDialog(false);
                  // ここでkurattaTextを使って必要な処理を行う
                  console.log("ハイライトテキスト:", kurattaText);
                }
              }}
              className="w-full"
            >
              送信
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}