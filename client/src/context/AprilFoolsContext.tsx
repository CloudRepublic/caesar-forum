import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AprilFoolsContextType {
  isAprilFools: boolean;
  togglePreview: () => void;
  isPreviewMode: boolean;
}

const AprilFoolsContext = createContext<AprilFoolsContextType>({
  isAprilFools: false,
  togglePreview: () => {},
  isPreviewMode: false,
});

export function useAprilFools() {
  return useContext(AprilFoolsContext);
}

function isAprilFirst(): boolean {
  const today = new Date();
  return today.getMonth() === 3 && today.getDate() === 1; // April = month 3 (0-indexed)
}

export function AprilFoolsProvider({ children }: { children: React.ReactNode }) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Check URL parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("aprilfools") === "true") {
      setIsPreviewMode(true);
      setIsActive(true);
    } else if (isAprilFirst()) {
      setIsActive(true);
    }
  }, []);

  // Keyboard shortcut: Ctrl+Shift+F to toggle preview
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "F") {
        e.preventDefault();
        setIsPreviewMode((prev) => !prev);
        setIsActive((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const togglePreview = useCallback(() => {
    setIsPreviewMode((prev) => !prev);
    setIsActive((prev) => !prev);
  }, []);

  // Apply the upside-down effect
  useEffect(() => {
    if (isActive) {
      document.body.style.transform = "rotate(180deg)";
      document.body.style.transformOrigin = "center center";
    } else {
      document.body.style.transform = "";
      document.body.style.transformOrigin = "";
    }
    return () => {
      document.body.style.transform = "";
      document.body.style.transformOrigin = "";
    };
  }, [isActive]);

  return (
    <AprilFoolsContext.Provider
      value={{
        isAprilFools: isActive,
        togglePreview,
        isPreviewMode,
      }}
    >
      {children}
    </AprilFoolsContext.Provider>
  );
}
