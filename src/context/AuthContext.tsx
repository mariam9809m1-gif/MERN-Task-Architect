import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthState } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  register: (username: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUserBalance: (newBalance: number) => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem("taskmaster_token"), // Keep token storage key consistent
    isLoading: true,
    error: null,
  });

  const refreshUserProfile = async () => {
    const currentToken = state.token || localStorage.getItem("taskmaster_token");
    if (!currentToken) return;

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        setState((prev) => ({
          ...prev,
          user,
          token: currentToken,
        }));
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("taskmaster_token");
      if (!storedToken) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const user = await response.json();
          setState({
            user,
            token: storedToken,
            isLoading: false,
            error: null,
          });
        } else {
          // Token expired
          localStorage.removeItem("taskmaster_token");
          setState({
            user: null,
            token: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const register = async (username: string, email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to register account.");
      }

      localStorage.setItem("taskmaster_token", data.token);
      setState({
        user: data.user,
        token: data.token,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || "An error occurred during registration.",
      }));
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials.");
      }

      localStorage.setItem("taskmaster_token", data.token);
      setState({
        user: data.user,
        token: data.token,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || "An error occurred during login.",
      }));
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("taskmaster_token");
    setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  const updateUserBalance = (newBalance: number) => {
    setState((prev) => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: {
          ...prev.user,
          balance: newBalance,
        }
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isLoading: state.isLoading,
        error: state.error,
        register,
        login,
        logout,
        clearError,
        updateUserBalance,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
