# Registro Formal de Limitações e Riscos: Ciclo de Redundância Operacional (E1+E2+E3)

Este documento registra as "verdades incômodas" e as dívidas técnicas identificadas durante a auditoria de encerramento das fases de redundância.

---

## 🏗️ Ressalva 1: Dívida Técnica de Schema (Fase 2)

> [!WARNING]
> **COMPATIBILIDADE VS. UNICIDADE CONTEXTUAL**: 
> - A unicidade real do banco de dados SQLite (V2) permanece ancorada no campo `question_id` como **Primary Key** dominante. 
> - **Risco**: Se este dispositivo for reutilizado para carregar múltiplos contextos concorrentes (diferentes exames ou diferentes alunos no mesmo dispositivo ao mesmo tempo) onde o mesmo `question_id` possa reaparecer, o sistema poderá sofrer colisão ou sobreposição de dados.
> - **Decisão Consciente**: Optou-se por compatibilidade total com o legado V1 em detrimento de uma reconstrução de schema para esta etapa.

---

## 🛡️ Ressalva 2: Segurança do Segredo de Rede (Fase 3)

> [!CAUTION]
> **LIMITAÇÃO DO BINÁRIO CLIENTE**: 
> - O uso de `BuildConfig` para injeção da chave `MESH_SECRET_KEY` (AES-GCM) é uma melhoria significativa de governança, mas **não torna a chave inviolável**.
> - **Verdade Técnica**: Qualquer chave simétrica embarcada no aplicativo Android pode ser extraída por engenharia reversa sofisticada ou binária estática.
> - **Garantia Real**: O protocolo protege contra interceptação casual na rede local e observação trivial, mas não provê segurança absoluta contra um adversário com controle total do binário e ferramentas de análise forense.

---

## 📈 Próximos Passos Recomendados
- Evolução do schema SQLite para PK Composta (`exam_id`, `student_id`, `question_id`) após validação em campo do modelo atual.
- Implementação de um protocolo de negociação de chaves efêmeras ou injeção dinâmica de segredos no início da sessão.
