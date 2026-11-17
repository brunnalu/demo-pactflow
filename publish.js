const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function publicarContrato() {
  const brokerUrl = process.env.PACT_BROKER_BASE_URL;
  const token = process.env.PACT_BROKER_TOKEN;
  const pactFile = path.resolve(__dirname, 'pacts', 'LojaFrontend-ProdutosAPI.json');
  const pactContent = JSON.parse(fs.readFileSync(pactFile, 'utf8'));

  const url = `${brokerUrl}/pacts/provider/ProdutosAPI/consumer/LojaFrontend/version/1.0.0`;

  try {
    await axios.put(url, pactContent, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Contrato publicado com sucesso no PactFlow!');
  } catch (error) {
    console.error('❌ Erro ao publicar:', error.response ? error.response.data : error.message);
  }
}

publicarContrato();
