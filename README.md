# Poeira Morta

Abra `index.html` no navegador para jogar (precisa de internet para carregar o Three.js da CDN).

Para editar: mude os arquivos em `src/` e rode `node build.js` para gerar o `index.html` de novo.
Com `node build.js --watch` ele regera sozinho a cada alteração.

## SENAI Esports (hub de jogos)

Abra `hub/index.html` para entrar no hub: crie uma conta, faça login e escolha um jogo.
Para adicionar jogos, edite a lista `GAMES` no começo do `<script>` de `hub/index.html`
(defina `url` e `status: 'live'`).
