# Poeira Morta

Abra `poeira-morta.html` no navegador para jogar. Funciona sem internet: o Three.js fica em `vendor/` e as fontes em `fonts/`.

Para editar: mude os arquivos em `src/` e rode `node build.js` para gerar o `poeira-morta.html` de novo.
Com `node build.js --watch` ele regera sozinho a cada alteração.

## SENAI Esports (hub de jogos)

Site estático: o `index.html` da raiz abre o hub em `hub/`. Não precisa de servidor nem de banco.

- `hub/index.html`: página de entrada (botão Entrar, sem login) e lista de jogos.
- `hub/games.js`: **a lista de jogos**. Para adicionar um jogo, copie um bloco, troque os textos e o link, e salve.
  A capa vai em `hub/img/` (16:9); sem capa, o hub mostra o nome do jogo.
- `hub/legal.html`: Termos de Uso e Política de Privacidade.

Para testar, abra `index.html` no navegador. Para publicar, use qualquer hospedagem de site estático
(Render *Static Site*, GitHub Pages, Netlify) apontando para a raiz do repositório, sem comando de build.
