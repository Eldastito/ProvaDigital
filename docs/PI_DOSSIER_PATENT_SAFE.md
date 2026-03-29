# PI Dossier: FORGE (Patent-Safe)

Este documento contém o lastro técnico para fundamentar pedidos de **Patente de Invenção (PI)** da plataforma FORGE, descrevendo núcleos inventivos, mecanismos técnicos e efeitos pretendidos de forma não confidencial.

---

## 1. Núcleos Inventivos Principais

### 1.1 Execução Offline-Local Orquestrada
**Problema Técnico**: Dependência de infraestrutura central (nuvem/WAN) em aplicações de avaliação digital de larga escala em áreas geográficas remotas ou instáveis.  
**Mecanismo**: Orquestração de malha local (mesh) com nó local de orquestração operando como gateway de sala.  
**Efeito Técnico**: Resiliência operacional com redução material da dependência de conectividade externa durante a aplicação da avaliação.

### 1.2 Retomada Segura de Sessão (Cold Boot Determinístico)
**Problema Técnico**: Perda de integridade da sessão de usuário em dispositivos de borda após interrupções de hardware ou falhas no software cliente.  
**Mecanismo**: Recuperação de estado via identificador determinístico de contexto baseado nos metadados da avaliação (identidade, evento) com armazenamento persistente local do cliente.  
**Efeito Técnico**: Retomada determinística de sessão, com redução do risco de colisão lógica mesmo em cenários de múltiplos logins.

### 1.3 Isolamento Criptográfico em Envelope Híbrido
**Problema Técnico**: Exposição de dados de resposta sensíveis ao trafegar por nós intermediários em redes locais ou mesh.  
**Mecanismo**: Estruturação de envelope com separação entre metadados operacionais (header aberto) e payload de conteúdo (cifrado na origem).  
**Efeito Técnico**: Não exposição do conteúdo útil da prova do estudante ao componente de retransmissão ou armazenamento intermediário.

---

## 2. Matriz de Rastreabilidade (Invenção ↔ Código ↔ Evidência)

| Núcleo | Mecanismo | Efeito Técnico (Status) | Base de Implementação | Prova de Evidência | Classe |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mesh Offline** | Orquestração local | Operação resiliente sem WAN. **[EM VALIDAÇÃO]** | `localServerService.ts`, `meshNetworkService.ts` | Relatórios R4B/R4C, Logs de Campo | Patent-Safe |
| **Cold Boot** | Identificador canônico | Retomada determinística de sessão. **[EM VALIDAÇÃO]** | `sessionIsolationService.ts`, `useStudentSession.ts` | Benchmark de Recuperação | Patent-Safe |
| **Secured Envelope** | Payload Híbrido | Isolamento criptográfico do conteúdo útil. **[EM VALIDAÇÃO]** | `e2eEncryptionService.ts`, `StudentApp.tsx` | Teste de Cifragem E2E | Patent-Safe |
| **Mitigação Reativa** | Shadow Mode (Log) | Trilha auditável para conformidade. **[META EXP.]** | `telemetryService.ts` | Logs interno de Drift | Trade Secret |

---

## 3. Limites de Divulgação e Sigilo
Este dossiê **NÃO CONTÉM** os segredos industriais da FORGE. Os itens a seguir foram omitidos ou descritos de forma genérica para proteção operacional:
- Thresholds exatos de latência para mitigação (Segredo Industrial).
- Chaves raiz de provisionamento e algoritmos de derivação proprietários (Segredo Industrial).
- Heurísticas específicas de detecção de fraude e pesos do `proctoring` (Segredo Industrial).

---
**Baseline de Referência**: Commit `9826697` (Marco Canônico de Consolidação)  
**Data da Revisão**: 29/03/2026  
**Responsável**: Engenharia FORGE | Arquitetura de Segurança
