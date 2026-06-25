import { CommandManager } from './CommandManager';
import { EditorModel } from './EditorModel';
import { PluginInterface, EditorConfig } from '../types';

export class Editor {
  private container: HTMLElement;
  private editableArea: HTMLElement;
  private commandManager: CommandManager;
  private model: EditorModel;
  private plugins: Map<string, PluginInterface> = new Map();
  private config: EditorConfig;

  constructor(selector: string, config: EditorConfig = {}) {
    const container = document.querySelector(selector);
    if (!container) {
      throw new Error(`Container "${selector}" not found`);
    }

    this.container = container as HTMLElement;
    this.config = config;
    this.commandManager = new CommandManager();
    this.model = new EditorModel();
    this.editableArea = this.createEditableArea();
    this.initializeEditor();

    if (config.initialData) {
      this.setData(config.initialData);
    }
  }

  private createEditableArea(): HTMLElement {
    const area = document.createElement('div');
    area.className = 'editor-editable';
    area.contentEditable = 'true';
    area.style.cssText = `
      border: 1px solid #ddd;
      border-radius: 0.375rem;
      padding: 0.75rem;
      min-height: 300px;
      outline: none;
      font-size: 1rem;
      line-height: 1.5;
    `;
    if (this.config.placeholder) {
      area.setAttribute('data-placeholder', this.config.placeholder);
      area.style.position = 'relative';
    }
    return area;
  }

  private initializeEditor(): void {
    this.container.appendChild(this.editableArea);

    // Setup input handler
    this.editableArea.addEventListener('input', () => {
      this.model.setContent(this.editableArea.innerHTML);
    });

    this.editableArea.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text/html') || 
                   e.clipboardData?.getData('text/plain') || '';
      this.executeCommand('insertHTML', text);
    });
  }

  registerPlugin(plugin: PluginInterface): void {
    plugin.init(this as any);
  }

  executeCommand(name: string, value?: any): boolean {
    if (name === 'insertHTML') {
      this.editableArea.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const frag = document.createDocumentFragment();
        const div = document.createElement('div');
        div.innerHTML = value;
        while (div.firstChild) {
          frag.appendChild(div.firstChild);
        }
        range.insertNode(frag);
        this.model.setContent(this.editableArea.innerHTML);
      }
      return true;
    }

    return this.commandManager.execute(name, value);
  }

  undo(): void {
    if (this.commandManager.undo()) {
      this.updateEditableArea();
    }
  }

  redo(): void {
    if (this.commandManager.redo()) {
      this.updateEditableArea();
    }
  }

  canUndo(): boolean {
    return this.commandManager.canUndo();
  }

  canRedo(): boolean {
    return this.commandManager.canRedo();
  }

  setData(html: string): void {
    this.editableArea.innerHTML = html;
    this.model.setContent(html);
  }

  getData(): string {
    return this.model.getContent();
  }

  getEditableArea(): HTMLElement {
    return this.editableArea;
  }

  getCommandManager(): CommandManager {
    return this.commandManager;
  }

  private updateEditableArea(): void {
    this.editableArea.innerHTML = this.model.getContent();
  }

  destroy(): void {
    this.plugins.forEach((plugin) => {
      if (plugin.destroy) {
        plugin.destroy();
      }
    });
    this.container.innerHTML = '';
  }
}
