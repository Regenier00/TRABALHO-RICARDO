const express = require('express');
const pool = require('../db');
const { criarErro } = require('../middlewares/erros');

const router = express.Router();

function validarServico(dados) {
  const { nome, preco, duracao } = dados;

  if (!nome || preco === undefined || duracao === undefined) {
    throw criarErro(400, 'Nome, preco e duracao sao obrigatorios');
  }
  if (isNaN(preco) || Number(preco) < 0) {
    throw criarErro(400, 'Preco invalido');
  }
  if (!Number.isInteger(Number(duracao)) || Number(duracao) <= 0) {
    throw criarErro(400, 'Duracao deve ser um numero inteiro de minutos');
  }
}

router.get('/', async (req, res) => {
  const resultado = await pool.query(
    'SELECT * FROM servicos WHERE usuario_id = $1 ORDER BY nome',
    [req.usuarioId]
  );
  res.json(resultado.rows);
});

router.get('/:id', async (req, res) => {
  const resultado = await pool.query(
    'SELECT * FROM servicos WHERE id = $1 AND usuario_id = $2',
    [req.params.id, req.usuarioId]
  );
  if (resultado.rows.length === 0) {
    throw criarErro(404, 'Servico nao encontrado');
  }
  res.json(resultado.rows[0]);
});

router.post('/', async (req, res) => {
  validarServico(req.body);
  const { nome, preco, duracao } = req.body;

  const resultado = await pool.query(
    'INSERT INTO servicos (usuario_id, nome, preco, duracao) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.usuarioId, nome, preco, duracao]
  );
  res.status(201).json(resultado.rows[0]);
});

router.put('/:id', async (req, res) => {
  validarServico(req.body);
  const { nome, preco, duracao } = req.body;

  const resultado = await pool.query(
    'UPDATE servicos SET nome = $1, preco = $2, duracao = $3 WHERE id = $4 AND usuario_id = $5 RETURNING *',
    [nome, preco, duracao, req.params.id, req.usuarioId]
  );
  if (resultado.rows.length === 0) {
    throw criarErro(404, 'Servico nao encontrado');
  }
  res.json(resultado.rows[0]);
});

router.delete('/:id', async (req, res) => {
  const resultado = await pool.query(
    'DELETE FROM servicos WHERE id = $1 AND usuario_id = $2',
    [req.params.id, req.usuarioId]
  );
  if (resultado.rowCount === 0) {
    throw criarErro(404, 'Servico nao encontrado');
  }
  res.status(204).send();
});

module.exports = router;
