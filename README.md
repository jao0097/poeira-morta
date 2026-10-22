# Poeira Morta

Abra `index.html` no navegador para jogar. Funciona sem internet: o Three.js fica em `vendor/` e as fontes em `fonts/`.

Para editar: mude os arquivos em `src/` e rode `node build.js` para gerar o `index.html` de novo.
Com `node build.js --watch` ele regera sozinho a cada alteração.

## SENAI Esports (hub de jogos)

Abra `hub/index.html` para entrar no hub: crie uma conta, faça login e escolha um jogo.
Os jogos ficam na lista `GAMES` no começo do `<script>` de `hub/index.html`
(`url` é para onde o botão Jogar leva; a capa fica em `hub/img/`; sem `img`, o hub desenha uma capa com o nome).

Privacidade: as contas ficam só no navegador (localStorage), a senha é guardada com PBKDF2 e sal,
e nenhuma página do hub ou do Poeira Morta carrega arquivos de outros sites. Termos e Política de
Privacidade em `hub/legal.html`; quem usa pode ver, baixar e excluir os próprios dados em "Minha conta".
Se mudar o que é guardado, atualize `hub/legal.html`.
