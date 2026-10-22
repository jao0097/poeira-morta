// Jogos do SENAI Esports. Para adicionar um jogo, copie um bloco { ... },
// troque os textos e salve. Campos:
//   id        nome curto, sem espaços nem acentos (único)
//   title     nome do jogo            genre  tipo de jogo
//   url       link do jogo (https://...) ou ../arquivo.html para jogos deste site
//   img       capa em hub/img/ (16:9, ex.: 'img/meu-jogo.jpg'); vazio = capa com o nome
//   accent    cor do jogo (#rrggbb)
//   tags      etiquetas: ['Texto', ''] ou ['Online', 'green'] para verde
//   short     uma frase (destaque)    desc   descrição completa
//   features  destaques (lista)       stats  ['Nome', 'valor'] (Jogadores, Plataforma...)
//   controls  ['Tecla', 'ação']       warn   aviso em amarelo (opcional)
// Não use fotos de pessoas nas capas sem autorização delas.
const GAMES = [
  {
    id: "poeira-morta",
    title: "Poeira Morta",
    genre: "FPS de sobrevivência",
    url: "../poeira-morta.html",
    img: "img/poeira-morta.jpg",
    accent: "#e0a458",
    tags: [["Tiro", ""], ["Zumbis", ""], ["1 jogador", ""]],
    short: "Sobreviva a ondas de zumbis numa cidade tomada pela poeira.",
    desc: "FPS de sobrevivência com visual low-poly no estilo dos jogos de tiro clássicos. Cada abate dá dinheiro para comprar armas nas paredes; cada morte cobra tudo. Aguente as ondas, derrote os chefes e evolua seu personagem na Oficina.",
    features: [
      "Ondas de zumbis cada vez maiores, com chefes",
      "Armas compradas nas paredes do mapa",
      "Ciclo de dia e noite",
      "Oficina com melhorias permanentes",
      "Três dificuldades: Fácil, Normal e Difícil",
    ],
    stats: [["Jogadores", "1"], ["Plataforma", "PC (navegador)"], ["Modo", "Sobrevivência"]],
    controls: [["WASD", "Mover"], ["Mouse", "Mirar"], ["Clique", "Atirar"], ["R", "Recarregar"], ["E", "Comprar"], ["Espaço", "Pular"], ["Ctrl", "Agachar"], ["G", "Granada"]],
    warn: "Precisa de teclado e mouse.",
  },
  {
    id: "senai-rush",
    title: "SENAI Rush",
    genre: "Corrida de kart 3D",
    url: "https://senai-rush.onrender.com/",
    img: "img/senai-rush.jpg",
    accent: "#ffc53d",
    tags: [["Corrida", ""], ["Online", "green"], ["Até 8 jogadores", ""]],
    short: "Corrida arcade de kart pelo campus da escola.",
    desc: "Escolha seu piloto, acelere por oito pistas e use os itens para passar os rivais. Corra sozinho, em tela dividida com os amigos ou online numa sala com código.",
    features: [
      "8 pistas, do Campus à Neon Avenue",
      "9 pilotos com atributos diferentes",
      "Drift com turbo e itens nas caixas",
      "Online por código de sala e tela dividida",
      "Quatro dificuldades: 50cc a 200cc",
    ],
    stats: [["Jogadores", "1 a 8"], ["Plataforma", "PC e celular"], ["Modo", "Corrida / Online"]],
    controls: [["WASD / Setas", "Dirigir"], ["Shift", "Drift"], ["Espaço", "Item"], ["C", "Olhar para trás"], ["Esc", "Pausar"]],
    warn: "",
  },
  {
    id: "gincana-4x0",
    title: "Gincana 4x0",
    genre: "Simulador de futebol 7",
    url: "https://tavasreidocartola.github.io/Gincana-4x0/",
    img: "img/gincana-4x0.jpg",
    accent: "#2e9e4f",
    tags: [["Futebol", ""], ["Estratégia", ""], ["1 jogador", ""]],
    short: "Monte seu time de Futebol 7 e dispute o campeonato interclasses.",
    desc: "Sorteie turmas, escolha um jogador de cada uma e monte seu elenco de 7. Depois é só acompanhar o mata-mata: partidas narradas lance a lance, pênaltis e as estatísticas da campanha no final.",
    features: [
      "Três formações: equilibrada, ofensiva e defensiva",
      "Modo Clássico ou Às Cegas (força dos jogadores oculta)",
      "Partidas com narração lance a lance",
      "Disputa de pênaltis e estatísticas do torneio",
    ],
    stats: [["Jogadores", "1"], ["Plataforma", "PC e celular"], ["Modo", "Campeonato"]],
    controls: [["Clique / Toque", "Escolher formação, modo e jogadores"]],
    warn: "",
  },
  {
    id: "riftstrike",
    title: "RiftStrike",
    genre: "Jogo online",
    url: "https://riftstrike.onrender.com/",
    img: "",
    accent: "#7c4dff",
    tags: [["Online", "green"]],
    short: "Jogo online no navegador.",
    desc: "Jogo online que roda direto no navegador.",
    features: [],
    stats: [["Plataforma", "Navegador"]],
    controls: [],
    warn: "",
  },
  {
    id: "senai-suspeitos",
    title: "SENAI Suspeitos",
    genre: "Jogo online",
    url: "https://senai-suspeitos.onrender.com/",
    img: "",
    accent: "#00b4d8",
    tags: [["Online", "green"]],
    short: "Jogo online no navegador.",
    desc: "Jogo online que roda direto no navegador.",
    features: [],
    stats: [["Plataforma", "Navegador"]],
    controls: [],
    warn: "",
  },
];
