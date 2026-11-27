# 星煉工坊 Star & Affix Forge

純前端單局小遊戲:對一把「星煉劍」衝星與洗練詞條,最後看成品評級。
Vite + React + TypeScript + Tailwind CSS,無後端、不使用任何瀏覽器儲存,每次開啟都是全新一局。

## 本機執行

```bash
npm install
npm run dev     # 開發伺服器
npm test        # Vitest
npm run build   # 型別檢查並建置到 dist/
```

開發測試面板只在 `npm run dev`,或網址結尾加上 `#dev` 時顯示。

## 部署

推送(合併)到 `main` 後,GitHub Actions 自動建置並部署到 GitHub Pages(`.github/workflows/deploy.yml`)。
首次使用請到 Settings → Pages,將 Source 設為 **GitHub Actions**。

## 遊戲規則

- **模式**:無限(顯示累計消耗)、限定額度(簡單 / 普通 / 困難 / 自訂)、次數制(石頭不限量,衝星與洗練各算 1 次)。
- **衝星**:+0 ~ +15,消耗升星石。分安全、掉星、歸零三區;歸零區可用星鐵護鑄(預設勾選、消耗加倍,歸零改為維持,不防掉星),連續掉星有保底。可開啟自動升星。
- **詞條**:3 欄(出現機率 100% / 50% / 30%),屬性不重複,Lv1~15,階級色為藍、紫、金、紅。
- **洗練**:「詞條變更」重洗屬性與 Lv,「數值重洗」只重洗 Lv;消耗洗練石 = 1 + 鎖定條數,鎖定另耗 1 顆。結果可選擇改變或維持。
- **結算**:按「完成打造」,或限定模式耗盡時自動結算;依詞條階級分數加星級評為 S / A / B / C。

## 調整數值的位置

皆在 `src/` 之下:

| 檔案 | 內容 |
| --- | --- |
| `config/balance.ts` | 衝星表、星鐵護鑄、保底 |
| `config/affixes.ts` | 詞條清單 |
| `config/reroll.ts` | 洗練機率與消耗 |
| `config/modes.ts` | 額度與次數 |
| `config/grading.ts` | 評級 |
| `config/auto.ts` | 自動功能節奏 |
| `config/audio.ts` | 音效 |
| `config/milestones.ts` | 里程碑星級 |
| `config/settle.ts` | 結算延遲 |
| `config/stats.ts` | 紀錄筆數上限 |
