"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Code,
  Heading,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Strikethrough,
} from "lucide-react";
import { Markdown } from "~~/components/Markdown";
import { Button } from "~~/components/ui/shadcn/button";
import { Textarea } from "~~/components/ui/shadcn/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "~~/components/ui/shadcn/tooltip";
import {
  type Edit,
  continueList,
  insertLink,
  toggleBulletList,
  toggleCode,
  toggleHeading,
  toggleNumberedList,
  toggleQuote,
  toggleTaskList,
  wrapSelection,
} from "~~/lib/markdownEditing";
import { cn } from "~~/lib/utils";

type ToolbarAction = {
  label: string;
  icon: React.ElementType;
  /** Key used with Ctrl (or ⌘) */
  shortcut?: string;
  edit: (value: string, selStart: number, selEnd: number) => Edit;
};

const GROUPS: ToolbarAction[][] = [
  [
    { label: "Título", icon: Heading, edit: toggleHeading },
    {
      label: "Negrita",
      icon: Bold,
      shortcut: "b",
      edit: (v, s, e) => wrapSelection(v, s, e, "**", "texto en negrita"),
    },
    {
      label: "Cursiva",
      icon: Italic,
      shortcut: "i",
      edit: (v, s, e) => wrapSelection(v, s, e, "_", "texto en cursiva"),
    },
    { label: "Tachado", icon: Strikethrough, edit: (v, s, e) => wrapSelection(v, s, e, "~~", "texto tachado") },
  ],
  [
    { label: "Cita", icon: Quote, edit: toggleQuote },
    { label: "Código", icon: Code, edit: toggleCode },
    { label: "Enlace", icon: LinkIcon, shortcut: "k", edit: insertLink },
  ],
  [
    { label: "Lista", icon: List, edit: toggleBulletList },
    { label: "Lista numerada", icon: ListOrdered, edit: toggleNumberedList },
    { label: "Lista de tareas", icon: ListChecks, edit: toggleTaskList },
  ],
];

const SHORTCUTS = new Map(GROUPS.flat().flatMap(action => (action.shortcut ? [[action.shortcut, action]] : [])));

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Lets react-hook-form focus the field when it has an error */
  inputRef?: React.Ref<HTMLTextAreaElement>;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
};

/**
 * Markdown editor in the style of GitHub: Write / Preview tabs, a formatting toolbar (with Ctrl+B, Ctrl+I and
 * Ctrl+K), and lists that continue when you press Enter. The text edits live in lib/markdownEditing.ts.
 */
export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onBlur,
  inputRef,
  placeholder,
  disabled,
  invalid,
}) => {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const setRefs = (element: HTMLTextAreaElement | null) => {
    textareaRef.current = element;
    if (typeof inputRef === "function") inputRef(element);
    else if (inputRef) inputRef.current = element;
  };

  // execCommand keeps the browser's undo history (Ctrl+Z); if it is not available the text is set directly
  const applyEdit = (textarea: HTMLTextAreaElement, edit: Edit) => {
    textarea.focus();
    textarea.setSelectionRange(edit.start, edit.end);

    const done =
      edit.text === "" ? document.execCommand("delete") : document.execCommand("insertText", false, edit.text);

    if (!done) {
      onChange(textarea.value.slice(0, edit.start) + edit.text + textarea.value.slice(edit.end));
    }

    // wait for React to render the new text before moving the selection
    requestAnimationFrame(() => textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd));
  };

  const run = (action: ToolbarAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    applyEdit(textarea, action.edit(textarea.value, textarea.selectionStart, textarea.selectionEnd));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;

    if (event.ctrlKey || event.metaKey) {
      const action = SHORTCUTS.get(event.key.toLowerCase());
      if (action) {
        event.preventDefault();
        run(action);
      }
      return;
    }

    if (event.key === "Enter" && !event.shiftKey && !event.altKey && !event.nativeEvent.isComposing) {
      if (textarea.selectionStart !== textarea.selectionEnd) return;

      const edit = continueList(textarea.value, textarea.selectionStart);
      if (edit) {
        event.preventDefault();
        applyEdit(textarea, edit);
      }
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-lg border", invalid && "border-destructive")}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-2 py-1.5">
        <div className="flex gap-1" role="tablist">
          {(["write", "preview"] as const).map(tab => (
            <Button
              key={tab}
              type="button"
              role="tab"
              aria-selected={mode === tab}
              size="sm"
              variant={mode === tab ? "secondary" : "ghost"}
              onClick={() => setMode(tab)}
            >
              {tab === "write" ? "Escribir" : "Vista previa"}
            </Button>
          ))}
        </div>

        {mode === "write" && (
          <div className="flex flex-wrap items-center">
            {GROUPS.map((group, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <span className="mx-1 h-5 w-px bg-border" />}
                {group.map(action => (
                  <Tooltip key={action.label}>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        disabled={disabled}
                        aria-label={action.label}
                        // keep the selection in the text box when the button is pressed
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => run(action)}
                      >
                        <action.icon className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {action.label}
                      {action.shortcut ? ` (Ctrl+${action.shortcut.toUpperCase()})` : ""}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {mode === "write" ? (
        <Textarea
          ref={setRefs}
          value={value}
          onChange={event => onChange(event.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={invalid}
          className="h-64 resize-y rounded-none border-0 shadow-none focus-visible:ring-0"
        />
      ) : (
        <div className="min-h-64 p-4">
          {value.trim().length > 0 ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="m-0 text-sm text-muted-foreground">Todavía no hay nada que mostrar.</p>
          )}
        </div>
      )}

      <p className="m-0 border-t bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
        Compatible con Markdown de GitHub: títulos, listas, tablas, listas de tareas y bloques de código.
      </p>
    </div>
  );
};
