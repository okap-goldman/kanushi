import { useState } from "react";
import StoryCircle from "./StoryCircle";
import StoryViewer from "./StoryViewer";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

interface Story {
  id: string;
  userId: string;
  username: string;
  profileImage: string;
  mediaUrl: string;
  contentType: "image" | "video";
  caption?: string;
  createdAt: string;
}

interface UserStories {
  userId: string;
  username: string;
  profileImage: string;
  stories: Story[];
  hasUnviewedStory: boolean;
}

interface StoriesRowProps {
  userStories: UserStories[];
  currentUserId: string;
  currentUserImage: string;
  onCreateStory: () => void;
  onStoryView?: (storyId: string) => void;
}

export default function StoriesRow({
  userStories,
  currentUserId,
  currentUserImage,
  onCreateStory,
  onStoryView
}: StoriesRowProps) {
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);

  const handleStoryCircleClick = (index: number) => {
    setSelectedUserIndex(index);
    setStoryViewerOpen(true);
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center px-2 py-3 gap-2">
        {/* Create Story Button */}
        <div className="flex flex-col items-center justify-center mx-2 min-w-[60px]">
          <div className="rounded-full bg-gray-100 p-[2px] mb-1">
            <div className="rounded-full bg-primary p-[2px]">
              <Button
                onClick={onCreateStory}
                variant="ghost"
                className="h-14 w-14 rounded-full p-0 flex items-center justify-center"
              >
                <Plus className="h-8 w-8 text-white" />
              </Button>
            </div>
          </div>
          <span className="text-xs text-center font-medium">ストーリー作成</span>
        </div>

        {/* User Stories */}
        {userStories.length > 0 ? (
          userStories.map((userStory, index) => (
            <StoryCircle
              key={userStory.userId}
              userId={userStory.userId}
              username={userStory.username}
              profileImage={userStory.profileImage}
              hasUnviewedStory={userStory.hasUnviewedStory}
              onClick={() => handleStoryCircleClick(index)}
            />
          ))
        ) : (
          <div className="flex-1 text-center text-sm text-muted-foreground py-2">
            ストーリーがありません
          </div>
        )}
      </div>

      {/* Story Viewer Modal */}
      <StoryViewer
        userStories={userStories}
        initialUserIndex={selectedUserIndex}
        initialStoryIndex={0}
        isOpen={storyViewerOpen}
        onOpenChange={setStoryViewerOpen}
        onStoryView={onStoryView}
      />
    </div>
  );
}