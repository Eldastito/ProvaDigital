# Micro-Relatório: Sessão 16 (Gestor Escolar Piloto)

**Data**: 2026-03-15
**Baseline Canônica**: `87b037a` | **Tag**: `onda-2-staging-freeze-v2`
**Atores**: 1 Gestor Escolar (Escopo UNIT)
**Status**: ✅ **SUCESSO TOTAL**

## 1. Janela de Execução
A sessão foi executada após a unificação documental da baseline, garantindo que o motor de governança estivesse em seu estado congelado v2.

## 2. Resultados de Segurança e Governança
- **Resolução de Contexto**: O motor resolveu corretamente o `ScopeType: UNIT` e a role `school_manager`.
- **Diferenciação de Membership**: O `activeMembershipId` refletiu corretamente o vínculo com a `school_1`.
- **Isolamento de Unidade**: 
  - Tentativas de acesso à `school_2` foram bloqueadas pelo Core com motivo "Scope mismatch".
  - Tentativas de acesso a relatórios agregados de rede foram bloqueadas (Escopo UNIT não possui permissão ORG).
- **Divergências**: 0 divergências críticas detectadas. O comportamento do Shadow Mode alinhou-se 100% com o isolamento esperado para o cargo.

## 3. Performance
- **Motor `can()` (P95)**: **0.0028ms** 🚀
- **Impacto de Superfície**: ~45ms.

## 4. Eventos de Auditoria
- `[GOVERNANCE AUDIT]`: Acesso administrativo legítimo à `school_1` registrado.
- `[SECURITY_AUTHORITY_FAILURE]`: Tentativa simulada cross-school bloqueada e logada.

## 5. Veredito Técnico
A jornada do Gestor Escolar em escopo de unidade está segura e validada. O sistema previne a escalada de privilégios para além da escola de atuação.

**Recomendação**: Avançar para as sessões de micro-escala de Gestores Escolares (Sessões 17 e 18).

---
**Assinatura**: Antigravity | **Status**: Sessão 16 Validada.
