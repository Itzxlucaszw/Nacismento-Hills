// ================================
// NASCIMENTOS HILLS - maps.js
// Colisões de cada mapa, definição dos mapas (fundo, inimigos, portas)
// e lógica de carregamento/transição entre mapas
// ================================

// --------------------------------
// GERADORES DE COLISÃO POR MAPA
// --------------------------------

function gerarColisoesMapa0() {
    // Recepção — colisões mapeadas em % da imagem original (896x1344)
    return [
        px(0,    0,    896,  70),
        px(0,    1300, 996,  100),
        px(0,    0,    95,   1344),
        px(800,  0,    96,   1344),

        px(150, 200, 900, 60),

        px(300, 431, 75, 180),
        px(515, 431, 75, 180),
        px(300, 500, 285, 125),

        px(100,   630,  50,  170),
        px(720,  975,  70,   175),
        px(720, 720, 70, 75),

        px(95,   195,  65,   80),
        px(730,  195,  65,   80),
        px(575, 1200, 50, 75),
        px(265, 1200, 50, 75),

        px(0,    1245, 250,  120),
        px(650,  1245, 250,  120),
    ];
}

function gerarColisoesMapa1() {
    // Corredor — colisões em % do canvas atual
    return [
        { x: 0,    y: 0,   largura: canvas.width, altura: canvas.height * 0.17 },
        { x: 0,    y: canvas.height * 0.82, largura: canvas.width, altura: canvas.height * 0.18 },
        { x: 0,    y: 0,   largura: canvas.width * 0.05, altura: canvas.height },
        { x: canvas.width * 0.95, y: 0, largura: canvas.width * 0.05, altura: canvas.height },
    ];
}

function gerarColisoesMapa2() {
    // Corredor da Saída
    return [
        { x: 0,   y: 0,   largura: canvas.width, altura: canvas.height * 0.05 },
        { x: 0,   y: canvas.height * 0.95, largura: canvas.width, altura: canvas.height * 0.05 },
        { x: 0,   y: 0,   largura: canvas.width * 0.12, altura: canvas.height },
        { x: canvas.width * 0.88, y: 0, largura: canvas.width * 0.12, altura: canvas.height },
    ];
}

function gerarColisoesMapa3() {
    // Quarto do João
    return [
        { x: 0,   y: 0,   largura: canvas.width, altura: canvas.height * 0.06 },
        { x: 0,   y: canvas.height * 0.93, largura: canvas.width, altura: canvas.height * 0.07 },
        { x: 0,   y: 0,   largura: canvas.width * 0.06, altura: canvas.height },
        { x: canvas.width * 0.94, y: 0, largura: canvas.width * 0.06, altura: canvas.height },
        { x: canvas.width * 0.62, y: canvas.height * 0.11, largura: canvas.width * 0.32, altura: canvas.height * 0.40 },
        { x: canvas.width * 0.06, y: canvas.height * 0.55, largura: canvas.width * 0.22, altura: canvas.height * 0.18 },
        { x: canvas.width * 0.06, y: canvas.height * 0.28, largura: canvas.width * 0.18, altura: canvas.height * 0.22 },
        { x: canvas.width * 0.06, y: canvas.height * 0.06, largura: canvas.width * 0.21, altura: canvas.height * 0.20 },
    ];
}

// --------------------------------
// DEFINIÇÃO DOS MAPAS
// --------------------------------

