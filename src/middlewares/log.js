function log(req, res, next) {
  const inicio = Date.now();

  res.on('finish', () => {
    const tempo = Date.now() - inicio;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${tempo}ms`);
  });

  next();
}

module.exports = log;
