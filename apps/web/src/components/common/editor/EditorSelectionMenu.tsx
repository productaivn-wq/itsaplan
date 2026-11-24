import { useState, type ReactNode } from 'react';
import { type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  SquareCode,
  Strikethrough,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import EditorToolbarButton from './EditorToolbarButton';

// `name` plus `attrs` is the mark or node the button toggles, which is also what lights it up.
const ITEMS: {
  name: string;
  attrs?: { level: 1 | 2 };
  icon: LucideIcon;
  run: (editor: Editor) => void;
}[] = [
  {
    name: 'heading',
    attrs: { level: 1 },
    icon: Heading1,
    run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    name: 'heading',
    attrs: { level: 2 },
    icon: Heading2,
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  { name: 'bold', icon: Bold, run: (editor) => editor.chain().focus().toggleBold().run() },
  { name: 'italic', icon: Italic, run: (editor) => editor.chain().focus().toggleItalic().run() },
  {
    name: 'strike',
    icon: Strikethrough,
    run: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  { name: 'code', icon: Code, run: (editor) => editor.chain().focus().toggleCode().run() },
  {
    name: 'codeBlock',
    icon: SquareCode,
    run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    name: 'link',
    icon: LinkIcon,
    run: (editor) => editor.chain().focus().run(),
  },
  {
    name: 'blockquote',
    icon: Quote,
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    name: 'bulletList',
    icon: List,
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    name: 'orderedList',
    icon: ListOrdered,
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
];

export default function EditorSelectionMenu({
  editor,
  placement = 'top',
  children,
}: {
  editor: Editor;
  children?: ReactNode;
  // Above the selection by default. A field with a label right over it passes
  // "bottom" so the menu does not cover the label.
  placement?: 'top' | 'bottom';
}) {
  const t = useTranslations('common.editor');
  const [editingLink, setEditingLink] = useState<string | null>(null);

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement }}
      className="flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-0.5 rounded-md border bg-popover p-1 shadow-md"
    >
      {editingLink !== null ? (
        <div className="flex items-center gap-1 px-1">
          <input
            type="url"
            autoFocus
            value={editingLink}
            placeholder={t('linkUrl')}
            onChange={(e) => setEditingLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (editingLink.trim() === '') {
                  editor.chain().focus().unsetLink().run();
                } else {
                  editor.chain().focus().setLink({ href: editingLink.trim() }).run();
                }
                setEditingLink(null);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setEditingLink(null);
                editor.chain().focus().run();
              }
            }}
            className="h-7 w-48 rounded border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      ) : (
        ITEMS.map((item) => (
          <EditorToolbarButton
            key={`${item.name}${item.attrs?.level ?? ''}`}
            active={editor.isActive(item.name, item.attrs)}
            onClick={() => {
              if (item.name === 'link') {
                setEditingLink(editor.getAttributes('link').href ?? '');
              } else {
                item.run(editor);
              }
            }}
          >
            <item.icon />
          </EditorToolbarButton>
        ))
      )}
      {children}
    </BubbleMenu>
  );
}
