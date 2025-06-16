import "@logseq/libs";

import React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { logseq as PL } from "../package.json";

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args);

const pluginId = PL.id;

function main() {
  console.info(`#${pluginId}: MAIN`);

  // 註冊設定
  logseq.useSettingsSchema([
    {
      key: 'userId',
      type: 'string',
      title: 'Habitica User ID',
      description: '你的 Habitica User ID',
      default: ''
    },
    {
      key: 'apiToken',
      type: 'string',
      title: 'Habitica API Token',
      description: '你的 Habitica API Token',
      default: ''
    }
  ]);

  // 測試連線函式
  async function testHabiticaConnection() {
    const userId = logseq.settings?.userId as string;
    const apiToken = logseq.settings?.apiToken as string;

    if (!userId || !apiToken) {
      logseq.UI.showMsg('請先填入 User ID 和 API Token', 'warning');
      return;
    }

    try {
      logseq.UI.showMsg('測試連線中...', 'info');

      const response = await fetch('https://habitica.com/api/v3/user', {
        method: 'GET',
        headers: {
          'x-api-user': userId,
          'x-api-key': apiToken,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        logseq.UI.showMsg(`Habitica 連接成功！歡迎，${data.data.profile.name}`, 'success');
        console.log('Connection successful:', data.data.profile.name);
      } else {
        logseq.UI.showMsg(`連接失敗: ${response.status} ${response.statusText}`, 'error');
        console.error('Connection failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Connection error:', error);
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      logseq.UI.showMsg(`連接測試失敗: ${errorMessage}`, 'error');
    }
  }

  // 註冊測試連線指令
  logseq.App.registerCommandPalette({
    key: 'test-habitica-connection',
    label: 'Test Habitica Connection',
    keybinding: {
      binding: 'mod+shift+h t'
    }
  }, testHabiticaConnection);

  // 註冊新增 Slash 指令
  logseq.Editor.registerSlashCommand('Habitica: Create a new task belonging', async (e) => {
    try {
      // 檢查設定
      const userId = logseq.settings?.userId as string;
      const apiToken = logseq.settings?.apiToken as string;

      if (!userId || !apiToken) {
        logseq.UI.showMsg('請先在設定中配置 Habitica User ID 和 API Token', 'warning');
        return;
      }

      // 取得區塊內容
      const block = await logseq.Editor.getBlock(e.uuid);

      if (!block) {
        logseq.UI.showMsg('找不到區塊內容', 'error');
        return;
      }

      // 提取任務文字（移除 TODO/DONE 標記）
      const taskText = block.content.replace(/^(TODO|DONE|LATER)\s+/, '').trim();

      if (!taskText) {
        logseq.UI.showMsg('任務內容不能為空', 'warning');
        return;
      }

      // 檢查任務長度並截斷
      const maxLength = 100;
      const finalTaskText = taskText.length > maxLength
        ? taskText.substring(0, maxLength) + '...'
        : taskText;

      logseq.UI.showMsg('正在建立 Habitica 任務...', 'info');

      // 呼叫 Habitica API
      const response = await fetch('https://habitica.com/api/v3/tasks/user', {
        method: 'POST',
        headers: {
          'x-api-user': userId,
          'x-api-key': apiToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: finalTaskText,
          type: 'todo',
          priority: 1 // medium priority
        })
      });

      if (!response.ok) {
        throw new Error(`API 呼叫失敗: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const taskId = result.data._id;

      // 將 taskId 儲存到區塊屬性
      await logseq.Editor.upsertBlockProperty(e.uuid, 'habitica-task-id', taskId);

      console.log('Created task ID:', taskId);

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      logseq.UI.showMsg(`建立任務失敗: ${errorMessage}`, 'error');
    }
  });

  // 防抖機制：避免重複觸發
  let debounceTimeout: NodeJS.Timeout | null = null;
  const processedTasks = new Set<string>();

  // 監聽 TODO 狀態變化 (例如完成任務)
  logseq.DB.onChanged(async (e) => {
    console.log('DB changed:', e);

    // 清除之前的 timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // 設定新的 timeout，延遲處理避免重複觸發
    debounceTimeout = setTimeout(async () => {
      for (const block of e.blocks) {
        // 檢查是否有 habitica-task-id 屬性 (logseq 會轉成小駝峰)
        const taskId = block.properties?.['habiticaTaskId'];
        const hasDone = block.marker === 'DONE' || (block.content?.startsWith('DONE') ?? false);

        // 如果沒有 habitica-task-id 或者不是 TODO 狀態，則跳過
        if (!taskId || !hasDone) {
          continue;
        }

        // 創建唯一識別鍵，避免重複處理同一個任務
        const taskKey = `${taskId}-${block.uuid}-DONE`;

        if (processedTasks.has(taskKey)) {
          console.log('Task already processed, skipping:', taskKey);
          continue;
        }

        // 標記為已處理
        processedTasks.add(taskKey);

        try {
          logseq.UI.showMsg(`正在更新 Habitica 任務狀態: ${taskId}`, 'info');

          // 呼叫 Habitica API 更新任務狀態
          const response = await fetch(`https://habitica.com/api/v3/tasks/${taskId}/score/up`, {
            method: 'POST',
            headers: {
              'x-api-user': logseq.settings?.userId as string,
              'x-api-key': logseq.settings?.apiToken as string,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error(`API 呼叫失敗: ${response.status} ${response.statusText}`);
          }

          const result = await response.json();
          console.log('Updated task:', result.data);

          logseq.UI.showMsg('Habitica 任務已完成！', 'success');

        } catch (error) {
          console.error('Error updating task:', error);
          const errorMessage = error instanceof Error ? error.message : '未知錯誤';
          logseq.UI.showMsg(`更新任務失敗: ${errorMessage}`, 'error');

          // 如果失敗，從已處理集合中移除，允許重試
          processedTasks.delete(taskKey);
        }
      }

      // 清理舊的已處理記錄 (10秒後清理，避免記憶體洩漏)
      setTimeout(() => {
        // 簡單清理：移除所有記錄，下次可以重新處理
        processedTasks.clear();
        console.log('Cleaned processed tasks cache');
      }, 10000);

    }, 300); // 300ms 延遲，避免重複觸發
  });

  const root = ReactDOM.createRoot(document.getElementById("app")!);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  function createModel() {
    return {
      show() {
        logseq.showMainUI();
      },
    };
  }

  logseq.provideModel(createModel());
  logseq.setMainUIInlineStyle({
    zIndex: 11,
  });

  const openIconName = "habitica-plugin-open";

  logseq.provideStyle(css`
    .${openIconName} {
      opacity: 0.55;
      font-size: 20px;
      margin-top: 4px;
    }

    .${openIconName}:hover {
      opacity: 0.9;
    }
  `);

  logseq.App.registerUIItem("toolbar", {
    key: openIconName,
    template: `
    <a data-on-click="show">
        <div class="${openIconName}" title="Habitica 設定">🎮</div>
    </a>    
`,
  });

}

logseq.ready(main).catch(console.error);




