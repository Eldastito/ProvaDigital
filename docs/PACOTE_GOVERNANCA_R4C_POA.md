# Pacote de Governança Operacional: Rerun R4C POA (FORGE)

Este documento consolida a governança, processos e critérios de decisão para o Rerun R4C na E.E. Inácio Montanha, utilizando a baseline `bb64cd4` (Fase 2) como núcleo de resiliência.

---

## 1. Fluxo de Documentação (Ordem de Uso)

A equipe deve seguir rigorosamente a sequência de artefatos para garantir a auditabilidade do ciclo:

1.  **Pré-Operação**: [PLANO_MONITORAMENTO_CONTROLADO_F2_R4C_POA.md](docs/PLANO_MONITORAMENTO_CONTROLADO_F2_R4C_POA.md)
2.  **Durante a Operação (Por Sala)**: [TEMPLATE_RELATORIO_POR_SALA_RESILIENCIA_R4C_POA.md](docs/TEMPLATE_RELATORIO_POR_SALA_RESILIENCIA_R4C_POA.md)
3.  **Evento Crítico (Individual)**: [TEMPLATE_OCORRENCIA_LOG_CB_PTR_ERR_001.md](docs/TEMPLATE_OCORRENCIA_LOG_CB_PTR_ERR_001.md)
4.  **Pós-Operação (24h)**: [DEBRIEF_24H_RESILIENCIA_F2_R4C_POA.md](docs/DEBRIEF_24H_RESILIENCIA_F2_R4C_POA.md)
5.  **Encerramento de Ciclo**: [VEREDITO_CAMPO_F2_R4C_POA.md](docs/VEREDITO_CAMPO_F2_R4C_POA.md)

---

## 2. Papéis e Responsabilidades

| Papel | Responsabilidade Principal |
| :--- | :--- |
| **Engenharia de Resiliência** | Monitoramento de telemetria em tempo real e validação de reconstrução silenciosa. |
| **Operação POA** | Execução de campo, coleta de dados por sala e registro de incidentes físicos. |
| **Responsável por Sala** | Geração do Relatório por Sala e abertura de Templates de Ocorrência individuais. |
| **Liderança Técnica (Antigravity)** | Emissão do Veredito Final baseada na evidência nominal. |

---

## 3. Watchlist Oficial e KPIs

### Evento Crítico: `LOG-CB-PTR-ERR-001`
Monitoramento obrigatório de toda inconsistência de ponteiro capturada pelo Shadow Mode.

| Métrica | Target (Sucesso) | Alerta (Risco) | Bloqueador (Falha) |
| :--- | :---: | :---: | :---: |
| **P95 Reconstrução** | < 200ms | > 350ms | > 500ms |
| **Máximo Absoluto** | < 400ms | > 600ms | > 1s |
| **Impacto ao Aluno** | **ZERO** | **QUALQUER** | Travamento/Perda de Sessão |
| **Matriz de Transição** | **Sem Violação** | N/A | Regressão de Status |
| **Duplicidade ativa** | **ZERO** | N/A | > 0 Casos |

---

## 4. Regras de Veredito (R4C)

### ✅ GO (Sucesso Pleno)
- P95 global < 3m15s (Handshake).
- Zero dispositivos > 3m28s por sala.
- **Zero impacto perceptível ao aluno** em correções de resiliência.
- **Zero violação da matriz de transição**.
- Auditoria de logs 100% compatível com a nominal de campo.

### ⚠️ GO CONDICIONADO (Sucesso com Alerta)
- Gate 1 e 2 aprovados.
- Ocorrência isolada de `LOG-CB-PTR-ERR-001` com recuperação silenciosa bem-sucedida.
- Exigência de RCA (Causa Raiz) formalizada antes da próxima onda.

### ❌ NO-GO (Falha Sistêmica)
- Qualquer dispositivo acima de 3m28s ou mais de 1 por sala acima de 3m25s.
- Falha na reconstrução silenciosa ou impacto visível ao aluno.
- Qualquer regressão de status `COMPLETED -> ACTIVE`.

