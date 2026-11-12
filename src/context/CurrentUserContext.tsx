import { createContext, useContext } from "react";

export interface CurrentUser {
  userId: string;
  username: string;
  role: string;
}

export const CurrentUserContext = createContext<CurrentUser | null>(null);

export const useCurrentUser = () => useContext(CurrentUserContext);

export const isAdmin = (user: CurrentUser | null) => user?.role === "ADMIN";
