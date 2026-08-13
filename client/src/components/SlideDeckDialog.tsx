import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Presentation } from "lucide-react";

interface SlideDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  filename: string;
  contentType: string;
}

export function SlideDeckDialog({
  open,
  onOpenChange,
  sessionId,
  filename,
  contentType,
}: SlideDeckDialogProps) {
  const isPdf = contentType === "application/pdf";
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      // Clean up blob URL when dialog closes
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setPdfUrl(null);
      setError(null);
      return;
    }

    if (!isPdf) return;

    setLoading(true);
    setError(null);

    fetch(`/api/sessions/${sessionId}/slidedeck/download`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Download mislukt");
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setPdfUrl(url);
      })
      .catch(() => setError("Kon het slidedeck niet laden."))
      .finally(() => setLoading(false));

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [open, sessionId, isPdf]);

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/slidedeck/download`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Download mislukt");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Downloaden mislukt. Probeer het opnieuw.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isPdf ? "max-w-4xl h-[90vh] flex flex-col" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            {filename}
          </DialogTitle>
        </DialogHeader>

        {isPdf ? (
          <div className="flex-1 min-h-0">
            {loading && (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {error && (
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">{error}</p>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Toch downloaden
                </Button>
              </div>
            )}
            {pdfUrl && !loading && (
              <iframe
                src={pdfUrl}
                className="h-full w-full rounded border-0"
                title={filename}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <Presentation className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-medium">{filename}</p>
              <p className="text-sm text-muted-foreground mt-1">
                PowerPoint-bestanden kunnen niet direct worden getoond.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleDownload} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Downloaden
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
