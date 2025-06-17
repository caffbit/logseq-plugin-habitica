# Logseq Habitica Plugin 🎮

A plugin that perfectly integrates Logseq tasks with Habitica gamification!

![Plugin Logo](./logo.svg)

## ✨ Features

- 🎯 **Smart Task Sync** - Automatically create Logseq TODO tasks in Habitica
- 🏆 **Four Priority Levels** - Support for Trivial, Easy, Medium, and Hard priority settings
- ⚡ **Real-time Completion Sync** - Automatically complete tasks in Habitica when marked DONE in Logseq
- 🚀 **Batch Operations** - One-click creation of all today's TODO tasks
- 🔒 **Secure & Reliable** - Follows Habitica API usage guidelines with built-in rate limiting protection

## 🛠️ Installation & Setup

### 1. Install Plugin
1. Enable developer mode in Logseq
2. Go to plugins page and select "Load unpacked plugin"
3. Select the plugin directory (containing package.json)

### 2. Get Habitica API Information
1. Log in to [Habitica](https://habitica.com)
2. Go to **Settings** → **API**
3. Copy your **User ID** and **API Token**

### 3. Configure Plugin
1. Find "Habitica Plugin" in Logseq settings
2. Paste your **User ID** and **API Token**
3. Use `Ctrl+Shift+H T` to test connection

## 🎯 Usage

### Single Task Creation (Slash Commands)
Use slash commands in any TODO block:
- `/Habitica: Create Trivial Task` - Create trivial task (yellow)
- `/Habitica: Create Easy Task` - Create easy task (orange)
- `/Habitica: Create Medium Task` - Create medium task (red)
- `/Habitica: Create Hard Task` - Create hard task (purple)

### Batch Creation (Keyboard Shortcuts)
- `Ctrl+Shift+H + 1` - Batch create trivial tasks
- `Ctrl+Shift+H + 2` - Batch create easy tasks
- `Ctrl+Shift+H + 3` - Batch create medium tasks
- `Ctrl+Shift+H + 4` - Batch create hard tasks

### Test Connection
- `Ctrl+Shift+H + T` - Test Habitica connection

## 📝 Usage Examples

### Basic Task Format
```markdown
- TODO Complete project report
- TODO Read technical articles
- LATER Plan next week's meeting
```

### After Task Creation
```markdown
- TODO Complete project report
:HABITICA:
taskId: 12345678-90ab-cdef-1234-567890abcdef
:END:
```

### Task Completion Sync
```markdown
- DONE Complete project report  ← Mark as DONE in Logseq
:HABITICA:
taskId: 12345678-90ab-cdef-1234-567890abcdef
:END:
```
Task will be automatically marked as completed in Habitica!

## ⚙️ Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| **User ID** | Your Habitica User ID | Empty |
| **API Token** | Your Habitica API Token | Empty |

## 🚦 API Rate Limiting Protection

This plugin fully complies with Habitica API usage guidelines:

- ✅ **Auto Delay** - Automatic 1-second delay between batch operations
- ✅ **Smart Retry** - Automatic retry on rate limit (up to 3 times)
- ✅ **Safe Stop** - Confirmation prompt for batch operations over 50 tasks
- ✅ **Status Monitoring** - Real-time display of remaining API requests

## 🔧 Supported Task Types

### Creatable Tasks
- `TODO` tasks
- `LATER` tasks  
- `WAITING` tasks

### Auto Completion Sync
- `DONE` tasks will be automatically completed in Habitica

## 🎮 Habitica Priority Mapping

| Plugin Setting | Habitica Display | Color | Value |
|---------------|-----------------|-------|-------|
| Trivial | ! (Easy) | Yellow | 0.1 |
| Easy | !! (Easy) | Orange | 1.0 |
| Medium | !!! (Medium) | Red | 1.5 |
| Hard | !!!! (Hard) | Purple | 2.0 |

## 🚨 Important Notes

### Task Requirements
- Task content cannot be empty
- Each block can only link to one Habitica task
- Task content over 100 characters will be automatically truncated

### Batch Operations
- Confirmation dialog will appear for operations over 50 tasks
- Operations will automatically stop and show progress on API rate limiting
- Recommended to perform batch operations when network is stable

## 🐛 Troubleshooting

### Connection Issues
1. Verify User ID and API Token are correct
2. Check network connection
3. Use test connection feature to verify settings

### API Rate Limiting
- If encountering rate limits, wait 1 minute before retrying
- Avoid making numerous API requests in short time periods
- Recommended to perform batch operations in smaller batches

### Task Sync Issues
- Ensure task format is correct (starts with TODO/LATER/WAITING)
- Check if HABITICA drawer is correctly generated
- Check console for error messages

## 🔄 Development Info

### Tech Stack
- TypeScript
- Logseq Plugin API
- Habitica REST API

### Project Structure
```
logseq-plugin-habitica/
├── src/
│   └── main.ts          # Main plugin logic
├── logo.svg             # Plugin icon
├── package.json         # Project configuration
└── README.md           # Documentation
```

## 📄 License

MIT License

## 🤝 Contributing

Issues and Pull Requests are welcome!
