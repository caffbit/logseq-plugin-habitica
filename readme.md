# Logseq Habitica Plugin 🎮

將 Logseq 任務與 Habitica 遊戲化完美整合的插件！

![Plugin Logo](./logo.svg)

## ✨ 功能特色

- 🎯 **智能任務同步** - 將 Logseq 的 TODO 任務自動建立到 Habitica
- 🏆 **四種優先級** - 支援瑣碎、簡單、中等、困難四種優先級設定
- ⚡ **即時完成同步** - 在 Logseq 標記 DONE 時自動在 Habitica 完成任務
- 🚀 **批量操作** - 一鍵建立今日所有 TODO 任務
- 🔒 **安全可靠** - 遵循 Habitica API 使用準則，內建限流保護

## 🛠️ 安裝設定

### 1. 安裝插件
1. 在 Logseq 中開啟開發者模式
2. 前往插件頁面，選擇「載入未打包插件」
3. 選擇插件目錄（包含 package.json 的目錄）

### 2. 獲取 Habitica API 資訊
1. 登入 [Habitica](https://habitica.com)
2. 前往 **Settings** → **API**
3. 複製你的 **User ID** 和 **API Token**

### 3. 配置插件
1. 在 Logseq 設定中找到 「Habitica Plugin」
2. 貼上你的 **User ID** 和 **API Token**
3. 使用 `Ctrl+Shift+H T` 測試連接

## 🎯 使用方法

### 單一任務建立（Slash 指令）
在任何 TODO 區塊中使用 Slash 指令：
- `/Habitica: Create Trivial Task` - 建立瑣碎任務（黃色）
- `/Habitica: Create Easy Task` - 建立簡單任務（橙色）
- `/Habitica: Create Medium Task` - 建立中等任務（紅色）
- `/Habitica: Create Hard Task` - 建立困難任務（紫色）

### 批量建立（快捷鍵）
- `Ctrl+Shift+H + 1` - 批量建立瑣碎任務
- `Ctrl+Shift+H + 2` - 批量建立簡單任務
- `Ctrl+Shift+H + 3` - 批量建立中等任務
- `Ctrl+Shift+H + 4` - 批量建立困難任務

### 測試連接
- `Ctrl+Shift+H + T` - 測試 Habitica 連接

## 📝 使用範例

### 基本任務格式
```markdown
- TODO 完成專案報告
- TODO 閱讀技術文章
- LATER 規劃下週會議
```

### 任務建立後
```markdown
- TODO 完成專案報告
:HABITICA:
taskId: 12345678-90ab-cdef-1234-567890abcdef
:END:
```

### 任務完成同步
```markdown
- DONE 完成專案報告  ← 在 Logseq 標記為 DONE
:HABITICA:
taskId: 12345678-90ab-cdef-1234-567890abcdef
:END:
```
任務會自動在 Habitica 中標記為完成！

## ⚙️ 設定選項

| 設定項目 | 說明 | 預設值 |
|---------|------|--------|
| **User ID** | 你的 Habitica User ID | 空白 |
| **API Token** | 你的 Habitica API Token | 空白 |

## 🚦 API 限流保護

本插件完全遵循 Habitica API 使用準則：

- ✅ **自動延遲** - 批量操作間自動加入 1 秒延遲
- ✅ **智能重試** - 遇到限流時自動重試（最多 3 次）
- ✅ **安全停止** - 批量操作超過 50 個任務時會先詢問
- ✅ **狀態監控** - 即時顯示剩餘 API 請求數

## 🔧 支援的任務類型

### 可建立的任務
- `TODO` 任務
- `LATER` 任務  
- `WAITING` 任務

### 自動完成同步
- `DONE` 任務會自動在 Habitica 中完成

## 🎮 Habitica 優先級對應

| 插件設定 | Habitica 顯示 | 顏色 | 數值 |
|---------|--------------|------|------|
| Trivial | !（簡單） | 黃色 | 0.1 |
| Easy | !!（簡單） | 橙色 | 1.0 |
| Medium | !!!（中等） | 紅色 | 1.5 |
| Hard | !!!!（困難） | 紫色 | 2.0 |

## 🚨 注意事項

### 任務要求
- 任務內容不能為空
- 每個區塊只能連結一個 Habitica 任務
- 任務內容超過 100 字元會自動截斷

### 批量操作
- 超過 50 個任務時會顯示確認對話框
- 遇到 API 限流會自動停止並顯示進度
- 建議在網路穩定時進行批量操作

## 🐛 故障排除

### 連接問題
1. 確認 User ID 和 API Token 正確
2. 檢查網路連接
3. 使用測試連接功能驗證設定

### API 限流
- 如果遇到限流，請等待 1 分鐘後再試
- 避免短時間內大量 API 請求
- 批量操作建議分批進行

### 任務同步問題
- 確認任務格式正確（以 TODO/LATER/WAITING 開頭）
- 檢查 HABITICA drawer 是否正確生成
- 查看控制台錯誤訊息

## 🔄 開發資訊

### 技術棧
- TypeScript
- Logseq Plugin API
- Habitica REST API

### 專案結構
```
logseq-plugin-habitica/
├── src/
│   └── main.ts          # 主要插件邏輯
├── logo.svg             # 插件圖標
├── package.json         # 專案配置
└── README.md           # 說明文件
```

## 📄 授權

MIT License

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

**享受遊戲化的任務管理體驗！** 🎉
