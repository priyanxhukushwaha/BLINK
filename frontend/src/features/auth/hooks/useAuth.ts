import { useAuthContext } from "../state/AuthContext";

export function useAuth() {
  const context = useAuthContext();

  return {
    isAuthenticated: context.authStatus === "authenticated",
    isLoading: context.authStatus === "loading",
    authStatus: context.authStatus,
    authError: context.authError,
    isAuthenticating: context.isAuthenticating,
    user: context.currentUser,
    login: context.login,
    register: context.register,
    logout: context.logout,
    clearAuthError: context.clearAuthError,
  };
}

export default useAuth;
