import React, { useState, useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { apiFetch, authStore } from "@/utils/auth";

interface Props {
  children: ReactNode;
}

export const PrivateRouters: React.FC<Props> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isActive = true;

    const checkAuth = async () => {
      const token = authStore.get();

      if (!token) {
        if (isActive) {
          setAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await apiFetch(`${import.meta.env.VITE_API_URL}/auth/check`, {
          method: "GET",
        });

        if (!isActive) {
          return;
        }

        if (res.ok) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      } catch {
        if (isActive) {
          setAuthenticated(false);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isActive = false;
    };
  }, []);

  if (loading) {
    return null;
  }
  return authenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};
