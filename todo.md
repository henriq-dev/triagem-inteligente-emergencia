# Triagem Inteligente de Emergência - TODO

## Fase 1: Estrutura Base e Banco de Dados
- [x] Criar schema de pacientes com dados de sensores
- [x] Criar tabela de histórico de atendimentos
- [x] Criar tabela de métricas de fila (para gráficos comparativos)
- [x] Gerar e aplicar migrations do Drizzle

## Fase 2: Backend - APIs e Algoritmo
- [x] Implementar algoritmo de cálculo de nível de urgência
- [x] Criar API de check-in de pacientes
- [x] Criar API de fila virtual inteligente (ordenação dinâmica)
- [x] Criar API de atualização de status de pacientes
- [x] Criar API de métricas de tempo de espera
- [x] Criar API de histórico de atendimentos
- [x] Escrever testes unitários para algoritmo de urgência (19 testes passando)

## Fase 3: Frontend - Páginas e Componentes
- [x] Criar página de formulário de check-in IoT
- [x] Criar página de dashboard em tempo real (fila de pacientes)
- [x] Criar painel administrativo para médicos/triadores
- [x] Criar página de histórico de atendimentos (integrado no admin)
- [x] Implementar autenticação e controle de acesso por role
- [x] Criar componente ProtectedRoute para proteger rotas

## Fase 4: Design Técnico - Blueprint Aesthetic
- [x] Implementar grid fino no background
- [x] Adicionar estilos blueprint com ciano pastel e rosa suave
- [x] Configurar tipografia: títulos bold sans-serif preta, labels monoespaçadas
- [x] Implementar cores ciano pastel e rosa suave para wireframes
- [x] Criar componentes estilo wireframe para elementos secundários

## Fase 5: Gráficos e Análise
- [x] Implementar gráfico comparativo de tempo de espera (com vs sem triagem)
- [x] Integrar biblioteca de gráficos (Recharts)
- [x] Criar indicadores visuais de redução de filas
- [x] Implementar dashboard de métricas gerais

## Fase 6: Remover Autenticação Obrigatória
- [x] Remover proteção de rotas (ProtectedRoute)
- [x] Criar modo demo com usuário padrão
- [x] Permitir acesso direto a todas as funcionalidades
- [x] Manter histórico de sessão durante uso

## Fase 7: Testes e Entrega
- [x] Escrever testes de backend para APIs (11 testes passando)
- [x] Escrever testes do algoritmo de urgência (19 testes passando)
- [x] Testar fluxo completo de check-in até atendimento
- [x] Testar atualização em tempo real da fila
- [x] Testar painel administrativo
- [x] Otimizar performance
- [x] Criar checkpoint final
- [x] Entregar sistema ao usuário

## Notas
- Classificações de urgência: crítico, urgente, pouco urgente, não urgente
- Dados de sensores simulados: frequência cardíaca, pressão arterial, temperatura, saturação de oxigênio, nível de dor
- Estética: blueprints matemáticos, grid fino, fundo branco, diagramas geométricos
