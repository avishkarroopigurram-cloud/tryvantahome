// AuthContext — allow-list authentication, no backend required.
// Only the two email addresses in ALLOWED_EMAILS can log in.
// Auth state is persisted in localStorage and reconstituted on page reload.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { tokens } from "@/lib/api";
import type { Home, TokenPair, User } from "@/lib/types";

// ─── Allow-list ──────────────────────────────────────────────────────────────
const ALLOWED_EMAILS = new Set([
  "rajanikanthmattepally@gmail.com",
  "aavishkarroopi@gmail.com",
]);

const USER_CACHE_KEY = "tv_user_cache";
const isBrowser = typeof window !== "undefined";

function makeUser(email: string): User {
  // Derive a display name from the local part of the email.
  const localPart = email.split("@")[0];
  const fullName = localPart
    .replace(/\./g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: `local-${email}`,
    email,
    full_name: fullName,
    is_active: true,
    is_superuser: false,
    email_verified: true,
  };
}

// A synthetic home — will be replaced once the FastAPI backend is wired up.
const LOCAL_HOME: Home = {
  id: "home-local",
  name: "My Home",
  timezone: "Asia/Kolkata",
  tariff_per_kwh: 6.5,
  currency: "INR",
};

function fakeTokenPair(email: string): TokenPair {
  return {
    access_token: `local-${btoa(email)}`,
    refresh_token: `local-r-${btoa(email)}`,
    token_type: "Bearer",
    expires_in: 2_592_000, // 30 days
  };
}

// ─── Context interface ────────────────────────────────────────────────────────
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

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [home, setHome] = useState<Home | null>(null);
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);

  // No backend in this phase — always false.
  const backendOffline = false;

  async function bootstrap() {
    if (!tokens.access) {
      setLoading(false);
      return;
    }
    const cached = isBrowser ? localStorage.getItem(USER_CACHE_KEY) : null;
    if (!cached) {
      // Token exists but no user cache → stale state, force re-login.
      tokens.clear();
      setLoading(false);
      return;
    }
    try {
      const cachedUser = JSON.parse(cached) as User;
      // Re-validate cached user against the allow-list in case it changed.
      if (!ALLOWED_EMAILS.has(cachedUser.email)) {
        tokens.clear();
        localStorage.removeItem(USER_CACHE_KEY);
        setLoading(false);
        return;
      }
      setUser(cachedUser);
      setHome(LOCAL_HOME);
      setHomes([LOCAL_HOME]);
    } catch {
      tokens.clear();
      if (isBrowser) localStorage.removeItem(USER_CACHE_KEY);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, _password: string) => {
    const normalised = email.trim().toLowerCase();
    if (!ALLOWED_EMAILS.has(normalised)) {
      throw new Error("Access denied. This email is not authorised.");
    }
    const u = makeUser(normalised);
    tokens.set(fakeTokenPair(normalised));
    tokens.setHome(LOCAL_HOME.id);
    if (isBrowser) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
    setUser(u);
    setHome(LOCAL_HOME);
    setHomes([LOCAL_HOME]);
  };

  const register = async (
    _email: string,
    _password: string,
    _fullName: string,
    _homeName: string,
  ) => {
    throw new Error(
      "Registration is not available. Contact an administrator to be added to the allow-list.",
    );
  };

  const logout = async () => {
    tokens.clear();
    if (isBrowser) localStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
    setHome(null);
    setHomes([]);
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
