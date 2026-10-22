# Poeira Morta

Abra `index.html` no navegador para jogar. Funciona sem internet: o Three.js fica em `vendor/` e as fontes em `fonts/`.

Para editar: mude os arquivos em `src/` e rode `node build.js` para gerar o `index.html` de novo.
Com `node build.js --watch` ele regera sozinho a cada alteração.

## SENAI Esports (hub de jogos)

O hub fica em `hub/` e roda com um pequeno servidor Node (`server/`), que também serve o Poeira Morta.

- `/hub/`: página de entrada (botão Entrar, sem login) e lista de jogos.
- `/admin`: painel do admin para adicionar, editar, reordenar e excluir jogos. As mudanças valem para todo mundo.
- `/hub/legal.html`: Termos de Uso e Política de Privacidade. Se mudar o que o site guarda, atualize essa página.

### Rodar no computador

```
cd server && npm install && cd ..
ADMIN_PASSWORD=uma-senha node server/server.js
```

Abra http://localhost:8080. Sem `DATABASE_URL`, os jogos ficam em `server/data/` (bom para testar).

### Publicar no Render

1. Crie um banco Postgres gratuito, por exemplo no [Neon](https://neon.tech), e copie a *connection string*
   (`postgres://...?sslmode=require`). O plano grátis do Render apaga os arquivos do servidor a cada reinício,
   por isso os jogos precisam ficar num banco.
2. No Render: **New → Blueprint**, escolha este repositório e o branch. O `render.yaml` já configura tudo.
3. Preencha as variáveis que o Render pedir:
   - `ADMIN_PASSWORD`: a senha do painel (o usuário é `admin`; dá para trocar com `ADMIN_USER`).
   - `DATABASE_URL`: a connection string do passo 1.
4. Depois do deploy, entre em `https://<seu-serviço>.onrender.com/admin`.

Na primeira vez, o servidor cadastra sozinho os jogos de `server/seed-games.json`. Depois disso, a lista é a do banco.
Para trocar a senha, mude `ADMIN_PASSWORD` no Render: as sessões abertas caem na hora.

Segurança: senha só em variável de ambiente; cookie de sessão assinado, `HttpOnly` e `SameSite=Strict`;
bloqueio após várias senhas erradas; links e capas validados no servidor; só `hub/`, `fonts/`, `vendor/` e
`poeira-morta.html` são públicos.
