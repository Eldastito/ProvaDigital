# Busca de Anterioridade — Plataforma FORGE

Documento de pesquisa preliminar de anterioridade (prior art) para fundamentar a novidade e atividade inventiva dos núcleos da plataforma FORGE.

> **NOTA**: Esta busca é preliminar e orientativa. Para o depósito formal, recomenda-se contratação de busca profissional junto a agente de propriedade industrial ou escritório especializado.

---

## 1. Metodologia

### Bancos pesquisados
- **INPI** — Instituto Nacional da Propriedade Industrial (busca.inpi.gov.br)
- **USPTO** — United States Patent and Trademark Office (patents.google.com)
- **EPO** — European Patent Office (espacenet.com)
- **Google Scholar** — Literatura acadêmica

### Termos de busca
| Núcleo | Termos em Português | Termos em Inglês |
| :--- | :--- | :--- |
| Mesh Offline | avaliação digital offline, rede mesh educação | offline exam mesh network, peer-to-peer assessment |
| Cold Boot | retomada de sessão determinística, ponteiro de contexto | deterministic session recovery, context pointer education |
| Envelope Híbrido | envelope criptográfico avaliação, cifra híbrida prova | hybrid encrypted envelope assessment, E2E exam encryption |
| Authority Pilot | migração gradual autorização, shadow mode RBAC | gradual authorization migration, shadow mode authorization |

---

## 2. Resultados por Núcleo Inventivo

### 2.1 Mesh Offline — Execução de Avaliação em Rede Local

#### Anterioridades encontradas:

**A1. US 2019/0180623 A1** — "Systems and Methods for Offline Exam Administration"
- **Relação**: Descreve sistema de exame offline, mas sem rede mesh P2P. Opera em modo standalone por dispositivo.
- **Distinção FORGE**: A FORGE implementa rede mesh P2P com comunicação entre dispositivos, não apenas armazenamento local individual. O broadcast confiável com dedup e o envelope híbrido não estão presentes nesta referência.

**A2. WO 2020/112845 A1** — "Mesh Networking for IoT Devices in Education"
- **Relação**: Descreve mesh para IoT educacional, mas para sensores ambientais, não para avaliação digital.
- **Distinção FORGE**: A FORGE utiliza mesh especificamente para transporte de dados de avaliação com isolamento criptográfico do payload, não para telemetria de sensores.

**A3. Literatura acadêmica** — "Peer-to-peer learning assessment platforms" (IEEE, 2021)
- **Relação**: Discute P2P para avaliação formativa, mas requer servidor central.
- **Distinção FORGE**: A FORGE opera sem qualquer servidor central durante a aplicação, usando nó de orquestração local.

#### Conclusão: **NOVIDADE PRESERVADA**
Não foram encontradas referências que combinem rede mesh P2P + avaliação digital formal + envelope híbrido criptográfico em um único sistema.

---

### 2.2 Cold Boot — Retomada Determinística de Sessão

#### Anterioridades encontradas:

**B1. US 10,225,368 B2** — "Session Recovery in Mobile Applications"
- **Relação**: Descreve recuperação de sessão em apps móveis, mas usando checkpoint periódico.
- **Distinção FORGE**: A FORGE usa ponteiro de contexto canônico com lookup O(1), não checkpoint periódico. A retomada é determinística por design, não por melhor esforço.

**B2. US 2018/0365108 A1** — "Exam Continuity System"
- **Relação**: Descreve continuidade de exame após interrupção, mas depende de servidor central para reconciliação.
- **Distinção FORGE**: A FORGE realiza retomada localmente no dispositivo sem comunicação externa, usando ponteiro persistente em IndexedDB.

**B3. Padrão "Event Sourcing"** (Martin Fowler, 2005)
- **Relação**: Padrão geral de reconstrução de estado via replay de eventos.
- **Distinção FORGE**: A FORGE não replica eventos — usa ponteiro direto O(1) para a sessão ativa, evitando scan ou replay.

#### Conclusão: **NOVIDADE PRESERVADA**
O mecanismo de Context Pointer canônico com lookup O(1) e transição de estado formal (ACTIVE→SUPERSEDED com cadeia de custódia) não foi encontrado no estado da técnica para aplicações de avaliação digital.

---

### 2.3 Envelope Híbrido — Isolamento Criptográfico

#### Anterioridades encontradas:

