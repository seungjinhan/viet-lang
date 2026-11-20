import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { itemByKey } from "./data";
import { BASIC_DAYS, LESSONS, LESSON_ITEMS, PARTS, nextLesson, normVi } from "./lessons";

const PUBLIC = new URL("../../public/", import.meta.url);

describe("배우기 과", () => {
  it("0~11부, 100과 (100일 매일 1과)", () => {
    expect(PARTS.map((p) => p.no)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(LESSONS).toHaveLength(100);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(100);
    expect(BASIC_DAYS).toBe(36);
  });
  it("모든 항목에 뜻 · 발음 · 음성 파일이 있어요", () => {
    for (const item of LESSON_ITEMS) {
      expect(item.ko, item.key).not.toBe("");
      expect(item.pron, item.key).not.toBe("");
      const file = new URL(item.audio.replace(/^\//, ""), PUBLIC);
      expect(existsSync(file), `${item.key} ${item.audio}`).toBe(true);
    }
  });
  it("기존 단어 · 문장 음성을 다시 써요", () => {
    const tamBiet = LESSON_ITEMS.find((i) => i.vi === "Tạm biệt.");
    expect(tamBiet?.audio).toMatch(/audio\/words\//);
    expect(LESSON_ITEMS.find((i) => i.vi === "Cho tôi cái này.")?.audio).toMatch(/audio\/phrases\//);
    expect(normVi("Xin chào. ")).toBe("xin chào");
  });
  it("저장 · 복습에서 과 항목을 찾을 수 있어요", () => {
    expect(itemByKey("l1-4-02")?.vi).toBe("mà");
  });
  it("다음 과는 끝내지 않은 첫 과예요", () => {
    expect(nextLesson([])?.id).toBe("0-1");
    expect(nextLesson(["0-1", "0-2"])?.id).toBe("1-1");
  });
});
