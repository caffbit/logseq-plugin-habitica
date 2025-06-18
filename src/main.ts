import "@logseq/libs";
import { logseq as PL } from "../package.json";

const pluginId = PL.id;

// 常數定義
const TODO_CATEGORY = ['TODO', 'LATER', 'WAITING'];
const DONE_CATEGORY = ['DONE'];
const HABITICA_DRAWER_REGEX = /\n:HABITICA:([\s\S]*?)\n:END:/s;
const API_BASE_URL = 'https://habitica.com/api/v3';
const AUTHOR_CLIENT_ID = "f82c8c63-51fe-43ef-959d-3ade37eab858"
const LOGSEQ_PLUGIN_NAME = "Habitica Tasks"
const HABITICA_PLUGIN_NAME = "Logseq Sync"
const MAX_TASK_LENGTH = 100;
const API_DELAY = 1000;
const RATE_LIMIT_DELAY = 60000; // 1 分鐘延遲當被限流時
const MAX_RETRIES = 3;
const DEBOUNCE_DELAY = 300;
const CACHE_CLEANUP_DELAY = 10000;

// 工具函式
const extractTaskIdFromContent = (blockContent: string): string | null => {
  const matches = blockContent.match(HABITICA_DRAWER_REGEX);
  if (!matches) return null;
  const taskIdLine = matches[1].trim().split('\n').find(line => line.trim().startsWith('taskId:'));
  return taskIdLine?.split(':')[1]?.trim() || null;
};

const genHabiticaDrawerText = (taskId: string): string => `:HABITICA:\ntaskId: ${taskId}\n:END:`;

const updateBlockHabiticaDrawer = (blockContent: string, taskId: string): string => {
  const newText = genHabiticaDrawerText(taskId);
  return HABITICA_DRAWER_REGEX.test(blockContent)
    ? blockContent.replace(HABITICA_DRAWER_REGEX, '\n' + newText)
    : blockContent + '\n' + newText;
};

const parseBlockTaskContent = (blockContent: string) => {
  const firstLine = blockContent.split('\n')[0] || '';
  const foundMarker = TODO_CATEGORY.find(marker => firstLine.startsWith(marker));

  if (!foundMarker) return { marker: null, taskText: '', hasTaskId: false };

  const taskText = firstLine.substring(foundMarker.length).replace(/^\s+/, '');
  const hasTaskId = extractTaskIdFromContent(blockContent) !== null;

  return { marker: foundMarker, taskText, hasTaskId };
};

