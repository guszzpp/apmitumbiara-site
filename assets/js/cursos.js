// APMI — catálogo de cursos estático. Os registros estão no cursos.html.
(function () {
  const busca = document.getElementById('filter-text');
  const instituicao = document.getElementById('filter-instituicao');
  const contador = document.getElementById('course-count');
  const secoes = Array.from(document.querySelectorAll('.cursos-group'));
  if (!busca || !instituicao || !contador || !secoes.length) return;
  const normalizar = valor => String(valor || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  const grupos = secoes.map(secao => ({
    secao,
    instituicao: secao.dataset.instituicao || '',
    linhas: Array.from(secao.querySelectorAll('tbody tr')).map(linha => ({
      linha,
      texto: normalizar((secao.dataset.instituicao || '') + ' ' + (secao.dataset.categoria || '') + ' ' + (linha.cells[0]?.textContent || ''))
    }))
  }));
  const total = grupos.reduce((n, grupo) => n + grupo.linhas.length, 0);
  function filtrar() {
    const termo = normalizar(busca.value);
    const origem = instituicao.value;
    let encontrados = 0;
    for (const grupo of grupos) {
      const filtroInstituicao = !origem || origem === grupo.instituicao;
      let visiveis = 0;
      for (const item of grupo.linhas) {
        const exibir = filtroInstituicao && (!termo || item.texto.includes(termo));
        item.linha.hidden = !exibir;
        if (exibir) visiveis++;
      }
      grupo.secao.hidden = visiveis === 0;
      encontrados += visiveis;
    }
    contador.textContent = encontrados === total
      ? total + ' cursos listados'
      : encontrados + ' de ' + total + ' cursos encontrados';
  }
  busca.addEventListener('input', filtrar);
  instituicao.addEventListener('change', filtrar);
  filtrar();
})();
