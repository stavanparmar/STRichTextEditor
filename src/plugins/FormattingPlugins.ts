import { PluginInterface, Command } from '../types';
import { Editor } from '../core/Editor';

export class FormattingPlugin implements PluginInterface {
  init(editor: Editor): void {
    this.registerCommands(editor);
  }

  private registerCommands(editor: Editor): void {
    const commands: Record<string, () => void> = {
      bold: () => document.execCommand('bold'),
      italic: () => document.execCommand('italic'),
      underline: () => document.execCommand('underline'),
      strikethrough: () => document.execCommand('strikethrough'),
      superscript: () => document.execCommand('superscript'),
      subscript: () => document.execCommand('subscript'),
      removeFormat: () => document.execCommand('removeFormat'),
      code: () => this.insertCode(editor),
    };

    Object.entries(commands).forEach(([name, execute]) => {
      const command: Command = {
        name,
        execute,
        canExecute: () => this.hasSelection(),
      };
      editor.getCommandManager().register(command);
    });
  }

  private hasSelection(): boolean {
    const selection = window.getSelection();
    return !!(selection && selection.toString().length > 0);
  }

  private insertCode(editor: Editor): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const code = document.createElement('code');
    code.style.cssText =
      'background-color: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace;';

    try {
      range.surroundContents(code);
    } catch {
      const fragment = range.extractContents();
      code.appendChild(fragment);
      range.insertNode(code);
    }
  }
}

export class ListPlugin implements PluginInterface {
  init(editor: Editor): void {
    this.registerCommands(editor);
  }

  private registerCommands(editor: Editor): void {
    const commands: Record<string, () => void> = {
      insertUnorderedList: () => document.execCommand('insertUnorderedList'),
      insertOrderedList: () => document.execCommand('insertOrderedList'),
    };

    Object.entries(commands).forEach(([name, execute]) => {
      const command: Command = {
        name,
        execute,
      };
      editor.getCommandManager().register(command);
    });
  }
}

export class HeadingPlugin implements PluginInterface {
  init(editor: Editor): void {
    const command: Command = {
      name: 'heading',
      execute: (level: number) => {
        if (!level || level < 1 || level > 6) {
          document.execCommand('formatBlock', false, '<p>');
          return;
        }
        document.execCommand('formatBlock', false, `<h${level}>`);
      },
    };
    editor.getCommandManager().register(command);
  }
}

export class LinkPlugin implements PluginInterface {
  init(editor: Editor): void {
    const command: Command = {
      name: 'insertLink',
      execute: (url: string) => {
        const selection = window.getSelection();
        if (selection && selection.toString()) {
          document.execCommand('createLink', false, url);
        }
      },
      canExecute: () => {
        const selection = window.getSelection();
        return !!(selection && selection.toString().length > 0);
      },
    };
    editor.getCommandManager().register(command);
  }
}

export class AlignmentPlugin implements PluginInterface {
  init(editor: Editor): void {
    const alignments = ['left', 'center', 'right', 'justify'];
    alignments.forEach((align) => {
      const command: Command = {
        name: `align${align.charAt(0).toUpperCase() + align.slice(1)}`,
        execute: () => {
          document.execCommand(`justify${align.charAt(0).toUpperCase() + align.slice(1)}`);
        },
      };
      editor.getCommandManager().register(command);
    });
  }
}

export class IndentPlugin implements PluginInterface {
  init(editor: Editor): void {
    const commands: Record<string, () => void> = {
      indent: () => document.execCommand('indent'),
      outdent: () => document.execCommand('outdent'),
    };

    Object.entries(commands).forEach(([name, execute]) => {
      const command: Command = {
        name,
        execute,
      };
      editor.getCommandManager().register(command);
    });
  }
}

export class BlockquotePlugin implements PluginInterface {
  init(editor: Editor): void {
    const command: Command = {
      name: 'insertBlockquote',
      execute: () => {
        document.execCommand('formatBlock', false, '<blockquote>');
      },
    };
    editor.getCommandManager().register(command);
  }
}

export class ImagePlugin implements PluginInterface {
  init(editor: Editor): void {
    const command: Command = {
      name: 'insertImage',
      execute: (url: string) => {
        if (!url) return;
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (editor.getEditableArea().contains(range.commonAncestorContainer)) {
            range.insertNode(img);
            return;
          }
        }

        editor.getEditableArea().appendChild(img);
      },
    };
    editor.getCommandManager().register(command);
  }
}

export class TablePlugin implements PluginInterface {
  init(editor: Editor): void {
    const command: Command = {
      name: 'insertTable',
      execute: (value?: { rows?: number; cols?: number } | number) => {
        const rows =
          typeof value === 'number'
            ? value
            : Math.max(1, Math.min(20, value?.rows ?? 3));
        const cols =
          typeof value === 'number'
            ? 3
            : Math.max(1, Math.min(20, value?.cols ?? 3));

        const table = document.createElement('table');
        for (let i = 0; i < rows; i++) {
          const tr = document.createElement('tr');
          for (let j = 0; j < cols; j++) {
            const td = document.createElement('td');
            td.textContent = '';
            tr.appendChild(td);
          }
          table.appendChild(tr);
        }
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (editor.getEditableArea().contains(range.commonAncestorContainer)) {
            range.insertNode(table);
            return;
          }
        }

        editor.getEditableArea().appendChild(table);
      },
    };
    editor.getCommandManager().register(command);
  }
}

export class ColorPlugin implements PluginInterface {
  init(editor: Editor): void {
    const commands: Record<string, (color: string) => void> = {
      textColor: (color: string) => {
        document.execCommand('foreColor', false, color);
      },
      highlightColor: (color: string) => {
        document.execCommand('hiliteColor', false, color);
      },
    };

    Object.entries(commands).forEach(([name, execute]) => {
      const command: Command = {
        name,
        execute,
      };
      editor.getCommandManager().register(command);
    });
  }
}

export class FontSizePlugin implements PluginInterface {
  init(editor: Editor): void {
    const command: Command = {
      name: 'fontSize',
      execute: (size: string) => {
        document.execCommand('fontSize', false, size);
      },
    };
    editor.getCommandManager().register(command);
  }
}

export class HorizontalRulePlugin implements PluginInterface {
  init(editor: Editor): void {
    const command: Command = {
      name: 'insertHR',
      execute: () => {
        const hr = document.createElement('hr');
        hr.style.cssText = 'margin: 1rem 0; border: none; border-top: 1px solid #ddd;';
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(hr);
        } else {
          document.execCommand('insertHorizontalRule');
        }
      },
    };
    editor.getCommandManager().register(command);
  }
}

export class SourceCodePlugin implements PluginInterface {
  init(editor: Editor): void {
    const command: Command = {
      name: 'viewSource',
      execute: () => {
        const area = editor.getEditableArea();
        const currentContent = area.innerHTML;
        area.innerHTML = `<pre>${currentContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
      },
    };
    editor.getCommandManager().register(command);
  }
}
