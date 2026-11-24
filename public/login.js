const mensagem = document.getElementById('mensagem');

async function enviar(url, dados) {
  const resposta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  const json = await resposta.json();
  if (!resposta.ok) {
    throw new Error(json.erro);
  }
  return json;
}

document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const dados = await enviar('/auth/login', {
      email: document.getElementById('loginEmail').value,
      senha: document.getElementById('loginSenha').value
    });
    localStorage.setItem('token', dados.token);
    localStorage.setItem('nome', dados.nome);
    window.location.href = 'painel.html';
  } catch (erro) {
    mensagem.textContent = erro.message;
  }
});

document.getElementById('formCadastro').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await enviar('/auth/cadastro', {
      nome: document.getElementById('cadNome').value,
      email: document.getElementById('cadEmail').value,
      senha: document.getElementById('cadSenha').value
    });
    mensagem.textContent = 'Cadastro realizado! Agora faca o login.';
    e.target.reset();
  } catch (erro) {
    mensagem.textContent = erro.message;
  }
});
