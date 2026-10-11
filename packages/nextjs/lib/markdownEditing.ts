/**
 * Text edits for the Markdown editor toolbar (bold, lists, links...). They are pure functions: they receive the
 * text and the selection and return what to change, so they can be tested without a browser.
 */

export type Edit = {
  /** The text between `start` and `end` is replaced by `text` */
  start: number;
  end: number;
  text: string;
  /** Selection once the edit is applied (positions in the new text) */
  selectionStart: number;
  selectionEnd: number;
};

/** Bold, italic, strikethrough, inline code. Selecting text that is already wrapped removes the marker. */
export const wrapSelection = (
  value: string,
  selStart: number,
  selEnd: number,
  marker: string,
  placeholder: string,
): Edit => {
  const selected = value.slice(selStart, selEnd);
  const size = marker.length;

  const isWrapped =
    selected.length > 0 &&
    selStart >= size &&
    value.slice(selStart - size, selStart) === marker &&
    value.slice(selEnd, selEnd + size) === marker;

  if (isWrapped) {
    const start = selStart - size;
    return { start, end: selEnd + size, text: selected, selectionStart: start, selectionEnd: start + selected.length };
  }

  const inner = selected.length > 0 ? selected : placeholder;
  return {
    start: selStart,
    end: selEnd,
    text: `${marker}${inner}${marker}`,
    selectionStart: selStart + size,
    selectionEnd: selStart + size + inner.length,
  };
};

/** Inline code for a single line, a fenced block when the selection spans several lines. */
export const toggleCode = (value: string, selStart: number, selEnd: number): Edit => {
  const selected = value.slice(selStart, selEnd);

  if (!selected.includes("\n")) return wrapSelection(value, selStart, selEnd, "`", "código");

  // the fence has to start on its own line
  const lead = selStart > 0 && value[selStart - 1] !== "\n" ? "\n" : "";
  const text = `${lead}\`\`\`\n${selected}\n\`\`\``;
  const innerStart = selStart + lead.length + 4;

  return { start: selStart, end: selEnd, text, selectionStart: innerStart, selectionEnd: innerStart + selected.length };
};

/** [text](url). If the selection already is a URL it becomes the target of the link. */
export const insertLink = (value: string, selStart: number, selEnd: number): Edit => {
  const selected = value.slice(selStart, selEnd);

  if (/^https?:\/\/\S+$/.test(selected)) {
    return {
      start: selStart,
      end: selEnd,
      text: `[texto](${selected})`,
      selectionStart: selStart + 1,
      selectionEnd: selStart + 6,
    };
  }

  const label = selected.length > 0 ? selected : "texto";
  const urlStart = selStart + label.length + 3;

  return {
    start: selStart,
    end: selEnd,
    text: `[${label}](url)`,
    selectionStart: urlStart,
    selectionEnd: urlStart + 3,
  };
};

// Whole lines touched by the selection. A selection that ends right after a line break does not include the next line.
const getLinesRange = (value: string, selStart: number, selEnd: number) => {
  const start = value.lastIndexOf("\n", selStart - 1) + 1;
  const lastChar = selEnd > selStart && value[selEnd - 1] === "\n" ? selEnd - 1 : selEnd;
  const lineEnd = value.indexOf("\n", lastChar);

  return { start, end: lineEnd === -1 ? value.length : lineEnd };
};

/**
 * Adds a prefix to every selected line (headings, quotes, lists), or removes it when every line already has it.
 * `prefixFor` receives the position of the line inside the selection (for numbered lists).
 */
export const toggleLinePrefix = (
  value: string,
  selStart: number,
  selEnd: number,
  prefixFor: (index: number) => string,
  existingPrefix: RegExp,
): Edit => {
  const { start, end } = getLinesRange(value, selStart, selEnd);
  const lines = value.slice(start, end).split("\n");

  const content = lines.filter(line => line.trim().length > 0);
  const shouldRemove = content.length > 0 && content.every(line => existingPrefix.test(line));

  let position = -1;
  const edited = lines.map(line => {
    if (shouldRemove) return line.replace(existingPrefix, "");
    if (line.trim().length === 0 && lines.length > 1) return line;

    position++;
    return `${prefixFor(position)}${line}`;
  });
  const text = edited.join("\n");

  if (selStart === selEnd) {
    const cursor = Math.max(start, selStart + (edited[0].length - lines[0].length));
    return { start, end, text, selectionStart: cursor, selectionEnd: cursor };
  }

  return { start, end, text, selectionStart: start, selectionEnd: start + text.length };
};

export const toggleHeading = (value: string, selStart: number, selEnd: number) =>
  toggleLinePrefix(value, selStart, selEnd, () => "### ", /^#{1,6} /);

export const toggleQuote = (value: string, selStart: number, selEnd: number) =>
  toggleLinePrefix(value, selStart, selEnd, () => "> ", /^> ?/);

export const toggleBulletList = (value: string, selStart: number, selEnd: number) =>
  toggleLinePrefix(value, selStart, selEnd, () => "- ", /^[-*+] (?!\[[ xX]\] )/);

export const toggleNumberedList = (value: string, selStart: number, selEnd: number) =>
  toggleLinePrefix(value, selStart, selEnd, index => `${index + 1}. `, /^\d+\. /);

export const toggleTaskList = (value: string, selStart: number, selEnd: number) =>
  toggleLinePrefix(value, selStart, selEnd, () => "- [ ] ", /^[-*+] \[[ xX]\] /);

const LIST_ITEM = /^(\s*)(?:([-*+])|(\d+)\.)( \[[ xX]\])? (.*)$/;

/**
 * Enter inside a list item: starts the next item (with the next number, or an unchecked box for task lists).
 * Enter on an empty item ends the list. Returns undefined when the cursor is not in a list item.
 */
export const continueList = (value: string, cursor: number): Edit | undefined => {
  const lineStart = value.lastIndexOf("\n", cursor - 1) + 1;
  const lineBreak = value.indexOf("\n", cursor);
  const lineEnd = lineBreak === -1 ? value.length : lineBreak;

  const match = LIST_ITEM.exec(value.slice(lineStart, lineEnd));
  if (match === null) return undefined;

  const [line, indent, bullet, number, task, content] = match;
  const prefixLength = line.length - content.length;

  // Enter inside the marker itself: leave it to the browser
  if (cursor < lineStart + prefixLength) return undefined;

  if (content.trim().length === 0) {
    return { start: lineStart, end: lineEnd, text: "", selectionStart: lineStart, selectionEnd: lineStart };
  }

  const marker = bullet ?? `${Number(number) + 1}.`;
  const text = `\n${indent}${marker}${task === undefined ? "" : " [ ]"} `;
  const position = cursor + text.length;

  return { start: cursor, end: cursor, text, selectionStart: position, selectionEnd: position };
};
