import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User } from "@shared/schema";

interface UserContextType {
  user: User | null;
  login: (user: User) => void;
  loginAsMockUser: () => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Mock user for demo
const mockUser: User = {
  id: "user-1",
  name: "Jan de Vries",
  email: "jan.devries@caesar.nl",
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(mockUser);

  const login = useCallback((newUser: User) => {
    setUser(newUser);
  }, []);

  const loginAsMockUser = useCallback(() => {
    setUser(mockUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, login, loginAsMockUser, logout }}>
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
