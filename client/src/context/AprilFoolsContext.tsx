import { createContext, useContext, useState, useEffect } from "react";

const LS_KEY = "april-fools-dismissed";

interface AprilFoolsContextType {
  isAprilFools: boolean;
  dismissAprilFools: () => void;
}

const AprilFoolsContext = createContext<AprilFoolsContextType>({
  isAprilFools: false,
  dismissAprilFools: () => {},
});

export function useAprilFools() {
  return useContext(AprilFoolsContext);
}

function isAprilFirst(): boolean {
  const today = new Date();
  return today.getMonth() === 3 && today.getDate() === 1;
}

export function AprilFoolsProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(LS_KEY) === "true";
    if (dismissed) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("aprilfools") === "true") {
      setIsActive(true);
    } else if (isAprilFirst()) {
      setIsActive(true);
    }
  }, []);

  const dismissAprilFools = () => {
    localStorage.setItem(LS_KEY, "true");
    setIsActive(false);
  };

  return (
    <AprilFoolsContext.Provider value={{ isAprilFools: isActive, dismissAprilFools }}>
      {children}
    </AprilFoolsContext.Provider>
  );
}