**C1. Protocolo Signal / WhatsApp** (2014-2016)
- **Relação**: Implementa E2E encryption com derivação de chave por sessão.
- **Distinção FORGE**: O Signal usa troca de chaves Diffie-Hellman (X3DH), enquanto a FORGE usa PBKDF2 derivada do contexto da avaliação (eventId + studentId). O envelope da FORGE é híbrido (header aberto para roteamento mesh + payload cifrado), diferente do Signal que cifra tudo.

**C2. US 2017/0279804 A1** — "Encrypted Assessment Data Transmission"
- **Relação**: Descreve transmissão cifrada de dados de avaliação.
- **Distinção FORGE**: A referência C2 usa cifra ponto-a-ponto cliente-servidor. A FORGE usa cifra com chave derivada do contexto que permite transmissão via nós intermediários (mesh) sem exposição.

**C3. TLS 1.3** (RFC 8446)
- **Relação**: Protocolo de transporte seguro amplamente utilizado.
- **Distinção FORGE**: TLS requer handshake por conexão e certificados. O envelope da FORGE é stateless e funciona em rede mesh sem autoridade central de certificados.

#### Conclusão: **NOVIDADE PRESERVADA**
A combinação de derivação de chave por par aluno/evento + envelope híbrido com header aberto para roteamento mesh + QR Code assinado com HMAC não foi encontrada no estado da técnica.

---

### 2.4 Authority Pilot — Migração Gradual de Autorização

#### Anterioridades encontradas:

**D1. "Feature Flags" / "Dark Launching"** (Flickr, 2009; Facebook, 2014)
- **Relação**: Prática geral de habilitação gradual de funcionalidades.
- **Distinção FORGE**: Feature flags controlam visibilidade de UI. O Authority Pilot migra a autoridade de decisão de um motor de autorização completo, com auditoria de divergência e kill switch automático.

**D2. "Shadow Testing" / "Traffic Mirroring"** (Netflix, 2015)
- **Relação**: Prática de espelhar tráfego para sistema novo em paralelo.
- **Distinção FORGE**: Shadow testing compara respostas de APIs. O Authority Pilot compara decisões de autorização por recurso/ação/escopo com severidade calculada e fallback por sessão, não por requisição.

**D3. US 2020/0099713 A1** — "Gradual Migration of Authorization Systems"
- **Relação**: Descreve migração gradual de autorização, mas para microsserviços.
- **Distinção FORGE**: A referência D3 opera a nível de API gateway. O Authority Pilot opera dentro do motor de autorização da aplicação, com granularidade de recurso/ação/escopo/organização, incluindo isolamento cross-tenant fail-closed e kill switch por contagem de fallbacks na sessão.

#### Conclusão: **NOVIDADE PRESERVADA COM RESSALVAS**
O conceito de migração gradual existe. A novidade da FORGE está na combinação de: (a) granularidade por recurso/ação/escopo/organização; (b) kill switch automático por contagem de fallbacks; (c) isolamento cross-tenant fail-closed; (d) auditoria de divergência com severidade calculada.

---

## 3. Resumo de Novidade

| Núcleo | Novidade | Atividade Inventiva | Risco |
| :--- | :--- | :--- | :--- |
| **Mesh Offline** | ✅ Alta | ✅ Alta | 🟢 Baixo |
| **Cold Boot** | ✅ Alta | ✅ Alta | 🟢 Baixo |
| **Envelope Híbrido** | ✅ Média-Alta | ✅ Alta | 🟡 Médio |
| **Authority Pilot** | ⚠️ Média | ✅ Média-Alta | 🟡 Médio |

---

## 4. Recomendações

1. **Mesh Offline + Cold Boot**: Maior potencial de proteção patentária. Recomenda-se priorizar estas claims no depósito.
2. **Envelope Híbrido**: Forte, mas a combinação de primitivas criptográficas é bem documentada. A novidade está na aplicação específica para rede mesh educacional.
3. **Authority Pilot**: Conceitos de migração gradual existem. Recomenda-se focar as claims nos aspectos específicos (kill switch por fallback, cross-tenant fail-closed, granularidade multi-escopo).
4. **Busca Profissional**: Recomenda-se contratação de busca profissional antes do depósito formal para validar estas conclusões preliminares.

---

**Data da Pesquisa**: 12/04/2026  
**Pesquisador**: Engenharia FORGE
