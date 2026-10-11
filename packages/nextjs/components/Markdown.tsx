import ReactMarkdown from "react-markdown";

/**
 * Renders user-written Markdown with the app's styles. Raw HTML is not rendered, and links with dangerous
 * protocols (like javascript:) are dropped by react-markdown.
 */
export const Markdown: React.FC<{ children: string }> = ({ children }) => (
  <div className="space-y-3 text-sm leading-relaxed break-words">
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h3 className="m-0 text-xl font-semibold">{children}</h3>,
        h2: ({ children }) => <h4 className="m-0 text-lg font-semibold">{children}</h4>,
        h3: ({ children }) => <h5 className="m-0 text-base font-semibold">{children}</h5>,
        p: ({ children }) => <p className="m-0">{children}</p>,
        ul: ({ children }) => <ul className="m-0 list-disc space-y-1 pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="m-0 list-decimal space-y-1 pl-5">{children}</ol>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="m-0 border-l-4 pl-3 text-muted-foreground">{children}</blockquote>
        ),
        code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>,
        pre: ({ children }) => <pre className="m-0 overflow-x-auto rounded-lg bg-muted p-3 text-xs">{children}</pre>,
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
);
