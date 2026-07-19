import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, tokens, NetworkError } from "@/lib/api";
import type { Home, TokenPair, User } from "@/lib/types";

interface AuthState {
  user: User | null;
  home: Home | null;
  homes: Home[];
  loading: boolean;
  backendOffline: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    homeName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  switchHome: (homeId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);
export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [home, setHome] = useState<Home | null>(null);
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendOffline, setBackendOffline] = useState(false);

  async function bootstrap() {
    if (!tokens.access) {
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<User>("/users/me");
      const myHomes = await api.get<Home[]>("/users/me/homes");
      setUser(me);
      setHomes(myHomes);
      const active = tokens.home && myHomes.find((h) => h.id === tokens.home);
      const chosen = active || myHomes[0];
      if (chosen) {
        tokens.setHome(chosen.id);
        setHome(chosen);
      }
      setBackendOffline(false);
    } catch (e) {
      if (e instanceof NetworkError) {
        setBackendOffline(true);
      } else {
        tokens.clear();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function afterAuth(pair: TokenPair) {
    tokens.set(pair);
    await bootstrap();
  }

  const login = async (email: string, password: string) => {
    const pair = await api.post<TokenPair>("/auth/login", { email, password });
    await afterAuth(pair);
  };
  const register = async (
    email: string,
    password: string,
    full_name: string,
    home_name: string,
  ) => {
    const pair = await api.post<TokenPair>("/auth/register", {
      email,
      password,
      full_name,
      home_name,
    });
    await afterAuth(pair);
  };
  const logout = async () => {
    try {
      if (tokens.refresh)
        await api.post("/auth/logout", { refresh_token: tokens.refresh });
    } catch {
      /* ignore */
    } finally {
      tokens.clear();
      setUser(null);
      setHome(null);
      setHomes([]);
    }
  };
  const switchHome = async (homeId: string) => {
    tokens.setHome(homeId);
    setHome(homes.find((x) => x.id === homeId) || null);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        home,
        homes,
        loading,
        backendOffline,
        login,
        register,
        logout,
        switchHome,
        refresh: bootstrap,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
