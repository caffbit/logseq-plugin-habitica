# 1.0.0 (2025-06-17)


### Bug Fixes

* remove redundant phrasing in plugin description and streamline usage section ([adad1ee](https://github.com/caffbit/logseq-plugin-habitica/commit/adad1eec35bccd9b4aaffe76ba7eb894a1b6f527))
* translate error messages and descriptions to English for better accessibility ([bdd1ca4](https://github.com/caffbit/logseq-plugin-habitica/commit/bdd1ca4ca6492a18d39a8d752df459d8602c816a))
* update Node.js version in workflow from 16 to 18 ([031faf8](https://github.com/caffbit/logseq-plugin-habitica/commit/031faf8e44fd705a148183d119030ae4e8b2cfe3))
* update plugin name in workflow and release configuration ([82048a7](https://github.com/caffbit/logseq-plugin-habitica/commit/82048a718e2526eec9bc30b7234ae67fea62067b))
* update title in index.html to reflect plugin name ([4ad0f07](https://github.com/caffbit/logseq-plugin-habitica/commit/4ad0f0796aeda1bdead3ae91ddd11ea6477dbf23))
* update version in package.json to 1.0.0 ([ff80c72](https://github.com/caffbit/logseq-plugin-habitica/commit/ff80c725dbbd757a998a0cb50de00969715a8237))


### Features

* add Habitica UI integration and toolbar icon ([bff3095](https://github.com/caffbit/logseq-plugin-habitica/commit/bff309570f231f320184f8047d10465b0942fcdf))
* add new screenshots for command palette, settings, and slash command ([2e9eff9](https://github.com/caffbit/logseq-plugin-habitica/commit/2e9eff9c7267511ce456851cca121587011f8d9d))
* implement Habitica connection testing and task management features ([ec352a9](https://github.com/caffbit/logseq-plugin-habitica/commit/ec352a9ef8f646e1863e07907720c916dfdf6ccf))
* implement Habitica task management features and connection handling ([c2efff5](https://github.com/caffbit/logseq-plugin-habitica/commit/c2efff551b0c81dbae4c47be58935cafefab12b0))
* update logo.svg with new design and gradients ([7672fcf](https://github.com/caffbit/logseq-plugin-habitica/commit/7672fcf82694ffee71d1d62be2a2515340b3f7a4))

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
