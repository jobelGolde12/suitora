"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderPlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { cn } from "@/lib/utils/cn";

export interface WardrobeFolderOption {
  id: string;
  name: string;
  itemCount?: number;
}

interface ItemFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string;
  initialFolderId?: string | null;
  initialTags?: string[];
  folders: WardrobeFolderOption[];
  onFoldersChange?: (folders: WardrobeFolderOption[]) => void;
  onSaved: (data: {
    wardrobeFolder: string | null;
    wardrobeFolderName: string | null;
    wardrobeTags: string[];
    inWardrobe: boolean;
  }) => void;
}

const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 24;

/**
 * Edit a saved item's wardrobe folder and tags. Creates folders inline.
 * Remounts via key when opened for a different item so local state stays fresh.
 */
export function ItemFolderModal({
  isOpen,
  onClose,
  analysisId,
  initialFolderId = null,
  initialTags = [],
  folders,
  onFoldersChange,
  onSaved,
}: ItemFolderModalProps) {
  const titleId = useId();

  return (
    <AnimatePresence>
      {isOpen && (
        <ItemFolderModalInner
          key={analysisId}
          analysisId={analysisId}
          initialFolderId={initialFolderId}
          initialTags={initialTags}
          folders={folders}
          onFoldersChange={onFoldersChange}
          onSaved={onSaved}
          onClose={onClose}
          titleId={titleId}
        />
      )}
    </AnimatePresence>
  );
}

function ItemFolderModalInner({
  analysisId,
  initialFolderId = null,
  initialTags = [],
  folders,
  onFoldersChange,
  onSaved,
  onClose,
  titleId,
}: Omit<ItemFolderModalProps, "isOpen"> & { titleId: string }) {
  const { addToast } = useToast();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLButtonElement>(null);
  const [folderId, setFolderId] = useState<string | null>(initialFolderId);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useFocusTrap(dialogRef, true);

  useEffect(() => {
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSaving, onClose]);

  const addTag = (raw: string) => {
    const value = raw.trim().slice(0, MAX_TAG_LENGTH);
    if (!value) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setTagInput("");
      return;
    }
    if (tags.length >= MAX_TAGS) {
      addToast(`You can add up to ${MAX_TAGS} tags`, "error");
      return;
    }
    setTags((prev) => [...prev, value]);
    setTagInput("");
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim().slice(0, 48);
    if (!name || isCreatingFolder) return;
    setIsCreatingFolder(true);
    try {
      const res = await fetch("/api/wardrobe/folders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create folder");
      const folder = data.folder as WardrobeFolderOption;
      onFoldersChange?.([folder, ...folders]);
      setFolderId(folder.id);
      setNewFolderName("");
      addToast("Folder created", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to create folder",
        "error"
      );
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          inWardrobe: true,
          wardrobeFolder: folderId,
          wardrobeTags: tags,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save");

      const favorite = data.favorite;
      const folderName = favorite?.wardrobeFolder
        ? (folders.find((f) => f.id === favorite.wardrobeFolder)?.name ?? null)
        : null;

      onSaved({
        wardrobeFolder: favorite?.wardrobeFolder ?? folderId,
        wardrobeFolderName: folderName,
        wardrobeTags: favorite?.wardrobeTags ?? tags,
        inWardrobe: true,
      });
      addToast("Wardrobe updated", "success");
      onClose();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      onClick={() => !isSaving && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-6 sm:p-8 pb-0">
          <div>
            <h3
              id={titleId}
              className="font-heading text-lg font-medium text-foreground leading-tight"
            >
              Organize in wardrobe
            </h3>
            <p className="text-sm text-muted mt-2 font-light leading-relaxed">
              Pick a folder and add up to {MAX_TAGS} tags.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <fieldset>
            <legend className="text-sm font-medium text-foreground mb-3">
              Folder
            </legend>
            <div className="flex flex-wrap gap-2">
              <button
                ref={firstFieldRef}
                type="button"
                onClick={() => setFolderId(null)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  folderId === null
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted hover:text-foreground"
                )}
              >
                None
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setFolderId(folder.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    folderId === folder.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted hover:text-foreground"
                  )}
                >
                  {folder.name}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                aria-label="New folder name"
                placeholder="New folder…"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleCreateFolder();
                  }
                }}
                className="h-10"
              />
              <Button
                type="button"
                variant="secondary"
                className="rounded-full shrink-0"
                onClick={() => void handleCreateFolder()}
                loading={isCreatingFolder}
                disabled={!newFolderName.trim() || isCreatingFolder}
                aria-label="Create folder"
              >
                <FolderPlus className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-foreground mb-3">
              Tags
            </legend>
            <div className="flex flex-wrap gap-1.5 mb-3 min-h-[1.5rem]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    className="text-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="h-3 w-3" strokeWidth={1.5} />
                  </button>
                </span>
              ))}
            </div>
            <Input
              aria-label="Add tag"
              placeholder={
                tags.length >= MAX_TAGS
                  ? "Tag limit reached"
                  : "Type a tag and press Enter"
              }
              value={tagInput}
              disabled={tags.length >= MAX_TAGS}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                  setTags((prev) => prev.slice(0, -1));
                }
              }}
              className="h-10"
            />
          </fieldset>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 sm:px-8">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSave()}
            loading={isSaving}
            disabled={isSaving}
            className="rounded-full"
          >
            Save
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
