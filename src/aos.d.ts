declare module 'aos' {
  interface AosOptions {
    duration?: number;
    easing?: string;
    once?: boolean;
    offset?: number;
    delay?: number;
    mirror?: boolean;
    anchorPlacement?: string;
    startEvent?: string;
    disable?: boolean | 'phone' | 'tablet' | 'mobile' | (() => boolean);
    disableMutationObserver?: boolean;
  }

  const AOS: {
    init(options?: AosOptions): void;
    refresh(hard?: boolean): void;
    refreshHard(): void;
  };

  export default AOS;
}
