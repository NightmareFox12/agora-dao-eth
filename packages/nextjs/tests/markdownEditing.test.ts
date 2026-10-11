import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
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

type EditLike = { start: number; end: number; text: string; selectionStart: number; selectionEnd: number };

// What the browser does with an edit: returns the new text and what ends up selected
const apply = (value: string, edit: EditLike) => {
  const next = value.slice(0, edit.start) + edit.text + value.slice(edit.end);
  return { next, selected: next.slice(edit.selectionStart, edit.selectionEnd), edit };
};

describe("wrapSelection", () => {
  it("inserts the markers around a placeholder when nothing is selected", () => {
    const { next, selected } = apply("", wrapSelection("", 0, 0, "**", "texto"));
    assert.equal(next, "**texto**");
    assert.equal(selected, "texto");
  });

  it("wraps the selected text and keeps it selected", () => {
    const value = "hola mundo";
    const { next, selected } = apply(value, wrapSelection(value, 5, 10, "**", "texto"));
    assert.equal(next, "hola **mundo**");
    assert.equal(selected, "mundo");
  });

  it("removes the markers when the selection is already wrapped", () => {
    const value = "hola **mundo**";
    const { next, selected } = apply(value, wrapSelection(value, 7, 12, "**", "texto"));
    assert.equal(next, "hola mundo");
    assert.equal(selected, "mundo");
  });

  it("does not take the bold markers for italic ones", () => {
    const value = "**mundo**";
    const { next } = apply(value, wrapSelection(value, 2, 7, "_", "texto"));
    assert.equal(next, "**_mundo_**");
  });

  it("works at the very start of the text", () => {
    const { next } = apply("hola", wrapSelection("hola", 0, 4, "~~", "texto"));
    assert.equal(next, "~~hola~~");
  });
});

describe("toggleCode", () => {
  it("uses inline code for one line", () => {
    const value = "usa npm";
    const { next, selected } = apply(value, toggleCode(value, 4, 7));
    assert.equal(next, "usa `npm`");
    assert.equal(selected, "npm");
  });

  it("uses a fenced block for several lines", () => {
    const value = "a\nb";
    const { next, selected } = apply(value, toggleCode(value, 0, 3));
    assert.equal(next, "```\na\nb\n```");
    assert.equal(selected, "a\nb");
  });

  it("starts the fence on its own line", () => {
    const value = "texto a\nb";
    const { next } = apply(value, toggleCode(value, 6, 9));
    assert.equal(next, "texto \n```\na\nb\n```");
  });
});

describe("insertLink", () => {
  it("turns the selection into the text of the link and selects the url", () => {
    const value = "ver mundo ya";
    const { next, selected } = apply(value, insertLink(value, 4, 9));
    assert.equal(next, "ver [mundo](url) ya");
    assert.equal(selected, "url");
  });

  it("adds a placeholder when nothing is selected", () => {
    const { next, selected } = apply("", insertLink("", 0, 0));
    assert.equal(next, "[texto](url)");
    assert.equal(selected, "url");
  });

  it("uses a selected url as the target", () => {
    const value = "https://agora.dev";
    const { next, selected } = apply(value, insertLink(value, 0, value.length));
    assert.equal(next, "[texto](https://agora.dev)");
    assert.equal(selected, "texto");
  });
});

