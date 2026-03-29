# Claims Hygiene Checklist: FORGE IP Guidelines

Este documento define as regras de redação para qualquer material técnico, dossiê de patente ou registro de software da FORGE, visando a proteção jurídica e a precisão operacional.

## 1. Frases Proibidas (Falsos Absolutos)
Estes termos devem ser ELIMINADOS de qualquer dossiê "Patent-Safe" pois são indesejáveis em exames de patente e arriscados em termos de responsabilidade técnica.

| ❌ Proibido | 🎯 Motivo | ✅ Substituto Recomendado |
| :--- | :--- | :--- |
| "Redução de 100%..." | Impossível de sustentar universalmente. | "Redução material da dependência..." |
| "Blindagem total/absoluta" | Não existe segurança sem brechas. | "Isolamento criptográfico estruturado" |
| "0% de colisão/colisão nula" | Pode haver colisão física ou de hash. | "Redução do risco de colisão lógica" |
| "Resposta em tempo real" | Tempo real é ambíguo em redes mesh. | "Resposta operacional síncrona/determinística" |
| "Sistema infalível" | Arrogância técnica insegura. | "Proteção resiliente com redundância" |
| "Garantido / Seguro / Imune" | Termos absolutos comercialmente frágeis. | "Robustez testada / Mitigação ativa" |
| "À prova de fraude" | Desafia o estado da técnica. | "Detecção e isolamento de anomalias" |
| "Único / Não existe similar" | Arriscado em exames de anterioridade. | "Novidade técnica evidenciada" |

---

## 2. Redação de Efeitos Técnicos (Status)
Cada alegação técnica deve ser classificada de acordo com seu estágio de comprovação no sistema.

1.  **[COMPROVADO]**: Já existe métrica real, benchmark ou log que sustenta o efeito.
2.  **[EM VALIDAÇÃO]**: Hipótese técnica plausível, aguardando benchmark formal (Fase 3 do plano).
3.  **[META EXPERIMENTAL]**: Objetivo de design de longo prazo, ainda não funcional ou medido.

---

## 3. Guia de Redação para Claims de Patente
- **O que priorizar**: Focar no **efeito técnico mensurável** (ex: menor tempo de retomada, menor tráfego de rede).
- **O que evitar**: Detalhes do segredo industrial (hashes específicos, chaves raiz, thresholds operacionais).
- **Linguagem**: Preferir verbos que descrevam ação do sistema (separar, cifrar, isolar, recuperar, detectar).

---

## 4. Regras Mandatórias de Governança
- **Regra A: Abstração de Implementação em PI**: Detalhes de frameworks, bibliotecas ou storages específicos (Ex: React, IndexedDB, Dexie, Supabase) não entram em claims Patent-Safe sem necessidade absoluta. Use termos genéricos funcionais.
- **Regra B: Código não equivale a Prova**: Alegações só podem ser marcadas como **[COMPROVADO]** quando houver benchmark, log, relatório de teste ou evidência operacional rastreável anexa. Apenas estar codificado é **[EM VALIDAÇÃO]**.
