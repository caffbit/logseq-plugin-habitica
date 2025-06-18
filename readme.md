# Logseq Habitica Plugin

A plugin that integrates Logseq tasks with Habitica!

## ✨ Features

![SlashCommand](./screenshots/slash-command.png)
![Settings](./screenshots/settings.png)

- 🏆 **Four Priority Levels** - Support for Trivial, Easy, Medium, and Hard priority settings
- 🔒 **Secure & Reliable** - Follows Habitica API usage guidelines with built-in rate limiting protection

## 🎯 Usage

### Configure Plugin
1. Find "Habitica Plugin" in Logseq settings
2. Paste your **User ID** and **API Token**
3. Use `Ctrl+Shift+H T` to test connection

### Task Completion (Slash Commands)
Use slash commands in any TODO/LATER/WAITING block:
- `/Habitica: Complete Trivial Task` - Complete trivial priority task
- `/Habitica: Complete Easy Task` - Complete easy priority task
- `/Habitica: Complete Medium Task` - Complete medium priority task
- `/Habitica: Complete Hard Task` - Complete hard priority task

### How it works:

1. Create daily TODOs in Logseq
2. When completing tasks, use `/` to find Habitica:xxx commands
3. The command will automatically create a Habitica task and complete it after a 1-second delay
4. After Habitica task completion, the Logseq TODO will be automatically marked as DONE

## 📄 License

MIT License