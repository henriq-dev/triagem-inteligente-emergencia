import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function CheckIn() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    cpf: "",
    symptoms: "",
    medicalHistory: "",
    // Sensor data
    heartRate: "72",
    systolicBP: "120",
    diastolicBP: "80",
    temperature: "37",
    oxygenSaturation: "98",
    painLevel: "0",
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const checkInMutation = trpc.triagem.checkIn.useMutation({
    onSuccess: (data) => {
      setSuccessData(data);
      setShowSuccess(true);
      toast.success("Check-in realizado com sucesso!");
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          name: "",
          age: "",
          gender: "",
          cpf: "",
          symptoms: "",
          medicalHistory: "",
          heartRate: "72",
          systolicBP: "120",
          diastolicBP: "80",
          temperature: "37",
          oxygenSaturation: "98",
          painLevel: "0",
        });
        setShowSuccess(false);
      }, 3000);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.age || !formData.gender) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    checkInMutation.mutate({
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender as "M" | "F" | "O",
      cpf: formData.cpf || undefined,
      symptoms: formData.symptoms || undefined,
      medicalHistory: formData.medicalHistory || undefined,
      sensorData: {
        heartRate: parseInt(formData.heartRate),
        systolicBP: parseInt(formData.systolicBP),
        diastolicBP: parseInt(formData.diastolicBP),
        temperature: parseFloat(formData.temperature),
        oxygenSaturation: parseInt(formData.oxygenSaturation),
        painLevel: parseInt(formData.painLevel),
      },
    });
  };

  if (showSuccess && successData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-green-500">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <CardTitle className="text-2xl">Check-in Realizado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm font-mono text-gray-700">
                <strong>Paciente:</strong> {successData.patient.name}
              </p>
              <p className="text-sm font-mono text-gray-700 mt-2">
                <strong>ID:</strong> #{successData.patient.id}
              </p>
              <p className="text-sm font-mono text-gray-700 mt-2">
                <strong>Urgência:</strong> {successData.patient.urgencyLevel}
              </p>
              <p className="text-xs text-gray-600 mt-3 italic">
                {successData.urgencyReasoning}
              </p>
            </div>
            <p className="text-center text-sm text-gray-600">
              Você será redirecionado em breve...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Check-in IoT</h1>
          <p className="text-gray-600 font-mono text-sm">
            Sistema de Triagem Inteligente de Emergência
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Informações Pessoais</CardTitle>
              <CardDescription className="font-mono text-xs">
                Dados básicos do paciente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="font-mono text-xs font-bold">
                    Nome *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nome completo"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="age" className="font-mono text-xs font-bold">
                    Idade *
                  </Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender" className="font-mono text-xs font-bold">
                    Gênero *
                  </Label>
                  <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="O">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cpf" className="font-mono text-xs font-bold">
                    CPF (opcional)
                  </Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    placeholder="000.000.000-00"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sensor Data */}
          <Card className="border-2 border-cyan-300 bg-cyan-50/30">
            <CardHeader>
              <CardTitle className="text-lg">Leitura de Sensores IoT</CardTitle>
              <CardDescription className="font-mono text-xs">
                Dados capturados pelos dispositivos médicos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="heartRate" className="font-mono text-xs font-bold">
                    Frequência Cardíaca (bpm)
                  </Label>
                  <Input
                    id="heartRate"
                    name="heartRate"
                    type="number"
                    value={formData.heartRate}
                    onChange={handleInputChange}
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="temperature" className="font-mono text-xs font-bold">
                    Temperatura (°C)
                  </Label>
                  <Input
                    id="temperature"
                    name="temperature"
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    className="mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="systolicBP" className="font-mono text-xs font-bold">
                    PA Sistólica (mmHg)
                  </Label>
                  <Input
                    id="systolicBP"
                    name="systolicBP"
                    type="number"
                    value={formData.systolicBP}
                    onChange={handleInputChange}
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="diastolicBP" className="font-mono text-xs font-bold">
                    PA Diastólica (mmHg)
                  </Label>
                  <Input
                    id="diastolicBP"
                    name="diastolicBP"
                    type="number"
                    value={formData.diastolicBP}
                    onChange={handleInputChange}
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="oxygenSaturation" className="font-mono text-xs font-bold">
                    Saturação O₂ (%)
                  </Label>
                  <Input
                    id="oxygenSaturation"
                    name="oxygenSaturation"
                    type="number"
                    value={formData.oxygenSaturation}
                    onChange={handleInputChange}
                    className="mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="painLevel" className="font-mono text-xs font-bold">
                  Nível de Dor (0-10)
                </Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    id="painLevel"
                    name="painLevel"
                    type="range"
                    min="0"
                    max="10"
                    value={formData.painLevel}
                    onChange={handleInputChange}
                    className="flex-1"
                  />
                  <span className="font-mono font-bold text-lg w-12 text-center">
                    {formData.painLevel}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Information */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Informações Clínicas</CardTitle>
              <CardDescription className="font-mono text-xs">
                Sintomas e histórico médico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="symptoms" className="font-mono text-xs font-bold">
                  Sintomas Principais
                </Label>
                <Textarea
                  id="symptoms"
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  placeholder="Descreva os sintomas apresentados..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="medicalHistory" className="font-mono text-xs font-bold">
                  Histórico Médico Relevante
                </Label>
                <Textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleInputChange}
                  placeholder="Alergias, medicamentos, condições pré-existentes..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={checkInMutation.isPending}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3"
            >
              {checkInMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Realizar Check-in"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
