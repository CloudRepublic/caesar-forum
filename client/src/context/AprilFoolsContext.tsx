import { createContext, useContext, useState, useEffect } from "react";

const LS_KEY = "april-fools-rotated";

interface AprilFoolsContextType {
  isAprilFools: boolean;
  isRotated: boolean;
  toggleRotation: () => void;
}

const AprilFoolsContext = createContext<AprilFoolsContextType>({
  isAprilFools: false,
  isRotated: false,
  toggleRotation: () => {},
});

export function useAprilFools() {
  return useContext(AprilFoolsContext);
}

function isAprilFirst(): boolean {
  const today = new Date();
  return today.getMonth() === 3 && today.getDate() === 1;
}

export function AprilFoolsProvider({ children }: { children: React.ReactNode }) {
  const [isAprilFools, setIsAprilFools] = useState(false);
  const [isRotated, setIsRotated] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const active = params.get("aprilfools") === "true" || isAprilFirst();
    setIsAprilFools(active);

    if (active) {
      const saved = localStorage.getItem(LS_KEY);
      setIsRotated(saved === null ? true : saved === "true");
    }
  }, []);

  const toggleRotation = () => {
    setIsRotated((prev) => {
      const next = !prev;
      localStorage.setItem(LS_KEY, String(next));
      return next;
    });
  };

  return (
    <AprilFoolsContext.Provider value={{ isAprilFools, isRotated, toggleRotation }}>
      {children}
    </AprilFoolsContext.Provider>
  );
}
