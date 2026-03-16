# Decisão de Gate: Transição para Escopo GLOBAL (MEC/Federal)

**Baseline de Referência**: `GLOBAL v4` | **Tag**: `onda-2-global-freeze-v4`
**Veredito**: 🟢 **READY FOR GLOBAL PLANNING**

---

## 1. Unificação da Baseline Canônica
Para sanear a inconsistência apontada:
- **Hash de Lógica (`15bbe48`)**: É o ponto de *Code Freeze* funcional. Nenhuma linha de lógica do `GovernanceService` ou regras de autorização foi alterada após este hash.
- **Hash de Auditoria (`5421371`)**: Representa o estado atual do repositório, incluindo os micro-relatórios e scripts de teste das sessões 19, 20 e 21.
- **Decisão**: A partir de agora, **todas** as referências em relatórios e roteiros usarão o hash unificado do commit atual (`5421371`) para auditoria, mantendo a nota de que a lógica está congelada desde o v3-logic-freeze (`15bbe48`).

## 2. Diferenciação Semântica: ORG vs GLOBAL
Conforme decisão de governança para o degrau MEC/Federal:

### Escopo ORG (Municipal / Estadual)
- **Natureza**: Hierárquico subordinado.
- **Limite**: Restrito à árvore de uma única organização âncora (Secretaria X).
- **Exemplo**: O Estado do RS não escala para SC.

### Escopo GLOBAL (MEC / Federal / Master SaaS)
- **Natureza**: Transversal e Onisciente.
- **Definição**: Ator que não possui um `activeOrganizationId` subordinado a uma rede, mas sim autoridade sobre o ecossistema total.
- **Modelagem MEC**: O Gestor Federal será modelado como **`GLOBAL`**. No contrato canônico, atores GLOBAL ignoram travas de `targetOrganizationId` em nível de leitura agregada.

## 3. Mitigação de Riscos Pré-Sessão 22
- **Risco de Stale Context**: O simulador da S21 provou que a limpeza de `activeSchoolId` funciona. Para o nível `GLOBAL`, o simulador deve provar que a limpeza de `targetOrganizationId` (Município/Estado) também é 100% segura.
- **Risco de Performance**: O escopo `GLOBAL` pode disparar rotas de aggregate pesadas. O Shadow Mode deve monitorar se a latência do motor se mantém sob visibilidade onisciente.

## 4. Promoção de Planejamento
Com a Onda 2 fechada e a semântica `GLOBAL` definida, o projeto está autorizado a iniciar o planejamento da:
- **Sessão Piloto 22 (MEC — Escopo GLOBAL)**: Leitura onisciente controlada.

---
**Assinatura**: Antigravity | **Gate**: APURADO E APROVADO.
