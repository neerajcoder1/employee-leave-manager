import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state from localStorage on load
  useEffect(() => {
    const bootstrapAuth = () => {
      const storedToken = sessionStorage.getItem("token");
      const storedUser = sessionStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error("Error parsing stored user details:", err);
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
        }
      }
      setLoading(false);
    };

    bootstrapAuth();
  }, []);

  /**
   * Handle user login API call
   */
  const login = async (username, password) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Login failed. Please check your credentials.",
        );
      }

      const { token: jwtToken, user: userData } = result.data;

      sessionStorage.setItem("token", jwtToken);
      sessionStorage.setItem("user", JSON.stringify(userData));

      setToken(jwtToken);
      setUser(userData);

      return {
        success: true,
        user: userData,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  };

  /**
   * Handle user logout
   */
  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  /**
   * Handle employee registration API call
   */
  const register = async (username, password) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Registration failed.");
      }

      return { success: true, message: result.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
