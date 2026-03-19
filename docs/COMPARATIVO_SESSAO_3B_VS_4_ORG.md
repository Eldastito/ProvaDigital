# Comparativo de Simetria Municipal - Autoridade Core (3B vs 4)

**Status:** ✅ SIMETRIA PROVADA  
**Baselines:** Global v4 (Remediada)  
**Flags:** `authority_pilot_analytics_readonly`

---

## Tabela Comparativa de Atuação

| Critério | Sessão 3B (Porto Alegre) | Sessão 4 (Canoas) | Status |
| :--- | :--- | :--- | :--- |
| **Ator Piloto** | `poa_admin` | `canoas_admin` | Simétrico |
| **Org Ativa** | `poa_organization` | `canoas_organization` | Simétrico |
| **Drill-down Legítimo** | `school_poa_1` (ALLOW) | `school_canoas_99` (ALLOW) | Simétrico |
| **Isolamento Inter-Org** | `canoas_organization` (DENY) | `poa_organization` (DENY) | Simétrico |
| **Isolamento Hierárquico** | `school_canoas_99` (DENY) | `school_poa_1` (DENY) | Simétrico |
| **Fallback Count** | 0 | 0 | Estável |
| **p95 Latência Core (E2E)** | 0.865ms | 2.037ms | OK |

---

## Análise Técnica de Simetria
A execução de dois pilotos reais em municípios distintos com o mesmo Core prova que:
1. **Não há Hardcoding**: O motor decide logicamente com base na árvore de subordinação fornecida no contexto.
2. **Escalabilidade**: Adicionar um novo município não exige mudança de código, apenas a ativação da Feature Flag para o novo contexto.
3. **Segurança Hierárquica**: A regra de subordinação escolar (implementada após a 3A) protege qualquer município contra tentativas de drill-down direto para IDs de escolas externas.

## Conclusão e Recomendação Final
O sistema está **aprovado para expansão limitada e controlada no escopo ORG (Municipal)**. 
A baseline atual é robusta e suporta a inclusão gradual de novos municípios com isolamento garantido pelo Core Governance Service, desde que mantida a restrição de somente leitura (**Read-only / Analytics / Metadata only**). Estão vedados neste momento o rollout amplo ou a escalada para o nível Estadual.

---
*Responsável Técnico: Governança Core*
