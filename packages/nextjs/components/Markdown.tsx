import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "~~/lib/utils";

// GitHub-flavored Markdown (tables, task lists, strikethrough, autolinks). Headings are shifted down a level so
// they do not compete with the page title. Every element resets the global `p { margin }` rule.
const components: Components = {
  h1: ({ children }) => <h3 className="m-0 border-b pb-2 text-2xl font-semibold">{children}</h3>,
  h2: ({ children }) => <h4 className="m-0 border-b pb-1.5 text-xl font-semibold">{children}</h4>,
  h3: ({ children }) => <h5 className="m-0 text-lg font-semibold">{children}</h5>,
  h4: ({ children }) => <h6 className="m-0 text-base font-semibold">{children}</h6>,
  h5: ({ children }) => <h6 className="m-0 text-sm font-semibold">{children}</h6>,
  h6: ({ children }) => <h6 className="m-0 text-sm font-semibold text-muted-foreground">{children}</h6>,
  p: ({ children }) => <p className="m-0">{children}</p>,
  ul: ({ className, children }) => (
    <ul
      className={cn("m-0 space-y-1", className?.includes("contains-task-list") ? "list-none pl-0" : "list-disc pl-6")}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => <ol className="m-0 list-decimal space-y-1 pl-6">{children}</ol>,
  // the box of a task list item (- [ ] / - [x])
  input: ({ checked }) => (
    <input type="checkbox" checked={checked} disabled readOnly className="mr-2 align-middle accent-primary" />
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
      {children}
    </a>
  ),
  // Remote images are not loaded: whoever opens the task would be visible to the server hosting them.
  // Tasks have their own image field, so an image written in the text is shown as a link.
  img: ({ src, alt }) =>
    typeof src === "string" ? (
      <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
        {alt || src}
      </a>
    ) : null,
  blockquote: ({ children }) => (
    <blockquote className="m-0 space-y-3 border-l-4 pl-4 text-muted-foreground">{children}</blockquote>
  ),
  hr: () => <hr className="my-1 border-t" />,
  code: ({ children }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[85%]">{children}</code>,
  pre: ({ children }) => (
    <pre className="m-0 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-normal [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-xs">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border px-3 py-1.5 text-left font-semibold bg-muted/50">{children}</th>,
  td: ({ children }) => <td className="border px-3 py-1.5">{children}</td>,
};

/**
 * Renders user-written Markdown with the app's styles. Raw HTML is not rendered, and links with dangerous
 * protocols (like javascript:) are dropped by react-markdown.
 */
export const Markdown: React.FC<{ children: string }> = ({ children }) => (
  <div className="space-y-3 text-sm leading-relaxed [overflow-wrap:anywhere]">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  </div>
);
