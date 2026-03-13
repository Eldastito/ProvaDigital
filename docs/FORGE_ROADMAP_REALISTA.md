# Roadmap Realista: FORGE Smart School

Este documento descreve a transição da plataforma ExamePad para o modelo FORGE em três ondas estratégicas, priorizando o que já possui fundação técnica sólida.

---

## Onda 1: Consolidação Smart Ops (Curto Prazo - 0 a 3 meses)
**Objetivo:** Transformar a operação logística em um sistema de gestão escolar completo.

- [ ] **Módulo de Espaços:** Implementar a entidade `Room` no banco de dados e vincular ao `SchedulingService`.
- [ ] **Calendário Institucional:** Interface unificada que consolida eventos acadêmicos, reservas de tablet e ocupação de salas.
- [ ] **Painéis de Eficiência:** Dashboards para Secretarias de Educação visualizarem o ROI de ativos (uso de tablets vs. performance).
- [ ] **Mensageria Contextual:** Integrar o Chat atual com gatilhos operacionais (ex: "Sua sala está pronta", "Tablet X precisa de carga").

---

## Onda 2: Evolução Smart Learning (Médio Prazo - 3 a 6 meses)
**Objetivo:** Aprofundar a inteligência pedagógica e conformidade com a BNCC.

- [ ] **BNCC Engine:** Mapear o banco de itens para as competências e habilidades da BNCC de forma nativa.
- [ ] **Lesson Plan 2.0:** Criador de planos de aula que sugere automaticamente questões do banco e vídeos de apoio baseados no tema.
- [ ] **Dossiê de Evidências:** Interface para pais e coordenadores que agrega: notas + observações qualitativas do diário + insights de IA.
- [ ] **NeuroScreening Proativo:** Alertas automáticos para coordenação quando padrões cognitivos indicarem fadiga ou desengajamento.

---

## Onda 3: Smart Environment (Longo Prazo - 6 a 12 meses)
**Objetivo:** Automação e inteligência do espaço físico.

- [ ] **Hardware Abstraction Layer (HAL):** Criar os serviços de escuta para sensores IoT via protocolo Mesh.
- [ ] **Digital Twin de Ambiente:** Visualização 2D/3D das salas com status em tempo real (Ocupada, Temperatura, CO2).
- [ ] **Cenários Automatizados:** Configuração de "Modos" (Ex: Modo Prova - diminui brilho de luzes periféricas, bloqueia internet externa, ativa log de presença via Bluetooth).
- [ ] **Zeladoria Preditiva:** Alerta de manutenção de AC ou troca de lâmpadas baseado em horas de uso detectadas.

---

## Estratégia de Deploy
1. **Fase Piloto:** 2 escolas utilizando Wave 1 + NeuroScreening.
2. **Escalonamento:** Expansão para rede municipal focando em Wave 1 e 2.
3. **Inovação:** Implementação de Wave 3 em Centros de Excelência.