describe("line prefixes", () => {
  it("adds and removes a heading, keeping the cursor on the same character", () => {
    const first = apply("Título", toggleHeading("Título", 3, 3));
    assert.equal(first.next, "### Título");
    assert.equal(first.edit.selectionStart, 7);

    const second = apply(first.next, toggleHeading(first.next, 7, 7));
    assert.equal(second.next, "Título");
    assert.equal(second.edit.selectionStart, 3);
  });

  it("replaces another heading level", () => {
    const { next } = apply("## Título", toggleHeading("## Título", 0, 0));
    assert.equal(next, "Título");
  });

  it("quotes every selected line", () => {
    const value = "uno\ndos\ntres";
    const { next } = apply(value, toggleQuote(value, 0, value.length));
    assert.equal(next, "> uno\n> dos\n> tres");
  });

  it("only touches the lines of the selection", () => {
    const value = "uno\ndos\ntres";
    const { next } = apply(value, toggleBulletList(value, 5, 5));
    assert.equal(next, "uno\n- dos\ntres");
  });

  it("does not include the next line when the selection ends after a line break", () => {
    const value = "uno\ndos\ntres";
    const { next } = apply(value, toggleBulletList(value, 0, 4));
    assert.equal(next, "- uno\ndos\ntres");
  });

  it("removes the bullets when every line has one", () => {
    const value = "- uno\n- dos";
    const { next } = apply(value, toggleBulletList(value, 0, value.length));
    assert.equal(next, "uno\ndos");
  });

  it("numbers the lines and skips the blank ones", () => {
    const value = "uno\n\ndos\ntres";
    const { next } = apply(value, toggleNumberedList(value, 0, value.length));
    assert.equal(next, "1. uno\n\n2. dos\n3. tres");
  });

  it("removes the numbers when every line has one", () => {
    const value = "1. uno\n2. dos";
    const { next } = apply(value, toggleNumberedList(value, 0, value.length));
    assert.equal(next, "uno\ndos");
  });

  it("makes a task list and takes it back", () => {
    const first = apply("uno\ndos", toggleTaskList("uno\ndos", 0, 7));
    assert.equal(first.next, "- [ ] uno\n- [ ] dos");

    const second = apply(first.next, toggleTaskList(first.next, 0, first.next.length));
    assert.equal(second.next, "uno\ndos");
  });

  it("prefixes an empty line and leaves the cursor after the marker", () => {
    const { next, edit } = apply("", toggleBulletList("", 0, 0));
    assert.equal(next, "- ");
    assert.equal(edit.selectionStart, 2);
  });
});

describe("continueList", () => {
  const press = (value: string, cursor: number) => {
    const edit = continueList(value, cursor);
    return edit === undefined ? undefined : apply(value, edit);
  };

  it("continues a bullet list", () => {
    const result = press("- uno", 5);
    assert.equal(result?.next, "- uno\n- ");
    assert.equal(result?.edit.selectionStart, 8);
  });

  it("keeps the marker the user chose", () => {
    assert.equal(press("* uno", 5)?.next, "* uno\n* ");
  });

  it("counts in numbered lists", () => {
    assert.equal(press("1. uno", 6)?.next, "1. uno\n2. ");
    assert.equal(press("9. nueve", 8)?.next, "9. nueve\n10. ");
  });

  it("starts an unchecked box in task lists, even after a checked one", () => {
    assert.equal(press("- [ ] uno", 9)?.next, "- [ ] uno\n- [ ] ");
    assert.equal(press("- [x] uno", 9)?.next, "- [x] uno\n- [ ] ");
  });

  it("keeps the indentation of nested items", () => {
    assert.equal(press("  - uno", 7)?.next, "  - uno\n  - ");
  });

  it("splits the item when the cursor is in the middle", () => {
    assert.equal(press("- abcd", 4)?.next, "- ab\n- cd");
  });

  it("ends the list on an empty item", () => {
    assert.equal(press("- uno\n- ", 8)?.next, "- uno\n");
    assert.equal(press("1. ", 3)?.next, "");
  });

  it("does nothing outside a list", () => {
    assert.equal(press("texto normal", 5), undefined);
    assert.equal(press("-sin espacio", 5), undefined);
  });

  it("does nothing when the cursor is inside the marker", () => {
    assert.equal(press("- uno", 1), undefined);
  });

  it("works on any line of the text", () => {
    const value = "intro\n- uno\notra";
    assert.equal(press(value, 11)?.next, "intro\n- uno\n- \notra");
  });
});
