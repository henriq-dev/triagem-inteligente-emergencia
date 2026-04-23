import { useState } from "react";
import { trpc } from "@/lib/trpc";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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

const STATUS_LABELS: Record<string, string> = {
  aguardando: "Aguardando",
  "em atendimento": "Em Atendimento",
  concluído: "Concluído",
  cancelado: "Cancelado",
};

export default function Admin() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  // Queries
  const queueQuery = trpc.triagem.getQueue.useQuery();
  const attendingQuery = trpc.triagem.getAttending.useQuery();
  const patientQuery = trpc.triagem.getPatient.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );
  const historyQuery = trpc.triagem.getHistory.useQuery({ limit: 50 });

  // Mutations
  const updateStatusMutation = trpc.triagem.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      queueQuery.refetch();
      attendingQuery.refetch();
      setSelectedPatientId(null);
      setNewStatus("");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const queue = queueQuery.data || [];
  const attending = attendingQuery.data || [];
  const patient = patientQuery.data;
  const history = historyQuery.data || [];

  const handleUpdateStatus = () => {
    if (!selectedPatientId || !newStatus) {
      toast.error("Selecione um paciente e um novo status");
      return;
    }

    updateStatusMutation.mutate({
      patientId: selectedPatientId,
      status: newStatus as "aguardando" | "em atendimento" | "concluído" | "cancelado",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-gray-600 font-mono text-sm">
            Gerenciamento de pacientes e fila de atendimento
          </p>
        </div>

        {/* Status Update Section */}
        <Card className="border-2 border-orange-300 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="text-lg">Atualizar Status do Paciente</CardTitle>
            <CardDescription className="font-mono text-xs">
              Selecione um paciente e atualize seu status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-xs font-bold block mb-2">Paciente</label>
                <Select value={selectedPatientId?.toString() || ""} onValueChange={(val) => setSelectedPatientId(parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {queue.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} (#{p.queuePosition})
                      </SelectItem>
                    ))}
                    {attending.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} (Em atendimento)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-mono text-xs font-bold block mb-2">Novo Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aguardando">Aguardando</SelectItem>
                    <SelectItem value="em atendimento">Em Atendimento</SelectItem>
                    <SelectItem value="concluído">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleUpdateStatus}
                  disabled={updateStatusMutation.isPending || !selectedPatientId || !newStatus}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    "Atualizar Status"
                  )}
                </Button>
              </div>
            </div>

            {patient && (
              <div className="bg-white p-4 rounded-lg border border-orange-200 mt-4">
                <p className="font-bold text-gray-900">{patient.name}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-600 font-mono">Urgência</p>
                    <Badge style={{ backgroundColor: URGENCY_COLORS[patient.urgencyLevel], color: "white" }}>
                      {URGENCY_LABELS[patient.urgencyLevel]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-mono">FC</p>
                    <p className="font-bold">{patient.sensorData.heartRate} bpm</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-mono">Temp</p>
                    <p className="font-bold">{patient.sensorData.temperature}°C</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-mono">O₂</p>
                    <p className="font-bold">{patient.sensorData.oxygenSaturation}%</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Queue Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Waiting Queue */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Fila de Espera</CardTitle>
              <CardDescription className="font-mono text-xs">
                {queue.length} pacientes aguardando
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queue.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {queue.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedPatientId === patient.id
                          ? "bg-blue-50 border-blue-400"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      style={{
                        borderLeftColor: URGENCY_COLORS[patient.urgencyLevel],
                        borderLeftWidth: "4px",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">#{patient.queuePosition} - {patient.name}</p>
                          <p className="text-xs text-gray-600 font-mono">ID: {patient.id}</p>
                        </div>
                        <Badge
                          style={{
                            backgroundColor: URGENCY_COLORS[patient.urgencyLevel],
                            color: "white",
                          }}
                        >
                          {URGENCY_LABELS[patient.urgencyLevel]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum paciente na fila</p>
              )}
            </CardContent>
          </Card>

          {/* Attending Patients */}
          <Card className="border-2 border-blue-300 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="text-lg">Em Atendimento</CardTitle>
              <CardDescription className="font-mono text-xs">
                {attending.length} pacientes sendo atendidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attending.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {attending.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedPatientId === patient.id
                          ? "bg-blue-100 border-blue-400"
                          : "border-blue-200 hover:bg-blue-50"
                      }`}
                      style={{
                        borderLeftColor: URGENCY_COLORS[patient.urgencyLevel],
                        borderLeftWidth: "4px",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{patient.name}</p>
                          <p className="text-xs text-gray-600 font-mono">ID: {patient.id}</p>
                        </div>
                        <Badge
                          style={{
                            backgroundColor: URGENCY_COLORS[patient.urgencyLevel],
                            color: "white",
                          }}
                        >
                          {URGENCY_LABELS[patient.urgencyLevel]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum paciente em atendimento</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent History */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Histórico Recente de Atendimentos</CardTitle>
            <CardDescription className="font-mono text-xs">
              Últimos 50 atendimentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-gray-300">
                    <tr>
                      <th className="text-left font-bold py-2 px-2">ID</th>
                      <th className="text-left font-bold py-2 px-2">Urgência</th>
                      <th className="text-left font-bold py-2 px-2">Espera (min)</th>
                      <th className="text-left font-bold py-2 px-2">Atendimento (min)</th>
                      <th className="text-left font-bold py-2 px-2">Desfecho</th>
                      <th className="text-left font-bold py-2 px-2">Médico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {history.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="py-2 px-2 font-mono text-xs">#{record.patientId}</td>
                        <td className="py-2 px-2">
                          <Badge
                            style={{
                              backgroundColor: URGENCY_COLORS[record.urgencyLevelAtCheckIn],
                              color: "white",
                            }}
                          >
                            {URGENCY_LABELS[record.urgencyLevelAtCheckIn]}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 font-mono">{record.waitingTimeMinutes || "-"}</td>
                        <td className="py-2 px-2 font-mono">{record.attendanceTimeMinutes || "-"}</td>
                        <td className="py-2 px-2">{record.outcome}</td>
                        <td className="py-2 px-2 text-xs">{record.attendingDoctor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhum histórico disponível</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
