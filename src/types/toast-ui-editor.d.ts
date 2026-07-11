declare module '@toast-ui/editor' {
  interface EditorOptions {
    el: HTMLElement
    height?: string
    minHeight?: string
    initialValue?: string
    initialEditType?: 'markdown' | 'wysiwyg'
    previewStyle?: 'tab' | 'vertical'
    language?: string
    usageStatistics?: boolean
    autofocus?: boolean
    placeholder?: string
    events?: {
      change?: () => void
    }
    hooks?: {
      addImageBlobHook?: (
        blob: Blob | File,
        callback: (url: string, altText?: string) => void,
      ) => void
    }
  }

  export default class Editor {
    constructor(options: EditorOptions)
    getMarkdown(): string
    setMarkdown(markdown: string, cursorToEnd?: boolean): void
    destroy(): void
  }
}
