# Plano: Fase 3 — Authority Pilot (Analytics ReadOnly)

**Baseline de Entrada**: `GLOBAL v4` | **Tag**: `onda-2-global-freeze-v4`
**Status**: 🟡 **EM PLANEJAMENTO**

---

## 1. Objetivo
Promover o Core de governança para **autoridade real** em **um único módulo** de leitura, mantendo todo o resto sob controle do legado.

## 2. Módulo Escolhido
**Analytics Institucional / Agregado (ReadOnly)**

### Por quê
- É leitura pura — sem risco de corrupção de dados.
- Já foi exercitado profundamente em Shadow Mode (Sessões 16–22).
- Alto valor de negócio para gestores.
- Rollback simples: desligar a flag e o legado reassume.

## 3. Perfis do Piloto
| Perfil | Escopo | Blast Radius |
| :--- | :--- | :--- |
| Gestor Escolar | `UNIT` | 1 escola |
| Gestor Municipal | `ORG` | 1 município (máx. 3 escolas) |

### Exclusões Explícitas
- ❌ Responsáveis
- ❌ Professores
- ❌ Gestor Estadual
- ❌ MEC / GLOBAL
- ❌ Qualquer perfil de escrita

## 4. Mecanismo de Controle

### Feature Flag
```typescript
// Feature Flag dedicada
const AUTHORITY_PILOT_FLAGS = {
  analytics_readonly: {
    enabled: false,           // Ativar só no momento do piloto
    modules: ['ANALYTICS', 'NETWORK_ANALYTICS'],
    allowedScopes: ['UNIT', 'ORG'],
    allowedActions: ['VIEW'],  // Somente leitura
    rollbackOnError: true      // Retorna ao legado automaticamente em caso de exceção
  }
};
```

### Kill Switch
- Flag desligada = legado decide imediatamente.
- Tempo de rollback: **< 1 segundo** (sem deploy).
- Monitoramento: log `[AUTHORITY_PILOT]` em cada decisão do Core.

## 5. Critérios de Sucesso
| Métrica | Meta |
| :--- | :--- |
| Divergência Crítica | 0 |
| Vazamento Cross-tenant | 0 |
| Stale Context | 0 |
| Latência P95 | < 2ms |
| Rollback acionado | 0 (ideal) ou com causa documentada |

## 6. Stop-the-Line
Desligar a flag imediatamente se:
- Qualquer vazamento cross-tenant.
- Qualquer dado individual retornado indevidamente.
- Latência P95 > 5ms.
- Qualquer ação de escrita alcançar o Core.
- Feedback negativo de um gestor piloto.

## 7. Duração e Observação
- **Fase de Observação**: 3 sesões controladas (mínimo).
- **Expansão**: Só após 3 sessões limpas consecutivas.
- **Monitoramento**: Logs `[AUTHORITY_PILOT]` revisados após cada sessão.

## 8. Sequência de Execução
1. Implementar a Feature Flag `authority_pilot_analytics_readonly`.
2. Testar rollback (desligar flag e confirmar que legado reassume).
3. Ativar para 1 Gestor Escolar em 1 escola.
4. Observar 1 sessão completa.
5. Se limpo, ativar para 1 Gestor Municipal.
6. Observar 1 sessão completa.
7. Se limpo, manter ativo e monitorar por 1 sessão adicional.
8. Gerar relatório de validação do Authority Pilot.

---
**Assinatura**: Antigravity | **Status**: Planejamento Fase 3 Completo.
