import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const URGENCY_COLORS: Record<string, string> = {
  crítico: "#ef4444",
  urgente: "#f97316",
  "pouco urgente": "#eab308",
  "não urgente": "#22c55e",
};

const URGENCY_LABELS: Record<string, string> = {
  crítico: "🔴 Crítico",
  urgente: "🟠 Urgente",
  "pouco urgente": "🟡 Pouco Urgente",
  "não urgente": "🟢 Não Urgente",
};

export default function History() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 20;

  const { data: history, isLoading } = trpc.triagem.getHistory.useQuery({
    limit: itemsPerPage,
    offset: page * itemsPerPage,
  });

  const records = history || [];

  // Filter by search term
  const filteredRecords = records.filter(
    (record) =>
      record.patientId.toString().includes(searchTerm) ||
      record.urgencyLevelAtCheckIn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Histórico de Atendimentos</h1>
          <p className="text-gray-600 font-mono text-sm">
            Registro completo de todos os atendimentos realizados
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="border-2 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                placeholder="Buscar por ID do paciente ou urgência..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Atendimentos</CardTitle>
            <CardDescription className="font-mono text-xs">
              Total de registros: {filteredRecords.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : filteredRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-gray-300 bg-gray-50">
                    <tr>
                      <th className="text-left font-bold py-3 px-4">ID Paciente</th>
                      <th className="text-left font-bold py-3 px-4">Urgência</th>
                      <th className="text-left font-bold py-3 px-4">Check-in</th>
                      <th className="text-left font-bold py-3 px-4">Início Atendimento</th>
                      <th className="text-left font-bold py-3 px-4">Fim Atendimento</th>
                      <th className="text-left font-bold py-3 px-4">Espera (min)</th>
                      <th className="text-left font-bold py-3 px-4">Atendimento (min)</th>
                      <th className="text-left font-bold py-3 px-4">Desfecho</th>
                      <th className="text-left font-bold py-3 px-4">Médico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold">#{record.patientId}</td>
                        <td className="py-3 px-4">
                          <Badge
                            style={{
                              backgroundColor: URGENCY_COLORS[record.urgencyLevelAtCheckIn],
                              color: "white",
                            }}
                          >
                            {URGENCY_LABELS[record.urgencyLevelAtCheckIn]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {formatDate(record.checkInTime)}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {record.attendanceStartTime ? formatDate(record.attendanceStartTime) : "-"}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {record.attendanceEndTime ? formatDate(record.attendanceEndTime) : "-"}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {record.waitingTimeMinutes || "-"}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {record.attendanceTimeMinutes || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={record.outcome === "atendido" ? "default" : "secondary"}
                          >
                            {record.outcome}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs">{record.attendingDoctor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum registro encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {filteredRecords.length > 0 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <span className="font-mono text-sm text-gray-600">
              Página {page + 1}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={filteredRecords.length < itemsPerPage}
            >
              Próxima
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <p className="text-sm font-mono text-gray-600">Total de Atendimentos</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{filteredRecords.length}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <p className="text-sm font-mono text-gray-600">Tempo Médio de Espera</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {filteredRecords.length > 0
                  ? (
                      filteredRecords.reduce((sum, r) => sum + (r.waitingTimeMinutes || 0), 0) /
                      filteredRecords.length
                    ).toFixed(1)
                  : "-"}
                <span className="text-lg">min</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-orange-50/50">
            <CardContent className="pt-6">
              <p className="text-sm font-mono text-gray-600">Tempo Médio de Atendimento</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {filteredRecords.length > 0
                  ? (
                      filteredRecords.reduce((sum, r) => sum + (r.attendanceTimeMinutes || 0), 0) /
                      filteredRecords.length
                    ).toFixed(1)
                  : "-"}
                <span className="text-lg">min</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <p className="text-sm font-mono text-gray-600">Pacientes Críticos</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {filteredRecords.filter((r) => r.urgencyLevelAtCheckIn === "crítico").length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
