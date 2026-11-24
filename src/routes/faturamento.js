const express = require('express');
const pool = require('../db');

const router = express.Router();

// Chama a funcao faturamento_total
router.get('/', async (req, res) => {
  const resultado = await pool.query(
    `SELECT faturamento_total($1) AS faturamento, total_atendimentos
     FROM usuarios WHERE id = $1`,
    [req.usuarioId]
  );
  res.json(resultado.rows[0]);
});

module.exports = router;
