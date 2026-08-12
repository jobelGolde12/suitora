"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderPlus, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { cn } from "@/lib/utils/cn";
import type { WardrobeFolderOption } from "./ItemFolderModal";

const MAX_FOLDER_NAME = 48;

interface FolderManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: WardrobeFolderOption[];
  onFoldersChange: (folders: WardrobeFolderOption[]) => void;
  onFolderRenamed: (id: string, name: string) => void;
  onFolderDeleted: (id: string) => void;
}

/**
 * Create, rename, and delete wardrobe folders. Deleting a folder unassigns
 * its items (the API clears `wardrobe_folder`), which the page reconciles.
 */
export function FolderManagerModal({
  isOpen,
  onClose,
  folders,
  onFoldersChange,
  onFolderRenamed,
  onFolderDeleted,
}: FolderManagerModalProps) {
  const { addToast } = useToast();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderError, setNewFolderError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusTrap(dialogRef, isOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) return;
    // Defer the reset to a microtask so closing the dialog doesn't trigger a
    // cascading render from within the effect body (react-hooks rule).
    void Promise.resolve().then(() => {
      setEditingId(null);
      setDeletingId(null);
      setNewFolderError(null);
    });
  }, [isOpen]);

  const handleCreate = async () => {
    const name = newFolderName.trim().slice(0, MAX_FOLDER_NAME);
    if (!name) {
      setNewFolderError("Folder name is required");
      return;
    }
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/wardrobe/folders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create folder");
      onFoldersChange([data.folder as WardrobeFolderOption, ...folders]);
      setNewFolderName("");
      addToast("Folder created", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to create folder", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const startRename = (folder: WardrobeFolderOption) => {
    setEditingId(folder.id);
    setEditingName(folder.name);
  };

  const handleRename = async (folder: WardrobeFolderOption) => {
    const name = editingName.trim().slice(0, MAX_FOLDER_NAME);
    if (!name || name === folder.name) {
      setEditingId(null);
      return;
    }
    if (renamingId) return;
    setRenamingId(folder.id);
    try {
      const res = await fetch(`/api/wardrobe/folders/${folder.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to rename folder");
      const updated = data.folder as WardrobeFolderOption;
      onFoldersChange(
        folders.map((f) => (f.id === folder.id ? { ...f, name: updated.name } : f))
      );
      onFolderRenamed(folder.id, updated.name);
      setEditingId(null);
      addToast("Folder renamed", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to rename folder", "error");
    } finally {
      setRenamingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingId || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/wardrobe/folders/${deletingId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete folder");
      onFoldersChange(folders.filter((f) => f.id !== deletingId));
      onFolderDeleted(deletingId);
      setDeletingId(null);
      addToast("Folder deleted", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete folder", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
          aria-modal="true"
          role="dialog"
          aria-labelledby={titleId}
          onClick={onClose}
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
                  Manage folders
                </h3>
                <p className="text-sm text-muted mt-2 font-light leading-relaxed">
                  Create, rename, or delete your wardrobe folders.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex gap-2">
                  <Input
                    aria-label="New folder name"
                    placeholder="New folder name…"
                    value={newFolderName}
                    error={newFolderError ?? undefined}
                    onChange={(e) => {
                      setNewFolderName(e.target.value);
                      if (newFolderError) setNewFolderError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleCreate();
                      }
                    }}
                    className="h-10"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-full shrink-0"
                    onClick={() => void handleCreate()}
                    loading={isCreating}
                    disabled={isCreating}
                    aria-label="Create folder"
                  >
                    <FolderPlus className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </div>

              {folders.length > 0 && (
                <ul className="space-y-2">
                  {folders.map((folder) => (
                    <li
                      key={folder.id}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
                    >
                      {editingId === folder.id ? (
                        <div className="flex flex-1 items-center gap-2">
                          <Input
                            aria-label={`Rename ${folder.name}`}
                            value={editingName}
                            maxLength={MAX_FOLDER_NAME}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void handleRename(folder);
                              } else if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                            className="h-9"
                          />
                          <Button
                            type="button"
                            variant="primary"
                            className="rounded-full h-9 px-3"
                            onClick={() => void handleRename(folder)}
                            loading={renamingId === folder.id}
                            disabled={renamingId === folder.id}
                            aria-label="Save folder name"
                          >
                            <Check className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="rounded-full h-9 px-3"
                            onClick={() => setEditingId(null)}
                            disabled={renamingId === folder.id}
                            aria-label="Cancel rename"
                          >
                            <X className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {folder.name}
                            </p>
                            <p className="text-[11px] text-muted font-light">
                              {folder.itemCount ?? 0} item
                              {(folder.itemCount ?? 0) === 1 ? "" : "s"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => startRename(folder)}
                            className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-muted hover:text-accent hover:border-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`Rename ${folder.name}`}
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(folder.id)}
                            className={cn(
                              "h-9 w-9 rounded-full border border-border flex items-center justify-center text-muted hover:text-error hover:border-error transition-colors",
                              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            )}
                            aria-label={`Delete ${folder.name}`}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 sm:px-8">
              <Button variant="secondary" onClick={onClose} className="rounded-full">
                Done
              </Button>
            </div>

            <ConfirmModal
              isOpen={!!deletingId}
              onClose={() => setDeletingId(null)}
              onConfirm={() => void handleDelete()}
              title="Delete folder?"
              description={`"${deletingId ? folders.find((f) => f.id === deletingId)?.name : ""}" will be deleted and its items moved to "Unfiled".`}
              confirmLabel="Delete"
              variant="danger"
              isLoading={isDeleting}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
