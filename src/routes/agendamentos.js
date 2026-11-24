const express = require('express');
const pool = require('../db');
const { criarErro } = require('../middlewares/erros');

const router = express.Router();

const SELECT_AGENDAMENTO = `
  SELECT a.id, a.servico_id, s.nome AS servico_nome, s.preco, a.cliente_nome,
         a.cliente_telefone, to_char(a.data_hora, 'YYYY-MM-DD"T"HH24:MI') AS data_hora, a.status
  FROM agendamentos a
  JOIN servicos s ON s.id = a.servico_id
  WHERE s.usuario_id = $1
`;

async function validarAgendamento(dados, usuarioId) {
  const { servico_id, cliente_nome, cliente_telefone, data_hora } = dados;

  if (!servico_id || !cliente_nome || !cliente_telefone || !data_hora) {
    throw criarErro(400, 'Servico, nome do cliente, telefone e data/hora sao obrigatorios');
  }
  if (isNaN(Date.parse(data_hora))) {
    throw criarErro(400, 'Data/hora invalida');
  }

  const servico = await pool.query(
    'SELECT id FROM servicos WHERE id = $1 AND usuario_id = $2',
    [servico_id, usuarioId]
  );
  if (servico.rows.length === 0) {
    throw criarErro(400, 'Servico invalido');
  }
}

router.get('/', async (req, res) => {
  const resultado = await pool.query(SELECT_AGENDAMENTO + ' ORDER BY a.data_hora', [req.usuarioId]);
  res.json(resultado.rows);
});

router.get('/:id', async (req, res) => {
  const resultado = await pool.query(SELECT_AGENDAMENTO + ' AND a.id = $2', [req.usuarioId, req.params.id]);
  if (resultado.rows.length === 0) {
    throw criarErro(404, 'Agendamento nao encontrado');
  }
  res.json(resultado.rows[0]);
});

router.post('/', async (req, res) => {
  await validarAgendamento(req.body, req.usuarioId);
  const { servico_id, cliente_nome, cliente_telefone, data_hora } = req.body;

  const resultado = await pool.query(
    `INSERT INTO agendamentos (servico_id, cliente_nome, cliente_telefone, data_hora)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [servico_id, cliente_nome, cliente_telefone, data_hora]
  );
  res.status(201).json(resultado.rows[0]);
});

router.put('/:id', async (req, res) => {
  await validarAgendamento(req.body, req.usuarioId);
  const { servico_id, cliente_nome, cliente_telefone, data_hora } = req.body;

  const resultado = await pool.query(
    `UPDATE agendamentos a
     SET servico_id = $1, cliente_nome = $2, cliente_telefone = $3, data_hora = $4
     FROM servicos s
     WHERE a.id = $5 AND s.id = a.servico_id AND s.usuario_id = $6
     RETURNING a.*`,
    [servico_id, cliente_nome, cliente_telefone, data_hora, req.params.id, req.usuarioId]
  );
  if (resultado.rows.length === 0) {
    throw criarErro(404, 'Agendamento nao encontrado');
  }
  res.json(resultado.rows[0]);
});

router.delete('/:id', async (req, res) => {
  const resultado = await pool.query(
    `DELETE FROM agendamentos a
     USING servicos s
     WHERE a.id = $1 AND s.id = a.servico_id AND s.usuario_id = $2`,
    [req.params.id, req.usuarioId]
  );
  if (resultado.rowCount === 0) {
    throw criarErro(404, 'Agendamento nao encontrado');
  }
  res.status(204).send();
});

// Chama a procedure concluir_agendamento
router.put('/:id/concluir', async (req, res) => {
  const existe = await pool.query(SELECT_AGENDAMENTO + ' AND a.id = $2', [req.usuarioId, req.params.id]);
  if (existe.rows.length === 0) {
    throw criarErro(404, 'Agendamento nao encontrado');
  }

  await pool.query('CALL concluir_agendamento($1)', [req.params.id]);
  res.json({ mensagem: 'Agendamento concluido' });
});

module.exports = router;
