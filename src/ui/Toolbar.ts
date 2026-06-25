import { Editor } from '../core/Editor';
import {
  FormattingPlugin,
  ListPlugin,
  HeadingPlugin,
  LinkPlugin,
  AlignmentPlugin,
  IndentPlugin,
  BlockquotePlugin,
  ImagePlugin,
  TablePlugin,
  ColorPlugin,
  FontSizePlugin,
  HorizontalRulePlugin,
  SourceCodePlugin,
} from '../plugins/FormattingPlugins';

export class Toolbar {
  private editor: Editor;
  private toolbarElement: HTMLElement;
  private buttonConfigs: Array<{
    label: string;
    command: string;
    value?: any;
    group?: string;
    icon?: string;
  }> = [];

  constructor(editor: Editor) {
    this.editor = editor;
    this.toolbarElement = this.createToolbar();
    this.initializePlugins();
    this.setupButtons();
  }

  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.75rem;
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      border-bottom: none;
      border-radius: 0.375rem 0.375rem 0 0;
      align-items: center;
    `;
    return toolbar;
  }

  private initializePlugins(): void {
    this.editor.registerPlugin(new FormattingPlugin());
    this.editor.registerPlugin(new ListPlugin());
    this.editor.registerPlugin(new HeadingPlugin());
    this.editor.registerPlugin(new LinkPlugin());
    this.editor.registerPlugin(new AlignmentPlugin());
    this.editor.registerPlugin(new IndentPlugin());
    this.editor.registerPlugin(new BlockquotePlugin());
    this.editor.registerPlugin(new ImagePlugin());
    this.editor.registerPlugin(new TablePlugin());
    this.editor.registerPlugin(new ColorPlugin());
    this.editor.registerPlugin(new FontSizePlugin());
    this.editor.registerPlugin(new HorizontalRulePlugin());
    this.editor.registerPlugin(new SourceCodePlugin());
  }

  private setupButtons(): void {
    this.buttonConfigs = [
      // Heading Selector
      { label: 'Paragraph', command: 'heading', value: 0, group: 'heading' },
      
      // Text Formatting
      { label: 'B', command: 'bold', group: 'formatting', icon: '𝐁' },
      { label: 'I', command: 'italic', group: 'formatting', icon: '𝐈' },
      { label: 'U', command: 'underline', group: 'formatting', icon: '𝐔' },
      { label: 'S', command: 'strikethrough', group: 'formatting', icon: '𝐒' },

      // Lists
      { label: 'UL', command: 'insertUnorderedList', group: 'lists' },
      { label: 'OL', command: 'insertOrderedList', group: 'lists' },

      // Alignment
      { label: '⬅', command: 'alignLeft', group: 'alignment' },
      { label: '⬇', command: 'alignCenter', group: 'alignment' },
      { label: '➡', command: 'alignRight', group: 'alignment' },
      { label: '⬌', command: 'alignJustify', group: 'alignment' },

      // Indent
      { label: '→', command: 'indent', group: 'indent' },
      { label: '←', command: 'outdent', group: 'indent' },

      // Media & Tables
      { label: '🖼️', command: 'insertImage', group: 'media' },
      { label: '📊', command: 'insertTable', group: 'media' },
      { label: '---', command: 'insertHR', group: 'media' },

      // Colors
      { label: '🎨', command: 'textColor', group: 'colors' },
      { label: '🖍️', command: 'highlightColor', group: 'colors' },

      // Other
      { label: 'Quote', command: 'insertBlockquote', group: 'other' },
      { label: 'Code', command: 'code', group: 'other' },
      { label: 'Clear', command: 'removeFormat', group: 'other' },
    ];

    this.renderButtons();
  }

  private renderButtons(): void {
    const container = this.editor.getEditableArea().parentElement;
    if (container) {
      container.insertBefore(this.toolbarElement, this.editor.getEditableArea());
    }

    // Add heading selector
    this.toolbarElement.appendChild(this.createHeadingSelector());
    
    // Add separator
    this.addSeparator();

    this.buttonConfigs.forEach((config) => {
      // Skip heading as it's already handled
      if (config.group === 'heading') return;

      // Add separator before certain groups
      if (config.group === 'lists') this.addSeparator();
      if (config.group === 'alignment') this.addSeparator();
      if (config.group === 'media') this.addSeparator();
      if (config.group === 'colors') this.addSeparator();
      if (config.group === 'other') this.addSeparator();

      // Handle special buttons
      if (config.command === 'insertImage') {
        this.toolbarElement.appendChild(this.createImageButton());
      } else if (config.command === 'insertTable') {
        this.toolbarElement.appendChild(this.createTableButton());
      } else if (config.command === 'textColor') {
        this.toolbarElement.appendChild(this.createColorButton('Text Color', 'textColor'));
      } else if (config.command === 'highlightColor') {
        this.toolbarElement.appendChild(this.createColorButton('Highlight', 'highlightColor'));
      } else if (config.command === 'insertHR') {
        const button = this.createButton(config);
        this.toolbarElement.appendChild(button);
      } else {
        const button = this.createButton(config);
        this.toolbarElement.appendChild(button);
      }
    });
  }

  private createButton(config: {
    label: string;
    command: string;
    value?: any;
    group?: string;
  }): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'btn btn-sm btn-outline-secondary editor-btn';
    button.textContent = config.label;
    button.title = config.command;
    button.style.cssText = `
      font-size: 0.875rem;
      padding: 0.375rem 0.75rem;
      min-width: 2rem;
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.editor.executeCommand(config.command, config.value);
      this.editor.getEditableArea().focus();
    });

    return button;
  }

  private createHeadingSelector(): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'form-select form-select-sm';
    select.style.cssText = `
      width: 140px;
      font-size: 0.875rem;
      margin-right: 0.5rem;
    `;

    const options = [
      { label: 'Paragraph', value: '0' },
      { label: 'Heading 1', value: '1' },
      { label: 'Heading 2', value: '2' },
      { label: 'Heading 3', value: '3' },
      { label: 'Heading 4', value: '4' },
      { label: 'Heading 5', value: '5' },
      { label: 'Heading 6', value: '6' },
    ];

    options.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      const level = parseInt(select.value);
      this.editor.executeCommand('heading', level);
      this.editor.getEditableArea().focus();
    });

    return select;
  }

  private createImageButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'btn btn-sm btn-outline-secondary editor-btn';
    button.textContent = '🖼️ Image';
    button.style.cssText = `
      font-size: 0.875rem;
      padding: 0.375rem 0.75rem;
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      const url = prompt('Enter image URL:');
      if (url) {
        this.editor.executeCommand('insertImage', url);
      }
      this.editor.getEditableArea().focus();
    });

    return button;
  }

  private createTableButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'btn btn-sm btn-outline-secondary editor-btn';
    button.textContent = '📊 Table';
    button.style.cssText = `
      font-size: 0.875rem;
      padding: 0.375rem 0.75rem;
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      const rows = prompt('Number of rows:', '3');
      if (rows) {
        const cols = prompt('Number of columns:', '3');
        if (cols) {
          this.editor.executeCommand('insertTable', {
            rows: parseInt(rows),
            cols: parseInt(cols),
          });
        }
      }
      this.editor.getEditableArea().focus();
    });

    return button;
  }

  private createColorButton(label: string, command: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'btn btn-sm btn-outline-secondary editor-btn';
    button.textContent = label;
    button.style.cssText = `
      font-size: 0.875rem;
      padding: 0.375rem 0.75rem;
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      const color = prompt('Enter color (hex or name):');
      if (color) {
        this.editor.executeCommand(command, color);
      }
      this.editor.getEditableArea().focus();
    });

    return button;
  }

  private addSeparator(): void {
    const separator = document.createElement('div');
    separator.style.cssText = `
      width: 1px;
      height: 24px;
      background-color: #ddd;
      margin: 0 0.25rem;
    `;
    this.toolbarElement.appendChild(separator);
  }

  getToolbarElement(): HTMLElement {
    return this.toolbarElement;
  }
}
