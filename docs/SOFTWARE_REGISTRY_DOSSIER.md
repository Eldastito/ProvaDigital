# Software Registry Dossier: FORGE (Code & Authorship)

Este documento identifica a estrutura funcional e os módulos prioritários da plataforma FORGE para efeito de **Registro de Programa de Computador** no INPI, documentando autoria, titularidade e baseline de versão.

---

## 1. Identificação do Sistema
- **Nome Comercial**: FORGE
- **Escopo**: Sistema de avaliação digital resiliente com persistência local e comunicação em malha.
- **Titular Jurídico**: ExamePad Tecnologia Ltda (CNPJ: 00.000.000/0000-00 - Placeholder)
- **Autoria Técnica**: Engenharia de Pilotagem | Porto Alegre (Em consolidação documental de titularidade)

---

## 2. Inventário de Módulos Prioritários

| Módulo | Arquivo-Fonte | Função de Software (Baseline) |
| :--- | :--- | :--- |
| **Sessão & Isolamento** | `sessionIsolationService.ts` | Gerenciamento de persistência local multi-aluno. |
| **Segurança E2E** | `e2eEncryptionService.ts` | Motor criptográfico de preservação de dados. |
| **Orquestração de Malha** | `meshNetworkService.ts` | Protocolo de transporte e descoberta de nós. |
| **Servidor Local** | `localServerService.ts` | Backend HTTP de borda para gateways de sala. |
| **App do Estudante** | `StudentApp.tsx` | Aplicação cliente de execução da avaliação. |
| **Persistência de Dados** | `persistenceGateway.ts` | Camada de abstração para armazenamento local. |

---

## 3. Evidências de Desenvolvimento (Baseline)
- **Marco de Versão**: Alpha-Hardened (Fase 3 do Authority Pilot)
- **Branch**: `main`
- **Hash Canônico (SHA)**: `9826697`
- **Data da Baseline**: 29/03/2026

---

## 4. Política de Registro e Congelamento
Este dossiê orienta o registro das versões recorrentes do software. Recomenda-se o depósito imediato dos módulos listados na Seção 2 como "Versão 1.0" da arquitetura FORGE, visando a proteção contra cópia literal do código-fonte.

---
**Observação**: O registro de software protege o código-fonte ("literariedade") e a autoria, sendo complementar e independente da Patente de Invenção (PI).
