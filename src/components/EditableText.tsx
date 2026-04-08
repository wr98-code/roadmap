import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Pencil, Eye } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
  className?: string;
}

export function EditableText({ value, onChange, multiline = true, className = "" }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="relative">
        <button
          onClick={() => setEditing(false)}
          className="absolute top-2 right-2 p-1 rounded bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors z-10"
          title="View mode"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full min-h-[120px] bg-muted/50 border border-border rounded-md p-3 pr-10 text-sm text-foreground font-body resize-y focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
            autoFocus
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full bg-muted/50 border border-border rounded-md px-3 py-2 pr-10 text-sm text-foreground font-body focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
            autoFocus
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`group relative cursor-pointer rounded-md p-3 hover:bg-muted/30 transition-colors ${className}`}
      onClick={() => setEditing(true)}
    >
      <button
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all"
        title="Edit"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <div className="prose prose-invert prose-sm max-w-none text-foreground [&_strong]:text-primary [&_li]:text-foreground/90 [&_p]:text-foreground/90">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{value || "*Click to edit...*"}</ReactMarkdown>
      </div>
    </div>
  );
}
