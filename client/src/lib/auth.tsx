import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./queryClient";

interface User {
  id: string;
  login: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, refetch } = useQuery({
    queryKey: ["/api/auth/status"],
    refetchOnWindowFocus: true,
    gcTime: 0,
    staleTime: 0
  });

  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
    },
  });

  // Check auth status when URL changes (e.g., after OAuth callback)
  useEffect(() => {
    const checkAuth = () => {
      if (window.location.search.includes("error=auth_failed")) {
        console.error("Authentication failed");
      } else {
        refetch();
      }
    };

    checkAuth();
    // Add event listener for route changes
    window.addEventListener('popstate', checkAuth);
    return () => window.removeEventListener('popstate', checkAuth);
  }, [refetch]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: data?.authenticated ?? false,
        user: data?.user ?? null,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}