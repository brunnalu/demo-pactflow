# 🤝 Demo PactFlow — Testes de Contrato (Consumer-Driven Contracts)

Este projeto é uma Prova de Conceito (PoC) prática de **Contract Testing** utilizando **Node.js**, **Express**, **Pact JS (`@pact-foundation/pact`)** e integração direta com o **PactFlow** (SaaS Broker).

O objetivo desta arquitetura é demonstrar como microsserviços e aplicações frontend podem evoluir e realizar deploys de forma independente, garantindo a compatibilidade da comunicação sem depender de ambientes de homologação pesados ou testes ponta a ponta (E2E) lentos e frágeis.

---

## 🎯 Por que Testes de Contrato com PactFlow?

Em arquiteturas distribuídas e de microsserviços, os testes tradicionais de integração exigem que todos os serviços estejam disponíveis simultaneamente. Isso gera lentidão no pipeline de CI/CD, alto custo de manutenção e dificuldade para rastrear falhas.

Com a abordagem **Consumer-Driven Contracts (CDC)**:
1. **O Consumidor (`LojaFrontend`)** define exatamente quais dados e tipagens precisa receber da API, gerando um contrato em formato `.json`.
2. **O Broker (`PactFlow`)** centraliza esse contrato, gerencia o versionamento e disponibiliza uma matriz visual de compatibilidade entre equipes.
3. **O Provedor (`ProdutosAPI`)** baixa o contrato publicado, executa a validação contra sua implementação real e publica o resultado (`Verified` ou `Failed`) de volta no PactFlow.

---

## 🏗️ Arquitetura e Fluxo do Projeto

```text
┌──────────────────┐       1. Gera Contrato (.json)       ┌──────────────────┐
│   LojaFrontend   │ ───────────────────────────────────► │  Pasta /pacts    │
│   (Consumidor)   │                                      └────────┬─────────┘
└──────────────────┘                                               │
                                                                   │ 2. Publica via API
                                                                   ▼
┌──────────────────┐       3. Baixa Contrato & Valida     ┌──────────────────┐
│   ProdutosAPI    │ ◄─────────────────────────────────── │     PactFlow     │
│    (Provedor)    │ ───────────────────────────────────► │  (Cloud Broker)  │
└──────────────────┘       4. Publica Status (Verde/Verm) └──────────────────┘
```

---

## 📂 Estrutura de Diretórios

```text
demo-pactflow/
├── consumer/
│   └── consumer.pact.js    # Teste do consumidor que define as expectativas e gera o contrato
├── provider/
│   ├── server.js           # API REST real desenvolvida em Express
│   └── provider.pact.js    # Teste de verificação que valida a API real contra o contrato do PactFlow
├── pacts/                  # Diretório gerado automaticamente contendo o contrato JSON
├── publish.js              # Script responsável por publicar o contrato no PactFlow via REST API
├── package.json            # Dependências e configurações do projeto
└── README.md               # Documentação técnica do projeto
```

---

## 🔍 Explicação Técnica do Código

### 1. Lado do Consumidor (`consumer/consumer.pact.js`)
Utiliza o `PactV3` e `MatchersV3` para criar um *Mock Server* local. Em vez de validar valores fixos (hardcoded), utilizamos *Matchers* para garantir **tipagem e estrutura**:
* `MatchersV3.integer(1)`: Garante que o campo `id` seja um número inteiro.
* `MatchersV3.string('Notebook Gamer')`: Garante que o campo `nome` seja uma string.
* `MatchersV3.decimal(4500.00)`: Garante que o campo `preco` seja um número decimal (ponto flutuante), protegendo o frontend contra erros de formatação ou arredondamento.

Ao executar este teste com o runner nativo do Node (`node --test`), o Pact valida o comportamento do consumidor e gera o arquivo `pacts/LojaFrontend-ProdutosAPI.json`.

### 2. Publicação no Broker (`publish.js`)
Nas versões mais recentes do `@pact-foundation/pact` (v17+), a CLI embutida foi desacoplada. Este script realiza a publicação direta do contrato gerado para a API REST do PactFlow utilizando `HTTP PUT` autenticado via Bearer Token, vinculando o contrato à versão `1.0.0` do consumidor.

### 3. API Real (`provider/server.js`)
Uma aplicação Express leve que expõe o endpoint `GET /produtos/1`, simulando o microsserviço responsável por fornecer os dados do catálogo.

### 4. Verificação do Provedor (`provider/provider.pact.js`)
Utiliza o `Verifier` do Pact para:
* Subir a API Express real localmente (`localhost:8081`).
* Conectar-se ao PactFlow utilizando `consumerVersionSelectors: [{ latest: true }]` para buscar a versão mais recente do contrato do consumidor.
* Disparar a requisição real contra a API e comparar a resposta com o contrato.
* Publicar o resultado da verificação (`publishVerificationResult: true`) diretamente na matriz do PactFlow.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* **Node.js** (v20 ou superior recomendado)
* Uma conta gratuita no [PactFlow](https://pactflow.io) com um **Read/Write API Token**

### Passo 1: Instalação
Clone o repositório e instale as dependências:
```bash
git clone https://github.com
cd demo-pactflow
npm install
```

### Passo 2: Gerar o Contrato (Consumidor)
Execute o teste do consumidor para criar o arquivo de contrato na pasta `pacts/`:
```bash
node --test consumer/consumer.pact.js
```

### Passo 3: Configurar Credenciais e Publicar no PactFlow
Configure as variáveis de ambiente com a URL da sua instância e seu token de leitura/gravação:

**No Windows (PowerShell):**
```powershell
\$env:PACT_BROKER_BASE_URL="https://pactflow.io"
\$env:PACT_BROKER_TOKEN="seu-token-read-write"
node publish.js
```

**No Linux / macOS:**
```bash
export PACT_BROKER_BASE_URL="https://pactflow.io"
export PACT_BROKER_TOKEN="seu-token-read-write"
node publish.js
```

### Passo 4: Validar o Contrato (Provedor)
Execute a verificação do provedor para validar a API real e atualizar o status no PactFlow para **Verified (Verde)**:
```bash
node --test provider/provider.pact.js
```

---

## 🧪 Simulando uma Quebra de Contrato (Demonstração Prática)

Para observar o PactFlow bloqueando uma regressão antes que ela chegue em produção:
1. Abra o arquivo `provider/server.js` e altere o campo `nome` para `titulo` (ou altere `preco` de `4500.50` para um inteiro `4500`).
2. Execute novamente `node --test provider/provider.pact.js`.
3. O teste falhará apontando exatamente a divergência (`BodyMismatch`) e atualizará o painel do PactFlow para **Failed (Vermelho)**, impedindo um deploy inseguro na esteira de CI/CD.

---

## 🛠️ Tecnologias Utilizadas

* **Node.js** (`node:test` & `node:assert` nativos)
* **Pact JS** (`@pact-foundation/pact` v17)
* **PactFlow** (Gerenciamento e Matriz de Compatibilidade de Contratos)
* **Express** (Servidor HTTP do Provedor)
* **Axios** (Cliente HTTP do Consumidor e Script de Publicação)
