# Poeira Morta

FPS de sobrevivência contra zumbis no navegador, com Three.js r128 (local, em `vendor/three.min.js`). Visual low-poly inspirado em CS 1.6, texturas geradas em canvas, áudio procedural com Web Audio.

## Como trabalhar neste projeto

- Edite apenas os arquivos em `src/`. O `index.html` é gerado.
- Depois de qualquer mudança rode `node build.js` e abra `index.html` no navegador para testar.
- Sem dependências, sem npm install. Nada de imagens ou sons externos: tudo é procedural.
- Nada carregado de outros sites (CDN, Google Fonts etc.), por privacidade/LGPD: fontes em `fonts/` (OFL), Three.js em `vendor/`.
- Todo o JS roda como um único script clássico; os módulos são objetos globais (`const X = (() => {...})()`), carregados na ordem numérica dos arquivos. Um módulo pode usar outro definido depois, desde que só na execução (não na definição).
- Unidades em metros. `U = 0.0254` converte unidades GoldSrc.
- Textos da interface em português do Brasil.

## Mapa dos arquivos

| Arquivo | Conteúdo |
|---|---|
| `00-head.html` | HTML, CSS, menus, HUD, opções |
| `01-core.js` | Utilitários, `Save` (localStorage, melhorias, opções), `UPGRADES`, `DIFFS`, `Tex` (texturas procedurais) |
| `02-world-nav.js` | `World` (mapa em caixas, colisão AABB, raios, quadros de compra, spawns, postes) e `Nav` (campo de fluxo Dijkstra para os zumbis) |
| `03-audio-input.js` | `Sfx` (sons procedurais, áudio posicional) e `Input` (teclado, mouse, Pointer Lock) |
| `04-weapons-view.js` | `WEAPONS` (dados de todas as armas: dano, cadência, recuo, dispersão, preço) e `View` (modelos em primeira pessoa, animações, mira ADS) |
| `05-fx-zombies.js` | `Fx` (partículas, marcas de tiro, traçantes, luzes) e `Zombies` (`ZTYPES`, modelos, IA, animação, chefe) |
| `06-physics-player.js` | `Physics` (movimento estilo GoldSrc) e `Player` (vida, colete, câmera, dano) |
| `07-combat.js` | `Combat` (disparo, penetração, faca, granadas, drops de munição, compra na parede, mortes e recompensas) |
| `08-waves-hud-game.js` | `Waves` (ondas e chefes), `Hud`, mira estática SVG e `Game` (cena, ciclo dia/noite, sombras, estados, loop principal) |

## Onde mexer para ajustes comuns

- Balanceamento de armas: `WEAPONS` em `04-weapons-view.js`.
- Zumbis (vida, velocidade, dano, recompensa): `ZTYPES` em `05-fx-zombies.js`.
- Dificuldade das ondas: `Waves.start` em `08-waves-hud-game.js`.
- Preços e posições das compras na parede: fim de `World.build` em `02-world-nav.js`.
- Duração do dia: `hour += dt / (...)` no loop de `Game`; cores do céu em `STOPS`.
- Melhorias da Oficina: `UPGRADES` em `01-core.js`.
- Ao adicionar caixas ao mapa, use `addBox` antes do bloco "merge por material"; a navegação é recalculada sozinha (`Nav.build`).
