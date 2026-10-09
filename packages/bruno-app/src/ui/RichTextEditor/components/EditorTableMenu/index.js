import React, { useMemo } from 'react';
import { useEditorState } from '@tiptap/react';
import {
  IconCaretDown,
  IconColumnInsertLeft,
  IconColumnInsertRight,
  IconRowInsertBottom,
  IconRowInsertTop,
  IconTableOptions,
  IconTrash
} from '@tabler/icons';
import MenuDropdown from 'ui/MenuDropdown';
import { useTranslation } from 'react-i18next';
import { EDITOR_MENU_DROPDOWN_PROPS } from '../../utils/editorToolbarUi';

const TABLE_MENU_GROUPS = [
  {
    nameKey: 'richText.table',
    options: [
      {
        id: 'deleteTable',
        labelKey: 'richText.tableMenu.deleteTable',
        Icon: IconTrash,
        run: (editor) => editor.chain().focus().deleteTable().run(),
        canRun: (editor) => editor.can().chain().focus().deleteTable().run()
      }
    ]
  },
  {
    nameKey: 'richText.tableMenu.rows',
    options: [
      {
        id: 'addRowBefore',
        labelKey: 'richText.tableMenu.addRowAbove',
        Icon: IconRowInsertTop,
        run: (editor) => editor.chain().focus().addRowBefore().run(),
        canRun: (editor) => editor.can().chain().focus().addRowBefore().run()
      },
      {
        id: 'addRowAfter',
        labelKey: 'richText.tableMenu.addRowBelow',
        Icon: IconRowInsertBottom,
        run: (editor) => editor.chain().focus().addRowAfter().run(),
        canRun: (editor) => editor.can().chain().focus().addRowAfter().run()
      },
      {
        id: 'deleteRow',
        labelKey: 'richText.tableMenu.deleteRow',
        Icon: IconTrash,
        run: (editor) => editor.chain().focus().deleteRow().run(),
        canRun: (editor) => editor.can().chain().focus().deleteRow().run()
      }
    ]
  },
  {
    nameKey: 'richText.tableMenu.columns',
    options: [
      {
        id: 'addColumnBefore',
        labelKey: 'richText.tableMenu.addColumnLeft',
        Icon: IconColumnInsertLeft,
        run: (editor) => editor.chain().focus().addColumnBefore().run(),
        canRun: (editor) => editor.can().chain().focus().addColumnBefore().run()
      },
      {
        id: 'addColumnAfter',
        labelKey: 'richText.tableMenu.addColumnRight',
        Icon: IconColumnInsertRight,
        run: (editor) => editor.chain().focus().addColumnAfter().run(),
        canRun: (editor) => editor.can().chain().focus().addColumnAfter().run()
      },
      {
        id: 'deleteColumn',
        labelKey: 'richText.tableMenu.deleteColumn',
        Icon: IconTrash,
        run: (editor) => editor.chain().focus().deleteColumn().run(),
        canRun: (editor) => editor.can().chain().focus().deleteColumn().run()
      }
    ]
  }
];

const EditorTableMenu = ({ editor }) => {
  const { t } = useTranslation();
  useEditorState({
    editor,
    selector: (ctx) => ctx.transactionNumber
  });

  const isInTable = editor ? editor.isActive('table') : false;

  const disabledById = useMemo(() => {
    if (!editor || !isInTable) return {};
    const disabled = {};
    TABLE_MENU_GROUPS.forEach((group) => {
      group.options.forEach((option) => {
        disabled[option.id] = !option.canRun(editor);
      });
    });
    return disabled;
  }, [editor, isInTable, editor?.state]);

  if (!editor || !isInTable) {
    return null;
  }

  const menuItems = TABLE_MENU_GROUPS.map((group) => ({
    name: t(group.nameKey),
    options: group.options.map((option) => ({
      id: option.id,
      label: t(option.labelKey),
      leftSection: option.Icon,
      disabled: disabledById[option.id],
      onClick: () => option.run(editor)
    }))
  }));

  return (
    <MenuDropdown
      items={menuItems}
      placement="bottom-start"
      className="editor-table-menu"
      showTickMark={false}
      groupStyle="select"
      {...EDITOR_MENU_DROPDOWN_PROPS}
    >
      <button
        type="button"
        className="heading-dropdown-trigger is-active"
        aria-label={t('richText.tableMenu.tableOptions')}
        data-testid="toolbar-table-menu"
      >
        <IconTableOptions size={16} strokeWidth={1.5} />
        <span>{t('richText.table')}</span>
        <IconCaretDown size={14} strokeWidth={1.5} fill="currentColor" />
      </button>
    </MenuDropdown>
  );
};

export default EditorTableMenu;
