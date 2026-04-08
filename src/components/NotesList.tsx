import { useState } from "react";
import { Note } from "@/lib/store";
import { EditableText } from "./EditableText";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  notes: Note[];
  onChange: (notes: Note[]) => void;
}

export function NotesList({ notes, onChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addNote = () => {
    const note: Note = {
      id: Math.random().toString(36).slice(2, 9),
      title: "Untitled Note",
      body: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onChange([note, ...notes]);
    setExpandedId(note.id);
  };

  const deleteNote = (id: string) => {
    onChange(notes.filter((n) => n.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const updateNote = (id: string, patch: Partial<Note>) => {
    onChange(
      notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
      )
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-heading text-xs uppercase tracking-wider text-muted-foreground">
          Notes ({notes.length})
        </h4>
        <button
          onClick={addNote}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      {notes.map((note) => (
        <div key={note.id} className="border border-border rounded-md bg-muted/20">
          <div
            className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}
          >
            {expandedId === note.id ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="flex-1 text-sm font-medium text-foreground">{note.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNote(note.id);
              }}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {expandedId === note.id && (
            <div className="px-3 pb-3 space-y-2">
              <input
                value={note.title}
                onChange={(e) => updateNote(note.id, { title: e.target.value })}
                className="w-full bg-transparent border-b border-border px-1 py-1 text-sm font-medium text-foreground focus:outline-none focus:border-primary"
              />
              <EditableText
                value={note.body}
                onChange={(body) => updateNote(note.id, { body })}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
