import { useEffect, useRef } from 'react'
import Editor from '@toast-ui/editor'
import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/i18n/zh-cn'
import { message } from 'antd'
import { uploadImage } from '../api/upload'
import { resolveAssetUrl } from '../utils/asset'
import { detectContentMode, htmlToMarkdown } from '../utils/content'

interface Props {
  value?: string
  onChange?: (value: string) => void
}

const toMarkdown = (content: string) =>
  detectContentMode(content) === 'rich' ? htmlToMarkdown(content) : content

const normalizeMarkdown = (content: string) => content.replace(/\n+$/, '')

const ArticleContentEditor = ({ value = '', onChange }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  const syncingExternalValueRef = useRef(false)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    if (!containerRef.current) return
    const editor = new Editor({
      el: containerRef.current,
      height: '680px',
      minHeight: '520px',
      initialValue: toMarkdown(value),
      initialEditType: 'wysiwyg',
      previewStyle: 'vertical',
      language: 'zh-CN',
      usageStatistics: false,
      autofocus: false,
      placeholder: '请输入文章正文',
      events: {
        change: () => {
          if (syncingExternalValueRef.current) return
          const markdown = editor.getMarkdown()
          if (normalizeMarkdown(markdown) === normalizeMarkdown(toMarkdown(valueRef.current)))
            return
          valueRef.current = markdown
          onChangeRef.current?.(markdown)
        },
      },
      hooks: {
        addImageBlobHook: (blob, callback) => {
          void (async () => {
            if (blob.size > 5 * 1024 * 1024) {
              message.error('图片不能超过 5MB')
              return
            }
            try {
              const file =
                blob instanceof File ? blob : new File([blob], '正文图片.png', { type: blob.type })
              const result = await uploadImage(file)
              callback(resolveAssetUrl(result.url), file.name)
              message.success('正文图片上传成功')
            } catch {
              // 请求层已展示错误信息
            }
          })()
        },
      },
    })
    editorRef.current = editor
    return () => {
      editor.destroy()
      editorRef.current = null
    }
    // 编辑器实例只在组件挂载时创建一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const markdown = toMarkdown(value)
    if (normalizeMarkdown(editor.getMarkdown()) === normalizeMarkdown(markdown)) return
    syncingExternalValueRef.current = true
    try {
      editor.setMarkdown(markdown, false)
    } finally {
      syncingExternalValueRef.current = false
    }
  }, [value])

  return <div ref={containerRef} />
}

export default ArticleContentEditor
