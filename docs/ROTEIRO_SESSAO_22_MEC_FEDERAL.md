# Roteiro: Sessão Piloto 22 (MEC / Federal - Escopo GLOBAL)

**Perfil**: Gestor Federal (MEC / Equipe Técnica)
**Escopo**: `GLOBAL`
**Baseline Canônica**: `5421371` | **Tag**: `onda-2-staging-freeze-v3`
**Status**: 🟡 **EM PLANEJAMENTO**

## 1. Definição do Escopo GLOBAL (Onisciência Controlada)
O Gestor Federal possui autoridade transversal sobre o ecossistema público, mas acesso restrito ao ecossistema privado.

- **REDE PÚBLICA**: Acesso total (estaduais, municipais, escolas em Staging).
- **REDE PRIVADA**: 
    - **Default Deny**: Nenhuma visibilidade padrão.
    - **Acesso Delegado**: Somente organizações privadas com Grant Explícito (`federal_visibility_enabled`).
- **RESTRITO**: Proibido acesso a `ExamePad Ops`, `SaaS Platform`, Financeiro e Logística.

## 2. Jornada do Piloto (Leitura Agregada)
1. **Login e Dashboard Federal (Onisciente)**:
   - Validar `activeOrganizationId = mec_hq`.
   - Validar `activeScopeType = GLOBAL`.
   - Visualizar agregados de múltiplos estados subordinados.
2. **Drill-down Público (Estado -> Município -> Escola)**:
   - Navegar até uma escola pública no interior do RS.
   - Validar purificação do `activeSchoolId` nos níveis superiores.
3. **Validação Rede Privada (Grant vs No-Grant)**:
   - Tentar acessar Dashboard da **Escola Privada A** (Grant Ativo) -> **SUCESSO**.
   - Tentar acessar Dashboard do **Grupo Privado X** (Grant Ausente) -> **BLOQUEIO**.
4. **Retorno e Limpeza de Contexto**:
   - Garantir que o retorno da escola/município limpa o `targetOrganizationId` e `activeSchoolId`.

## 3. Critérios de Segurança e Stop-the-Line
- **Inter-Boundary (Ops)**: Bloqueio sumário se o MEC conseguir visionar o Dashboard de Operações.
- **Privado sem Grant**: Bloqueio se houver vazamento de dados de organizações privadas não autorizadas.
- **Escada de Privilégio**: MEC tentando realizar escrita ou gestão de usuários.

## 4. Métricas Observadas
- Latência do motor sob visibilidade aggregate massiva.
- Coerência do `activeOrganizationId` (MEC) vs `targetOrganizationId` (Alvo).
- Purificação de contexto pós-drill-down.

---
**Responsável**: Antigravity | **Data**: 2026-03-15