const MAPAS = [
    {
        nome: "Recepção",
        fundo: "../assets/game/background/recepcao.png",
        get colisoes() { return gerarColisoesMapa0(); },
        inimigos: [
            {
                xPct: 0.48, yPct: 0.65,
                largura: 28, altura: 28,
                velocidade: 0.8,
                vida: 30, vidaMax: 30,
                cor: "#8b0000", tempoDano: 0, dano: 10,
            },
        ],
        portas: [
            {
                get x()       { return canvas.width  * 0.355; },
                get y()       { return canvas.height * 0.068; },
                get largura() { return canvas.width  * 0.215; },
                get altura()  { return canvas.height * 0.060; },
                label: "[E] Corredor",
                destinoMapa: 1,
                destinoXPct: 0.12, destinoYPct: 0.50,
            },
        ],
    },
    {
        nome: "Corredor",
        fundo: "../assets/game/background/Corredor_kkk2.png",
        get colisoes() { return gerarColisoesMapa1(); },
        inimigos: [
            { xPct: 0.45, yPct: 0.50, largura: 28, altura: 28, velocidade: 1.0,
              vida: 30, vidaMax: 30, cor: "#8b0000", tempoDano: 0, dano: 10 },
            { xPct: 0.70, yPct: 0.50, largura: 28, altura: 28, velocidade: 1.2,
              vida: 30, vidaMax: 30, cor: "#8b0000", tempoDano: 0, dano: 10 },
        ],
        portas: [
            {
                get x()       { return canvas.width  * 0.05; },
                get y()       { return canvas.height * 0.30; },
                get largura() { return canvas.width  * 0.06; },
                get altura()  { return canvas.height * 0.40; },
                label: "[E] Recepção",
                destinoMapa: 0,
                destinoXPct: 0.48, destinoYPct: 0.20,
            },
            {
                get x()       { return canvas.width  * 0.89; },
                get y()       { return canvas.height * 0.30; },
                get largura() { return canvas.width  * 0.06; },
                get altura()  { return canvas.height * 0.40; },
                label: "[E] Corredor da Saída",
                destinoMapa: 2,
                destinoXPct: 0.15, destinoYPct: 0.50,
            },
        ],
    },
    {
        nome: "Corredor da Saída",
        fundo: "../assets/game/background/CorredorBoss.png",
        get colisoes() { return gerarColisoesMapa2(); },
        inimigos: [
            { xPct: 0.40, yPct: 0.40, largura: 28, altura: 28, velocidade: 1.3,
              vida: 50, vidaMax: 50, cor: "#8b0000", tempoDano: 0, dano: 15 },
        ],
        portas: [
            {
                get x()       { return canvas.width  * 0.30; },
                get y()       { return canvas.height * 0.04; },
                get largura() { return canvas.width  * 0.35; },
                get altura()  { return canvas.height * 0.05; },
                label: "[E] Quarto do João",
                destinoMapa: 3,
                destinoXPct: 0.48, destinoYPct: 0.85,
            },
            {
                get x()       { return canvas.width  * 0.30; },
                get y()       { return canvas.height * 0.91; },
                get largura() { return canvas.width  * 0.35; },
                get altura()  { return canvas.height * 0.05; },
                label: "[E] Corredor",
                destinoMapa: 1,
                destinoXPct: 0.85, destinoYPct: 0.50,
            },
        ],
    },
    {
        nome: "Quarto do João",
        fundo: "../assets/game/background/Quarto_do_Joao_com_cartao.png",
        get colisoes() { return gerarColisoesMapa3(); },
        inimigos: [],
        portas: [
            {
                get x()       { return canvas.width  * 0.42; },
                get y()       { return canvas.height * 0.91; },
                get largura() { return canvas.width  * 0.14; },
                get altura()  { return canvas.height * 0.05; },
                label: "[E] Corredor da Saída",
                destinoMapa: 2,
                destinoXPct: 0.48, destinoYPct: 0.15,
            },
        ],
    },
];

// --------------------------------
// ESTADO DO MAPA ATUAL
// --------------------------------

let mapaAtualIdx   = 0;
let inimigosAtivos = [];
let portaProxima   = null;
let imagemFundo    = new Image();

function carregarMapa(idx, xPct, yPct) {
    mapaAtualIdx = idx;
    const mapa   = MAPAS[idx];

    jogador.x = (xPct ?? 0.5) * canvas.width;
    jogador.y = (yPct ?? 0.5) * canvas.height;

    inimigosAtivos = mapa.inimigos.map(ini => ({
        ...ini,
        x: ini.xPct * canvas.width,
        y: ini.yPct * canvas.height,
    }));

    portaProxima = null;

    const novaImagem = new Image();
    novaImagem.onload  = () => { imagemFundo = novaImagem; };
    novaImagem.onerror = () => { console.error("Imagem não encontrada:", mapa.fundo); };
    novaImagem.src = mapa.fundo;
}

// --------------------------------
// INTERAGIR (E) — usa a porta próxima para trocar de mapa com fade
// --------------------------------

function interagir() {
    if (transicionando || pausado || !portaProxima) return;
    transicionando = true;
    const p = portaProxima;

    iniciarFadeOut(() => {
        carregarMapa(p.destinoMapa, p.destinoXPct, p.destinoYPct);
        function tentarFadeIn() {
            if (imagemFundo.complete && imagemFundo.naturalWidth > 0) {
                iniciarFadeIn(() => { transicionando = false; });
            } else {
                setTimeout(tentarFadeIn, 50);
            }
        }
        tentarFadeIn();
    });
}

// --------------------------------
// VERIFICAR PORTA PRÓXIMA (chamado a cada frame no update)
// --------------------------------

function verificarPortas() {
    const mapa = MAPAS[mapaAtualIdx];
    portaProxima = null;
    for (const porta of mapa.portas) {
        if (distancia(jogador, porta) < 150) { portaProxima = porta; break; }
    }
}