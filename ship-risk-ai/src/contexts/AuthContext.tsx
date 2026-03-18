import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import type { User, UserRole, AuthContextType } from "../types/user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          let role: UserRole = "user";

          // Try to fetch role from Firestore
          if (db) {
            try {
              const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
              if (userDoc.exists()) {
                const data = userDoc.data();
                role = (data.userRole as UserRole) || "user";
              }
            } catch (err) {
              console.warn("Failed to fetch user role:", err);
            }
          }

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            userRole: role,
          });
          setUserRole(role);
        } else {
          setUser(null);
          setUserRole(null);
        }
        setLoading(false);
      },
      (error) => {
        console.warn("Auth error:", error.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, role: UserRole = "user") => {
    try {
      setError(null);
      if (!auth) throw new Error("Firebase not configured");
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Store user document with role in Firestore
      if (db) {
        try {
          await setDoc(doc(db, "users", cred.user.uid), {
            uid: cred.user.uid,
            email,
            userRole: role,
            createdAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("Failed to create user doc:", err);
        }
      }

      setUserRole(role);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      if (!auth) throw new Error("Firebase not configured");
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const isDemoUser = user?.uid?.startsWith("demo-user-");

      // Always clear React state first
      setUser(null);
      setUserRole(null);

      // Only call Firebase signOut for real users
      if (!isDemoUser && auth) {
        await signOut(auth);
      }
    } catch (err) {
      // Still clear state even if Firebase signOut fails
      setUser(null);
      setUserRole(null);
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
      throw err;
    }
  };

  const loginAsDemo = async (role: UserRole = "admin") => {
    try {
      setError(null);
      setUser({
        uid: "demo-user-" + Date.now(),
        email: "demo@ship-risk-ai.com",
        displayName: role === "admin" ? "Demo Admin" : "Demo User",
        photoURL: null,
        createdAt: new Date().toISOString(),
        userRole: role,
      });
      setUserRole(role);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Demo login failed";
      setError(message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    userRole,
    loading,
    error,
    login,
    signup,
    logout,
    loginAsDemo,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
