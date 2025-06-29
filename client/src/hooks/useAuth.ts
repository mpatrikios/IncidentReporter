import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  title?: string;
  isEngineer: boolean;
  picture?: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user: user as AuthUser | undefined,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Redirect to home page after successful login
      window.location.href = "/";
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Clear all cached queries
      queryClient.clear();
      // Redirect to login page after successful logout
      window.location.href = "/login";
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      // Even if logout fails on the server, clear local state and redirect
      queryClient.clear();
      window.location.href = "/login";
    },
  });
}