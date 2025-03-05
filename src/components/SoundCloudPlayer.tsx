import React from 'react';

interface SoundCloudPlayerProps {
  url: string;
  className?: string;
}

export const SoundCloudPlayer: React.FC<SoundCloudPlayerProps> = ({ url, className }) => {
  // Extract track ID from SoundCloud URL if needed
  const getEmbedUrl = (soundcloudUrl: string) => {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
  };

  return (
    <iframe
      width="100%"
      height="166"
      scrolling="no"
      frameBorder="no"
      allow="autoplay"
      src={getEmbedUrl(url)}
      className={className}
    ></iframe>
  );
};
