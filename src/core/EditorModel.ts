export class EditorModel {
  private content: string = '';
  private listeners: Array<(content: string) => void> = [];

  setContent(html: string): void {
    this.content = html;
    this.notify();
  }

  getContent(): string {
    return this.content;
  }

  getText(): string {
    const temp = document.createElement('div');
    temp.innerHTML = this.content;
    return temp.innerText;
  }

  subscribe(listener: (content: string) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.content));
  }
}
