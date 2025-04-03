import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface TextPostFormProps {
  onSubmit: (title: string, text_content: string) => void;
}

export function TextPostForm({ onSubmit }: TextPostFormProps) {
  const [title, setTitle] = useState('');
  const [text_content, setTextContent] = useState('');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTextContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(e.target.value);
  };

  const handleSubmit = () => {
    onSubmit(title, text_content);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className="sr-only">
          タイトル
        </label>
        <Input
          id="title"
          placeholder="タイトルを入力…"
          maxLength={100}
          value={title}
          onChange={handleTitleChange}
        />
      </div>
      <div>
        <label htmlFor="text_content" className="sr-only">
          本文
        </label>
        <Textarea
          id="text_content"
          placeholder="本文を入力…"
          maxLength={10000}
          value={text_content}
          onChange={handleTextContentChange}
          className="min-h-[120px]"
        />
        <div className="text-right text-sm text-gray-500">
          {text_content.length} / 10000
        </div>
      </div>
      <Button variant="default" onClick={handleSubmit}>
        投稿する
      </Button>
    </div>
  );
}