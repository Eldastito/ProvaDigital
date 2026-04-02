# PI Dossier: FORGE (Patent-Safe)

Este documento contém o lastro técnico para fundamentar pedidos de **Patente de Invenção (PI)** da plataforma FORGE, descrevendo núcleos inventivos, mecanismos técnicos e efeitos pretendidos de forma não confidencial.

- **Estado**: Fase 2 (Encerramento Técnico / Prova de Cold Boot)
- **Baseline de Referência**: Commit `bb64cd4`
- **Titularidade jurídica**: em consolidação formal, fora do escopo do presente fechamento técnico.

---

## 1. Núcleos Inventivos Principais

### 1.1 Execução Offline-Local Orquestrada
**Problema Técnico**: Dependência de infraestrutura central (nuvem/WAN) em aplicações de avaliação digital de larga escala em áreas geográficas remotas ou instáveis.  
**Mecanismo**: Orquestração de malha local (mesh) com nó local de orquestração operando como gateway de sala.  
**Efeito Técnico**: Resiliência operacional com redução material da dependência de conectividade externa durante a aplicação da avaliação.

### 1.2 Retomada Segura de Sessão (Cold Boot Determinístico)
**Problema Técnico**: Perda de integridade da sessão de usuário em dispositivos de borda após interrupções de hardware ou falhas no software cliente.  
**Mecanismo**: Recuperação de estado via identificador determinístico de contexto baseado nos metadados da avaliação (identidade, evento) com armazenamento persistente local do cliente e ponteiro de contexto atômico.  
**Efeito Técnico**: Retomada determinística de sessão por meio de lookup direto por ponteiro canônico de contexto.

### 1.3 Isolamento Criptográfico em Envelope Híbrido
**Problema Técnico**: Exposição de dados de resposta sensíveis ao trafegar por nós intermediários em redes locais ou mesh.  
**Mecanismo**: Estruturação de envelope com separação entre metadados operacionais (header aberto) e payload de conteúdo (cifrado na origem).  
**Efeito Técnico**: Não exposição do conteúdo útil da prova do estudante ao componente de retransmissão ou armazenamento intermediário.

---

## 2. Matriz de Rastreabilidade (Invenção ↔ Código ↔ Evidência)

| Núcleo | Mecanismo | Efeito Técnico (Status) | Base de Implementação | Prova de Evidência | Classe |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mesh Offline** | Orquestração local | Operação resiliente sem WAN. **[VALIDADO EM LAB]** | `localServerService.ts`, `meshNetworkService.ts` | `EV-MESH-LOCAL-001` | Patent-Safe |
| **Cold Boot** | Identificador canônico | Lookup direto por ponteiro canônico. **[VALIDADO EM LAB]** | `sessionIsolationService.ts`, `useStudentSession.ts` | `EV-DET-CB-001` | Patent-Safe |
| **Secured Envelope** | Payload Híbrido | Isolamento criptográfico. **[VALIDADO EM LAB]** | `e2eEncryptionService.ts`, `StudentApp.tsx` | `EV-SEC-ENV-001` | Patent-Safe |
| **Mitigação Reativa** | Shadow Mode (Log) | Trilha auditável/conformidade. **[VALIDADO EM LAB]** | `telemetryService.ts` | `LOG-CB-PTR-ERR-001` | Trade Secret |

---

## 3. Limites de Divulgação e Sigilo
Este dossiê **NÃO CONTÉM** os segredos industriais da FORGE. Os itens a seguir foram omitidos ou descritos de forma genérica para proteção operacional:
- Thresholds exatos de latência para mitigação (Segredo Industrial).
- Chaves raiz de provisionamento e algoritmos de derivação proprietários (Segredo Industrial).
- Heurísticas específicas de detecção de fraude e pesos do `proctoring` (Segredo Industrial).

---
**Baseline Técnica**: Commit `bb64cd4` (Pós-Fase 2 / Context Pointer e Cold Boot Canônico)  
**Data da Revisão**: 29/03/2026  
**Responsável**: Engenharia FORGE | Arquitetura de Segurança
