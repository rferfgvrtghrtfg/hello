import { useState, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const API_BASE = "http://localhost:4010";
const PROJECT_ID = "c6a01081-c689-4b7d-823e-a1f06cd0e10c";

interface User {
  id: string;
  email: string;
}

interface TestItem {
  id: string;
  name: string | null;
  created_at: string;
  user_id: string;
}

// Auth Context
const AuthContext = createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}>({
  user: null,
  setUser: () => {},
  isLoading: true,
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount
  useState(() => {
    fetch(`${API_BASE}/api/projects/${PROJECT_ID}/auth/me`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setUser(data);
        }
      })
      .finally(() => setIsLoading(false));
  });

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

const fetchTestData = async (): Promise<TestItem[]> => {
  const response = await fetch(`${API_BASE}/api/projects/${PROJECT_ID}/tables/test/rows?limit=25`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }
  
  return response.json();
};

const AuthForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin 
        ? `${API_BASE}/api/projects/${PROJECT_ID}/auth/signin`
        : `${API_BASE}/api/projects/${PROJECT_ID}/auth/signup`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Auth failed");
      }

      setUser({ id: data.id, email: data.email });
      toast({
        title: isLogin ? "Willkommen zurück!" : "Erfolgreich registriert!",
        description: `Angemeldet als ${email}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isLogin ? "Anmelden" : "Registrieren"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? "Anmelden" : "Registrieren"}
          </Button>
          <p className="text-center text-sm text-slate-500">
            {isLogin ? "Noch kein Konto? " : "Bereits ein Konto? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:underline"
            >
              {isLogin ? "Registrieren" : "Anmelden"}
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

const TestList = () => {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["test"],
    queryFn: fetchTestData,
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async (newName: string) => {
      const response = await fetch(`${API_BASE}/api/projects/${PROJECT_ID}/tables/test/rows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        credentials: "include",
        body: JSON.stringify({ 
          row: { name: newName }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add data");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test"] });
      setName("");
      toast({
        title: "Erfolgreich",
        description: "Datensatz wurde hinzugefügt",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error.message,
      });
    },
  });

  const handleLogout = async () => {
    await fetch(`${API_BASE}/api/projects/${PROJECT_ID}/auth/signout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      mutation.mutate(name.trim());
    }
  };

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">Angemeldet als: <strong>{user.email}</strong></p>
        <Button variant="outline" onClick={handleLogout}>Abmelden</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neuen Eintrag hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input
              placeholder="Name eingeben..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={mutation.isPending || !name.trim()}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hinzufügen
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Fehler beim Laden der Daten</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <div className="grid gap-4">
          {data && data.length > 0 ? (
            data.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">
                    {item.name || "Kein Name"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">ID: {item.id}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Erstellt: {new Date(item.created_at).toLocaleString("de-DE")}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-10">
                <p className="text-slate-500">Noch keine Daten vorhanden</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-800 mb-8 text-center">
          Test Daten
        </h1>
        <AuthProvider>
          <TestList />
        </AuthProvider>
      </div>
    </div>
  );
};

export default Index;
