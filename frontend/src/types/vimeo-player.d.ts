/**
 * Type declarations for @vimeo/player
 *
 * These are minimal type declarations for the Vimeo Player SDK.
 * Based on the official API: https://developer.vimeo.com/player/sdk/reference
 */

declare module '@vimeo/player' {
  interface VimeoPlayerOptions {
    id?: string | number;
    url?: string;
    width?: number | string;
    height?: number | string;
    autopause?: boolean;
    autoplay?: boolean;
    background?: boolean;
    byline?: boolean;
    color?: string;
    controls?: boolean;
    dnt?: boolean;
    keyboard?: boolean;
    loop?: boolean;
    maxheight?: number;
    maxwidth?: number;
    muted?: boolean;
    pip?: boolean;
    playsinline?: boolean;
    portrait?: boolean;
    quality?: string;
    responsive?: boolean;
    speed?: boolean;
    texttrack?: string;
    title?: boolean;
    transparent?: boolean;
  }

  interface VimeoTimeData {
    duration: number;
    percent: number;
    seconds: number;
  }

  interface VimeoError {
    message: string;
    method: string;
    name: string;
  }

  class Player {
    constructor(element: HTMLElement | string, options?: VimeoPlayerOptions);

    // Playback methods
    play(): Promise<void>;
    pause(): Promise<void>;
    unload(): Promise<void>;
    destroy(): Promise<void>;

    // Getters
    getAutopause(): Promise<boolean>;
    getBuffered(): Promise<number>;
    getColor(): Promise<string>;
    getCurrentTime(): Promise<number>;
    getDuration(): Promise<number>;
    getEnded(): Promise<boolean>;
    getLoop(): Promise<boolean>;
    getMuted(): Promise<boolean>;
    getPaused(): Promise<boolean>;
    getPlaybackRate(): Promise<number>;
    getPlayed(): Promise<number>;
    getVideoHeight(): Promise<number>;
    getVideoId(): Promise<number>;
    getVideoTitle(): Promise<string>;
    getVideoUrl(): Promise<string>;
    getVideoWidth(): Promise<number>;
    getVolume(): Promise<number>;

    // Setters
    setAutopause(autopause: boolean): Promise<boolean>;
    setColor(color: string): Promise<string>;
    setCurrentTime(seconds: number): Promise<number>;
    setLoop(loop: boolean): Promise<boolean>;
    setMuted(muted: boolean): Promise<boolean>;
    setPlaybackRate(playbackRate: number): Promise<number>;
    setVolume(volume: number): Promise<number>;

    // Event handlers
    on(event: string, callback: (data: unknown) => void): void;
    off(event: string, callback?: (data: unknown) => void): void;

    // Specific event types
    on(event: 'play', callback: () => void): void;
    on(event: 'pause', callback: () => void): void;
    on(event: 'ended', callback: () => void): void;
    on(event: 'timeupdate', callback: (data: VimeoTimeData) => void): void;
    on(event: 'progress', callback: (data: VimeoTimeData) => void): void;
    on(event: 'seeked', callback: (data: VimeoTimeData) => void): void;
    on(event: 'error', callback: (error: VimeoError) => void): void;
    on(event: 'loaded', callback: (data: { id: number }) => void): void;
  }

  export default Player;
}
