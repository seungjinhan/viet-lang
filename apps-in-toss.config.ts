import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  // 임시 이름이에요. 콘솔에 등록하기 전에 정해요 (등록하면 바꿀 수 없어요).
  appName: "viet-lang",
  brand: {
    primaryColor: "#E5483B",
  },
  webView: {},
  permissions: [],
  webBundleDir: "dist",
});
