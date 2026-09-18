# Site institucional — APMI

Site estático (HTML/CSS/JS puro, sem build step) da Associação dos
Procuradores do Município de Itumbiara, pronto para o GitHub Pages.

## Estrutura

```
index.html        Início
associacao.html    Associação — institucional, finalidades, dados
diretoria.html      Diretoria (placeholder até a composição ser definida)
contato.html        Contato
404.html            Página de erro personalizada
assets/css/styles.css
assets/js/main.js   Só o menu mobile
assets/img/         Logo, emblema e favicons
CNAME               Domínio customizado (apmitumbiara.org)
.nojekyll           Evita o processamento Jekyll do GitHub Pages
```

## Publicar no GitHub Pages

1. Suba todo o conteúdo desta pasta para a raiz do repositório (ou para a
   branch/pasta que o Pages já está servindo hoje).
2. Em **Settings → Pages**, confirme que a fonte é a branch/pasta correta.
3. O arquivo `CNAME` já aponta para `apmitumbiara.org` — se esse domínio
   já está configurado no DNS, não precisa mexer em mais nada. Se o
   repositório atual já tem um `CNAME`, mantenha só um.
4. Sem domínio customizado? Apague o `CNAME` e o site sobe normalmente em
   `usuario.github.io/repositorio`.

## Editar conteúdo depois

- Textos institucionais e finalidades: `associacao.html`.
- Quando a diretoria for definida, substitua o placeholder em
  `diretoria.html` por uma lista (nome + cargo).
- Quando houver e-mail/endereço oficiais, atualize `contato.html`
  (os campos "a definir" estão marcados no arquivo).
- Cores, tipografia e espaçamentos: `assets/css/styles.css` (tokens no
  topo do arquivo, em `:root`).

## Limitações por ser GitHub Pages

- Não há backend: qualquer formulário de contato precisaria de um
  serviço externo (Formspree, etc.) — por enquanto o contato é só
  informativo.
- Tudo é estático e case-sensitive nos nomes de arquivo — mantenha
  nomes em minúsculas ao adicionar páginas novas.
