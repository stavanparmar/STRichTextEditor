# ST Rich Text WYSIWYG Editor

A lightweight, modular WYSIWYG (What You See Is What You Get) rich text editor built with vanilla JavaScript/TypeScript and Bootstrap 5 for seamless integration.

## Features

- **Lightweight**: Minimal dependencies, focus on essential functionality
- **Bootstrap Compatible**: Built with Bootstrap 5 classes and responsive design
- **Plugin-Based Architecture**: Extensible command system for easy feature addition
- **Rich Text Formatting**:
  - Text styles (bold, italic, underline, strikethrough)
  - Lists (ordered and unordered)
  - Text alignment (left, center, right, justify)
  - Indentation control
  - Blockquotes and code blocks
  - Links and formatting removal
- **Undo/Redo Support**: Full history management with undo and redo capabilities
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **TypeScript Support**: Fully typed for better development experience

## Installation

```bash
npm install st-rich-text-editor
```

## Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
</head>
<body>
  <div id="editor-container"></div>
  
  <script src="path/to/editor.js"></script>
  <script>
    const editor = new TinyWYSIWYG('#editor-container', {
      placeholder: 'Start typing...'
    });
  </script>
</body>
</html>
```

### With Initial Content

```javascript
const editor = new TinyWYSIWYG('#editor', {
  placeholder: 'Enter content here...',
  initialData: '<p>Hello <strong>World</strong>!</p>'
});

// Get content
const html = editor.getData();

// Set content
editor.setData('<p>New content</p>');
```

## Configuration Options

```typescript
interface EditorConfig {
  placeholder?: string;        // Placeholder text for empty editor
  autosave?: boolean;          // Enable autosave (future feature)
  autosaveInterval?: number;   // Autosave interval in ms (future feature)
  toolbar?: string[];          // Custom toolbar buttons
  plugins?: string[];          // Custom plugins
  initialData?: string;        // Initial HTML content
}
```

## Development

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The editor will be available at `http://localhost:8080`

### Build for Production

```bash
npm run build
```

The compiled files will be in the `dist/` directory.

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Project Structure

```
├── src/
│   ├── core/
│   │   ├── Editor.ts              # Main editor class
│   │   ├── CommandManager.ts      # Command execution and history
│   │   └── EditorModel.ts         # Content model
│   ├── plugins/
│   │   └── FormattingPlugins.ts   # Built-in formatting plugins
│   ├── ui/
│   │   └── Toolbar.ts             # Toolbar and button management
│   ├── styles/
│   │   └── editor.css             # Editor styles
│   ├── types.ts                   # TypeScript interfaces
│   ├── index.ts                   # Main entry point
│   └── utils/                     # Utility functions
├── examples/
│   └── index.html                 # Demo page
├── dist/                          # Build output
├── webpack.config.js              # Webpack configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Project configuration
```

## API Reference

### TinyWYSIWYG Class

```typescript
class TinyWYSIWYG {
  constructor(selector: string, config?: EditorConfig)
  
  // Get editor content as HTML
  getData(): string
  
  // Set editor content
  setData(html: string): void
  
  // Get the underlying Editor instance
  getEditor(): Editor
  
  // Destroy the editor
  destroy(): void
}
```

### Editor Class

```typescript
class Editor {
  // Execute a command
  executeCommand(name: string, value?: any): boolean
  
  // Undo last action
  undo(): void
  
  // Redo last undone action
  redo(): void
  
  // Check if undo is available
  canUndo(): boolean
  
  // Check if redo is available
  canRedo(): boolean
  
  // Get the editable area element
  getEditableArea(): HTMLElement
  
  // Get command manager for custom command registration
  getCommandManager(): CommandManager
  
  // Destroy the editor
  destroy(): void
}
```

## Built-in Commands

### Text Formatting
- `bold` - Toggle bold
- `italic` - Toggle italic
- `underline` - Toggle underline
- `strikethrough` - Toggle strikethrough
- `superscript` - Toggle superscript
- `subscript` - Toggle subscript
- `code` - Wrap selection in code
- `removeFormat` - Remove all formatting

### Lists
- `insertUnorderedList` - Insert unordered list
- `insertOrderedList` - Insert ordered list

### Alignment
- `alignLeft` - Align text left
- `alignCenter` - Align text center
- `alignRight` - Align text right
- `alignJustify` - Justify text

### Indentation
- `indent` - Increase indentation
- `outdent` - Decrease indentation

### Other
- `heading` - Convert to heading (value: 1-6)
- `insertLink` - Insert link (value: URL)
- `insertBlockquote` - Insert blockquote

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Color Model Reference

### CMYK

CMYK is a subtractive color model used in color printing, standing for **Cyan, Magenta, Yellow, and Key (Black)**.
Unlike the RGB model used in digital displays, CMYK works by subtracting light — each ink layer absorbs (subtracts) certain wavelengths, and the combination of all four produces a full range of printable colors.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Roadmap

- [ ] Image insertion and resizing
- [ ] Table support
- [ ] Mentions and autocomplete
- [ ] Collaborative editing
- [ ] More built-in plugins
- [ ] Themes and customization
- [ ] Accessibility improvements

## Examples

See [examples/index.html](./examples/index.html) for working examples.

## Support

For issues and questions, please open an issue on GitHub.