---

## 5. Critério de Promoção de PI (Fase 2)

A baseline `bb64cd4` só será promovida de **VALIDADO EM LAB** para **OBSERVADO EM CAMPO** caso o Veredito Final do R4C POA seja **GO** sem ressalvas na camada de resiliência. Caso contrário, a Fase 2 permanece bloqueada para Hardening Corretivo.

---

## 6. Diretrizes Finais de Comando (Dia Zero)

Para garantir a integridade da baseline e a validade da prova de PI, as seguintes diretrizes de comando são **mandatórias**:

### 6.1 Autoridade de STOP/CONTINUE
- **Autoridade Técnica**: [NOME A PREENCHER]
- **Autoridade Operacional**: [NOME A PREENCHER]
- Qualquer um dos dois possui autoridade para declarar **PAUSA TÉCNICA** imediata em caso de **SEV-1**. Ninguém fora desta autoridade pode reinterpretar gates ou "empurrar" a operação.

### 6.2 Política de No-Hotfix
- Proibida qualquer alteração estrutural no núcleo `sessionIsolation` ou lógica de `coldBoot` em campo.
- Ajustes de configuração local devem seguir o rito formal de exceção e registro em ata.
- **Quebra de Baseline = Anulação da Prova de PI**.

### 6.3 Reconciliação Nominal Obrigatória
- O Debrief 24h só será aberto após a conta fechar entre: Tablets Nominais = Sessões Iniciadas = Encerramentos (`COMPLETED`) + Exceções Formais.
- Divergência não explicada = **Evidência Incompleta**.

### 6.4 Protocolo de Severidade
- **SEV-1 (Bloqueador)**: Regressão de status, duplicidade ativa, impacto ao aluno ou violação de matriz. Ação: **PARAR**.
- **SEV-2 (Alerta)**: Desvio com recuperação silenciosa bem-sucedida. Ação: **REGISTRAR ARTEFATO INDIVIDUAL**.
- **SEV-3 (Observação)**: Anomalia de telemetria sem risco. Ação: **ANOTAR EM RELATÓRIO DE SALA**.

### 6.5 Sincronização e Trilha
- Todos os dispositivos e operadores devem sincronizar relógios e timezone antes do T0.
- Toda ocorrência **DEVE** carregar: Timestamp, Sala, Tablet, Contexto/Aluno e `attemptId`.

### 6.6 Regra de Promoção Inegociável
- Promoção para **OBSERVADO EM CAMPO** exige **GO Limpo** (Zero SEV-1 e Zero impacto ao aluno).
- **GO CONDICIONADO** mantém a baseline como **VALIDADO EM LAB**.

---

## 7. Matriz de Responsabilidade Nominal (Inácio Montanha)

| Sala | Responsável Titular | Substituto | Contato (Rádio/Tel) |
| :--- | :--- | :--- | :--- |
| **Sala 01** | [Nome] | [Nome] | [Canal/Número] |
| **Sala 02** | [Nome] | [Nome] | [Canal/Número] |
| **Sala 03** | [Nome] | [Nome] | [Canal/Número] |
| **Sala 04** | [Nome] | [Nome] | [Canal/Número] |
| **Sala 05** | [Nome] | [Nome] | [Canal/Número] |

---

## 8. Veredito de Preparação Técnica

**Status**: [ENCERRADO]
**Baseline**: `bb64cd4` (Fase 2)

O ciclo de preparação técnica está formalmente encerrado. A baseline encontra-se congelada e os artefatos de governança estão implantados. O **GO OFICIAL** para o Dia Zero fica condicionado apenas ao preenchimento nominal das autoridades de STOP (Seção 6.1) e da Matriz de Responsabilidade por Sala (Seção 7).

---
**Aprovação Final para Dia Zero**: [NOME DO RESPONSÁVEL]  
**Função**: Liderança Técnica / Engenharia de Resiliência  
**Data**: 30/03/2026
