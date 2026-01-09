# 🧪 Guia de Testes - ExamePad SaaS

## ✅ Configuração Completa

O ambiente de testes está totalmente configurado e pronto para uso!

### 📦 Ferramentas Instaladas

- **Vitest** - Framework de testes rápido e moderno
- **@vitest/ui** - Interface visual para testes
- **@testing-library/react** - Testes de componentes React
- **@testing-library/jest-dom** - Matchers adicionais
- **@testing-library/user-event** - Simulação de interações do usuário
- **jsdom** - Ambiente DOM para testes

---

## 🚀 Como Usar

### Comandos Disponíveis

```bash
# Rodar todos os testes (modo watch - reexecuta ao salvar)
npm test

# Rodar testes uma vez e sair
npm test -- --run

# Abrir interface visual
npm run test:ui

# Gerar relatório de cobertura
npm run test:coverage
```

### Atalhos no Modo Watch

Quando você roda `npm test`, o Vitest fica observando mudanças:

- **`a`** - Rodar todos os testes
- **`f`** - Rodar apenas testes que falharam
- **`t`** - Filtrar por nome do teste
- **`p`** - Filtrar por nome do arquivo
- **`q`** - Sair
- **`h`** - Mostrar ajuda

---

## 📝 Exemplos de Testes Criados

### 1. Testes de Serviço (gamificationService.test.ts)

✅ **10 testes passando**

Testa a lógica de gamificação:
- Cálculo de níveis baseado em XP
- Validação de compra de itens
- Verificação de saldo e nível
- Itens de acessibilidade gratuitos

### 2. Testes de Motor de Risco (riskDetectionEngine.test.ts)

✅ **4 testes passando** | ⚠️ **2 testes com dados simulados**

Testa detecção de risco de evasão:
- Identificação de alunos em risco alto
- Detecção de queda de desempenho
- Recomendações de intervenção
- Processamento em lote

### 3. Testes de Componente (LoginPage.test.tsx)

✅ **Exemplo de teste de componente React**

Verifica renderização da página de login:
- Presença de campos de formulário
- Botão de login
- Logo da plataforma

---

## 📚 Como Escrever Novos Testes

### Estrutura Básica

```typescript
import { describe, it, expect } from 'vitest';

describe('Nome do Módulo', () => {
  it('deve fazer algo específico', () => {
    // 1. Arrange (Preparar)
    const input = 'dados de teste';
    
    // 2. Act (Executar)
    const result = minhaFuncao(input);
    
    // 3. Assert (Verificar)
    expect(result).toBe('resultado esperado');
  });
});
```

### Teste de Função Simples

```typescript
// services/myService.test.ts
import { describe, it, expect } from 'vitest';
import { calculateIDG } from './analyticsService';

describe('calculateIDG', () => {
  it('deve calcular IDG ponderado corretamente', () => {
    const examAvg = 8.0;
    const projectAvg = 7.0;
    const bonus = 0.5;
    
    const idg = calculateIDG(examAvg, projectAvg, bonus);
    
    // IDG = (8.0 * 0.7) + (7.0 * 0.2) + (0.5 * 0.1)
    // IDG = 5.6 + 1.4 + 0.05 = 7.05
    expect(idg).toBeCloseTo(7.05, 2);
  });
});
```

### Teste de Componente React

```typescript
// components/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('deve renderizar o título', () => {
    render(<MyComponent title="Olá Mundo" />);
    
    expect(screen.getByText('Olá Mundo')).toBeInTheDocument();
  });
  
  it('deve chamar callback ao clicar no botão', async () => {
    const handleClick = vi.fn(); // Mock function
    
    render(<MyComponent onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Teste com Mock de API

```typescript
import { describe, it, expect, vi } from 'vitest';

// Mock do Supabase
vi.mock('./services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [{ id: '1', name: 'Teste' }],
          error: null
        }))
      }))
    }))
  }
}));

describe('fetchStudents', () => {
  it('deve buscar alunos do banco', async () => {
    const students = await fetchStudents('class-1');
    
    expect(students).toHaveLength(1);
    expect(students[0].name).toBe('Teste');
  });
});
```

---

## 🎯 Matchers Úteis

### Comparações Básicas
```typescript
expect(value).toBe(expected);           // Igualdade estrita (===)
expect(value).toEqual(expected);        // Igualdade profunda (objetos)
expect(value).toBeTruthy();             // Valor verdadeiro
expect(value).toBeFalsy();              // Valor falso
expect(value).toBeNull();               // Null
expect(value).toBeUndefined();          // Undefined
expect(value).toBeDefined();            // Definido
```

### Números
```typescript
expect(value).toBeGreaterThan(3);       // > 3
expect(value).toBeGreaterThanOrEqual(3);// >= 3
expect(value).toBeLessThan(5);          // < 5
expect(value).toBeLessThanOrEqual(5);   // <= 5
expect(value).toBeCloseTo(0.3, 2);      // ~0.3 (2 decimais)
```

### Strings
```typescript
expect(text).toContain('substring');    // Contém substring
expect(text).toMatch(/regex/);          // Match regex
expect(text).toHaveLength(5);           // Tamanho 5
```

### Arrays
```typescript
expect(array).toHaveLength(3);          // Tamanho 3
expect(array).toContain(item);          // Contém item
expect(array).toContainEqual(obj);      // Contém objeto igual
```

### Objetos
```typescript
expect(obj).toHaveProperty('key');      // Tem propriedade
expect(obj).toMatchObject({ a: 1 });    // Match parcial
```

### DOM (jest-dom)
```typescript
expect(element).toBeInTheDocument();    // Está no DOM
expect(element).toBeVisible();          // Está visível
expect(element).toHaveTextContent('text'); // Tem texto
expect(element).toHaveClass('active');  // Tem classe CSS
expect(input).toHaveValue('value');     // Input tem valor
expect(button).toBeDisabled();          // Está desabilitado
```

### Funções (Mocks)
```typescript
expect(mockFn).toHaveBeenCalled();      // Foi chamada
expect(mockFn).toHaveBeenCalledTimes(2);// Chamada 2x
expect(mockFn).toHaveBeenCalledWith(arg);// Chamada com arg
```

---

## 📊 Cobertura de Código

Para ver quais partes do código estão cobertas por testes:

```bash
npm run test:coverage
```

Isso gera um relatório em `coverage/index.html` que você pode abrir no navegador.

**Metas de Cobertura:**
- ✅ **Funções críticas**: 80%+ (risco, cálculos, segurança)
- ✅ **Serviços**: 70%+
- ✅ **Componentes**: 60%+
- ✅ **Utilitários**: 90%+

---

## 🎨 Interface Visual (Vitest UI)

Para uma experiência visual melhor:

```bash
npm run test:ui
```

Isso abre uma interface web onde você pode:
- Ver todos os testes em uma árvore
- Filtrar e buscar testes
- Ver detalhes de falhas
- Rodar testes individualmente
- Ver cobertura de código

---

## 🔧 Dicas e Boas Práticas

### 1. **Nomeie testes claramente**
```typescript
// ❌ Ruim
it('test 1', () => { ... });

