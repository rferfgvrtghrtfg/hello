import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface TestItem {
  id: string;
  name: string | null;
  created_at: string;
}

const fetchTestData = async (): Promise<TestItem[]> => {
  const response = await fetch("http://localhost:4010/rest/v1/test?select=*", {
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
  const { data, isLoading, error } = useQuery({
    queryKey: ["test"],
    queryFn: fetchTestData,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-800 mb-8 text-center">
          Test Daten
        </h1>

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
