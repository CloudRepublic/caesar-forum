import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const { data, isLoading, error } = useQuery<User>({
    queryKey: ["/api/me"],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data && !error) {
      setUser(data);
    } else if (error) {
      setUser(null);
    }
  }, [data, error]);

  const login = useCallback(() => {
    window.location.href = "/auth/login";
  }, []);

  const logout = useCallback(() => {
    window.location.href = "/auth/logout";
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
