import { createContext, useContext, useState, useEffect } from "react";

interface KonamiCodeContextType {
  isRetroMode: boolean;
}

const KonamiCodeContext = createContext<KonamiCodeContextType>({
  isRetroMode: false,
});

export function useKonamiCode() {
  return useContext(KonamiCodeContext);
}

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

export function KonamiCodeProvider({ children }: { children: React.ReactNode }) {
  const [isRetroMode, setIsRetroMode] = useState(false);
  const [inputSequence, setInputSequence] = useState<string[]>([]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const newSequence = [...inputSequence, e.code].slice(-KONAMI_CODE.length);
      setInputSequence(newSequence);

      if (newSequence.length === KONAMI_CODE.length && 
          newSequence.every((key, i) => key === KONAMI_CODE[i])) {
        setIsRetroMode(true);
        setInputSequence([]);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputSequence]);

  useEffect(() => {
    if (isRetroMode) {
      document.documentElement.classList.add("retro-mode");
    } else {
      document.documentElement.classList.remove("retro-mode");
    }
    return () => {
      document.documentElement.classList.remove("retro-mode");
    };
  }, [isRetroMode]);

  return (
    <KonamiCodeContext.Provider value={{ isRetroMode }}>
      {children}
    </KonamiCodeContext.Provider>
  );
}
