<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project: Tiny Bootstrap-Compatible WYSIWYG Editor

This is a lightweight, modular WYSIWYG rich text editor.

- **Framework**: Vanilla JavaScript/TypeScript
- **Styling**: Bootstrap 5
- **Architecture**: Plugin-based command system
- **Features**: 
  - Text formatting (bold, italic, underline, strikethrough)
  - Lists (ordered, unordered)
  - Links, quotes, code blocks
  - Heading levels
  - Text alignment
  - Character and paragraph formatting

### Build & Development

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
```

### Usage

```javascript
import { TinyWYSIWYG } from './src/editor';

const editor = new TinyWYSIWYG('#editor-container');
```

### Architecture

- `src/core/` - Core editor engine and command system
- `src/plugins/` - Feature plugins (formatting, lists, etc.)
- `src/ui/` - Toolbar and UI components
- `src/utils/` - Utility functions

