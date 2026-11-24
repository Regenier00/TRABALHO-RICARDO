function criarErro(status, mensagem) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

function tratarErros(err, req, res, next) {
  // P0001 = erro lancado pelo banco (RAISE EXCEPTION na trigger ou procedure)
  if (err.code === 'P0001') {
    return res.status(400).json({ erro: err.message });
  }

  if (err.status) {
    return res.status(err.status).json({ erro: err.message });
  }

  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor' });
}

module.exports = { criarErro, tratarErros };
