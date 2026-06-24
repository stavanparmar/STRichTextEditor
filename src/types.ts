export interface EditorConfig {
  placeholder?: string;
  autosave?: boolean;
  autosaveInterval?: number;
  toolbar?: string[];
  plugins?: string[];
  initialData?: string;
}

export interface Command {
  name: string;
  execute(value?: any): void;
  canExecute?(): boolean;
  undo?(): void;
}

export interface ExecutionContext {
  editor: TinyWYSIWYG;
  selection: Selection;
  range: Range;
}

export interface PluginInterface {
  init(editor: TinyWYSIWYG): void;
  destroy?(): void;
}

export type TinyWYSIWYG = any; // Placeholder for circular dependency
