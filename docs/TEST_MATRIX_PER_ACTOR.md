# Matriz de Teste por Ator (Onda 1)

Esta matriz define os perfis reais e as jornadas mínimas para validação do Shadow Mode em Staging.

## Ativos e Vínculos de Teste
| Ator | Papel Legado | Contexto Ativo | Organização |
| :--- | :--- | :--- | :--- |
| **Admin SaaS** | MASTER_SAAS | GLOBAL | ExamePad Platform |
| **Operador Operação** | SYSTEM_ADMIN | GLOBAL | ExamePad Ops |
| **Gestor MEC** | SUPER_ADMIN | GLOBAL | MEC / Federal |
| **Gestor Estadual** | STATE_ADMIN | REGIONAL | Sec. Estadual RS |
| **Gestor Municipal 1** | TENANT_ADMIN | REGIONAL | Sec. Municipal POA |
| **Gestor Municipal 2** | TENANT_ADMIN | REGIONAL | Sec. Municipal Canoas |
| **Diretor Unidade A** | DIRETOR | UNIT | Escola Primária A |
| **Diretor Escola Priv** | DIRETOR | UNIT | Colégio Private Elite |
| **Professor Titular** | PROFESSOR | UNIT | Escola Primária A |
| **Professor Multi** | PROFESSOR | UNIT (Dual) | Escola A + Escola B |
| **Estudante** | ALUNO | UNIT | Escola Primária A |
| **Pai / Responsável** | PAIS | UNIT | Dependente na Escola A |
| **Legado S/ Membro** | SUPERVISOR | UNIT | Legado s/ Membership Real |

## Requisitos de Dataset (Onda 1)
Para garantir a verdade dos dados, o Staging deve conter:
- **2 Municípios Independentes**: POA e Canoas (Teste Cross-Tenant).
- **2 Escolas Municipais em POA**: (Teste Cross-School).
- **1 Rede/Escola Privada**: Validar comportamento fora do eixo público.
- **Professor Multi-Vínculo**: Ativo em pelo menos 2 escolas.
- **Caso Legado Incompleto**: Usuário com role mas sem membership canônico.
1. **Login & Sidebar**: Validar visibilidade inicial dos módulos.
2. **Navegação de Rota**: Tentar acessar rotas protegidas permitidas e negadas.
3. **Cross-Tenant Test**: (Admin POA) tentar acessar dados de (Admin Canoas).
4. **Cross-School Test**: (Professor Escola A) tentar acessar turma da (Escola B).
5. **Multi-Membership Test**: Garantir que a troca de contexto entre Escola A e B atualiza corretamente o `activeMembershipId`, `activeSchoolId` e o contexto efetivo usado pelo `can()`.
6. **Guardian Negative Test**: (Pai Aluno A) tentando acessar dados do (Aluno B) ou contexto da (Escola B).

## Critérios de Validação Técnica
- **Deduplicação**: Máximo de 1 log divergent por par (Resource, Action) por superfície.
- **Performance**: Latência de decisão `can()` < 2ms (Decision Cache).
