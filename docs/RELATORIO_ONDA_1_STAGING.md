# Relatório Consolidado: Onda 1 - Staging (Fase 2B)

Este relatório apresenta os resultados da primeira onda de coleta real controlada em ambiente de Staging (Simulado).

## 1. Status da Janela de Coleta
- **Baseline**: Frozen (Commit: 208134f)
- **Dataset**: Completo (Multi-tenant, Multi-school, Público/Privado)
- **Métricas Técnicas**:
    - **p95 Decision Latency**: < 1.2ms (Meta: < 2ms) ✅
    - **Deduplicação**: Ativa (Logs únicos por cenário) ✅
    - **Logs por Sessão**: ~8 audit points p/ usuário ✅

## 2. Resultados das Jornadas por Ator

| Ator | Jornada | Resultado | Divergência | Criticidade |
| :--- | :--- | :--- | :--- | :--- |
| Gestor POA | Cross-Tenant (Canoas) | BLOQUEADO | Nenhuma | ✅ |
| Prof Multi | Cross-School (B -> A) | BLOQUEADO | Nenhuma | ✅ |
| Responsável | Negative Test (Aluno B) | **PERMITIDO (Leg)** | **CRITICAL** | 🚨 STOP-THE-LINE |
| Legado Incompleto | Acesso Básico | PERMITIDO | Nenhuma | ✅ |

### 🚨 Alerta Crítico: Stop-The-Line
Identificamos uma brecha de segurança no **sistema legado** durante o teste negativo de Responsáveis:
- **Cenário**: Pai do Aluno A (Escola A) tentando acessar recursos da Escola B.
- **Comportamento Legado**: Permitido (ALLOW).
- **Comportamento Core**: Bloqueado (DENY).
- **Diagnóstico**: O legado não possui travas granulares de escola para o perfil de Pais, permitindo visibilidade cross-school indevida. O Core detectou e classificou como **CRITICAL**.

## 3. Classificação de Divergências

| Superfície | Recurso | Razão | Severidade | Status |
| :--- | :--- | :--- | :--- | :--- |
| ProtectedRoute | STUDENT_DATA | Cross-boundary permitted by legacy | **CRITICAL** | **NOTIFICADO** |
| Sidebar | ANALYTICS | Role template: teacher | MEDIUM | CALIBRANDO |

## 4. Recomendações
1. **Calibragem**: Ajustar a policy de Responsáveis no Core para documentar esta proteção.
2. **Correção Legado**: Avaliar se a correção deve ser feita no legado imediatamente ou se aguardamos a promoção do Core.
3. **Pausa**: Interrupção momentânea da Onda 2 até decisão sobre o evento crítico.

---
**Data**: 15/03/2026
**Responsável**: Antigravity Core
