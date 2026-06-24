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
import { getEditorIconSvg } from '../assets/icons';

export class Toolbar {
  private editor: Editor;
  private toolbarElement: HTMLElement;
  private quickToolbarElement: HTMLElement;
  private imageToolbarElement: HTMLElement;
  private tableToolbarElement: HTMLElement;
  private linkToolbarElement: HTMLElement;
  private imageResizeHandles: Record<string, HTMLElement> = {};
  private resizeTooltip: HTMLElement;
  private savedSelectionRange: Range | null = null;
  private activeImage: HTMLImageElement | null = null;
  private activeTableCell: HTMLTableCellElement | null = null;
  private activeLink: HTMLAnchorElement | null = null;
  private isResizingImage = false;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private resizeStartWidth = 0;
  private resizeStartHeight = 0;
  private resizeCorner: string | null = null;
  private isDraggingImageToMove = false;
  private imageMoveStartX = 0;
  private imageMoveStartY = 0;
  private imageMoveOffsetX = 0;
  private imageMoveOffsetY = 0;
  private buttonConfigs: Array<{
    label: string;
    command: string;
    title?: string;
    value?: any;
    group?: string;
    icon?: string;
  }> = [];
  private linkButtons: HTMLButtonElement[] = [];

  constructor(editor: Editor) {
    this.editor = editor;
    this.toolbarElement = this.createToolbar();
    this.quickToolbarElement = this.createQuickToolbar();
    this.imageToolbarElement = this.createImageToolbar();
    this.tableToolbarElement = this.createTableToolbar();
    this.linkToolbarElement = this.createLinkToolbar();
    this.createImageResizeHandles();
    this.resizeTooltip = this.createResizeTooltip();
    this.initializePlugins();
    this.setupButtons();
    this.setupQuickToolbarBehavior();
    this.setupContextToolbarBehavior();
  }

  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    return toolbar;
  }

  private createIconElement(icon: string, fallback = '?'): HTMLElement {
    const span = document.createElement('span');
    span.className = 'editor-icon';
    const svg = getEditorIconSvg(icon);
    if (svg) {
      span.innerHTML = svg;
    } else {
      span.textContent = fallback;
    }
    return span;
  }

  private createFileUploadButton(): HTMLElement {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.position = 'relative';

    const button = document.createElement('button');
    button.className = 'editor-btn';
    button.type = 'button';
    button.title = 'Upload File';
    button.setAttribute('aria-label', 'Upload File');
    button.classList.add('icon-only');
    button.appendChild(this.createIconElement('fa-upload', 'Up'));

    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.accept = 'image/*,.pdf,.doc,.docx,.txt';

    button.addEventListener('click', () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        this.savedSelectionRange = selection.getRangeAt(0).cloneRange();
      }
      input.click();
    });

    input.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        this.restoreSelectionIfNeeded();

        if (file.type.startsWith('image/')) {
          this.insertImageAndActivate(result);
          return;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          return;
        }

        const link = document.createElement('a');
        link.href = result;
        link.download = file.name;
        link.textContent = file.name;

        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(link);

        const newRange = document.createRange();
        newRange.setStartAfter(link);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        this.editor.getEditableArea().focus();
      };
      reader.readAsDataURL(file);
      input.value = '';
    });

    container.appendChild(button);
    container.appendChild(input);
    return container;
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
      { label: 'Bold', command: 'bold', title: 'Bold (Ctrl+B)', group: 'formatting', icon: 'fa-bold' },
      { label: 'Italic', command: 'italic', title: 'Italic (Ctrl+I)', group: 'formatting', icon: 'fa-italic' },
      { label: 'Underline', command: 'underline', title: 'Underline (Ctrl+U)', group: 'formatting', icon: 'fa-underline' },
      { label: 'Strikethrough', command: 'strikethrough', title: 'Strikethrough', group: 'formatting', icon: 'fa-strikethrough' },

      // Script
      { label: 'Subscript', command: 'subscript', title: 'Subscript', group: 'script', icon: 'fa-subscript' },
      { label: 'Superscript', command: 'superscript', title: 'Superscript', group: 'script', icon: 'fa-superscript' },

      // Lists
      { label: 'List', command: 'insertUnorderedList', title: 'Bulleted List', group: 'lists', icon: 'fa-list-ul' },
      { label: 'Ordered', command: 'insertOrderedList', title: 'Numbered List', group: 'lists', icon: 'fa-list-ol' },

      // Alignment
      { label: 'Left', command: 'alignLeft', title: 'Align Left', group: 'alignment', icon: 'fa-align-left' },
      { label: 'Center', command: 'alignCenter', title: 'Align Center', group: 'alignment', icon: 'fa-align-center' },
      { label: 'Right', command: 'alignRight', title: 'Align Right', group: 'alignment', icon: 'fa-align-right' },
      { label: 'Justify', command: 'alignJustify', title: 'Justify', group: 'alignment', icon: 'fa-align-justify' },

      // Indent
      { label: 'Indent', command: 'indent', title: 'Indent', group: 'indent', icon: 'fa-indent' },
      { label: 'Outdent', command: 'outdent', title: 'Outdent', group: 'indent', icon: 'fa-outdent' },

      // Linking
      { label: 'Link', command: 'insertLink', title: 'Insert Link (Ctrl+K)', group: 'link', icon: 'fa-link' },

      // Media & Tables
      { label: 'Image', command: 'insertImage', title: 'Insert Image', group: 'media', icon: 'fa-image' },
      { label: 'Upload', command: 'uploadFile', title: 'Upload File', group: 'media', icon: 'fa-upload' },
      { label: 'Table', command: 'insertTable', title: 'Insert Table', group: 'media', icon: 'fa-table' },
      { label: 'Line', command: 'insertHR', title: 'Horizontal Line', group: 'media', icon: 'fa-minus' },

      // Colors
      { label: 'Text Color', command: 'textColor', title: 'Text Color', group: 'colors', icon: 'fa-palette' },
      { label: 'Highlight', command: 'highlightColor', title: 'Highlight', group: 'colors', icon: 'fa-highlighter' },

      // Other
      { label: 'Quote', command: 'insertBlockquote', title: 'Blockquote', group: 'other', icon: 'fa-quote-left' },
      { label: 'Code', command: 'code', title: 'Inline Code', group: 'other', icon: 'fa-code' },
      { label: 'Source', command: 'viewSource', title: 'View Source', group: 'other', icon: 'fa-file-code' },
      { label: 'Clear', command: 'removeFormat', title: 'Clear Formatting', group: 'other', icon: 'fa-eraser' },
    ];

    this.renderButtons();
  }

  private renderButtons(): void {
    const container = this.editor.getEditableArea().parentElement;
    if (container) {
      container.insertBefore(this.toolbarElement, this.editor.getEditableArea());
    }

    // Froala-like typography controls
    this.toolbarElement.appendChild(this.createHeadingSelector());
    this.toolbarElement.appendChild(this.createFontFamilySelector());
    this.toolbarElement.appendChild(this.createFontSizeSelector());
    
    // Add separator
    this.addSeparator();

    this.buttonConfigs.forEach((config) => {
      // Skip heading as it's already handled
      if (config.group === 'heading') return;

      // Add separator before certain groups
      if (config.group === 'lists') this.addSeparator();
      if (config.group === 'script') this.addSeparator();
      if (config.group === 'alignment') this.addSeparator();
      if (config.group === 'link') this.addSeparator();
      if (config.group === 'media') this.addSeparator();
      if (config.group === 'colors') this.addSeparator();
      if (config.group === 'other') this.addSeparator();

      // Handle special buttons
      if (config.command === 'insertImage') {
        this.toolbarElement.appendChild(this.createImageButton());
      } else if (config.command === 'uploadFile') {
        return;
      } else if (config.command === 'insertTable') {
        this.toolbarElement.appendChild(this.createTableButton());
      } else if (config.command === 'textColor') {
        this.toolbarElement.appendChild(this.createColorButton('Text Color', 'textColor', 'Text Color'));
      } else if (config.command === 'highlightColor') {
        this.toolbarElement.appendChild(this.createColorButton('Highlight', 'highlightColor', 'Highlight'));
      } else if (config.command === 'insertHR') {
        const button = this.createButton(config);
        this.toolbarElement.appendChild(button);
      } else if (config.command === 'insertLink') {
        this.toolbarElement.appendChild(this.createLinkButton());
      } else {
        const button = this.createButton(config);
        this.toolbarElement.appendChild(button);
      }
    });
  }

  private createButton(config: {
    label: string;
    command: string;
    title?: string;
    value?: any;
    group?: string;
    icon?: string;
  }): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'editor-btn';
    button.type = 'button';
    button.title = config.title || config.command;
    button.setAttribute('aria-label', config.title || config.command);

    if (config.icon) {
      button.classList.add('icon-only');
      button.appendChild(this.createIconElement(config.icon, config.label.charAt(0).toUpperCase()));
    } else {
      button.textContent = config.label;
    }

    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.editor.executeCommand(config.command, config.value);
      this.editor.getEditableArea().focus();
    });

    return button;
  }

  private createHeadingSelector(): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'form-select form-select-sm editor-toolbar-select editor-heading-select';

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

  private createFontFamilySelector(): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'form-select form-select-sm editor-toolbar-select editor-font-select';
    select.title = 'Font Family';
    select.setAttribute('aria-label', 'Font Family');

    const options = [
      { label: 'Default', value: '' },
      { label: 'Arial', value: 'Arial' },
      { label: 'Arial Black', value: 'Arial Black' },
      { label: 'Comic Sans MS', value: 'Comic Sans MS' },
      { label: 'Courier New', value: 'Courier New' },
      { label: 'Georgia', value: 'Georgia' },
      { label: 'Helvetica', value: 'Helvetica' },
      { label: 'Impact', value: 'Impact' },
      { label: 'Tahoma', value: 'Tahoma' },
      { label: 'Times New Roman', value: 'Times New Roman' },
      { label: 'Trebuchet MS', value: 'Trebuchet MS' },
      { label: 'Verdana', value: 'Verdana' },
    ];

    options.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      if (select.value) {
        document.execCommand('fontName', false, select.value);
      }
      this.editor.getEditableArea().focus();
    });

    return select;
  }

  private createFontSizeSelector(): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'form-select form-select-sm editor-toolbar-select editor-size-select';
    select.title = 'Font Size';
    select.setAttribute('aria-label', 'Font Size');

    const options = [
      { label: '8',  value: '8pt' },
      { label: '10', value: '10pt' },
      { label: '12', value: '12pt' },
      { label: '14', value: '14pt' },
      { label: 'Default', value: '' },
      { label: '18', value: '18pt' },
      { label: '20', value: '20pt' },
      { label: '22', value: '22pt' },
      { label: '24', value: '24pt' },
      { label: '26', value: '26pt' },
      { label: '28', value: '28pt' },
      { label: '32', value: '32pt' },
      { label: '36', value: '36pt' },
      { label: '48', value: '48pt' },
      { label: '72', value: '72pt' },
    ];

    options.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      // Apply inline font-size style on selected text; Default clears explicit size.
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        document.execCommand('fontSize', false, '7');
        const spans = this.editor.getEditableArea().querySelectorAll<HTMLElement>('[size="7"]');
        spans.forEach((el) => {
          el.removeAttribute('size');
          if (select.value) {
            el.style.fontSize = select.value;
          } else {
            el.style.removeProperty('font-size');
          }
        });
      }
      this.editor.getEditableArea().focus();
      select.value = '';
    });

    return select;
  }

  private createImageButton(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'editor-image-dropdown';

    const button = document.createElement('button');
    button.className = 'editor-btn';
    button.type = 'button';
    button.title = 'Insert Image options';
    button.setAttribute('aria-label', 'Insert Image options');
    button.classList.add('icon-only');
    button.appendChild(this.createIconElement('fa-image', 'I'));

    const menu = document.createElement('div');
    menu.className = 'editor-dropdown-menu';

    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'editor-dropdown-item';
    uploadBtn.title = 'Upload image';
    uploadBtn.setAttribute('aria-label', 'Upload image');
    uploadBtn.classList.add('icon-only');
    uploadBtn.appendChild(this.createIconElement('fa-upload', 'Up'));

    const urlBtn = document.createElement('button');
    urlBtn.type = 'button';
    urlBtn.className = 'editor-dropdown-item';
    urlBtn.title = 'Image URL';
    urlBtn.setAttribute('aria-label', 'Image URL');
    urlBtn.classList.add('icon-only');
    urlBtn.appendChild(this.createIconElement('fa-link', 'URL'));

    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.accept = 'image/*';

    const closeMenu = () => {
      menu.classList.remove('visible');
      button.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
      menu.classList.add('visible');
      button.setAttribute('aria-expanded', 'true');
    };

    button.addEventListener('click', (e) => {
      e.preventDefault();
      if (menu.classList.contains('visible')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    uploadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        this.savedSelectionRange = selection.getRangeAt(0).cloneRange();
      }
      closeMenu();
      input.click();
    });

    urlBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        this.savedSelectionRange = selection.getRangeAt(0).cloneRange();
      }
      closeMenu();
      this.openImageDialog();
    });

    input.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        this.insertImageAndActivate(result);
      };
      reader.readAsDataURL(file);
      input.value = '';
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target as Node)) {
        closeMenu();
      }
    });

    menu.append(uploadBtn, urlBtn);
    container.append(button, menu, input);

    return container;
  }

  private createTableButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'editor-btn';
    button.type = 'button';
    button.title = 'Insert Table';
    button.setAttribute('aria-label', 'Insert Table');
    button.classList.add('icon-only');
    button.appendChild(this.createIconElement('fa-table', 'T'));

    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.openTableDialog();
    });

    return button;
  }

  private createColorButton(label: string, command: string, title: string): HTMLElement {
    // Split button: left applies last-used color, right opens picker
    const container = document.createElement('div');
    container.className = 'editor-color-btn-group';
    container.style.position = 'relative';

    const isText = command === 'textColor';
    const icon = isText ? 'fa-palette' : 'fa-highlighter';
    let activeColor = isText ? '#000000' : '#ffff00';

    // ── main icon button ──────────────────────────────────────────────────────
    const applyBtn = document.createElement('button');
    applyBtn.className = 'editor-btn icon-only editor-color-apply-btn';
    applyBtn.type = 'button';
    applyBtn.title = title;
    applyBtn.setAttribute('aria-label', title);

    const iconEl = this.createIconElement(icon, label.charAt(0).toUpperCase());
    applyBtn.appendChild(iconEl);

    // color bar under the icon
    const bar = document.createElement('span');
    bar.className = 'editor-color-bar';
    bar.style.background = activeColor;
    applyBtn.appendChild(bar);

    applyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.editor.executeCommand(command, activeColor);
      this.editor.getEditableArea().focus();
    });

    // ── chevron button ────────────────────────────────────────────────────────
    const chevronBtn = document.createElement('button');
    chevronBtn.className = 'editor-btn icon-only editor-color-chevron-btn';
    chevronBtn.type = 'button';
    chevronBtn.title = `${title} options`;
    chevronBtn.setAttribute('aria-label', `${title} options`);
    chevronBtn.innerHTML = '<svg viewBox="0 0 10 6" aria-hidden="true" style="width:8px;height:8px;stroke:currentColor;fill:none;stroke-width:1.5"><path d="M1 1l4 4 4-4"/></svg>';

    // ── dropdown ──────────────────────────────────────────────────────────────
    const dropdown = document.createElement('div');
    dropdown.className = 'editor-color-dropdown';

    // tabs
    const tabBar = document.createElement('div');
    tabBar.className = 'editor-color-tabs';

    const swatchTab = document.createElement('button');
    swatchTab.type = 'button';
    swatchTab.className = 'editor-color-tab active';
    swatchTab.textContent = 'Color';

    const cmykTab = document.createElement('button');
    cmykTab.type = 'button';
    cmykTab.className = 'editor-color-tab';
    cmykTab.textContent = 'CMYK';

    tabBar.append(swatchTab, cmykTab);
    dropdown.appendChild(tabBar);

    // ── swatch panel ──────────────────────────────────────────────────────────
    const swatchPanel = document.createElement('div');
    swatchPanel.className = 'editor-color-panel';

    // "Remove color" row
    const removeRow = document.createElement('button');
    removeRow.type = 'button';
    removeRow.className = 'editor-color-remove-btn';
    removeRow.innerHTML = `<svg viewBox="0 0 16 16" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.5"><path d="M4 12L12 4M4 4l8 8"/></svg> Remove color`;
    removeRow.addEventListener('click', () => {
      this.editor.executeCommand('removeFormat');
      this.editor.getEditableArea().focus();
      dropdown.classList.remove('visible');
    });
    swatchPanel.appendChild(removeRow);

    // swatch grid – 10 columns × N rows of curated colors
    const grid = document.createElement('div');
    grid.className = 'editor-color-grid';
    const SWATCHES = [
      '#000000','#1a1a1a','#333333','#4d4d4d','#666666','#808080','#999999','#b3b3b3','#cccccc','#ffffff',
      '#ff0000','#ff4000','#ff8000','#ffbf00','#ffff00','#80ff00','#00ff00','#00ff80','#00ffff','#0080ff',
      '#0000ff','#8000ff','#ff00ff','#ff0080','#bf0000','#7f3300','#7f6600','#667f00','#007f00','#00664d',
      '#004d7f','#003380','#1a0066','#4d0066','#66004d','#ff9999','#ffcc99','#ffff99','#ccff99','#99ffcc',
      '#99ccff','#9999ff','#cc99ff','#ff99cc','#ff99e6','#cc0000','#cc5200','#ccaa00','#88cc00','#00cc44',
      '#0088cc','#0044cc','#5500cc','#aa00cc','#cc0077','#ff6666','#ffaa66','#ffee66','#aaff66','#66ffaa',
      '#66aaff','#6666ff','#aa66ff','#ff66aa','#ff66dd',
    ];
    SWATCHES.forEach((hex) => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'editor-color-swatch';
      swatch.style.background = hex;
      swatch.title = hex;
      swatch.addEventListener('click', () => {
        activeColor = hex;
        bar.style.background = hex;
        this.editor.executeCommand(command, hex);
        this.editor.getEditableArea().focus();
        dropdown.classList.remove('visible');
      });
      grid.appendChild(swatch);
    });
    swatchPanel.appendChild(grid);

    // native color picker row
    const pickerRow = document.createElement('label');
    pickerRow.className = 'editor-color-picker-row';
    pickerRow.innerHTML = `<svg viewBox="0 0 16 16" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg> Color picker`;
    const nativeInput = document.createElement('input');
    nativeInput.type = 'color';
    nativeInput.value = activeColor;
    nativeInput.style.opacity = '0';
    nativeInput.style.position = 'absolute';
    nativeInput.style.pointerEvents = 'none';
    nativeInput.addEventListener('input', () => {
      activeColor = nativeInput.value;
      bar.style.background = activeColor;
      this.editor.executeCommand(command, activeColor);
      this.editor.getEditableArea().focus();
    });
    pickerRow.appendChild(nativeInput);
    pickerRow.addEventListener('click', () => nativeInput.click());
    swatchPanel.appendChild(pickerRow);

    dropdown.appendChild(swatchPanel);

    // ── CMYK panel ────────────────────────────────────────────────────────────
    const cmykPanel = document.createElement('div');
    cmykPanel.className = 'editor-color-panel';
    cmykPanel.style.display = 'none';

    const cmykPreview = document.createElement('div');
    cmykPreview.className = 'editor-cmyk-preview';

    const cmykValues = { c: 0, m: 0, y: 0, k: 0 };

    const cmykToHex = (c: number, m: number, y: number, k: number): string => {
      const r = Math.round(255 * (1 - c / 100) * (1 - k / 100));
      const g = Math.round(255 * (1 - m / 100) * (1 - k / 100));
      const b = Math.round(255 * (1 - y / 100) * (1 - k / 100));
      return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    };

    const updateCmykPreview = () => {
      const hex = cmykToHex(cmykValues.c, cmykValues.m, cmykValues.y, cmykValues.k);
      cmykPreview.style.background = hex;
      cmykPreview.title = hex;
    };

    const makeSlider = (ch: 'c' | 'm' | 'y' | 'k', labelText: string, color: string) => {
      const row = document.createElement('div');
      row.className = 'editor-cmyk-row';

      const lbl = document.createElement('span');
      lbl.className = 'editor-cmyk-label';
      lbl.textContent = labelText;
      lbl.style.color = color;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.value = '0';
      slider.className = 'editor-cmyk-slider';
      slider.style.accentColor = color;

      const numInput = document.createElement('input');
      numInput.type = 'number';
      numInput.min = '0';
      numInput.max = '100';
      numInput.value = '0';
      numInput.className = 'editor-cmyk-num';

      slider.addEventListener('input', () => {
        cmykValues[ch] = Number(slider.value);
        numInput.value = slider.value;
        updateCmykPreview();
      });
      numInput.addEventListener('input', () => {
        const v = Math.max(0, Math.min(100, Number(numInput.value)));
        cmykValues[ch] = v;
        slider.value = String(v);
        updateCmykPreview();
      });

      row.append(lbl, slider, numInput);
      return row;
    };

    cmykPanel.appendChild(cmykPreview);
    cmykPanel.appendChild(makeSlider('c', 'C', '#00b5d8'));
    cmykPanel.appendChild(makeSlider('m', 'M', '#e53e8e'));
    cmykPanel.appendChild(makeSlider('y', 'Y', '#ecc94b'));
    cmykPanel.appendChild(makeSlider('k', 'K', '#2d3748'));

    const cmykApply = document.createElement('button');
    cmykApply.type = 'button';
    cmykApply.className = 'editor-cmyk-apply';
    cmykApply.textContent = 'Apply';
    cmykApply.addEventListener('click', () => {
      const hex = cmykToHex(cmykValues.c, cmykValues.m, cmykValues.y, cmykValues.k);
      activeColor = hex;
      bar.style.background = hex;
      this.editor.executeCommand(command, hex);
      this.editor.getEditableArea().focus();
      dropdown.classList.remove('visible');
    });
    cmykPanel.appendChild(cmykApply);
    dropdown.appendChild(cmykPanel);

    // ── tab switching ─────────────────────────────────────────────────────────
    swatchTab.addEventListener('click', () => {
      swatchTab.classList.add('active');
      cmykTab.classList.remove('active');
      swatchPanel.style.display = '';
      cmykPanel.style.display = 'none';
    });
    cmykTab.addEventListener('click', () => {
      cmykTab.classList.add('active');
      swatchTab.classList.remove('active');
      cmykPanel.style.display = '';
      swatchPanel.style.display = 'none';
    });

    // ── chevron toggle ────────────────────────────────────────────────────────
    const allColorDropdowns = () =>
      document.querySelectorAll('.editor-color-dropdown.visible');

    chevronBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('visible');
      allColorDropdowns().forEach((d) => d.classList.remove('visible'));
      if (!isOpen) {
        dropdown.classList.add('visible');
      }
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target as Node)) {
        dropdown.classList.remove('visible');
      }
    });

    container.append(applyBtn, chevronBtn, dropdown);
    return container;
  }

  private createLinkButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'editor-btn';
    button.type = 'button';
    button.title = 'Insert Link (Ctrl+K)';
    button.setAttribute('aria-label', 'Insert Link (Ctrl+K)');
    button.classList.add('icon-only');
    button.appendChild(this.createIconElement('fa-link', 'L'));
    this.linkButtons.push(button);

    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.openLinkDialogForSelection();
    });

    return button;
  }

  private addSeparator(): void {
    const separator = document.createElement('div');
    separator.className = 'editor-separator';
    separator.setAttribute('aria-hidden', 'true');
    this.toolbarElement.appendChild(separator);
  }

  getToolbarElement(): HTMLElement {
    return this.toolbarElement;
  }

  private createQuickToolbar(): HTMLElement {
    const quickToolbar = document.createElement('div');
    quickToolbar.className = 'editor-quick-toolbar';
    quickToolbar.setAttribute('role', 'toolbar');

    const actions = [
      { icon: 'fa-bold', title: 'Bold', handler: () => this.editor.executeCommand('bold') },
      { icon: 'fa-italic', title: 'Italic', handler: () => this.editor.executeCommand('italic') },
      { icon: 'fa-underline', title: 'Underline', handler: () => this.editor.executeCommand('underline') },
      { icon: 'fa-link', title: 'Insert Link', handler: () => this.openLinkDialogForSelection() },
    ];

    actions.forEach((action) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'editor-quick-btn';
      button.title = action.title;
      button.setAttribute('aria-label', action.title);
      button.classList.add('icon-only');
      button.appendChild(this.createIconElement(action.icon, action.title.charAt(0).toUpperCase()));
      if (action.icon === 'fa-link') {
        this.linkButtons.push(button);
      }
      button.addEventListener('click', (e) => {
        e.preventDefault();
        action.handler();
        this.editor.getEditableArea().focus();
        this.updateQuickToolbarVisibility();
      });
      quickToolbar.appendChild(button);
    });

    document.body.appendChild(quickToolbar);
    return quickToolbar;
  }

  private setupQuickToolbarBehavior(): void {
    const editableArea = this.editor.getEditableArea();

    editableArea.addEventListener('mouseup', () => {
      this.updateQuickToolbarVisibility();
      this.updateLinkButtonsState();
    });

    editableArea.addEventListener('keyup', () => {
      this.updateQuickToolbarVisibility();
      this.updateLinkButtonsState();
    });

    document.addEventListener('selectionchange', () => {
      const active = document.activeElement;
      if (active === editableArea || editableArea.contains(active)) {
        this.updateQuickToolbarVisibility();
      }
      this.updateLinkButtonsState();
    });

    document.addEventListener('click', (e) => {
      const target = e.target as Node;
      if (
        !editableArea.contains(target) &&
        !this.quickToolbarElement.contains(target) &&
        !this.imageToolbarElement.contains(target) &&
        !this.tableToolbarElement.contains(target)
      ) {
        this.quickToolbarElement.classList.remove('visible');
        this.imageToolbarElement.classList.remove('visible');
        this.tableToolbarElement.classList.remove('visible');
        Object.values(this.imageResizeHandles).forEach((h) => h.classList.remove('visible'));
        this.activeImage?.classList.remove('editor-image-selected');
        this.activeImage = null;
        this.activeTableCell = null;
      }
      this.updateLinkButtonsState();
    });

    this.updateLinkButtonsState();
  }

  private setupContextToolbarBehavior(): void {
    const editableArea = this.editor.getEditableArea();

    // Handle image selection and start of drag-to-move
    editableArea.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        // Start potential drag-to-move (will only move if not on resize handle)
        this.isDraggingImageToMove = true;
        this.activeImage = img;
        this.imageMoveStartX = e.clientX;
        this.imageMoveStartY = e.clientY;
        this.imageMoveOffsetX = 0;
        this.imageMoveOffsetY = 0;
      }
    });

    editableArea.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.tagName === 'IMG') {
        this.showImageToolbar(target as HTMLImageElement);
        return;
      }

      const cell = target.closest('td,th');
      if (cell) {
        this.showTableToolbar(cell as HTMLTableCellElement);
        return;
      }

      const link = target.closest('a');
      if (link) {
        this.showLinkToolbar(link as HTMLAnchorElement);
        return;
      }

      this.hideContextToolbars();
    });

    document.addEventListener('mousemove', (e) => {
      // Handle image resize (takes priority)
      if (this.isResizingImage && this.activeImage && this.resizeCorner) {
        this.handleImageResize(e);
        return;
      }

      // Handle image drag-to-move
      if (this.isDraggingImageToMove && this.activeImage) {
        this.imageMoveOffsetX = e.clientX - this.imageMoveStartX;
        this.imageMoveOffsetY = e.clientY - this.imageMoveStartY;
        this.activeImage.style.transform = `translate(${this.imageMoveOffsetX}px, ${this.imageMoveOffsetY}px)`;
        return;
      }
    });

    document.addEventListener('mouseup', () => {
      this.isResizingImage = false;
      this.resizeCorner = null;
      this.isDraggingImageToMove = false;
    });
  }

  private hideContextToolbars(): void {
    this.imageToolbarElement.classList.remove('visible');
    this.tableToolbarElement.classList.remove('visible');
    this.linkToolbarElement.classList.remove('visible');
    this.resizeTooltip.classList.remove('visible');
    Object.values(this.imageResizeHandles).forEach((h) => h.classList.remove('visible'));
    if (this.activeImage) {
      this.activeImage.classList.remove('editor-image-selected');
      // Clear any drag-to-move offset
      if (this.imageMoveOffsetX === 0 && this.imageMoveOffsetY === 0) {
        this.activeImage.style.transform = '';
      }
    }
    this.activeImage = null;
    this.activeTableCell = null;
    this.activeLink = null;
    this.isDraggingImageToMove = false;
  }

  private createImageToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-context-toolbar editor-image-toolbar';

    const removeImage = this.createContextButton('fa-trash', 'Delete image', () => {
      if (!this.activeImage) return;
      const image = this.activeImage;
      this.hideContextToolbars();
      image.remove();
    });

    const editImage = this.createContextButton('fa-pen', 'Change image URL', () => {
      if (!this.activeImage) return;
      this.openImageEditDialog(this.activeImage);
    });

    const alignLeft = this.createContextButton('fa-align-left', 'Align image left', () => {
      if (!this.activeImage) return;
      this.activeImage.style.display = 'block';
      this.activeImage.style.margin = '0.5rem auto 0.5rem 0';
    });

    const alignCenter = this.createContextButton('fa-align-center', 'Align image center', () => {
      if (!this.activeImage) return;
      this.activeImage.style.display = 'block';
      this.activeImage.style.margin = '0.5rem auto';
    });

    const alignRight = this.createContextButton('fa-align-right', 'Align image right', () => {
      if (!this.activeImage) return;
      this.activeImage.style.display = 'block';
      this.activeImage.style.margin = '0.5rem 0 0.5rem auto';
    });

    toolbar.append(removeImage, editImage, alignLeft, alignCenter, alignRight);
    document.body.appendChild(toolbar);
    return toolbar;
  }

  private createImageResizeHandles(): void {
    const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    corners.forEach((corner) => {
      const handle = document.createElement('div');
      handle.className = `editor-image-resize-handle editor-resize-${corner}`;
      handle.setAttribute('data-corner', corner);

      handle.addEventListener('mousedown', (e) => {
        if (!this.activeImage) return;
        e.preventDefault();
        this.isResizingImage = true;
        this.resizeCorner = corner;
        this.resizeStartX = e.clientX;
        this.resizeStartY = e.clientY;
        const rect = this.activeImage.getBoundingClientRect();
        this.resizeStartWidth = rect.width;
        this.resizeStartHeight = rect.height;
      });

      document.body.appendChild(handle);
      this.imageResizeHandles[corner] = handle;
    });
  }

  private handleImageResize(e: MouseEvent): void {
    if (!this.activeImage || !this.resizeCorner) return;

    const deltaX = e.clientX - this.resizeStartX;
    const deltaY = e.clientY - this.resizeStartY;
    const aspectRatio = this.resizeStartWidth / this.resizeStartHeight;

    let newWidth = this.resizeStartWidth;
    let newHeight = this.resizeStartHeight;

    if (this.resizeCorner.includes('right')) {
      newWidth = Math.max(60, this.resizeStartWidth + deltaX);
    } else if (this.resizeCorner.includes('left')) {
      newWidth = Math.max(60, this.resizeStartWidth - deltaX);
    }

    newHeight = Math.round(newWidth / aspectRatio);

    this.activeImage.style.width = `${newWidth}px`;
    this.activeImage.style.height = `${newHeight}px`;
    this.positionImageResizeHandles(this.activeImage);
    this.updateResizeTooltip(this.activeImage);
  }

  private showImageToolbar(image: HTMLImageElement): void {
    this.activeTableCell = null;
    this.tableToolbarElement.classList.remove('visible');

    if (this.activeImage && this.activeImage !== image) {
      this.activeImage.classList.remove('editor-image-selected');
    }

    this.activeImage = image;
    this.activeImage.classList.add('editor-image-selected');

    const rect = image.getBoundingClientRect();
    this.imageToolbarElement.style.top = `${Math.max(8, rect.top + window.scrollY - 40)}px`;
    this.imageToolbarElement.style.left = `${Math.max(8, rect.left + window.scrollX)}px`;
    this.imageToolbarElement.classList.add('visible');

    this.positionImageResizeHandles(image);
    Object.values(this.imageResizeHandles).forEach((h) => h.classList.add('visible'));
  }

  private positionImageResizeHandles(image: HTMLImageElement): void {
    const rect = image.getBoundingClientRect();
    const offset = 6;
    const positions: Record<string, { top: number; left: number }> = {
      'top-left': {
        top: rect.top + window.scrollY - offset,
        left: rect.left + window.scrollX - offset,
      },
      'top-right': {
        top: rect.top + window.scrollY - offset,
        left: rect.right + window.scrollX - offset,
      },
      'bottom-left': {
        top: rect.bottom + window.scrollY - offset,
        left: rect.left + window.scrollX - offset,
      },
      'bottom-right': {
        top: rect.bottom + window.scrollY - offset,
        left: rect.right + window.scrollX - offset,
      },
    };

    Object.entries(positions).forEach(([corner, pos]) => {
      const handle = this.imageResizeHandles[corner];
      if (handle) {
        handle.style.top = `${pos.top}px`;
        handle.style.left = `${pos.left}px`;
      }
    });
  }

  private createTableToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-context-toolbar editor-table-toolbar';

    const rowGroup = this.createTableDropdown('fa-table-header', 'Row tools', [
      { label: 'Header row', action: () => this.toggleTableHeaderRow() },
      { label: 'Insert row above', action: () => this.insertTableRow('before') },
      { label: 'Insert row below', action: () => this.insertTableRow('after') },
      { label: 'Delete row', action: () => this.deleteTableRow() },
    ]);

    const columnGroup = this.createTableDropdown('fa-table-header-column', 'Column tools', [
      { label: 'Header column', action: () => this.toggleTableHeaderColumn() },
      { label: 'Insert column left', action: () => this.insertTableColumn('before') },
      { label: 'Insert column right', action: () => this.insertTableColumn('after') },
      { label: 'Delete column', action: () => this.deleteTableColumn() },
    ]);

    const mergeGroup = this.createTableDropdown('fa-table', 'Merge and split tools', [
      { label: 'Merge cell up', action: () => this.mergeActiveCell('up') },
      { label: 'Merge cell right', action: () => this.mergeActiveCell('right') },
      { label: 'Merge cell down', action: () => this.mergeActiveCell('down') },
      { label: 'Merge cell left', action: () => this.mergeActiveCell('left') },
      { label: 'Split cell vertically', action: () => this.splitActiveCell('vertical') },
      { label: 'Split cell horizontally', action: () => this.splitActiveCell('horizontal') },
    ]);

    const delTable = this.createContextButton('fa-trash', 'Delete table', () => {
      this.deleteTable();
    });

    toolbar.append(rowGroup, columnGroup, mergeGroup, delTable);
    document.body.appendChild(toolbar);
    return toolbar;
  }

  private createTableDropdown(
    icon: string,
    title: string,
    items: Array<{ label: string; action: () => void }>
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'editor-table-dropdown';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'editor-context-btn editor-table-dropdown-trigger';
    button.title = title;
    button.setAttribute('aria-label', title);
    button.setAttribute('aria-expanded', 'false');
    button.appendChild(this.createIconElement(icon, title.charAt(0).toUpperCase()));
    button.appendChild(this.createIconElement('fa-chevron-down', 'v'));

    const menu = document.createElement('div');
    menu.className = 'editor-table-dropdown-menu';

    const closeMenu = () => {
      menu.classList.remove('visible');
      button.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
      const openMenus = this.tableToolbarElement.querySelectorAll('.editor-table-dropdown-menu.visible');
      openMenus.forEach((open) => open.classList.remove('visible'));
      const expandedButtons = this.tableToolbarElement.querySelectorAll('.editor-table-dropdown-trigger[aria-expanded="true"]');
      expandedButtons.forEach((expanded) => expanded.setAttribute('aria-expanded', 'false'));
      menu.classList.add('visible');
      button.setAttribute('aria-expanded', 'true');
    };

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (menu.classList.contains('visible')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    items.forEach((item) => {
      const itemButton = document.createElement('button');
      itemButton.type = 'button';
      itemButton.className = 'editor-table-dropdown-item';
      itemButton.textContent = item.label;
      itemButton.addEventListener('click', (e) => {
        e.preventDefault();
        item.action();
        closeMenu();
        this.editor.getEditableArea().focus();
      });
      menu.appendChild(itemButton);
    });

    container.append(button, menu);
    return container;
  }

  private getActiveTable(): HTMLTableElement | null {
    return this.activeTableCell?.closest('table') ?? null;
  }

  private createEmptyTableCell(tagName: string): HTMLTableCellElement {
    const cell = document.createElement(tagName === 'th' ? 'th' : 'td');
    cell.textContent = '';
    return cell;
  }

  private insertTableRow(position: 'before' | 'after'): void {
    if (!this.activeTableCell) return;

    const row = this.activeTableCell.parentElement as HTMLTableRowElement | null;
    if (!row) return;

    const newRow = document.createElement('tr');
    Array.from(row.cells).forEach((cell) => {
      newRow.appendChild(this.createEmptyTableCell(cell.tagName.toLowerCase()));
    });

    row.parentElement?.insertBefore(newRow, position === 'before' ? row : row.nextSibling);
  }

  private insertTableColumn(position: 'before' | 'after'): void {
    if (!this.activeTableCell) return;

    const table = this.getActiveTable();
    if (!table) return;

    const cellIndex = this.activeTableCell.cellIndex;
    Array.from(table.rows).forEach((row) => {
      const referenceCell = row.cells[cellIndex] as HTMLTableCellElement | undefined;
      const newCell = this.createEmptyTableCell(referenceCell?.tagName.toLowerCase() ?? 'td');
      row.insertBefore(newCell, position === 'before' ? referenceCell ?? null : referenceCell?.nextSibling ?? null);
    });
  }

  private deleteTableRow(): void {
    if (!this.activeTableCell) return;

    const row = this.activeTableCell.parentElement as HTMLTableRowElement | null;
    const table = this.getActiveTable();
    if (!row || !table || table.rows.length <= 1) return;

    row.remove();
    this.tableToolbarElement.classList.remove('visible');
    this.activeTableCell = null;
  }

  private deleteTableColumn(): void {
    if (!this.activeTableCell) return;

    const table = this.getActiveTable();
    if (!table) return;

    const cellIndex = this.activeTableCell.cellIndex;
    const firstRow = table.rows[0];
    if (!firstRow || firstRow.cells.length <= 1) return;

    Array.from(table.rows).forEach((row) => {
      if (row.cells[cellIndex]) {
        row.deleteCell(cellIndex);
      }
    });

    this.tableToolbarElement.classList.remove('visible');
    this.activeTableCell = null;
  }

  private toggleTableHeaderRow(): void {
    const table = this.getActiveTable();
    if (!table || !table.rows.length) return;

    const firstRow = table.rows[0];
    const shouldUseHeader = Array.from(firstRow.cells).some((cell) => cell.tagName.toLowerCase() !== 'th');

    Array.from(firstRow.cells).forEach((cell) => {
      const replacement = this.createEmptyTableCell(shouldUseHeader ? 'th' : 'td');
      replacement.innerHTML = cell.innerHTML;
      Array.from(cell.attributes).forEach((attr) => {
        if (attr.name !== 'style') {
          replacement.setAttribute(attr.name, attr.value);
        }
      });
      cell.replaceWith(replacement);
      if (this.activeTableCell === cell) {
        this.activeTableCell = replacement;
      }
    });

    if (this.activeTableCell) {
      this.showTableToolbar(this.activeTableCell);
    }
  }

  private toggleTableHeaderColumn(): void {
    const table = this.getActiveTable();
    if (!table || !table.rows.length) return;

    let nextActiveCell: HTMLTableCellElement | null = this.activeTableCell;

    Array.from(table.rows).forEach((row) => {
      const firstCell = row.cells[0] as HTMLTableCellElement | undefined;
      if (!firstCell) return;

      const shouldUseHeader = firstCell.tagName.toLowerCase() !== 'th';
      const replacement = this.createEmptyTableCell(shouldUseHeader ? 'th' : 'td');
      replacement.innerHTML = firstCell.innerHTML;
      replacement.colSpan = firstCell.colSpan;
      replacement.rowSpan = firstCell.rowSpan;
      Array.from(firstCell.attributes).forEach((attr) => {
        if (attr.name !== 'style' && attr.name !== 'colspan' && attr.name !== 'rowspan') {
          replacement.setAttribute(attr.name, attr.value);
        }
      });
      firstCell.replaceWith(replacement);
      if (this.activeTableCell === firstCell) {
        nextActiveCell = replacement;
      }
    });

    this.activeTableCell = nextActiveCell;
    if (this.activeTableCell) {
      this.showTableToolbar(this.activeTableCell);
    }
  }

  private mergeActiveCell(direction: 'up' | 'right' | 'down' | 'left'): void {
    if (!this.activeTableCell) return;

    const table = this.getActiveTable();
    const currentCell = this.activeTableCell;
    const row = currentCell.parentElement as HTMLTableRowElement | null;
    if (!table || !row) return;

    const rowIndex = row.rowIndex;
    const cellIndex = currentCell.cellIndex;
    const colspan = currentCell.colSpan || 1;
    const rowspan = currentCell.rowSpan || 1;

    let baseCell = currentCell;
    let targetCell: HTMLTableCellElement | null = null;

    if (direction === 'right') {
      targetCell = row.cells[cellIndex + 1] as HTMLTableCellElement | null;
    } else if (direction === 'left') {
      targetCell = row.cells[cellIndex - 1] as HTMLTableCellElement | null;
      if (targetCell) {
        baseCell = targetCell;
        targetCell = currentCell;
      }
    } else if (direction === 'down') {
      const nextRow = table.rows[rowIndex + rowspan] as HTMLTableRowElement | undefined;
      targetCell = nextRow?.cells[cellIndex] as HTMLTableCellElement | null;
    } else if (direction === 'up') {
      const previousRow = table.rows[rowIndex - 1] as HTMLTableRowElement | undefined;
      targetCell = previousRow?.cells[cellIndex] as HTMLTableCellElement | null;
      if (targetCell) {
        baseCell = targetCell;
        targetCell = currentCell;
      }
    }

    if (!targetCell || baseCell === targetCell) return;

    if (direction === 'left' || direction === 'right') {
      baseCell.colSpan = (baseCell.colSpan || 1) + (targetCell.colSpan || 1);
    } else {
      baseCell.rowSpan = (baseCell.rowSpan || 1) + (targetCell.rowSpan || 1);
    }

    const targetContent = targetCell.innerHTML.trim();
    if (targetContent) {
      if (baseCell.innerHTML.trim()) {
        baseCell.innerHTML = `${baseCell.innerHTML}<br>${targetContent}`;
      } else {
        baseCell.innerHTML = targetContent;
      }
    }

    targetCell.remove();
    this.activeTableCell = baseCell;
    this.showTableToolbar(baseCell);
  }

  private splitActiveCell(direction: 'vertical' | 'horizontal'): void {
    if (!this.activeTableCell) return;

    const cell = this.activeTableCell;
    const row = cell.parentElement as HTMLTableRowElement | null;
    const table = this.getActiveTable();
    if (!row || !table) return;

    if (direction === 'horizontal') {
      const currentColSpan = cell.colSpan || 1;
      if (currentColSpan <= 1) return;

      const cellsToAdd = currentColSpan - 1;
      cell.colSpan = 1;
      for (let i = 0; i < cellsToAdd; i++) {
        const newCell = this.createEmptyTableCell(cell.tagName.toLowerCase());
        row.insertBefore(newCell, cell.nextSibling);
      }
      this.showTableToolbar(cell);
      return;
    }

    const currentRowSpan = cell.rowSpan || 1;
    if (currentRowSpan <= 1) return;

    const rowIndex = row.rowIndex;
    const cellIndex = cell.cellIndex;
    cell.rowSpan = 1;
    for (let offset = 1; offset < currentRowSpan; offset++) {
      const targetRow = table.rows[rowIndex + offset] as HTMLTableRowElement | undefined;
      if (!targetRow) continue;
      const newCell = this.createEmptyTableCell(cell.tagName.toLowerCase());
      targetRow.insertBefore(newCell, targetRow.cells[cellIndex] ?? null);
    }
    this.showTableToolbar(cell);
  }

  private deleteTable(): void {
    const table = this.getActiveTable();
    if (!table) return;

    table.remove();
    this.tableToolbarElement.classList.remove('visible');
    this.activeTableCell = null;
  }

  private showTableToolbar(cell: HTMLTableCellElement): void {
    this.activeImage?.classList.remove('editor-image-selected');
    this.activeImage = null;
    this.imageToolbarElement.classList.remove('visible');
    Object.values(this.imageResizeHandles).forEach((h) => h.classList.remove('visible'));

    this.activeTableCell = cell;
    this.setupTableCellResize(cell);
    const rect = cell.getBoundingClientRect();
    this.tableToolbarElement.style.top = `${Math.max(8, rect.top + window.scrollY - 38)}px`;
    this.tableToolbarElement.style.left = `${Math.max(8, rect.left + window.scrollX)}px`;
    this.tableToolbarElement.classList.add('visible');
  }

  private setupTableCellResize(cell: HTMLTableCellElement): void {
    // Remove existing resize handle if present
    const existingHandle = cell.querySelector('.table-cell-resize-handle') as HTMLElement;
    if (existingHandle) existingHandle.remove();

    // Create resize handle for column width and apply width across the whole column.
    const handle = document.createElement('div');
    handle.className = 'table-cell-resize-handle';
    handle.style.position = 'absolute';
    handle.style.right = '-4px';
    handle.style.top = '0';
    handle.style.width = '8px';
    handle.style.height = '100%';
    handle.style.cursor = 'col-resize';
    handle.style.backgroundColor = '#007bff';
    handle.style.opacity = '0';
    handle.style.transition = 'opacity 0.15s';
    handle.style.zIndex = '100';
    handle.style.userSelect = 'none';

    handle.addEventListener('mouseenter', () => {
      handle.style.opacity = '0.8';
    });
    handle.addEventListener('mouseleave', () => {
      handle.style.opacity = '0';
    });

    handle.addEventListener('mousedown', (e) => {
      const table = cell.closest('table');
      if (!table) {
        return;
      }

      table.style.tableLayout = 'fixed';

      const startX = e.clientX;
      const startWidth = cell.getBoundingClientRect().width;
      const colIndex = cell.cellIndex;
      handle.style.opacity = '1';
      e.preventDefault();

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.max(60, startWidth + delta);

        Array.from(table.rows).forEach((row) => {
          const targetCell = row.cells[colIndex] as HTMLTableCellElement | undefined;
          if (targetCell) {
            targetCell.style.width = `${newWidth}px`;
            targetCell.style.minWidth = `${newWidth}px`;
            targetCell.style.maxWidth = `${newWidth}px`;
          }
        });
      };

      const onMouseUp = () => {
        handle.style.opacity = '0';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    cell.style.position = 'relative';
    cell.appendChild(handle);
  }

  private createContextButton(label: string, title: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'editor-context-btn';
    button.title = title;
    button.setAttribute('aria-label', title);

    if (label.startsWith('fa-')) {
      button.classList.add('icon-only');
      button.appendChild(this.createIconElement(label, title.charAt(0).toUpperCase()));
    } else {
      button.textContent = label;
    }

    button.addEventListener('click', (e) => {
      e.preventDefault();
      action();
      this.editor.getEditableArea().focus();
    });
    return button;
  }

  private updateQuickToolbarVisibility(): void {
    const selection = window.getSelection();
    const editableArea = this.editor.getEditableArea();

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      this.quickToolbarElement.classList.remove('visible');
      return;
    }

    const range = selection.getRangeAt(0);
    const commonNode = range.commonAncestorContainer;
    if (!editableArea.contains(commonNode)) {
      this.quickToolbarElement.classList.remove('visible');
      return;
    }

    this.savedSelectionRange = range.cloneRange();

    const rect = range.getBoundingClientRect();
    const toolbarRect = this.quickToolbarElement.getBoundingClientRect();
    const top = Math.max(8, rect.top + window.scrollY - toolbarRect.height - 8);
    const left = Math.max(8, rect.left + window.scrollX + rect.width / 2 - toolbarRect.width / 2);

    this.quickToolbarElement.style.top = `${top}px`;
    this.quickToolbarElement.style.left = `${left}px`;
    this.quickToolbarElement.classList.add('visible');
  }

  private restoreSelectionIfNeeded(): void {
    if (!this.savedSelectionRange) {
      return;
    }
    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    selection.removeAllRanges();
    selection.addRange(this.savedSelectionRange);
  }

  private captureSelectionIfValid(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const editableArea = this.editor.getEditableArea();
    if (!editableArea.contains(range.commonAncestorContainer)) {
      return false;
    }

    if (!selection.toString().trim()) {
      return false;
    }

    this.savedSelectionRange = range.cloneRange();
    return true;
  }

  private hasValidSelectionForLink(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const editableArea = this.editor.getEditableArea();
    if (!editableArea.contains(range.commonAncestorContainer)) {
      return false;
    }

    return !!selection.toString().trim();
  }

  private updateLinkButtonsState(): void {
    const enabled = this.hasValidSelectionForLink();
    this.linkButtons.forEach((button) => {
      button.disabled = !enabled;
      button.setAttribute('aria-disabled', (!enabled).toString());
    });
  }

  private openLinkDialogForSelection(): void {
    if (!this.captureSelectionIfValid()) {
      this.editor.getEditableArea().focus();
      return;
    }

    this.openLinkDialog();
  }

  private openLinkDialog(): void {
    this.openDialog(
      'Insert Link',
      [
        { id: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com' },
      ],
      (values) => {
        const url = values.url.trim();
        if (!url) {
          return;
        }
        this.restoreSelectionIfNeeded();
        this.editor.executeCommand('insertLink', url);
      }
    );
  }

  private openImageDialog(): void {
    this.openDialog(
      'Insert Image',
      [
        { id: 'url', label: 'Image URL', type: 'text', placeholder: 'https://example.com/image.jpg' },
      ],
      (values) => {
        const url = values.url.trim();
        if (!url) {
          return;
        }
        this.insertImageAndActivate(url);
      }
    );
  }

  private insertImageAndActivate(url: string): void {
    if (!url) {
      return;
    }

    this.restoreSelectionIfNeeded();

    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';

    let inserted = false;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (this.editor.getEditableArea().contains(range.commonAncestorContainer)) {
        range.insertNode(img);
        const newRange = document.createRange();
        newRange.setStartAfter(img);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        inserted = true;
      }
    }

    if (!inserted) {
      this.editor.getEditableArea().appendChild(img);
    }

    this.editor.getEditableArea().focus();

    // Defer activation so any dialog/button click handlers that hide toolbars
    // have already completed before we show the image controls.
    window.setTimeout(() => {
      this.showImageToolbar(img);
      Object.values(this.imageResizeHandles).forEach((h) => h.classList.add('visible'));
    }, 40);
  }

  private openImageEditDialog(image: HTMLImageElement): void {
    this.openDialog(
      'Change Image URL',
      [
        { id: 'url', label: 'Image URL', type: 'text', placeholder: 'https://example.com/image.jpg', initialValue: image.src },
      ],
      (values) => {
        const url = values.url.trim();
        if (!url || !this.activeImage) {
          return;
        }

        this.activeImage.src = url;
        this.showImageToolbar(this.activeImage);
      }
    );
  }

  private openTableDialog(): void {
    const backdrop = document.createElement('div');
    backdrop.className = 'editor-dialog-backdrop';

    const dialog = document.createElement('div');
    dialog.className = 'editor-dialog editor-table-picker-dialog';

    const heading = document.createElement('h4');
    heading.className = 'editor-dialog-title';
    heading.textContent = 'Insert Table';
    dialog.appendChild(heading);

    const pickerContainer = document.createElement('div');
    pickerContainer.className = 'editor-table-grid-container';

    const gridSize = 10; // 10x10 grid
    let selectedRows = 1;
    let selectedCols = 1;
    // Dimension display
    const dimensionText = document.createElement('div');
    dimensionText.className = 'editor-table-dimension-text';
    dimensionText.textContent = '1 × 1';

    // Define helper functions first
    const updateGridSelection = () => {
      pickerContainer.querySelectorAll('.editor-table-grid-cell').forEach((cell: any) => {
        const cellRow = Number(cell.dataset.row);
        const cellCol = Number(cell.dataset.col);
        if (cellRow <= selectedRows && cellCol <= selectedCols) {
          cell.classList.add('selected');
        } else {
          cell.classList.remove('selected');
        }
      });
    };

    const updateDimensionText = () => {
      dimensionText.textContent = `${selectedRows} × ${selectedCols}`;
    };

    const confirmSelection = () => {
      this.restoreSelectionIfNeeded();
      this.editor.executeCommand('insertTable', { rows: selectedRows, cols: selectedCols });
      backdrop.remove();
    };

    // Create grid cells
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cell = document.createElement('div');
        cell.className = 'editor-table-grid-cell';
        cell.dataset.row = String(row + 1);
        cell.dataset.col = String(col + 1);

        cell.addEventListener('mouseenter', () => {
          selectedRows = row + 1;
          selectedCols = col + 1;
          updateGridSelection();
          updateDimensionText();
        });

        cell.addEventListener('click', () => {
          selectedRows = row + 1;
          selectedCols = col + 1;
          updateGridSelection();
          confirmSelection();
        });

        pickerContainer.appendChild(cell);
      }
    }

    dialog.appendChild(pickerContainer);
    dialog.appendChild(dimensionText);

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'editor-dialog-buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'editor-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
      backdrop.remove();
    });

    const applyBtn = document.createElement('button');
    applyBtn.className = 'editor-btn editor-btn-primary';
    applyBtn.textContent = 'Insert';
    applyBtn.addEventListener('click', confirmSelection);

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(applyBtn);
    dialog.appendChild(buttonContainer);

    document.body.appendChild(backdrop);
    backdrop.appendChild(dialog);
  }

  private openDialog(
    title: string,
    fields: Array<{ id: string; label: string; type: string; placeholder?: string; initialValue?: string }>,
    onSubmit: (values: Record<string, string>) => void
  ): void {
    const backdrop = document.createElement('div');
    backdrop.className = 'editor-dialog-backdrop';

    const dialog = document.createElement('div');
    dialog.className = 'editor-dialog';

    const heading = document.createElement('h4');
    heading.className = 'editor-dialog-title';
    heading.textContent = title;
    dialog.appendChild(heading);

    const inputs: Record<string, HTMLInputElement> = {};

    fields.forEach((field) => {
      const row = document.createElement('label');
      row.className = 'editor-dialog-row';
      row.textContent = field.label;

      const input = document.createElement('input');
      input.type = field.type;
      input.placeholder = field.placeholder || '';
      input.value = field.initialValue || '';
      input.className = 'editor-dialog-input';
      row.appendChild(input);
      dialog.appendChild(row);
      inputs[field.id] = input;
    });

    const actions = document.createElement('div');
    actions.className = 'editor-dialog-actions';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'editor-dialog-btn secondary';
    cancelButton.textContent = 'Cancel';

    const applyButton = document.createElement('button');
    applyButton.type = 'button';
    applyButton.className = 'editor-dialog-btn primary';
    applyButton.textContent = 'Apply';

    actions.appendChild(cancelButton);
    actions.appendChild(applyButton);
    dialog.appendChild(actions);

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    const close = () => {
      backdrop.remove();
      this.editor.getEditableArea().focus();
    };

    cancelButton.addEventListener('click', close);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        close();
      }
    });

    applyButton.addEventListener('click', () => {
      const values: Record<string, string> = {};
      Object.keys(inputs).forEach((id) => {
        values[id] = inputs[id].value;
      });
      onSubmit(values);
      close();
    });

    const firstInput = fields.length > 0 ? inputs[fields[0].id] : null;
    firstInput?.focus();
  }

  private createResizeTooltip(): HTMLElement {
    const tooltip = document.createElement('div');
    tooltip.className = 'editor-resize-tooltip';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  private updateResizeTooltip(image: HTMLImageElement): void {
    const width = Math.round(image.getBoundingClientRect().width);
    const height = Math.round(image.getBoundingClientRect().height);
    this.resizeTooltip.textContent = `${width}×${height}`;

    const rect = image.getBoundingClientRect();
    this.resizeTooltip.style.left = `${rect.right + window.scrollX - 30}px`;
    this.resizeTooltip.style.top = `${rect.top + window.scrollY - 28}px`;
    this.resizeTooltip.classList.add('visible');
  }

  private createLinkToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-context-toolbar editor-link-toolbar';

    const editBtn = this.createContextButton('fa-pen', 'Edit link', () => {
      if (!this.activeLink) return;
      this.openLinkEditDialog(this.activeLink);
    });

    const removeBtn = this.createContextButton('fa-unlink', 'Remove link', () => {
      if (!this.activeLink) return;
      const text = this.activeLink.textContent;
      const parent = this.activeLink.parentElement;
      if (parent) {
        const textNode = document.createTextNode(text);
        parent.replaceChild(textNode, this.activeLink);
      }
      this.hideContextToolbars();
    });

    toolbar.append(editBtn, removeBtn);
    document.body.appendChild(toolbar);
    return toolbar;
  }

  private showLinkToolbar(link: HTMLAnchorElement): void {
    this.activeImage?.classList.remove('editor-image-selected');
    this.activeImage = null;
    this.imageToolbarElement.classList.remove('visible');
    Object.values(this.imageResizeHandles).forEach((h) => h.classList.remove('visible'));
    this.tableToolbarElement.classList.remove('visible');

    this.activeLink = link;
    const rect = link.getBoundingClientRect();
    this.linkToolbarElement.style.top = `${Math.max(8, rect.top + window.scrollY - 38)}px`;
    this.linkToolbarElement.style.left = `${Math.max(8, rect.left + window.scrollX)}px`;
    this.linkToolbarElement.classList.add('visible');
  }

  private openLinkEditDialog(link: HTMLAnchorElement): void {
    this.openDialog(
      'Edit Link',
      [
        { id: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com', initialValue: link.href },
        { id: 'text', label: 'Link Text', type: 'text', placeholder: 'Link text', initialValue: link.textContent || '' },
      ],
      (values) => {
        const url = values.url.trim();
        const text = values.text.trim();
        if (!url || !this.activeLink) return;
        this.activeLink.href = url;
        this.activeLink.textContent = text || url;
        this.hideContextToolbars();
      }
    );
  }
}
