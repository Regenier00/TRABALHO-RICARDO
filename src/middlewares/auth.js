const jwt = require('jsonwebtoken');
const { criarErro } = require('./erros');

function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    throw criarErro(401, 'Token nao informado');
  }

  const token = cabecalho.replace('Bearer ', '');

  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = dados.id;
    next();
  } catch {
    throw criarErro(401, 'Token invalido ou expirado');
  }
}

module.exports = autenticar;
