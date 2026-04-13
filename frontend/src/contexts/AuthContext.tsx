import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  user: any | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  updateUser: (newData: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(() => {
    const savedUser = sessionStorage.getItem("bolsur_session");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const getToken = () => sessionStorage.getItem("bolsur_token");

  // Función para actualizar los datos del usuario en el estado y en storage
  const updateUser = (newData: any) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    sessionStorage.setItem("bolsur_session", JSON.stringify(updatedUser));
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      
      if (res.ok) {
        // Al hacer login, data.user ya trae imprimir_automatico y recibir_notificaciones
        setUser(data.user);
        sessionStorage.setItem("bolsur_session", JSON.stringify(data.user)); 
        sessionStorage.setItem("bolsur_token", data.token); 
        
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: "Error de conexión con el servidor" };
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("bolsur_session");
    sessionStorage.removeItem("bolsur_token");
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    
    if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
    }

    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
      logout();
    }

    return response;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, authFetch, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};