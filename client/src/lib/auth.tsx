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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { data, refetch } = useQuery({
    queryKey: ["/api/auth/status"],
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.invalidateQueries();
    },
  });

  useEffect(() => {
    // Only check auth status once on initial mount
    if (isInitialLoad) {
      setIsInitialLoad(false);
      refetch();
    }
  }, [isInitialLoad, refetch]);

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