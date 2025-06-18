import "@logseq/libs";
import { logseq as PL } from "../package.json";

const pluginId = PL.id;

// 常數定義
const TODO_CATEGORY = ['TODO', 'LATER', 'WAITING'];
const API_BASE_URL = 'https://habitica.com/api/v3';
const AUTHOR_CLIENT_ID = "f82c8c63-51fe-43ef-959d-3ade37eab858"
const LOGSEQ_PLUGIN_NAME = "Habitica Tasks"
const HABITICA_PLUGIN_NAME = "Logseq Sync"
const API_DELAY = 1000;
const RATE_LIMIT_DELAY = 60000; // 1 分鐘延遲當被限流時
const MAX_RETRIES = 3;


/**
 * 解析 Logseq 區塊任務內容
 * @param blockContent - 區塊內容字串
 * @returns 返回解析結果，包含標記和任務文字
 */
const parseBlockTaskContent = (blockContent: string) => {
  const firstLine = blockContent.split('\n')[0] || '';
  const foundMarker = TODO_CATEGORY.find(marker => firstLine.startsWith(marker));

  if (!foundMarker) return { marker: null, taskText: '' };

  const taskText = firstLine.substring(foundMarker.length).replace(/^\s+/, '');

  return { marker: foundMarker, taskText };
};

/**
 * 檢查是否可以建立 Habitica 任務
 * @param blockContent - 區塊內容字串
 * @returns 返回檢查結果，包含是否可建立和原因
 */
const canCreateHabiticaTask = (blockContent: string) => {
  const parsed = parseBlockTaskContent(blockContent);

  if (!parsed.marker) return { canCreate: false, reason: `This block is not a ${TODO_CATEGORY.join('/')} task` };
  if (!parsed.taskText) return { canCreate: false, reason: 'Task content cannot be empty' };

  return { canCreate: true };
};

