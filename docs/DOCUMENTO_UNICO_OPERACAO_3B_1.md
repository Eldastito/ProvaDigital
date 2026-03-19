# Documento Único de Operação (DUO): Fase 3B.1

**Status:** APROVADO PARA EXECUÇÃO CONTROLADA  
**Escopo:** Municipal (ORG) - Alvorada, Viamão, Gravataí  
**Modo:** Somente Leitura (Analytics e Metadata)

---

## 🛡️ Camada 1: Resumo Executivo (Governança)

### Objetivo Estratégico
Realizar a expansão horizontal do Authority Pilot para 3 novos municípios, validando a escalabilidade do motor Core Governance sem comprometer o isolamento de dados ou a performance do sistema legado.

### Fonte da Verdade (Baseline)
1. **Rollback Multi-Org**: Validado com sucesso (Sessão 6).
2. **Métrica Mestre**: **p95 End-to-End** (Referência POA: 0.865ms / Canoas: 2.037ms).
3. **Restrições de Escopo**: Vedada qualquer escrita ou acesso a dados pedagógicos sensíveis. Vedada a escala Estadual/Global nesta fase.

### Regras de Ouro
- **Aprovação Sequencial**: Alvorada → Viamão → Gravataí.
- **Kill Switch**: O piloto pode ser desativado instantaneamente via Feature Flag em caso de anomalia.
- **Stop-the-line**: Qualquer desvio de isolamento ou tentativa de escrita interrompe a fase.

---

## ⚙️ Camada 2: Guia Técnico Operacional (Execução)

### 1. Preparação e Baseline
Antes de iniciar, garantir que o motor está operando na **GLOBAL v4 Remediada**.
```bash
# Teste de Sanidade Inicial (Rollback Check)
npx tsx scripts/testGovernance_Session6_Rollback.ts
```

### 2. Fluxo de Ativação Sequencial

#### Etapa A: Alvorada (Primeira Escala)
- **Ação:** Habilitar `authority_pilot_analytics_readonly` para o contexto de Alvorada.
- **Checkpoint:**
  - Observar 30 min de tráfego.
  - Validar p95 E2E < 5.0ms.
  - Provar isolamento contra POA e Canoas.

#### Etapa B: Viamão (Segunda Escala)
- **Condição:** Checkpoint Alvorada aprovado com registro formal.
- **Ação:** Habilitar para o contexto de Viamão.

#### Etapa C: Gravataí (Terceira Escala)
- **Condição:** Checkpoint Viamão aprovado com registro formal.
- **Ação:** Habilitar para o contexto de Gravataí.

### 3. Matriz de Stop-the-line
| Gatilho | Ação Imediata | Requisito de Retorno |
| :--- | :--- | :--- |
| **Tentativa de Escrita** | Kill Switch OFF | Auditoria de Logs + Correção do Core |
| **Falha de Isolamento** | Kill Switch OFF | Novo Relatório de Gate Re-aprovado |
| **p95 entre 5ms e 10ms** | Alerta / Investigação | Ajuste de Cache / Otimização de Busca |
| **p95 >= 10ms (Sustentado)**| Stop-the-line | Bloqueio da Ativação até Correção |
| **Alteração de Contexto/Flag**| Reverter Configuração | Revisão de Governança + Novo Checkpoint |
| **Divergência Documental**| Travar Fase | Saneamento e Alinhamento de Dados |

---
**Auditoria:** Governança Core - Registro Operacional Fase 3B.1 - 18/03/2026
