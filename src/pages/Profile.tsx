import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FooterNav } from "@/components/FooterNav";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { Post } from "@/components/Post";

const Profile = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTab, setSelectedTab] = useState("media");
  const [selectedPost, setSelectedPost] = useState<Record<string, unknown> | null>(null);
  const [selectedShopItem, setSelectedShopItem] = useState<Record<string, unknown> | null>(null);

  const handlePlayVoice = () => {
    setIsPlaying(!isPlaying);
    /* Implement voice playback logic */
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-24">
      <ProfileHeader
        isPlaying={isPlaying}
        handlePlayVoice={handlePlayVoice}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />

      <ProfileTabs
        selectedTab={selectedTab}
        setSelectedPost={setSelectedPost}
        setSelectedShopItem={setSelectedShopItem}
      />

      {/* Post Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl">
          {selectedPost?.mediaType === "image" ? (
            <img
              src={selectedPost.content}
              alt=""
              className="w-full h-auto rounded-lg"
            />
          ) : (
            selectedPost && <Post {...selectedPost} />
          )}
        </DialogContent>
      </Dialog>

      {/* Shop Item Dialog */}
      <Dialog open={!!selectedShopItem} onOpenChange={() => setSelectedShopItem(null)}>
        <DialogContent className="max-w-2xl">
          {selectedShopItem && (
            <div className="space-y-4">
              <img
                src={selectedShopItem.image}
                alt={selectedShopItem.name}
                className="w-full h-auto rounded-lg"
              />
              <h2 className="text-xl font-semibold">{selectedShopItem.name}</h2>
              <p className="text-muted-foreground">{selectedShopItem.description}</p>
              <p className="text-lg font-semibold">¥{selectedShopItem.price.toLocaleString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FooterNav />
    </div>
  );
};

export default Profile;