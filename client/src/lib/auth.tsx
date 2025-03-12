import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "./queryClient";

interface User {
  id: string;
  login: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery<{ authenticated: boolean; user: User | null }>({
    queryKey: ["/api/auth/status"],
    refetchOnWindowFocus: false,
    retry: false,
  });

  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.invalidateQueries();
      window.location.href = "/";
    },
  });

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(data?.authenticated),
        user: data?.user || null,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}