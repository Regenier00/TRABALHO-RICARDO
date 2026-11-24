const mensagem = document.getElementById('mensagem');
let servicos = [];
let agendamentos = [];

if (!localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

document.getElementById('nomeUsuario').textContent = localStorage.getItem('nome');

function sair() {
  localStorage.removeItem('token');
  localStorage.removeItem('nome');
  window.location.href = 'index.html';
}

document.getElementById('sair').addEventListener('click', sair);

async function api(metodo, url, dados) {
  const resposta = await fetch(url, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: dados ? JSON.stringify(dados) : undefined
  });

  if (resposta.status === 401) {
    sair();
    return;
  }
  if (resposta.status === 204) {
    return;
  }

  const json = await resposta.json();
  if (!resposta.ok) {
    throw new Error(json.erro);
  }
  return json;
}

async function executar(acao) {
  mensagem.textContent = '';
  try {
    await acao();
  } catch (erro) {
    mensagem.textContent = erro.message;
  }
}

// Resumo

async function carregarResumo() {
  const dados = await api('GET', '/faturamento');
  document.getElementById('totalAtendimentos').textContent = dados.total_atendimentos;
  document.getElementById('faturamento').textContent = 'R$ ' + Number(dados.faturamento).toFixed(2);
}

// Servicos

async function carregarServicos() {
  servicos = await api('GET', '/servicos');

  const tabela = document.getElementById('listaServicos');
  const select = document.getElementById('agendamentoServico');
  tabela.innerHTML = '';
  select.innerHTML = '';

  servicos.forEach((s) => {
    tabela.innerHTML += `
      <tr>
        <td>${s.nome}</td>
        <td>R$ ${Number(s.preco).toFixed(2)}</td>
        <td>${s.duracao} min</td>
        <td>
          <button onclick="editarServico(${s.id})">Editar</button>
          <button onclick="removerServico(${s.id})">Remover</button>
        </td>
      </tr>`;
    select.innerHTML += `<option value="${s.id}">${s.nome}</option>`;
  });
}

function editarServico(id) {
  const s = servicos.find((item) => item.id === id);
  document.getElementById('servicoId').value = s.id;
  document.getElementById('servicoNome').value = s.nome;
  document.getElementById('servicoPreco').value = s.preco;
  document.getElementById('servicoDuracao').value = s.duracao;
}

function removerServico(id) {
  if (!confirm('Remover este servico? Os agendamentos dele tambem serao removidos.')) return;
  executar(async () => {
    await api('DELETE', '/servicos/' + id);
    await carregarTudo();
  });
}

document.getElementById('formServico').addEventListener('submit', (e) => {
  e.preventDefault();
  executar(async () => {
    const id = document.getElementById('servicoId').value;
    const dados = {
      nome: document.getElementById('servicoNome').value,
      preco: document.getElementById('servicoPreco').value,
      duracao: document.getElementById('servicoDuracao').value
    };

    if (id) {
      await api('PUT', '/servicos/' + id, dados);
    } else {
      await api('POST', '/servicos', dados);
    }

    e.target.reset();
    document.getElementById('servicoId').value = '';
    await carregarTudo();
  });
});

// Agendamentos

async function carregarAgendamentos() {
  agendamentos = await api('GET', '/agendamentos');

  const tabela = document.getElementById('listaAgendamentos');
  tabela.innerHTML = '';

  agendamentos.forEach((a) => {
    const botaoConcluir = a.status === 'agendado'
      ? `<button onclick="concluirAgendamento(${a.id})">Concluir</button>`
      : '';

    tabela.innerHTML += `
      <tr>
        <td>${a.data_hora.replace('T', ' ')}</td>
        <td>${a.cliente_nome} (${a.cliente_telefone})</td>
        <td>${a.servico_nome}</td>
        <td>${a.status}</td>
        <td>
          ${botaoConcluir}
          <button onclick="editarAgendamento(${a.id})">Editar</button>
          <button onclick="removerAgendamento(${a.id})">Remover</button>
        </td>
      </tr>`;
  });
}

function editarAgendamento(id) {
  const a = agendamentos.find((item) => item.id === id);
  document.getElementById('agendamentoId').value = a.id;
  document.getElementById('agendamentoServico').value = a.servico_id;
  document.getElementById('clienteNome').value = a.cliente_nome;
  document.getElementById('clienteTelefone').value = a.cliente_telefone;
  document.getElementById('dataHora').value = a.data_hora;
}

function removerAgendamento(id) {
  if (!confirm('Remover este agendamento?')) return;
  executar(async () => {
    await api('DELETE', '/agendamentos/' + id);
    await carregarTudo();
  });
}

function concluirAgendamento(id) {
  executar(async () => {
    await api('PUT', '/agendamentos/' + id + '/concluir');
    await carregarTudo();
  });
}

document.getElementById('formAgendamento').addEventListener('submit', (e) => {
  e.preventDefault();
  executar(async () => {
    const id = document.getElementById('agendamentoId').value;
    const dados = {
      servico_id: document.getElementById('agendamentoServico').value,
      cliente_nome: document.getElementById('clienteNome').value,
      cliente_telefone: document.getElementById('clienteTelefone').value,
      data_hora: document.getElementById('dataHora').value
    };

    if (id) {
      await api('PUT', '/agendamentos/' + id, dados);
    } else {
      await api('POST', '/agendamentos', dados);
    }

    e.target.reset();
    document.getElementById('agendamentoId').value = '';
    await carregarTudo();
  });
});

async function carregarTudo() {
  await carregarServicos();
  await carregarAgendamentos();
  await carregarResumo();
}

executar(carregarTudo);
