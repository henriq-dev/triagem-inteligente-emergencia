import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Users, TrendingDown } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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

export default function Dashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Queries
  const queueQuery = trpc.triagem.getQueue.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const attendingQuery = trpc.triagem.getAttending.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const metricsQuery = trpc.triagem.getMetrics.useQuery(undefined, {
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const historyQuery = trpc.triagem.getHistory.useQuery({ limit: 20 });

  const queue = queueQuery.data || [];
  const attending = attendingQuery.data || [];
  const metrics = metricsQuery.data;
  const history = historyQuery.data || [];

  // Prepare data for charts
  const urgencyChartData = metrics
    ? [
        { name: "Crítico", value: metrics.urgencyCounts.crítico, fill: URGENCY_COLORS.crítico },
        { name: "Urgente", value: metrics.urgencyCounts.urgente, fill: URGENCY_COLORS.urgente },
        { name: "Pouco Urgente", value: metrics.urgencyCounts["pouco urgente"], fill: URGENCY_COLORS["pouco urgente"] },
        { name: "Não Urgente", value: metrics.urgencyCounts["não urgente"], fill: URGENCY_COLORS["não urgente"] },
      ]
    : [];

  const comparisonData = metrics
    ? [
        {
          name: "Tempo de Espera",
          "Com Triagem": metrics.actualWaitTimeWithTriage,
          "Sem Triagem": metrics.estimatedWaitTimeWithoutTriage,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard em Tempo Real</h1>
            <p className="text-gray-600 font-mono text-sm">
              Fila Virtual Inteligente - Sistema de Triagem Hospitalar
            </p>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg font-mono text-sm font-bold transition-colors ${
              autoRefresh
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            }`}
          >
            {autoRefresh ? "🔄 Auto-atualizar" : "⏸ Pausado"}
          </button>
        </div>

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-600">Pacientes na Fila</p>
                    <p className="text-3xl font-bold text-blue-600">{metrics.totalInQueue}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-cyan-200 bg-cyan-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-600">Em Atendimento</p>
                    <p className="text-3xl font-bold text-cyan-600">{metrics.totalAttending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-cyan-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 bg-orange-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-600">Tempo Médio de Espera</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {metrics.averageWaitingTimeMinutes.toFixed(1)}
                      <span className="text-lg">min</span>
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-600">Redução de Espera</p>
                    <p className="text-3xl font-bold text-green-600">
                      {(
                        ((metrics.estimatedWaitTimeWithoutTriage - metrics.actualWaitTimeWithTriage) /
                          metrics.estimatedWaitTimeWithoutTriage) *
                        100
                      ).toFixed(0)}
                      %
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Urgency Distribution */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Urgência</CardTitle>
              <CardDescription className="font-mono text-xs">
                Pacientes aguardando por nível de urgência
              </CardDescription>
            </CardHeader>
            <CardContent>
              {urgencyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={urgencyChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {urgencyChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wait Time Comparison */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Comparação de Tempo de Espera</CardTitle>
              <CardDescription className="font-mono text-xs">
                Com vs Sem Triagem Automatizada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {comparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: "Minutos", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Sem Triagem" fill="#ef4444" />
                    <Bar dataKey="Com Triagem" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Queue List */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Fila de Espera</CardTitle>
            <CardDescription className="font-mono text-xs">
              Pacientes aguardando atendimento ordenados por urgência
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queue.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {queue.map((patient, index) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                    style={{ borderLeftColor: URGENCY_COLORS[patient.urgencyLevel], borderLeftWidth: "4px" }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-gray-700 w-8">#{patient.queuePosition}</span>
                        <div>
                          <p className="font-bold text-gray-900">{patient.name}</p>
                          <p className="text-xs text-gray-600 font-mono">
                            {patient.age} anos • ID: {patient.id}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        style={{
                          backgroundColor: URGENCY_COLORS[patient.urgencyLevel],
                          color: "white",
                        }}
                      >
                        {URGENCY_LABELS[patient.urgencyLevel]}
                      </Badge>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 font-mono">Espera estimada</p>
                        <p className="font-bold text-gray-900">{patient.estimatedWaitMinutes} min</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum paciente na fila</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attending Patients */}
        {attending.length > 0 && (
          <Card className="border-2 border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="text-lg">Em Atendimento</CardTitle>
              <CardDescription className="font-mono text-xs">
                Pacientes sendo atendidos no momento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attending.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-blue-200">
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
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
