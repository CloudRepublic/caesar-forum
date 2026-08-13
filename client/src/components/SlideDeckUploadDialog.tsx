import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Loader2, FileText, Presentation } from "lucide-react";

interface SlideDeckInfo {
  filename: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
}

interface SlideDeckUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  sessionTitle: string;
  existing?: SlideDeckInfo;
  /** Called after a successful upload or delete so the parent can refresh */
  onChanged: () => void;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const MAX_SIZE_MB = 50;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ contentType }: { contentType: string }) {
  if (contentType === "application/pdf") return <FileText className="h-5 w-5 text-red-500" />;
  return <Presentation className="h-5 w-5 text-orange-500" />;
}

export function SlideDeckUploadDialog({
  open,
  onOpenChange,
  sessionId,
  sessionTitle,
  existing,
  onChanged,
}: SlideDeckUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/sessions/${sessionId}/slidedeck`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Upload mislukt");
      }
      return res.json();
    },
    onSuccess: () => {
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/editions"] });
      onChanged();
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}/slidedeck`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Verwijderen mislukt");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editions"] });
      onChanged();
      onOpenChange(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) { setSelectedFile(null); return; }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError("Alleen PDF en PowerPoint (.pptx) bestanden zijn toegestaan.");
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`Bestand is te groot. Maximum is ${MAX_SIZE_MB} MB.`);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const isBusy = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isBusy) onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Slidedeck beheren</DialogTitle>
          <DialogDescription className="line-clamp-2">{sessionTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing slidedeck */}
          {existing && (
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Huidig slidedeck
              </p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileIcon contentType={existing.contentType} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{existing.filename}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(existing.fileSize)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={isBusy}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {deleteMutation.isError && (
                <p className="mt-2 text-xs text-destructive">
                  {deleteMutation.error?.message}
                </p>
              )}
            </div>
          )}

          {/* Upload area */}
          <div>
            <p className="mb-2 text-sm font-medium">
              {existing ? "Vervangen door nieuw bestand" : "Bestand uploaden"}
            </p>
            <div
              className="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary hover:bg-muted/30"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Klik om een bestand te kiezen
              </p>
              <p className="mt-1 text-xs text-muted-foreground">PDF of PowerPoint (.pptx) — max {MAX_SIZE_MB} MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {fileError && (
              <p className="mt-2 text-sm text-destructive">{fileError}</p>
            )}

            {selectedFile && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
                <FileIcon contentType={selectedFile.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                </div>
              </div>
            )}

            {uploadMutation.isError && (
              <p className="mt-2 text-sm text-destructive">
                {uploadMutation.error?.message}
              </p>
            )}
          </div>

          <Button
            className="w-full"
            onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
            disabled={!selectedFile || isBusy}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploaden…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {existing ? "Vervangen" : "Uploaden"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