function main() {
  console.info(`#${pluginId}: MAIN`);

  // 註冊設定
  logseq.useSettingsSchema([
    {
      key: 'userId',
      type: 'string',
      title: 'Habitica User ID',
      description: 'Your Habitica User ID (found in Settings > Site Data)',
      default: ''
    },
    {
      key: 'apiToken',
      type: 'string',
      title: 'Habitica API Token',
      description: 'Your Habitica API Token (found in Settings > Site Data)',
      default: ''
    }
  ]);

  // Rate limiting 狀態
  let isRateLimited = false;
  let rateLimitResetTime = 0;

  /**
   * 通用 API 請求函式（遵循 Habitica API 準則）
   * @param endpoint - API 端點
   * @param method - HTTP 方法
   * @param body - 請求主體
   * @param retries - 重試次數
   * @returns API 響應結果
   */
  const makeHabiticaRequest = async (endpoint: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', body?: any, retries = 0): Promise<any> => {
    const userId = logseq.settings?.userId as string;
    const apiToken = logseq.settings?.apiToken as string;

    if (!userId || !apiToken) {
      throw new Error('Please configure Habitica User ID and API Token in settings first');
    }

    // 檢查是否仍在 rate limit 期間
    if (isRateLimited && Date.now() < rateLimitResetTime) {
      const waitTime = Math.ceil((rateLimitResetTime - Date.now()) / 1000);
      throw new Error(`API request rate limited, please wait ${waitTime} seconds before retrying`);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'x-api-user': userId,
          'x-api-key': apiToken,
          // Habitica staff need to troubleshoot the source
          'x-client': `${AUTHOR_CLIENT_ID}-${HABITICA_PLUGIN_NAME}`,
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });

      // 處理 rate limiting headers
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');

      if (rateLimitRemaining) {
        console.log(`API Rate Limit Remaining: ${rateLimitRemaining}`);

        // 如果剩餘請求數很少，記錄重置時間
        if (parseInt(rateLimitRemaining) <= 5 && rateLimitReset) {
          console.warn(`Rate limit will reset at: ${new Date(parseInt(rateLimitReset) * 1000).toLocaleString()}`);
        }
      }

      // 處理 429 Too Many Requests
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : RATE_LIMIT_DELAY;

        isRateLimited = true;
        rateLimitResetTime = Date.now() + waitTime;

        console.warn(`Rate limited. Retry after ${waitTime / 1000} seconds`);

        if (retries < MAX_RETRIES) {
          console.log(`Retrying in ${waitTime / 1000} seconds... (attempt ${retries + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          isRateLimited = false;
          return makeHabiticaRequest(endpoint, method, body, retries + 1);
        } else {
          throw new Error(`API request rate limited and maximum retries reached. Please try again later.`);
        }
      }

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      // 重置 rate limit 狀態（成功請求）
      isRateLimited = false;
      return response.json();

    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network connection failed, please check your network connection');
      }
      throw error;
    }
  };


  /**
   * 測試與 Habitica 的連線並驗證設定
   */
  const testHabiticaConnection = async () => {
    try {
      const data = await makeHabiticaRequest('/user');
      const userName = data.data.profile.name;
      const userIdFromAPI = data.data._id;
      const configuredUserId = logseq.settings?.userId as string;

      console.log('Habitica connection successful for user:', userName);

      // 驗證設定的 User ID 是否正確
      if (configuredUserId !== userIdFromAPI) {
        logseq.UI.showMsg(
          `⚠️ Configuration Error: Configured User ID (${configuredUserId}) does not match API returned ID (${userIdFromAPI}). Please check settings.`,
          'warning'
        );
      } else {
        logseq.UI.showMsg(`✅ Connection successful! Welcome ${userName}`, 'success');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      logseq.UI.showMsg(`❌ Connection test failed: ${errorMessage}`, 'error');
    }
  };

  // 註冊測試連線指令
  logseq.App.registerCommandPalette({
    key: 'test-habitica-connection',
    label: 'Habitica: Test Connection',
    keybinding: { binding: 'ctrl+shift+h t' }
  }, testHabiticaConnection);


  /**
   * 在 Habitica 中建立任務
   * @param blockUuid - Logseq 區塊 UUID
   * @param priority - 任務優先級
   * @returns 返回 Habitica 任務 ID
   */
  const createTaskInHabitica = async (blockUuid: string, priority: number): Promise<string> => {
    const result = await makeHabiticaRequest('/tasks/user', 'POST', {
      text: `logseq:${blockUuid}`,
      type: 'todo',
      priority: priority
    });

    const taskId = result.data._id;
    if (!taskId) {
      throw new Error('No task ID returned from Habitica API');
    }

    return taskId;
  };

  /**
   * 完成 Habitica 中的任務
   * @param taskId - Habitica 任務 ID
   */
  const completeTaskInHabitica = async (taskId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, API_DELAY));
    await makeHabiticaRequest(`/tasks/${taskId}/score/up`, 'POST');
  };

  /**
   * 更新 Logseq 區塊狀態
   * @param blockUuid - Logseq 區塊 UUID
   * @param taskText - 任務文字內容
   */
  const updateLogseqBlockStatus = async (blockUuid: string, taskText: string): Promise<void> => {
    const newContent = `DONE ${taskText}`;
    await logseq.Editor.updateBlock(blockUuid, newContent);
  };

  /**
   * 刪除 Habitica 任務（用於回滾）
   * @param taskId - Habitica 任務 ID
   */
  const deleteHabiticaTask = async (taskId: string): Promise<void> => {
    try {
      await makeHabiticaRequest(`/tasks/${taskId}`, 'DELETE');
      console.log(`Rollback: Deleted Habitica task ${taskId}`);
    } catch (error) {
      console.error(`Failed to delete Habitica task ${taskId} during rollback:`, error);
    }
  };

  /**
   * 處理任務建立的完整流程
   * @param blockUuid - Logseq 區塊 UUID
   * @param priority - 任務優先級
   * @param priorityName - 優先級名稱（用於顯示）
   */
  const processTaskCreation = async (blockUuid: string, priority: number, priorityName: string) => {
    // 狀態追蹤
    let taskCreated = false;
    let taskCompleted = false;
    let logseqUpdated = false;
    let habiticaTaskId: string | null = null;

    try {

      // 1. 驗證區塊內容
      const block = await logseq.Editor.getBlock(blockUuid);
      if (!block) {
        logseq.UI.showMsg('Block content not found', 'error');
        return;
      }

      const checkResult = canCreateHabiticaTask(block.content);
      if (!checkResult.canCreate) {
        logseq.UI.showMsg(checkResult.reason || 'Unable to create task', 'warning');
        return;
      }

      const parsed = parseBlockTaskContent(block.content);

      // 2. 建立 Habitica 任務
      try {
        habiticaTaskId = await createTaskInHabitica(blockUuid, priority);
        taskCreated = true;
        console.log(`Created Habitica task: ${habiticaTaskId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';
        logseq.UI.showMsg(`Failed to create ${priorityName} priority task: ${errorMessage}`, 'error');
        return;
      }

      // 3. 完成 Habitica 任務
      try {
        await completeTaskInHabitica(habiticaTaskId);
        taskCompleted = true;
        console.log(`Completed Habitica task: ${habiticaTaskId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';
        // 回滾：刪除已建立的任務
        await deleteHabiticaTask(habiticaTaskId);
        logseq.UI.showMsg(`Failed to complete ${priorityName} priority task: ${errorMessage}`, 'error');
        return;
      }

      // 4. 更新 Logseq 區塊狀態
      try {
        await updateLogseqBlockStatus(blockUuid, parsed.taskText);
        logseqUpdated = true;
        console.log(`Updated Logseq block: ${blockUuid}`);
        logseq.UI.showMsg(`✅ Successfully created and completed ${priorityName} priority task`, 'success');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';
        // 不回滾 Habitica 任務，只顯示提示
        logseq.UI.showMsg(
          `⚠️ Habitica task created and completed successfully, but failed to update Logseq block: ${errorMessage}. Please manually mark the task as DONE in Logseq.`,
          'warning'
        );
        return;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      logseq.UI.showMsg(`Unexpected error during task creation: ${errorMessage}`, 'error');

      // 防呆：根據狀態決定回滾策略
      if (taskCreated && !taskCompleted && habiticaTaskId) {
        await deleteHabiticaTask(habiticaTaskId);
      }
    }
  };

  // 註冊批量建立指令
  const priorities = [
    { key: 'trivial', value: 0.1, name: 'Trivial' },
    { key: 'easy', value: 1, name: 'Easy' },
    { key: 'medium', value: 1.5, name: 'Medium' },
    { key: 'hard', value: 2, name: 'Hard' }
  ];

  priorities.forEach(p => {
    logseq.Editor.registerSlashCommand(`Habitica: Complete ${p.key.charAt(0).toUpperCase() + p.key.slice(1)} Task`, async (e) => {
      await processTaskCreation(e.uuid, p.value, p.name);
    });
  });

}

logseq.ready(main).catch(console.error);
