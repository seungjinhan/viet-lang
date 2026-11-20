export type Tone = "ngang" | "huyen" | "sac" | "hoi" | "nga" | "nang";

export const TONE_NAMES: Record<Tone, string> = { ngang: "평성", huyen: "하강", sac: "상승", hoi: "물음", nga: "꺾임", nang: "무거운" };

const MARKS: Record<string, Tone> = { "̀": "huyen", "́": "sac", "̉": "hoi", "̃": "nga", "̣": "nang" };

/** 글자마다 성조를 붙여요. 성조 기호가 붙은 모음만 색이 들어가요. */
export function toneSpans(text: string): { text: string; tone?: Tone }[] {
  return [...text.normalize("NFC")].map((ch) => {
    const marks = [...ch.normalize("NFD")].slice(1);
    const tone = marks.map((m) => MARKS[m]).find(Boolean);
    return { text: ch, tone };
  });
}

/** 한 음절의 성조. 기호가 없으면 평성이에요. */
export function syllableTone(syllable: string): Tone {
  for (const ch of syllable.normalize("NFC")) {
    const tone = [...ch.normalize("NFD")].slice(1).map((m) => MARKS[m]).find(Boolean);
    if (tone) return tone;
  }
  return "ngang";
}