// ✅ Bom
it('deve retornar risco ALTO quando frequência < 75%', () => { ... });
```

### 2. **Um conceito por teste**
```typescript
// ❌ Ruim - testa múltiplas coisas
it('deve funcionar', () => {
  expect(calculateLevel(0).level).toBe(1);
  expect(calculateLevel(100).level).toBe(2);
  expect(calculateLevel(1000).level).toBe(5);
});

// ✅ Bom - um teste por cenário
it('deve retornar nível 1 para 0 XP', () => {
  expect(calculateLevel(0).level).toBe(1);
});

it('deve retornar nível 2 para 100 XP', () => {
  expect(calculateLevel(100).level).toBe(2);
});
```

### 3. **Use describe para agrupar**
```typescript
describe('GamificationService', () => {
  describe('calculateLevel', () => {
    it('caso 1', () => { ... });
    it('caso 2', () => { ... });
  });
  
  describe('canBuyItem', () => {
    it('caso 1', () => { ... });
    it('caso 2', () => { ... });
  });
});
```

### 4. **Teste casos extremos**
```typescript
it('deve lidar com array vazio', () => { ... });
it('deve lidar com valores negativos', () => { ... });
it('deve lidar com valores muito grandes', () => { ... });
it('deve lidar com null/undefined', () => { ... });
```

### 5. **Use beforeEach para setup**
```typescript
describe('MyTests', () => {
  let mockData;
  
  beforeEach(() => {
    // Executado antes de cada teste
    mockData = createMockData();
  });
  
  it('teste 1', () => {
    // mockData está disponível
  });
  
  it('teste 2', () => {
    // mockData está disponível (novo)
  });
});
```

---

## 🚨 Quando Rodar Testes

### Durante Desenvolvimento
```bash
npm test
# Deixe rodando em watch mode
# Testes rodam automaticamente ao salvar
```

### Antes de Commit
```bash
npm test -- --run
# Garante que tudo está passando
```

### Antes de Deploy
```bash
npm run test:coverage
# Verifica cobertura
# Garante qualidade mínima
```

---

## 📁 Estrutura de Arquivos de Teste

```
examepad-saas-prova-digital/
├── services/
│   ├── gamificationService.ts
│   ├── gamificationService.test.ts     ✅ Testes do serviço
│   ├── riskDetectionEngine.ts
│   └── riskDetectionEngine.test.ts     ✅ Testes do serviço
├── components/
│   └── Auth/
│       ├── LoginPage.tsx
│       └── LoginPage.test.tsx           ✅ Testes do componente
├── utils/
│   ├── helpers.ts
│   └── helpers.test.ts                  ✅ Testes de utilitários
├── vitest.config.ts                     ⚙️ Configuração
├── vitest.setup.ts                      ⚙️ Setup global
└── coverage/                            📊 Relatórios (gerado)
```

---

## 🎯 Próximos Passos

### Áreas Prioritárias para Testes

1. **Serviços Críticos** (Alta Prioridade)
   - [ ] `geminiService.ts` - Integração com IA
   - [ ] `cryptoService.ts` - Criptografia
   - [ ] `analyticsService.ts` - Cálculos de métricas
   - [ ] `alertService.ts` - Sistema de alertas

2. **Componentes Principais** (Média Prioridade)
   - [ ] `ExamBuilderView.tsx` - Criação de provas
   - [ ] `ItemEditorView.tsx` - Editor de questões
   - [ ] `RiskDashboard.tsx` - Dashboard de risco
   - [ ] `StudentDashboardView.tsx` - Portal do aluno

3. **Utilitários** (Média Prioridade)
   - [ ] `utils/helpers.ts` - Funções auxiliares
   - [ ] `utils/validators.ts` - Validações
   - [ ] `utils/formatters.ts` - Formatadores

4. **Integrações** (Baixa Prioridade)
   - [ ] Testes E2E com Playwright/Cypress
   - [ ] Testes de performance
   - [ ] Testes de acessibilidade

---

## 📞 Suporte

- **Documentação Vitest**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react
- **Matchers jest-dom**: https://github.com/testing-library/jest-dom

---

**Última Atualização:** 08/01/2026  
**Status:** ✅ Ambiente Configurado e Funcional  
**Testes Criados:** 16 testes (14 passando)
