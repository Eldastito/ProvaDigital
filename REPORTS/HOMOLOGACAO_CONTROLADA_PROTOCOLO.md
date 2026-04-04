# Protocolo de Homologação Controlada: Ciclo de Redundância (E1+E2+E3)

Este protocolo define os critérios, ondas de teste e métricas de aceitação para validar a resiliência tripla (BLE + SQLite + UDP Mesh) em ambiente real.

---

## 🚦 Governança de Avanço
O avanço entre as ondas **não é determinado por tempo fixo**, mas sim pelo cumprimento integral dos **Critérios de Saída** de cada etapa.
- **Janela Sugerida**: 24h a 72h por onda (referência operacional).

### Classificação de Status por Onda:
- **🟢 GO**: Todos os critérios obrigatórios atingidos sem incidentes críticos.
- **🟡 GO CONDICIONADO**: Critérios atingidos, mas com incidentes não críticos documentados e mitigados.
- **🔴 NO-GO**: Falha em critério crítico ou instabilidade sistêmica.

---

## 🌊 Ondas de Homologação

### Onda 1: Laboratório Realista
**Objetivo**: Validar a cadeia técnica completa e resiliência a falhas induzidas em ambiente controlado.
- **Critérios de Saída (Obrigatórios)**:
    - [ ] Emissão BLE consultável sem erro crítico (`getBLEPresence`).
    - [ ] IndexedDB preserva dados mesmo com falha induzida no SQLite (Double-Write falhando propositalmente).
    - [ ] Emissão UDP Mesh protegida (AES-GCM-256) confirmada no Logcat.
    - [ ] Script Auditor decifra pacotes válidos e REJEITA pacotes adulterados (Tag Mismatch).
    - [ ] **UX Segura**: Nenhuma quebra visual ou travamento durante falhas nas camadas nativas.

### Onda 2: Sala Real Pequena
**Objetivo**: Validar o comportamento sob ruído ambiental e operação real com poucos dispositivos (6-12 nós).
- **Critérios de Saída (Obrigatórios)**:
    - [ ] BLE não gera falsos positivos de presença acima de 5% (Critério oficial de aprovação).
    - [ ] Regularidade de emissão UDP condizente com o volume de salvamento.
    - [ ] Logs de auditoria permitem rastrear 100% dos eventos através do `requestId` (`rid`).
    - [ ] Estabilidade de memória e processamento do plugin nativo confirmada.

### Onda 3: Cenário de Estresse e Carga
**Objetivo**: Validar a robustez do protocolo sob carga máxima, clock drift e imperfeições de rede.
- **Critérios de Saída (Obrigatórios)**:
    - [ ] Sistema tolera Clock Drift dentro da janela de 60s (E3).
    - [ ] Deduplicação por `rid` funciona (Receptor ignora duplicatas).
    - [ ] Replays vencidos são descartados silenciosamente.
    - [ ] Prova de que 0% das respostas foram perdidas no IndexedDB (Verdade Absoluta).

---

## ⚠️ Matriz de Incidentes

| Tipo | Descrição | Gravidade | Ação Requerida |
| :--- | :--- | :--- | :--- |
| **Crítico** | Perda de resposta no IndexedDB ou Travamento da UI. | 🔴 BLOQUEADOR | Parada imediata e correção. |
| **Crítico** | Falha de decriptação em pacote UDP válido (Tag Mismatch falso). | 🔴 BLOQUEADOR | Revisão de canonicalização/IV. |
| **Nivelado** | Atraso isolado na emissão UDP ou SQLite Lock temporário. | 🟡 MONITORAR | Registro no log de auditoria. |
| **Nivelado** | Pacote duplicado detectado e descartado corretamente. | 🟢 ESPERADO | Apenas contagem estatística. |

---

## 🧭 Taxonomia Canônica de Erros

Identifique e reporte incidentes utilizando exclusivamente estes códigos:

| Camada | Código | Natureza do Incidente |
| :--- | :--- | :--- |
| **E1** | `E1_BLE_TIMEOUT` | Sinal BLE do monitor ausente por >30s. |
| **E1** | `E1_BLE_FALSE_TOGGLE` | `present` oscila sem afastamento físico real. |
| **E2** | `E2_SQLITE_LOCKED` | Base de dados SQLite travada ou em I/O morto. |
| **E2** | `E2_SQLITE_IO_ERROR` | Falha gravacional de escrita ou schema corrompido. |
| **E3** | `E3_SOCKET_ERROR` | Falha de rede (Wi-Fi off / Timeout socket). |
| **E3** | `E3_ENCRYPTION_ERROR` | Falha no CSPRNG, IV ou algoritmo AES-GCM. |
| **E3** | `E3_DECRYPTION_ERROR` | Falha no Auth Tag (AAD ou CT Adulterado). |
| **E3** | `E3_CLOCK_SKEW_INVALID` | Pacote com timestamp fora da janela aceitável (Skew). |
| **E3** | `E3_REPLAY_REJECTED` | Pacote reenviado/aceito fora da janela temporal aceitável. |
| **E3** | `E3_DUPLICATE_RID` | Mesmo `rid` reapresentado dentro da janela válida. |

---

## 📝 Registro de Incidente (Template)
Todo incidente durante a homologação deve ser registrado com:
- **RID (Completo)**: [requestId-UUID]
- **Timestamp (Audit)**: [ISO-8601]
- **SRC (App UUID)**: [UUID do Dispositivo]
- **Camada**: [E1 / E2 / E3 / UX]
- **Código Canônico**: [Ex: E3_SOCKET_ERROR]
- **Latência Observada**: [Não auditável / P95 estimada via UX]
- **Descrição**: [O que ocorreu]
- **Impacto Percebido**: [Efeito no aluno/sistema]
- **Recuperação**: [Automática / Manual / Nenhuma]
- **Decisão**: [Aceitável / Investigar / Bloqueador]

---

## 🔓 Gatilho de Liberação da Fase 4 (UI)
A interface de monitoramento (Fase 4) sairá do estado de **HOLD** somente após:
1. Conclusão da Onda 3 com status **🟢 GO**.
2. Definição da Matriz de Alertas baseada nos incidentes reais observados (Não especulativos).
3. Confirmação dos eventos de maior valor para o diagnóstico do operador de campo.
