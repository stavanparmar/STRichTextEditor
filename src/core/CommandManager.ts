import { Command } from '../types';

export class CommandManager {
  private commands: Map<string, Command> = new Map();
  private history: Array<{ command: Command; value?: any }> = [];
  private historyIndex: number = -1;

  register(command: Command): void {
    this.commands.set(command.name, command);
  }

  execute(name: string, value?: any): boolean {
    const command = this.commands.get(name);
    if (!command) {
      console.warn(`Command "${name}" not found`);
      return false;
    }

    if (command.canExecute && !command.canExecute()) {
      return false;
    }

    command.execute(value);

    // Add to history
    this.history.splice(this.historyIndex + 1);
    this.history.push({ command, value });
    this.historyIndex++;

    return true;
  }

  undo(): boolean {
    if (this.historyIndex < 0) {
      return false;
    }

    const entry = this.history[this.historyIndex];
    if (entry.command.undo) {
      entry.command.undo();
      this.historyIndex--;
      return true;
    }

    return false;
  }

  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) {
      return false;
    }

    this.historyIndex++;
    const entry = this.history[this.historyIndex];
    entry.command.execute(entry.value);
    return true;
  }

  canUndo(): boolean {
    return this.historyIndex >= 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }
}
