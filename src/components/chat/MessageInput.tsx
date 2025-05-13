import { useState, useRef, FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Camera, 
  Paperclip, 
  Mic, 
  Send, 
  Image, 
  Video, 
  X, 
  FileAudio
} from "lucide-react";
import { uploadFile, uploadAudioBlob } from "@/lib/supabase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MessageInputProps {
  onSendMessage: (content: string, contentType: 'text' | 'image' | 'video' | 'audio', mediaUrl?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ 
  onSendMessage, 
  disabled = false,
  placeholder = "メッセージを入力..."
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  
  // For audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (disabled) return;
    
    // Handle media upload if there's media
    if (mediaType && mediaFile) {
      try {
        // Upload file to Supabase
        const folder = mediaType === 'image' ? 'message-images' : 
                      mediaType === 'video' ? 'message-videos' : 'message-audio';
                      
        const { url, error } = await uploadFile(mediaFile, 'media', folder);
        
        if (error || !url) {
          console.error('Error uploading media:', error);
          return;
        }
        
        // Send message with media URL
        onSendMessage(message, mediaType, url);
        
        // Reset state
        setMessage("");
        setMediaPreview(null);
        setMediaType(null);
        setMediaFile(null);
      } catch (error) {
        console.error('Error uploading media:', error);
      }
    } else if (message.trim()) {
      // Send text message
      onSendMessage(message, 'text');
      setMessage("");
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const fileType = file.type.split('/')[0];
    
    if (fileType === 'image') {
      setMediaType('image');
    } else if (fileType === 'video') {
      setMediaType('video');
    } else if (fileType === 'audio') {
      setMediaType('audio');
    } else {
      alert('Unsupported file type. Please select an image, video, or audio file.');
      return;
    }
    
    setMediaFile(file);
    
    // Create a preview for images and videos
    if (fileType === 'image' || fileType === 'video') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // For audio, just set a placeholder
      setMediaPreview('audio');
    }
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.addEventListener('dataavailable', (e) => {
        audioChunksRef.current.push(e.data);
      });
      
      mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Upload the audio blob
        try {
          const { url, error } = await uploadAudioBlob(audioBlob);
          
          if (error || !url) {
            console.error('Error uploading audio:', error);
            return;
          }
          
          // Send message with audio URL
          onSendMessage(message || "Audio message", 'audio', url);
          
          // Reset state
          setMessage("");
          setIsRecording(false);
        } catch (error) {
          console.error('Error uploading audio:', error);
        } finally {
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        }
      });
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };
  
  const cancelMedia = () => {
    setMediaPreview(null);
    setMediaType(null);
    setMediaFile(null);
    
    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mediaInputRef.current) mediaInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full">
      {/* Media preview */}
      {mediaPreview && (
        <div className="relative mb-2 max-w-xs">
          <button 
            type="button"
            onClick={cancelMedia}
            className="absolute top-1 right-1 bg-gray-800 rounded-full p-1 opacity-70 hover:opacity-100"
          >
            <X size={16} className="text-white" />
          </button>
          
          {mediaType === 'image' && (
            <img 
              src={mediaPreview} 
              alt="Selected" 
              className="max-h-40 rounded-md object-contain bg-gray-100"
            />
          )}
          
          {mediaType === 'video' && (
            <video 
              src={mediaPreview} 
              className="max-h-40 rounded-md" 
              controls
            />
          )}
          
          {mediaType === 'audio' && (
            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md">
              <FileAudio size={24} />
              <span className="text-sm">{mediaFile?.name || 'Audio file'}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Message input area */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" size="icon" variant="ghost" className="rounded-full">
              <Paperclip size={20} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start" side="top">
            <div className="flex gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="rounded-full"
                onClick={() => mediaInputRef.current?.click()}
              >
                <Image size={20} />
              </Button>
              
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="rounded-full"
                onClick={() => mediaInputRef.current?.click()}
              >
                <Video size={20} />
              </Button>
              
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="rounded-full"
                onClick={() => audioInputRef.current?.click()}
              >
                <FileAudio size={20} />
              </Button>
              
              <input
                type="file"
                ref={mediaInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                style={{ display: 'none' }}
              />
              
              <input
                type="file"
                ref={audioInputRef}
                onChange={handleFileSelect}
                accept="audio/*"
                style={{ display: 'none' }}
              />
            </div>
          </PopoverContent>
        </Popover>
        
        <Button 
          type="button" 
          size="icon" 
          variant="ghost" 
          className="rounded-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera size={20} />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            style={{ display: 'none' }}
            capture="environment"
          />
        </Button>
        
        <Input
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isRecording}
          className="rounded-full"
        />
        
        {message.trim() || mediaPreview ? (
          <Button 
            type="submit" 
            size="icon" 
            disabled={disabled || (!message.trim() && !mediaPreview)}
            className="rounded-full bg-blue-500 hover:bg-blue-600"
          >
            <Send size={20} className="text-white" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            variant={isRecording ? "destructive" : "default"}
            className="rounded-full"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
          >
            <Mic size={20} />
          </Button>
        )}
      </div>
    </form>
  );
}