# 🗑️ CHANGELOG: Remoções e Higiene (v3.0 Otimização)

Data: 2026-02-25
Autor: Antigravity

## 📂 Pastas Removidas
- `quarantine/`: Removida completamente (38 arquivos legados de versões < 2.5). Não havia referências no código atual.

## 🚚 Arquivos Movidos (Reorganização)

### De `services/` para `scripts/db-tools/`
Scripts CLI de manutenção que não fazem parte do runtime do frontend:
- `check_counts.js`
- `inspect_context.js`
- `inspect_parent_data.js`
- `link_parent_student.js`
- `list_users.js`
- `verify_rls.js`
- `inspect_parent_data.ts`
- `validateRiskEngine.ts`

### De `migrations/` para `migrations/diagnostics/`
Scripts de reparo emergencial movidos para subpasta para limpar a raiz de migrações:
- Todos os `DIAGNOSTIC_*.sql`
- Todos os `REPAIR_*.sql`

## 🛡️ Verificação
- Busca via `grep`: Nenhuma referência encontrada no código fonte.
- `npm run build`: Sucesso (Confirma que não há imports quebrados).
