# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-17

### Added

#### Core Features
- **Smart Task Sync** - Automatically create Logseq TODO tasks in Habitica
- **Four Priority Levels** - Support for Trivial (0.1), Easy (1.0), Medium (1.5), and Hard (2.0) priority settings
- **Real-time Completion Sync** - Automatically complete tasks in Habitica when marked DONE in Logseq
- **Batch Operations** - One-click creation of all today's TODO tasks with keyboard shortcuts
- **Task Detection** - Support for TODO, LATER, and WAITING task types

#### User Interface
- **Slash Commands** - Create individual tasks with different priorities:
  - `/Habitica: Create Trivial Task`
  - `/Habitica: Create Easy Task` 
  - `/Habitica: Create Medium Task`
  - `/Habitica: Create Hard Task`
- **Keyboard Shortcuts** - Batch operations:
  - `Ctrl+Shift+H + 1` - Batch create trivial tasks
  - `Ctrl+Shift+H + 2` - Batch create easy tasks
  - `Ctrl+Shift+H + 3` - Batch create medium tasks
  - `Ctrl+Shift+H + 4` - Batch create hard tasks
  - `Ctrl+Shift+H + T` - Test Habitica connection
- **Command Palette Integration** - All commands available via command palette

#### Settings & Configuration
- **Habitica User ID** configuration setting
- **Habitica API Token** configuration setting
- **Connection Test** functionality to verify credentials
- **User ID Validation** - Automatic verification of configured User ID against API response

#### API Integration & Safety
- **Rate Limiting Protection** - Full compliance with Habitica API usage guidelines:
  - Automatic 1-second delay between batch operations
  - Smart retry mechanism (up to 3 times) on rate limit errors
  - Safe stop with confirmation for operations over 50 tasks
  - Real-time API request monitoring
- **Error Handling** - Comprehensive error handling with user-friendly messages
- **Network Resilience** - Proper handling of network connection issues

#### Task Management
- **Task Length Limitation** - Automatic truncation of tasks over 100 characters
- **Duplicate Prevention** - Prevents creating multiple Habitica tasks for the same block
- **Task State Tracking** - Uses `:HABITICA:` drawer to store task IDs
- **Completion Monitoring** - Debounced block change detection for real-time sync
- **Task Validation** - Comprehensive validation before task creation

#### Localization
- **English Interface** - All user-facing text in English
- **Error Messages** - Clear, actionable error messages in English
- **Settings Descriptions** - Detailed configuration help text

### Technical Details

#### Architecture
- **TypeScript Implementation** - Full TypeScript codebase for type safety
- **Vite Build System** - Modern build toolchain with HMR support
- **ESLint Configuration** - Code quality enforcement
- **Semantic Release** - Automated versioning and changelog generation

#### Dependencies
- **@logseq/libs** ^0.0.17 - Official Logseq plugin SDK
- **Development Dependencies** - Complete development toolchain including TypeScript, Vite, and semantic-release

#### API Compliance
- **X-Client Header** - Proper client identification for Habitica API
- **Rate Limit Handling** - Respects X-RateLimit-Remaining and X-RateLimit-Reset headers
- **Retry Strategy** - Exponential backoff on 429 responses
- **Error Recovery** - Graceful degradation on API failures

### Security Features
- **Credential Validation** - Real-time validation of API credentials
- **Safe API Calls** - Proper error boundaries and timeout handling
- **Data Privacy** - No logging of sensitive user data
- **Secure Storage** - Uses Logseq's secure settings storage

### Performance Optimizations
- **Debounced Operations** - 300ms debounce on block changes to prevent excessive API calls
- **Cache Management** - Automatic cleanup of processed task cache after 10 seconds
- **Efficient Queries** - Optimized Datalog queries for today's journal page
- **Minimal DOM Updates** - Efficient block content updates

### Documentation
- **Comprehensive README** - Detailed installation, configuration, and usage instructions
- **API Guidelines** - Clear documentation of Habitica API compliance
- **Troubleshooting Guide** - Common issues and solutions
- **Examples** - Practical usage examples and workflows

[1.0.0]: https://github.com/callum/logseq-plugin-habitica/releases/tag/v1.0.0
