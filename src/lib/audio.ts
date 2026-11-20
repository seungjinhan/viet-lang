import { useEffect, useState } from "react";

/** 앱 전체에서 소리는 한 번에 하나만 나요. */
const player = new Audio();
let current: string | null = null;
const listeners = new Set<(src: string | null) => void>();

function emit() {
  for (const fn of listeners) fn(current);
}

player.addEventListener("ended", () => {
  current = null;
  emit();
});
player.addEventListener("pause", () => {
  current = null;
  emit();
});

export type PlayResult = "ok" | "failed" | "blocked";

export async function play(src: string, slow = false): Promise<PlayResult> {
  if (current === src && !player.paused) {
    player.pause();
    return "ok";
  }
  player.pause();
  player.src = src;
  player.playbackRate = slow ? 0.75 : 1;
  current = src;
  emit();
  try {
    await player.play();
    return "ok";
  } catch (e) {
    current = null;
    emit();
    return e instanceof DOMException && e.name === "NotAllowedError" ? "blocked" : "failed";
  }
}

export function stop(): void {
  player.pause();
}

export function usePlaying(): string | null {
  const [src, setSrc] = useState(current);
  useEffect(() => {
    listeners.add(setSrc);
    return () => {
      listeners.delete(setSrc);
    };
  }, []);
  return src;
}
