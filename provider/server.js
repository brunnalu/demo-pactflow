const express = require('express');
const app = express();

app.get('/produtos/1', (req, res) => {
  res.json({
    id: 1,
    nome: 'Notebook Gamer',
    preco: 4500.50
  });
});

module.exports = app;

