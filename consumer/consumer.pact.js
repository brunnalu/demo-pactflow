const { describe, it } = require('node:test');
const assert = require('node:assert');
const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const axios = require('axios');
const path = require('path');

const provider = new PactV3({
  consumer: 'LojaFrontend',
  provider: 'ProdutosAPI',
  dir: path.resolve(process.cwd(), 'pacts'),
});

describe('Contrato: LojaFrontend -> ProdutosAPI', () => {
  it('retorna os detalhes do produto 1', async () => {
    provider
      .given('produto 1 existe')
      .uponReceiving('uma requisição GET para /produtos/1')
      .withRequest({ method: 'GET', path: '/produtos/1' })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: MatchersV3.integer(1),
          nome: MatchersV3.string('Notebook Gamer'),
          preco: MatchersV3.decimal(4500.00)
        }
      });

    await provider.executeTest(async (mockServer) => {
      const res = await axios.get(`${mockServer.url}/produtos/1`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.nome, 'Notebook Gamer');
    });
  });
});