const canCreateHabiticaTask = (blockContent: string) => {
  const parsed = parseBlockTaskContent(blockContent);

  if (!parsed.marker) return { canCreate: false, reason: `This block is not a ${TODO_CATEGORY.join('/')} task` };
  if (parsed.hasTaskId) return { canCreate: false, reason: 'This block is already linked to a Habitica task' };
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

  // 通用 API 請求函式（遵循 Habitica API 準則）
  const makeHabiticaRequest = async (endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any, retries = 0): Promise<any> => {
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

  // 獲取今天的日誌頁面
  const getTodayPage = async () => {
    const today = new Date();
    const todayJournalDay = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    let todayPage = await logseq.Editor.getCurrentPage();

    if (!todayPage || !todayPage.journalDay || todayPage.journalDay !== todayJournalDay) {
      const allPages = await logseq.DB.datascriptQuery(`
        [:find ?page-name
         :where
         [?page :block/journal-day ${todayJournalDay}]
         [?page :block/name ?page-name]]
      `);

      if (allPages.length === 0) throw new Error('Cannot find today\'s journal page');
      todayPage = await logseq.Editor.getPage(allPages[0][0]);
    }

    if (!todayPage) throw new Error('Unable to get today\'s journal page');
    return todayPage;
  };

  // 遞迴獲取所有區塊
  const getAllBlocks = (blocks: any[]): any[] => {
    return blocks.reduce((acc, block) => {
      acc.push(block);
      if (block.children?.length > 0) {
        acc.push(...getAllBlocks(block.children));
      }
      return acc;
    }, []);
  };

  // 測試連線並驗證設定
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

  // 批量建立任務
  const createTodaysTodos = async (priority: number, priorityName: string) => {
    try {
      const todayPage = await getTodayPage();
      const blocks = await logseq.Editor.getPageBlocksTree(todayPage.uuid);
      const allBlocks = getAllBlocks(blocks);

      const todoBlocks = allBlocks.filter(block => {
        if (!block.content) return false;
        const parsed = parseBlockTaskContent(block.content);
        const canCreate = canCreateHabiticaTask(block.content);
        return parsed.marker && canCreate.canCreate;
      });

      if (todoBlocks.length === 0) {
        logseq.UI.showMsg('No TODO tasks found for today that can be created', 'info');
        return;
      }

      // 檢查是否有太多任務（防止意外大量 API 呼叫）
      if (todoBlocks.length > 50) {
        const proceed = await logseq.UI.showMsg(
          `Found ${todoBlocks.length} TODO tasks. This will generate many API calls, do you want to continue?`,
          'warning'
        );
        if (!proceed) return;
      }

      console.log(`Found ${todoBlocks.length} TODO tasks to create as ${priorityName} priority`);

      let successCount = 0;
      let errorCount = 0;

      for (const block of todoBlocks) {
        try {
          const parsed = parseBlockTaskContent(block.content);
          const finalTaskText = parsed.taskText.length > MAX_TASK_LENGTH
            ? parsed.taskText.substring(0, MAX_TASK_LENGTH) + '...'
            : parsed.taskText;

          const result = await makeHabiticaRequest('/tasks/user', 'POST', {
            text: finalTaskText,
            type: 'todo',
            priority: priority
          });

          const newContent = updateBlockHabiticaDrawer(block.content, result.data._id);
          await logseq.Editor.updateBlock(block.uuid, newContent);

          successCount++;
          console.log(`Created ${priorityName} priority task: ${finalTaskText} (${result.data._id})`);

          // 遵循 API 準則：批量operations之間的延遲
          await new Promise(resolve => setTimeout(resolve, API_DELAY));
        } catch (error) {
          errorCount++;
          console.error(`Error creating task for block ${block.uuid}:`, error);

          // 如果是 rate limit 錯誤，停止批量處理
          if (error instanceof Error && error.message.includes('限流')) {
            logseq.UI.showMsg(
              `Batch creation stopped due to API rate limiting. Successfully created ${successCount} tasks, ${errorCount} failed. Please try again later.`,
              'warning'
            );
            break;
          }
        }
      }

      if (errorCount === 0) {
        logseq.UI.showMsg(`Successfully created ${successCount} ${priorityName} priority Habitica tasks`, 'success');
      } else {
        logseq.UI.showMsg(`Creation completed: ${successCount} successful, ${errorCount} failed (${priorityName} priority)`, 'warning');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      logseq.UI.showMsg(`Batch creation of ${priorityName} priority tasks failed: ${errorMessage}`, 'error');
    }
  };

  // 單個任務建立
  const createHabiticaTask = async (blockUuid: string, priority: number, priorityName: string) => {
    try {
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
      const finalTaskText = parsed.taskText.length > MAX_TASK_LENGTH
        ? parsed.taskText.substring(0, MAX_TASK_LENGTH) + '...'
        : parsed.taskText;

      const result = await makeHabiticaRequest('/tasks/user', 'POST', {
        text: finalTaskText,
        type: 'todo',
        priority: priority
      });

      const newContent = updateBlockHabiticaDrawer(block.content, result.data._id);
      await logseq.Editor.updateBlock(blockUuid, newContent);

      console.log(`Created ${priorityName} priority task:`, result.data._id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      logseq.UI.showMsg(`Failed to create ${priorityName} priority task: ${errorMessage}`, 'error');
    }
  };

  // 註冊批量建立指令
  const priorities = [
    { key: 'trivial', value: 0.1, name: 'Trivial', binding: '1' },
    { key: 'easy', value: 1, name: 'Easy', binding: '2' },
    { key: 'medium', value: 1.5, name: 'Medium', binding: '3' },
    { key: 'hard', value: 2, name: 'Hard', binding: '4' }
  ];

  priorities.forEach(p => {
    logseq.App.registerCommandPalette({
      key: `create-todays-${p.key}-todos`,
      label: `Habitica: Create today's ${p.key.charAt(0).toUpperCase() + p.key.slice(1)} todos`,
      keybinding: { binding: `ctrl+shift+h ${p.binding}` }
    }, async () => {
      await createTodaysTodos(p.value, p.name);
    });

    logseq.Editor.registerSlashCommand(`Habitica: Create ${p.key.charAt(0).toUpperCase() + p.key.slice(1)} Task`, async (e) => {
      await createHabiticaTask(e.uuid, p.value, p.name);
    });
  });

  // 任務完成監聽
  let debounceTimeout: NodeJS.Timeout | null = null;
  const processedTasks = new Set<string>();

  const getHabiticaTaskStatus = async (taskId: string) => {
    try {
      const result = await makeHabiticaRequest(`/tasks/${taskId}`);
      return { completed: result.data.completed || false, exists: true };
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return { completed: false, exists: false };
      }
      console.error('Error getting task status:', error);
      return { completed: false, exists: false };
    }
  };

  logseq.DB.onChanged(async (e) => {
    if (debounceTimeout) clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(async () => {
      for (const block of e.blocks) {
        const taskId = extractTaskIdFromContent(block.content || '');
        const isDone = DONE_CATEGORY.includes(block.marker || '') ||
          (block.content?.startsWith('DONE') ?? false);

        if (!taskId || !isDone) continue;

        const taskKey = `${taskId}-${block.uuid}-DONE`;
        if (processedTasks.has(taskKey)) continue;

        processedTasks.add(taskKey);

        try {
          const taskStatus = await getHabiticaTaskStatus(taskId);

          if (!taskStatus.exists) {
            console.log(`Task ${taskId} does not exist in Habitica, skipping`);
            continue;
          }

          if (taskStatus.completed) continue;

          await makeHabiticaRequest(`/tasks/${taskId}/score/up`, 'POST');
        } catch (error) {
          console.error('Error updating task:', error);
          const errorMessage = error instanceof Error ? error.message : '未知錯誤';
          logseq.UI.showMsg(`Failed to update task: ${errorMessage}`, 'error');
          processedTasks.delete(taskKey);
        }
      }

      setTimeout(() => processedTasks.clear(), CACHE_CLEANUP_DELAY);
    }, DEBOUNCE_DELAY);
  });
}

logseq.ready(main).catch(console.error);
