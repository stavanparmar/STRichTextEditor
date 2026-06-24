import { Editor } from './core/Editor';
import { CommandManager } from './core/CommandManager';
import { EditorModel } from './core/EditorModel';
import { Toolbar } from './ui/Toolbar';
import { EditorConfig } from './types';
import './styles/editor.css';

export class TinyWYSIWYG {
  private editor: Editor;
  private toolbar: Toolbar;

  constructor(selector: string, config?: EditorConfig) {
    this.editor = new Editor(selector, config);
    this.toolbar = new Toolbar(this.editor);
  }

  setData(html: string): void {
    this.editor.setData(html);
  }

  getData(): string {
    return this.editor.getData();
  }

  getEditor(): Editor {
    return this.editor;
  }

  destroy(): void {
    this.editor.destroy();
  }
}

// Export all core components for advanced usage
export { Editor } from './core/Editor';
export { CommandManager } from './core/CommandManager';
export { EditorModel } from './core/EditorModel';
export { Toolbar } from './ui/Toolbar';
export {
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
} from './plugins/FormattingPlugins';

// Expose globally for UMD builds
if (typeof window !== 'undefined') {
  (window as any).TinyWYSIWYG = TinyWYSIWYG;
}
