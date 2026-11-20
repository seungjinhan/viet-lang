import { Analytics, Storage } from "@apps-in-toss/web-framework";

/** GitHub Pages 웹 버전 (`vite build --mode web`) */
export const WEB = import.meta.env.MODE === "web";

/** 토스 앱의 베트남어 배우기 (휴대폰에서는 토스로 열고, PC에서는 QR을 보여 줘요) */
export const APP_URL = "https://tossminiapp.com/d/viet-lang";

export async function loadJson(key: string): Promise<unknown> {
  if (WEB) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }
  try {
    const value = await Storage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    if (!import.meta.env.DEV) return null;
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }
}

/** 저장에 실패하면 false를 돌려줘요 (저장 공간 부족 등). */
export async function saveJson(key: string, value: unknown): Promise<boolean> {
  const text = JSON.stringify(value);
  if (WEB) {
    try {
      localStorage.setItem(key, text);
      return true;
    } catch {
      return false;
    }
  }
  try {
    await Storage.setItem(key, text);
    return true;
  } catch {
    if (!import.meta.env.DEV) return false;
    try {
      localStorage.setItem(key, text);
      return true;
    } catch {
      return false;
    }
  }
}

/** 학습 내용은 넣지 않아요. */
export function logEvent(name: string, params: Record<string, string> = {}): void {
  if (WEB) return;
  Analytics.log({ log_name: name, log_type: "event", params }).catch(() => undefined);
}
