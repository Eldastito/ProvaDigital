# Plano: Fase 3 — Authority Pilot (Analytics ReadOnly)

**Baseline de Entrada**: `GLOBAL v4` | **Tag**: `onda-2-global-freeze-v4`
**Status**: 🟢 **APROVADO PARA IMPLEMENTAÇÃO**

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
- ❌ Responsáveis / Professores
- ❌ Gestor Estadual / MEC / GLOBAL
- ❌ Qualquer perfil de escrita

## 4. Feature Flag (Nome Canônico Único)

**Identificador único em código, docs e logs**: `authority_pilot_analytics_readonly`

```typescript
const AUTHORITY_PILOT_CONFIG = {
  flagName: 'authority_pilot_analytics_readonly',
  enabled: false,
  // Whitelist explícita de Resources (não apenas módulos)
  allowedResources: [
    'ANALYTICS',
    'NETWORK_ANALYTICS',
    'SCHOOL_AGGREGATE_DATA',
    'INSTITUTIONAL_METADATA'
  ],
  // Whitelist de Actions (somente leitura)
  allowedActions: ['VIEW'],
  // Whitelist de Escopos
  allowedScopes: ['UNIT', 'ORG'],
  // Recursos PROIBIDOS (mesmo se dentro do módulo analytics)
  deniedResources: [
    'STUDENT_PEDAGOGICAL_DATA',
    'USER_MANAGEMENT',
    'EXAMEPAD_OPS',
    'SAAS_PLATFORM',
    'FINANCE',
    'LOGISTICS'
  ]
};
```

## 5. Comportamento de Fallback (Formal)

| Situação | Comportamento |
| :--- | :--- |
| Core retorna decisão válida | ✅ Usa a decisão do Core |
| Core lança exceção | ⚠️ Fallback imediato para legado **na mesma requisição** |
| Fallback acionado | 📝 Log obrigatório `[AUTHORITY_PILOT_FALLBACK]` |
| Contador de fallback > 3 por sessão | 🔴 Flag desligada automaticamente (auto-disable) |
| Flag desligada (manual ou auto) | Legado reassume em < 1 segundo, sem deploy |

### Regra de Auto-Disable
```
SE fallbackCount >= 3 na mesma sessão:
  ENTÃO desligar authority_pilot_analytics_readonly
  E registrar [AUTHORITY_PILOT_AUTO_DISABLED]
  E notificar equipe técnica
```

## 6. Stop-the-Line (Separação Formal)

### Stop-the-Line Técnico (Automático — derruba o piloto)
- Vazamento cross-tenant ou cross-school.
- Dado pedagógico individual retornado indevidamente.
- Ação de escrita alcançando o Core.
- Latência P95 > 5ms.
- Exceção não tratada no Core.

### Incidente Operacional (Abre revisão — NÃO derruba automaticamente)
- Feedback negativo de gestor sobre UX/resultado.
- Dado agregado com valor inesperado (possível bug de query, não de segurança).
- Lentidão percebida (mas dentro do limiar técnico).

## 7. Sequência de Execução
1. Implementar a Feature Flag `authority_pilot_analytics_readonly`.
2. Testar rollback (desligar flag e confirmar que legado reassume).
3. Testar auto-disable (simular 3 fallbacks e confirmar desligamento).
4. Ativar para 1 Gestor Escolar em 1 escola.
5. Observar 1 sessão completa.
6. Se limpo, ativar para 1 Gestor Municipal.
7. Observar 1 sessão completa.
8. Se limpo, manter ativo e monitorar por 1 sessão adicional.
9. Gerar relatório de validação do Authority Pilot.

---
**Assinatura**: Antigravity | **Status**: Planejamento Fase 3 Completo e Aprovado.
