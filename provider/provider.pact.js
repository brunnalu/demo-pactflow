const { describe, it, before, after } = require('node:test');
const { Verifier } = require('@pact-foundation/pact');
const app = require('./server');

describe('Verificação do Provedor - ProdutosAPI', () => {
  let server;

  before((_, done) => {
    server = app.listen(8081, done);
  });

  after((_, done) => {
    server.close(done);
  });

  it('valida o contrato publicado no PactFlow', async () => {
    const opts = {
      provider: 'ProdutosAPI',
      providerBaseUrl: 'http://localhost:8081',
      pactBrokerUrl: process.env.PACT_BROKER_BASE_URL,
      pactBrokerToken: process.env.PACT_BROKER_TOKEN,
      consumerVersionSelectors: [{ latest: true }],
      publishVerificationResult: true,
      providerVersion: '1.0.0',
      providerVersionBranch: 'main'
    };

    await new Verifier(opts).verifyProvider();
  });
});
