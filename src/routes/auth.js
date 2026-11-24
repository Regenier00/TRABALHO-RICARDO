const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { criarErro } = require('../middlewares/erros');

const router = express.Router();

router.post('/cadastro', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    throw criarErro(400, 'Nome, email e senha sao obrigatorios');
  }
  if (!email.includes('@')) {
    throw criarErro(400, 'Email invalido');
  }
  if (senha.length < 6) {
    throw criarErro(400, 'A senha deve ter no minimo 6 caracteres');
  }

  const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
  if (existe.rows.length > 0) {
    throw criarErro(400, 'Email ja cadastrado');
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const resultado = await pool.query(
    'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
    [nome, email, senhaHash]
  );

  res.status(201).json(resultado.rows[0]);
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    throw criarErro(400, 'Email e senha sao obrigatorios');
  }

  const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
  const usuario = resultado.rows[0];

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
    throw criarErro(401, 'Email ou senha incorretos');
  }

  const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token, nome: usuario.nome });
});

module.exports = router;
