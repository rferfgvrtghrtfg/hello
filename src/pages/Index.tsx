import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const API_BASE = "http://localhost:4010";
const PROJECT_ID = "c6a01081-c689-4b7d-823e-a1f06cd0e10c";

interface TestItem {
  id: string;
  name: string | null;
  created_at: string;
}

const fetchTestData = async (): Promise<TestItem[]> => {
  const response = await fetch(`${API_BASE}/api/projects/${PROJECT_ID}/tables/test/rows?limit=25`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }
  
  return response.json();
};

const Index = () => {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["test"],
    queryFn: fetchTestData,
  });

  const mutation = useMutation({
    mutationFn: async (newName: string) => {
      const response = await fetch(`${API_BASE}/api/projects/${PROJECT_ID}/tables/test/rows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add data");
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
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Datensatz konnte nicht hinzugefügt werden",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      mutation.mutate(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-800 mb-8 text-center">
          Test Daten
        </h1>

        {/* Formular */}
        <Card className="mb-8">
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

        {/* Daten Liste */}
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
                    <p className="text-sm text-slate-500">
                      ID: {item.id}
                    </p>
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
    </div>
  );
};

export default Index;
