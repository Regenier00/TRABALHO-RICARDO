require('dotenv').config({ quiet: true });
const express = require('express');

const log = require('./middlewares/log');
const autenticar = require('./middlewares/auth');
const { criarErro, tratarErros } = require('./middlewares/erros');

const authRotas = require('./routes/auth');
const servicosRotas = require('./routes/servicos');
const agendamentosRotas = require('./routes/agendamentos');
const faturamentoRotas = require('./routes/faturamento');

const app = express();

app.use(express.json());
app.use(log);
app.use(express.static('public'));

app.use('/auth', authRotas);
app.use('/servicos', autenticar, servicosRotas);
app.use('/agendamentos', autenticar, agendamentosRotas);
app.use('/faturamento', autenticar, faturamentoRotas);

app.use((req, res) => {
  throw criarErro(404, 'Rota nao encontrada');
});

app.use(tratarErros);

const porta = process.env.PORT || 3000;
app.listen(porta, () => {
  console.log(`Servidor rodando em http://localhost:${porta}`);
});
