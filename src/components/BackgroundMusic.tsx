import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

const SRC = "/assets/bg-music.mp3";
const STORAGE_KEY = "bg_music_muted";
const VOLUME = 0.3;

export function BackgroundMusic() {
  const { lang } = useLang();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const audio = new Audio(SRC);
    audio.loop = true;
    audio.volume = VOLUME;
    audio.preload = "auto";
    audio.muted = muted;
    audioRef.current = audio;

    let started = false;
    const tryPlay = () => {
      if (started) return;
      audio.play().then(
        () => {
          started = true;
          removeListeners();
        },
        () => {
          /* autoplay blocked — wait for a user gesture */
        },
      );
    };

    const onGesture = () => tryPlay();
    const events: (keyof DocumentEventMap)[] = ["pointerdown", "keydown", "touchstart", "scroll"];
    const addListeners = () => events.forEach((e) => window.addEventListener(e, onGesture, { passive: true }));
    const removeListeners = () => events.forEach((e) => window.removeEventListener(e, onGesture));

    tryPlay();
    addListeners();

    return () => {
      removeListeners();
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
    try {
      localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [muted]);

  const toggle = () => {
    setMuted((m) => !m);
    const audio = audioRef.current;
    if (audio && audio.paused) audio.play().catch(() => {});
  };

  const label = lang === "fr" ? (muted ? "Activer la musique" : "Couper la musique") : lang === "ar" ? (muted ? "تشغيل الموسيقى" : "كتم الموسيقى") : muted ? "Unmute music" : "Mute music";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      data-testid="btn-toggle-music"
      className="fixed bottom-5 end-5 z-50 w-11 h-11 flex items-center justify-center rounded-full border border-white/15 bg-black/50 backdrop-blur text-white/80 shadow-lg shadow-black/40 hover:text-primary hover:border-primary/40 transition-colors"
    >
      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </button>
  );
}
