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

  // Check for error parameter in URL
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
  }, []);

  const { data, isLoading } = useQuery<{ authenticated: boolean; user: User | null }>({
    queryKey: ["/api/auth/status"],
    refetchOnWindowFocus: false,
    retry: false,
    refetchInterval: (data) => data?.authenticated ? false : 2000 // Poll while not authenticated
  });

  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.invalidateQueries();
      window.location.href = "/";
    },
  });

  // Clear error when authentication succeeds
  useEffect(() => {
    if (data?.authenticated) {
      setError(null);
    }
  }, [data?.authenticated]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(data?.authenticated),
        user: data?.user || null,
        logout,
        isLoading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}