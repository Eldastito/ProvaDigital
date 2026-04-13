# Dossiê Estratégico: Proteção Intelectual FORGE

Este documento serve como guia para a preparação da plataforma FORGE para proteção intelectual (PI), registro de software e segredo industrial.

## 1. Núcleos de Patente de Invenção (PI)

| Núcleo Inventivo | Base no Codebase | Status Atual |
| :--- | :--- | :--- |
| **Execução Offline-Local com Malha** | `MeshNetworkService`, `LocalServerService` | ✅ Estável, multi-transporte (WebRTC/BLE/WiFi). |
| **Retomada Segura (Cold Boot)** | `sessionIsolationService`, `useStudentSession` | ✅ Funcional, Context Pointer canônico O(1). |
| **Envelope Híbrido Criptográfico** | `e2eEncryptionService`, `StudentApp` | ✅ Implementado, narrativa sanada. |
| **Autenticação Contextual (F3A)** | `LocalServerService` (RBAC + JTI) | ✅ Implementado, segredo protegido. |
| **Authority Pilot (Kill Switch)** | `governanceService` | ✅ Mitigação ativa com kill switch automático. |
| **Transporte Óptico QR** | `qrCodecService`, `OfflineSubmissionFlow` | ✅ Implementado, HMAC assinado. |
| **CAT Offline (TRI 3PL)** | `offlineAdaptiveEngine`, `catEngine` | ✅ Motor funcional com serialização. |

---

## 2. Inventário para Registro de Software (Software Registry)

Módulos prioritários para registro de autoria e código-fonte no INPI:

1.  **Núcleo de Sessão**: `sessionIsolationService.ts`, `persistenceGateway.ts`
2.  **Motor de Segurança**: `e2eEncryptionService.ts`
3.  **Comunicação em Malha**: `meshNetworkService.ts`, `localServerService.ts`
4.  **Interface do Aluno**: `StudentApp.tsx`, `useStudentSession.ts`
5.  **Módulos de Auditoria**: `proctoring`, `telemetry`, `alerting`

---

## 3. Matriz de Segredo Industrial (NÃO DIVULGAR)

Itens que devem ser excluídos de qualquer depósito de patente e protegidos via contrato de confidencialidade:

- **Segredos de Provisionamento**: `rootProvisioningSecret`, chaves HMAC derivadas.
- **Limiares de Alerta**: Thresholds de latência, bateria e fraude.
- **Inteligência de Rede**: Topologias específicas de roteamento em malha e heurísticas de transição.
- **Runbooks Operacionais**: Procedimentos de recuperação de falhas críticas.
- **Heurísticas de Fraude**: Parâmetros internos do `CATEngine` e Proctoring.

---

## 4. Plano de Ação (Próximos Passos)

1.  **Fortalecimento de PI**: Unificar narrativa criptográfica e formalizar o handshake "forte".
2.  **Saneamento de Software**: Reduzir `any` e normalizar tipagens de metadados.
3.  **Segregação de Segredo**: Marcar e proteger constantes de configuração sensíveis.

---
**Parecer**: A FORGE possui massa crítica técnica para PI, mas requer o endurecimento dos fluxos de recuperação e autenticação para um depósito seguro.
