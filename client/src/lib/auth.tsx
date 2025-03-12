import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
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
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  logout: () => {},
  isLoading: true,
  error: null
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);

  // Check for error parameter in URL and Twitch redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('error');

    if (authError) {
      setError(authError === 'redirect_mismatch' 
        ? 'Authentication configuration error. Please try again.'
        : 'Authentication failed. Please try again.');

      // Clear error from URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Force refetch after Twitch redirect
    if (window.location.pathname === '/' && params.has('state')) {
      // Small delay to ensure session is properly set
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      }, 1000);
    }
  }, []);

  // Auth status query
  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/status"],
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });

  // Logout mutation
  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.invalidateQueries();
      window.location.href = "/";
    }
  });

  // Clear error on successful auth
  useEffect(() => {
    if (authData?.authenticated) {
      setError(null);
    }
  }, [authData?.authenticated]);

  const value = {
    isAuthenticated: Boolean(authData?.authenticated),
    user: authData?.user || null,
    logout,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}