import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Activity, BarChart3, ClipboardList, History } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(0deg, transparent 24%, rgba(0, 255, 255, 0.05) 25%, rgba(0, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, 0.05) 75%, rgba(0, 255, 255, 0.05) 76%, transparent 77%, transparent),
                linear-gradient(90deg, transparent 24%, rgba(0, 255, 255, 0.05) 25%, rgba(0, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, 0.05) 75%, rgba(0, 255, 255, 0.05) 76%, transparent 77%, transparent)
              `,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center space-y-6">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight">
              Triagem Inteligente de Emergência
            </h1>
            <p className="text-xl text-gray-600 font-mono max-w-2xl mx-auto">
              Sistema de Check-in IoT com fila virtual inteligente para hospitais
            </p>
            <p className="text-sm text-gray-500 font-mono">
              Redução de filas através de automação e priorização por urgência
            </p>

            <div className="pt-4">
              <p className="text-sm text-green-600 font-mono font-bold mb-4">
                ✓ Acesso direto sem login - Modo Demo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Check-in Card */}
          <Card className="border-2 border-cyan-300 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-cyan-600" />
              </div>
              <CardTitle>Check-in IoT</CardTitle>
              <CardDescription className="font-mono text-xs">
                Formulário de triagem com sensores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Pacientes inserem dados de sensores simulados: frequência cardíaca, pressão arterial, temperatura, saturação de oxigênio e nível de dor.
              </p>
              <Link href="/check-in">
                <Button variant="outline" className="w-full">
                  Acessar Check-in
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Dashboard Card */}
          <Card className="border-2 border-blue-300 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Dashboard em Tempo Real</CardTitle>
              <CardDescription className="font-mono text-xs">
                Fila virtual inteligente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Visualize a fila de pacientes ordenada por urgência, tempo estimado de espera e métricas de redução de filas.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Acessar Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Panel Card */}
          <Card className="border-2 border-orange-300 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <ClipboardList className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Painel Administrativo</CardTitle>
              <CardDescription className="font-mono text-xs">
                Gerenciamento de pacientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Médicos e triadores gerenciam o status dos pacientes, atualizam informações e acompanham histórico de atendimentos.
              </p>
              <Link href="/admin">
                <Button variant="outline" className="w-full">
                  Acessar Admin
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* History Card */}
          <Card className="border-2 border-purple-300 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <History className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Histórico</CardTitle>
              <CardDescription className="font-mono text-xs">
                Registro de atendimentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Visualize o histórico completo de atendimentos com tempos de espera, urgência e desfecho de cada paciente.
              </p>
              <Link href="/history">
                <Button variant="outline" className="w-full">
                  Acessar Histórico
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Description */}
      <div className="max-w-7xl mx-auto px-4 py-16 border-t border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Funcionalidades Principais</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">✓ Algoritmo de Urgência</h3>
            <p className="text-gray-600">
              Classifica pacientes em 4 níveis: crítico, urgente, pouco urgente e não urgente, baseado em análise inteligente dos dados de sensores.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">✓ Fila Virtual Inteligente</h3>
            <p className="text-gray-600">
              Ordenação dinâmica por prioridade de urgência, atualizada em tempo real conforme novos pacientes entram ou têm seu status alterado.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">✓ Métricas de Redução</h3>
            <p className="text-gray-600">
              Gráficos comparativos demonstram a redução de tempo de espera com triagem automatizada versus sem triagem.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">✓ Histórico de Atendimentos</h3>
            <p className="text-gray-600">
              Registro completo de cada atendimento com tempo de espera, nível de urgência atribuído e desfecho do paciente.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 py-8 text-center text-gray-600 font-mono text-sm">
        <p>Sistema de Triagem Inteligente de Emergência © 2026</p>
        <p className="text-xs mt-2">Estética técnica inspirada em blueprints matemáticos</p>
      </div>
    </div>
  );
}
