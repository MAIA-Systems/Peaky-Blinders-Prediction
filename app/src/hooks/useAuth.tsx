import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "@/api/auth";
import type { SignupResult } from "@/api/auth";
import type { AuthCredentials, SignupPayload, User } from "@/types";

interface AuthContextValue {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: AuthCredentials) => Promise<User>;
  signup: (payload: SignupPayload) => Promise<SignupResult>;
  logout: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  isLoginPending: boolean;
  isSignupPending: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const CURRENT_USER_KEY = ["auth", "currentUser"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: authApi.getCurrentUser,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (loggedInUser) => queryClient.setQueryData(CURRENT_USER_KEY, loggedInUser),
  });

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: ({ emailSent: _emailSent, ...newUser }: SignupResult) => queryClient.setQueryData(CURRENT_USER_KEY, newUser),
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => queryClient.setQueryData(CURRENT_USER_KEY, null),
  });

  const resendVerificationMutation = useMutation({ mutationFn: authApi.resendVerificationEmail });

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    resendVerificationEmail: resendVerificationMutation.mutateAsync,
    isLoginPending: loginMutation.isPending,
    isSignupPending: signupMutation.isPending,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
