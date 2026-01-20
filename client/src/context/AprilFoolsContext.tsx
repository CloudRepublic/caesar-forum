import { createContext, useContext, useState, useEffect } from "react";

interface AprilFoolsContextType {
  isAprilFools: boolean;
}

const AprilFoolsContext = createContext<AprilFoolsContextType>({
  isAprilFools: false,
});

export function useAprilFools() {
  return useContext(AprilFoolsContext);
}

function isAprilFirst(): boolean {
  const today = new Date();
  return today.getMonth() === 3 && today.getDate() === 1; // April = month 3 (0-indexed)
}

export function AprilFoolsProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("aprilfools") === "true") {
      // Preview mode via URL parameter
      setIsActive(true);
    } else if (isAprilFirst()) {
      // Automatically activate on April 1st
      setIsActive(true);
    }
  }, []);

  return (
    <AprilFoolsContext.Provider value={{ isAprilFools: isActive }}>
      {children}
    </AprilFoolsContext.Provider>
  );
}
