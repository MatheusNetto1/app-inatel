# Inatel Móvel — Tesouraria & Documentos

> Protótipo frontend para a disciplina de **Interação Homem-Máquina (IHM)** — módulo de tesouraria e emissão de documentos acadêmicos do INATEL.

**Demo:** [MatheusNetto1.github.io/app-inatel](https://MatheusNetto1.github.io/app-inatel)

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [Arquitetura](#arquitetura)
4. [Stack Técnica](#stack-técnica)
5. [Estrutura de Pastas](#estrutura-de-pastas)
6. [Módulos JavaScript](#módulos-javascript)
7. [Design System](#design-system)
8. [Testes](#testes)
9. [CI/CD](#cicd)
10. [Instalação e Uso](#instalação-e-uso)
11. [Makefile](#makefile)

---

## Visão Geral

O **app-inatel** é um protótipo de alta fidelidade mobile-first que simula o módulo de **Tesouraria & Documentos** de um aplicativo institucional do INATEL. Foi desenvolvido como projeto prático da disciplina de IHM, com foco em usabilidade, navegação entre telas, feedback visual e fluxos de pagamento.

O app roda inteiramente no navegador sem nenhum backend: toda a lógica de estado, navegação entre telas e persistência em memória são implementadas com JavaScript puro (ES Modules), sem frameworks.

### Principais decisões de design

- **Zero dependências de runtime** — apenas Vite como bundler/dev server. Nenhum React, Vue ou similar.
- **ES Modules nativos** — `import`/`export` sem transpilação extra; o navegador moderno consome diretamente.
- **Estado centralizado** — módulo `state.js` como única fonte da verdade, com getters e setters explícitos.
- **Mockup mobile no desktop** — a shell `.phone-shell` simula um iPhone com `border-radius`, sombras e dimensões fixas (`390×844 px`) acima de `600px` de viewport.

---

## Funcionalidades

### Tela 1 — Menu Principal
- Listagem de serviços do app (Notas, Horário, Tesouraria, Biblioteca).
- Card de pendência destacada (taxa em aberto).
- Bottom navigation com ícones.

### Tela 2 — Catálogo de Documentos
- Quatro documentos disponíveis: dois gratuitos e dois pagos.
- Seleção única com indicador visual (borda azul + checkmark animado).
- Rodapé dinâmico com valor total e botão de avanço (desabilitado até seleção).
- Documentos gratuitos pulam a tela de pagamento e vão direto ao overlay de sucesso.

### Tela 3 — Pagamento
- **Aba Pix:** QR Code SVG estático + código Copia e Cola + timer regressivo de 10 minutos.
  - Timer muda para estado de alerta (fundo vermelho) nos últimos 2 minutos.
  - Ao expirar, o QR é esmaecido e o texto do timer é substituído por ícone de erro.
  - Botão "Copiar" troca seu estado visual para "Copiado!" por 2,5 s.
- **Aba Cartão:** Formulário com máscara automática de número (grupos de 4) e validade (`MM/AA`). Select de parcelamento calculado dinamicamente (até 3×, sem juros).
- Overlay de processamento (spinner) → overlay de sucesso com protocolo gerado.

### Tela 4 — Minhas Solicitações
- Lista de solicitações em ordem decrescente (mais recente no topo).
- Cards com status codificado por cor: **Disponível** (verde), **Processando** (azul), **Pendente** (âmbar).
- Botão de download para documentos prontos com toast de confirmação duplo.
- Estado inicial com uma solicitação pré-existente.

---

## Arquitetura

```
┌──────────────────────────────────────────────────┐
│                   index.html                     │
│  4 screens (divs) + 2 overlays + toast           │
│  Toda navegação é feita via classList (active)   │
└────────────────┬─────────────────────────────────┘
                 │ <script type="module">
                 ▼
┌────────────────────────────┐
│          app.js            │  ← controlador principal
│  - Funções de navegação    │    expõe globais (window.*)
│  - Render de listas        │    para event handlers inline
│  - Lógica de pagamento     │    no HTML
└──────┬──────────┬──────────┘
       │          │
       ▼          ▼
┌──────────┐  ┌──────────┐
│ state.js │  │ utils.js │
│ (estado) │  │ (puro)   │
└──────────┘  └──────────┘
```

### Padrão de navegação

A navegação entre telas é feita por manipulação de classe CSS `.active` em elementos `<div class="screen">`. O histórico de telas é mantido em `state.screenHistory` (pilha LIFO), permitindo a função `goBack()` sem `window.history`.

```
screen-menu ──goTo──► screen-catalog ──goTo──► screen-payment
     ▲                      ▲                       │
     └──────goBack()────────┘◄──────goBack()────────┘
```

### Ciclo de vida do timer Pix

```
goTo('screen-payment')
    └─► renderPaymentScreen()
    └─► startTimer()
            └─► setInterval (1 s)
                    └─► decrementTimer()
                    └─► renderTimerDisplay()
                    └─► [se segundos <= 0] expirePix() + stopTimer()

switchTab('card') ──► stopTimer()
switchTab('pix')  ──► startTimer()   ← guarda contra múltiplos intervalos
goBack()          ──► stopTimer()
```

`startTimer()` verifica `getTimerInterval() !== null` antes de criar um novo intervalo, evitando múltiplos `setInterval` simultâneos.

---

## Stack Técnica

| Categoria | Ferramenta | Versão |
|---|---|---|
| Dev server / bundler | [Vite](https://vitejs.dev/) | ^8.0 |
| Testes unitários | [Vitest](https://vitest.dev/) | ^4.1 |
| Cobertura | @vitest/coverage-v8 | ^4.1 |
| Testes E2E | [Playwright](https://playwright.dev/) | ^1.44 |
| Runtime JS | Vanilla ES Modules | — |
| Estilização | CSS custom properties (design system próprio) | — |
| CI/CD | GitHub Actions | — |
| Hospedagem | GitHub Pages | — |

Nenhuma dependência de produção (`dependencies` vazio no `package.json`).

---

## Estrutura de Pastas

```
app-inatel/
├── .github/
│   └── workflows/
│       ├── deploy-release.yml   # Deploy automático para GitHub Pages
│       └── tests.yml            # CI de testes (unit + E2E) em PRs e pushes
├── src/
│   ├── assets/
│   │   └── logo-Inatel.svg
│   ├── css/
│   │   └── style.css            # Design system completo (variáveis, componentes)
│   └── js/
│       ├── app.js               # Controlador principal, globais de navegação
│       ├── state.js             # Estado centralizado com getters/setters exportados
│       └── utils.js             # Funções puras de formatação e geração
├── tests/
│   ├── e2e/
│   │   ├── catalog.spec.js      # 10 testes: seleção, footer, navegação
│   │   ├── payment.spec.js      # 14 testes: Pix, cartão, timer, overlays
│   │   └── requests.spec.js     # 14 testes: estados, badges, download
│   └── unit/
│       ├── state.test.js        # 22 testes: selectedDoc, timer, history, requests
│       └── utils.test.js        # 37 testes: formatadores e geradores
├── index.html                   # SPA com todas as telas inline
├── package.json
├── playwright.config.js
├── vitest.config.js
└── Makefile
```

---

## Módulos JavaScript

### `state.js` — Estado Centralizado

Módulo de estado com objeto privado `state` e API pública de getters/setters. **Nenhum componente modifica `state` diretamente.**

```
state
├── selectedDoc: SelectedDoc | null     — documento selecionado no catálogo
├── timerInterval: number | null        — ID do setInterval do Pix
├── timerSeconds: number                — segundos restantes (inicial: 600)
├── screenHistory: string[]             — pilha de IDs de telas (navegação)
└── requests: DocumentRequest[]        — histórico de solicitações
```

**Tipos exportados:**

```typescript
type RequestStatus = 'done' | 'pending' | 'processing';

interface SelectedDoc {
  name:     string;
  price:    number;
  deadline: string;
}

interface DocumentRequest {
  id:       number;       // Date.now()
  name:     string;
  protocol: string;       // ex: "#20260412"
  date:     string;       // ex: "20/06/2026"
  status:   RequestStatus;
  price:    number;
}
```

**Constante exportada:**

| Constante | Valor | Descrição |
|---|---|---|
| `TIMER_INITIAL` | `600` | Duração do timer Pix em segundos (10 min) |

**API completa:**

| Função | Descrição |
|---|---|
| `getSelectedDoc()` | Retorna o documento selecionado ou `null` |
| `setSelectedDoc(doc)` | Define o documento selecionado |
| `clearSelectedDoc()` | Limpa a seleção |
| `getTimerSeconds()` | Segundos restantes no timer |
| `decrementTimer()` | Decrementa 1 s (floor em 0) |
| `resetTimer()` | Restaura `TIMER_INITIAL` |
| `getTimerInterval()` | ID do `setInterval` ativo |
| `setTimerInterval(id)` | Armazena o ID |
| `clearTimerInterval()` | Cancela e limpa o intervalo |
| `getScreenHistory()` | Array de telas no histórico |
| `pushScreen(id)` | Empilha uma tela |
| `popScreen()` | Desempilha a última tela ou `null` |
| `getRequests()` | Array de solicitações |
| `addRequest(status)` | Cria e adiciona uma solicitação; lança `Error` se `selectedDoc` for null |
| `resetRequests()` | Volta ao estado inicial (uma solicitação pré-existente) |

---

### `utils.js` — Funções Puras

Todas as funções são **puras** (sem efeitos colaterais, sem acesso ao DOM ou ao estado global) e exportadas individualmente.

| Função | Assinatura | Exemplo |
|---|---|---|
| `formatCurrency` | `(value: number) => string` | `15.5` → `"15,50"` |
| `formatTime` | `(totalSeconds: number) => string` | `605` → `"10:05"` |
| `formatCardNumber` | `(raw: string) => string` | `"1234567890123456"` → `"1234 5678 9012 3456"` |
| `formatExpiry` | `(raw: string) => string` | `"1225"` → `"12/25"` |
| `generateProtocol` | `() => string` | `"#20260412"` |
| `todayFormatted` | `() => string` | `"20/06/2026"` |
| `buildInstallments` | `(price: number, maxInstallments?: number) => Array<{label, value}>` | ver abaixo |
| `isTimerWarning` | `(seconds: number) => boolean` | `119` → `true` |

**`generateProtocol()`** combina o ano atual com 4 dígitos aleatórios, produzindo o formato `#AAAANNNN` (9 caracteres no total).

**`buildInstallments(price, maxInstallments = 3)`** retorna um array de objetos com `label` (ex: `"2x de R$ 7,50 (sem juros)"`) e `value` (valor por parcela). O parcelamento é sempre sem juros.

**`isTimerWarning(seconds)`** retorna `true` quando `seconds < 120` (menos de 2 minutos).

---

### `app.js` — Controlador Principal

Importa `state.js` e `utils.js`. Expõe funções no escopo global (`window.*`) para que os event handlers inline do HTML possam acessá-las.

**Funções globais expostas:**

| Função global | Descrição |
|---|---|
| `goTo(screenId, addToHistory?)` | Navega para uma tela, dispara efeitos colaterais (timer, render) |
| `goBack()` | Desempilha o histórico e retorna à tela anterior |
| `goToRequests()` | Fecha o overlay de sucesso e navega para Tela 4 |
| `selectDoc(card)` | Marca um card como selecionado e atualiza o rodapé |
| `goToPayment()` | Avança para pagamento ou abre overlay de sucesso (documentos gratuitos) |
| `switchTab(tab)` | Alterna entre abas Pix e Cartão na Tela 3 |
| `copyPix()` | Copia o código Pix, atualiza estado visual do botão, exibe toast |
| `confirmPayment()` | Simula processamento (2 s) e exibe overlay de sucesso |
| `downloadPDF(protocol, name)` | Exibe toast de download (simulado) |
| `formatCard(input)` | Máscara de número de cartão (oninput) |
| `formatExpiry(input)` | Máscara de validade (oninput) |
| `showToast(msg)` | Exibe toast temporário (2,8 s) |

---

## Design System

O arquivo `src/css/style.css` implementa o design system completo via **CSS custom properties**.

### Paleta de cores

| Variável | Valor | Uso |
|---|---|---|
| `--inatel-blue` | `#003366` | Cor primária, headers, botões |
| `--inatel-blue-mid` | `#1a4080` | Hover de botões |
| `--inatel-blue-light` | `#2a5caa` | Ícones, estados ativos |
| `--inatel-red` | `#c0392b` | Destaque, badges, avatar |
| `--green` | `#27ae60` | Status "Disponível", sucesso |
| `--amber` | `#e67e22` | Alertas, status "Pendente", timer de alerta |

### Componentes

| Componente | Classe | Descrição |
|---|---|---|
| Shell de tela | `.screen` + `.phone-shell` | Container de cada tela; `.active` exibe, demais ocultam |
| Header padrão | `.app-header` | Azul escuro, usuário com avatar |
| Header interno | `.app-header--inner` | Com botão voltar e título centralizado |
| Item de menu | `.menu-item` | Botão de linha com ícone, texto e seta |
| Card de documento | `.doc-card` | Selecionável; `.selected` aplica borda azul |
| Card de solicitação | `.request-card` | Com borda esquerda colorida por status |
| Overlay | `.overlay` | Full-screen com blur; `.active` exibe |
| Toast | `.toast` | Fixed, bottom-center; `.show` anima entrada |
| Bottom nav | `.bottom-nav` + `.bottom-nav-item` | 3 itens; `--active` em azul escuro |

### Responsividade

- **`≥ 600px` (desktop):** App renderiza como mockup de celular centralizado, com `border-radius: 40px`, sombra dupla simulando bordas do aparelho, e fundo gradiente cinza.
- **`< 600px` (mobile real):** App ocupa toda a tela (`100dvh`), `safe-area-inset-top` no header.
- **`prefers-reduced-motion`:** Todas as animações e transições são reduzidas a `0.01ms`.

---

## Testes

O projeto conta com **dois níveis de teste** totalmente independentes.

### Testes Unitários — Vitest

Cobrem os módulos `state.js` e `utils.js` com isolamento completo entre casos (hook `beforeEach` faz reset do estado). Rodam em Node.js sem navegador.

```
tests/unit/
├── state.test.js    — 22 testes
│   ├── selectedDoc  (4 casos)
│   ├── timer        (8 casos)
│   ├── screenHistory(5 casos)
│   └── addRequest   (7 casos)
└── utils.test.js    — 37 testes
    ├── formatCurrency     (5 casos)
    ├── formatTime         (5 casos)
    ├── formatCardNumber   (7 casos)
    ├── formatExpiry       (6 casos)
    ├── buildInstallments  (8 casos)
    ├── isTimerWarning     (3 casos)
    ├── generateProtocol   (5 casos)
    └── todayFormatted     (2 casos)
```

**Casos notáveis:**
- `decrementTimer` não vai abaixo de 0, mesmo com mais chamadas que `TIMER_INITIAL`.
- `addRequest` lança `Error` com mensagem específica se `selectedDoc` for `null`.
- `generateProtocol` gera valores distintos em 30 chamadas consecutivas (teste probabilístico).
- `clearTimerInterval` não lança erro quando o intervalo já é `null`.

### Testes E2E — Playwright

Simulam fluxos reais de usuário no navegador (Chromium por padrão). Cobrem três arquivos de spec com foco em navegação, interação e renderização de estado.

```
tests/e2e/
├── catalog.spec.js    — 10 testes
│   ├── Listagem de documentos e badges
│   ├── Seleção e estado do botão de avanço
│   ├── Rodapé dinâmico (valor e "Gratuito")
│   ├── Restrição de seleção única
│   └── Fluxos gratuito e pago
├── payment.spec.js    — 14 testes
│   ├── Resumo e estrutura da tela
│   ├── Timer inicial, botão copiar
│   ├── Fluxo completo Pix → overlay → protocolo → Tela 4
│   ├── Troca de abas (Pix ↔ Cartão)
│   ├── Formulário de cartão e máscaras
│   ├── Select de parcelamento dinâmico
│   └── Confirmar via Cartão → overlay de sucesso
└── requests.spec.js   — 14 testes
    ├── Estado inicial (1 solicitação pré-existente)
    ├── Após pagamento pago: card, status, valor, download, toast
    ├── Após solicitação gratuita: status "Processando", sem botão download
    └── Navegação: "Nova solicitação" e botão voltar
```

**Helper `goToPaymentScreen`** (compartilhado nos specs de pagamento): encapsula o caminho `/ → catálogo → selecionar Histórico → avançar → tela de pagamento`, eliminando repetição entre testes.

### Comandos de teste

```bash
# Unitários
npm run test:unit           # execução única
npm run test:unit:watch     # modo watch
npm run test:unit:cov       # com relatório de cobertura (v8)

# E2E
npm run test:e2e            # headless
npm run test:e2e:ui         # interface gráfica do Playwright
npm run test:e2e:debug      # passo a passo com inspetor

# Ambos
npm test
```

---

## CI/CD

### `tests.yml` — Verificação contínua

Disparado em **push** e **pull request** para qualquer branch.

```
jobs:
  test
    ├── checkout
    ├── setup Node.js
    ├── npm ci
    ├── npx playwright install --with-deps
    ├── npm run test:unit:cov     → relatório de cobertura
    └── npm run test:e2e          → testes E2E headless
```

### `deploy-release.yml` — Deploy para GitHub Pages

Disparado em **push para `main`** (ou em criação de release, conforme configuração). Faz build com Vite e publica o diretório `dist/` no branch `gh-pages`.

---

## Instalação e Uso

**Pré-requisitos:** Node.js ≥ 18.

```bash
# 1. Clonar
git clone https://github.com/MatheusNetto1/app-inatel.git
cd app-inatel

# 2. Instalar dependências
npm install

# 3. Iniciar dev server
npm run dev
# → http://localhost:5173
```

Para instalar os navegadores do Playwright na primeira vez:

```bash
npx playwright install
```

---

## Makefile

O projeto inclui um `Makefile` com atalhos para todos os fluxos comuns:

| Alvo | Descrição |
|---|---|
| `make help` | Lista todos os alvos disponíveis |
| `make install` | `npm install` |
| `make dev` | Inicia o Vite dev server |
| `make preview` | Serve a build local para conferência |
| `make test` | Unitários + E2E |
| `make test-unit` | Unitários (execução única) |
| `make test-unit-watch` | Unitários em modo watch |
| `make test-unit-cov` | Unitários com cobertura |
| `make test-e2e` | E2E headless |
| `make test-e2e-ui` | Interface gráfica do Playwright |
| `make test-e2e-debug` | Playwright em modo debug |
| `make playwright-install` | Instala os navegadores do Playwright |
| `make ci` | Simula a verificação principal do CI localmente |
| `make clean` | Remove `dist/`, `coverage/`, `test-results/`, `playwright-report/` |
| `make clean-reports` | Remove apenas relatórios de teste |

---

## Licença

MIT © [Matheus Netto](https://github.com/MatheusNetto1)