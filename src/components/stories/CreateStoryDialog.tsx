import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Camera, FileVideo, Image, X, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface CreateStoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { file: File; caption: string; contentType: "image" | "video" }) => Promise<void>;
}

export default function CreateStoryDialog({
  isOpen,
  onOpenChange,
  onSubmit
}: CreateStoryDialogProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "camera">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [contentType, setContentType] = useState<"image" | "video">("image");
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine content type
    const fileContentType = file.type.startsWith("image/") ? "image" : "video";
    setContentType(fileContentType);

    // Create preview
    const fileUrl = URL.createObjectURL(file);
    setPreview(fileUrl);
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const fileContentType = file.type.startsWith("image/") ? "image" : "video";
      setContentType(fileContentType);
      
      const fileUrl = URL.createObjectURL(file);
      setPreview(fileUrl);
      setSelectedFile(file);
    }
  };

  const triggerFileInput = (type: "image" | "video") => {
    setContentType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === "image" ? "image/*" : "video/*";
      fileInputRef.current.click();
    }
  };

  const startCamera = async () => {
    try {
      const constraints = contentType === "image" 
        ? { video: { facingMode: "environment" } }
        : { video: { facingMode: "environment" }, audio: true };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          setSelectedFile(file);
          setPreview(URL.createObjectURL(file));
          stopCamera();
        }
      }, "image/jpeg");
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setCaption("");
    setPreview(null);
    stopCamera();
  };

  const handleTabChange = (value: string) => {
    stopCamera();
    setActiveTab(value as "upload" | "camera");
    
    if (value === "camera") {
      startCamera();
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        file: selectedFile,
        caption,
        contentType
      });
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating story:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={value => {
      if (!value) {
        handleClose();
      }
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ストーリーを作成</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">アップロード</TabsTrigger>
            <TabsTrigger value="camera">カメラ</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-4">
            {!preview ? (
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer h-60 flex flex-col items-center justify-center"
                onClick={() => triggerFileInput("image")}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-sm text-gray-500">
                    画像またはビデオをドラッグ&ドロップ、または選択してください
                  </p>
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        triggerFileInput("image");
                      }}
                    >
                      <Image className="h-4 w-4 mr-2" /> 画像
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        triggerFileInput("video");
                      }}
                    >
                      <FileVideo className="h-4 w-4 mr-2" /> ビデオ
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-60 w-full overflow-hidden rounded-md">
                {contentType === "image" ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <video
                    src={preview}
                    className="h-full w-full object-contain"
                    controls
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPreview(null);
                    setSelectedFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="camera" className="mt-4">
            <div className="relative h-60 w-full overflow-hidden rounded-md bg-black">
              <video
                ref={videoRef}
                className="h-full w-full object-contain"
                playsInline
                autoPlay
                muted
              />
              
              {contentType === "image" ? (
                <Button
                  type="button"
                  variant="default"
                  className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
                  onClick={captureImage}
                >
                  <Camera className="h-4 w-4 mr-2" /> 撮影
                </Button>
              ) : (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  <Button type="button" variant="default">
                    録画開始
                  </Button>
                  <Button type="button" variant="destructive">
                    録画終了
                  </Button>
                </div>
              )}
              
              <div className="absolute top-2 right-2 flex space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setContentType("image")}
                  className={contentType === "image" ? "bg-primary text-white" : ""}
                >
                  <Image className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setContentType("video")}
                  className={contentType === "video" ? "bg-primary text-white" : ""}
                >
                  <FileVideo className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {preview && (
          <div className="space-y-4 mt-4">
            <Textarea
              placeholder="キャプションを追加..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="resize-none"
              rows={2}
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedFile || isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "送信中..." : "ストーリーを投稿"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}