declare global {
  var userService: {
    getCurrentUser: () => Promise<any>;
    getUserById: () => Promise<any>;
    updateProfile: () => Promise<any>;
    getProfile: () => Promise<any>;
  };
  
  var audioService: {
    play: (url: string) => Promise<any> | void;
    pause: () => Promise<any> | void;
    stop: () => Promise<any> | void;
    seek: (position: number) => Promise<any> | void;
    getStatus: () => Promise<any>;
  };
  
  var mediaService: {
    uploadFile: (file: any) => Promise<any>;
    processAudio: (url: string) => Promise<any>;
    processImage: (url: string) => Promise<any>;
  };
}

export {};
