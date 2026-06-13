// ================================
// NASCIMENTOS HILLS - game.js
// ================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// --------------------------------
// ESTADO
// --------------------------------

let pausado = false;
let transicionando = false;
let debugColisoes = false; // muda para true para ver as colisões

// --------------------------------
// FADE
// --------------------------------

let fadeAlpha = 0;
let fadeSentido = 0;
let fadeCallback = null;

function iniciarFadeOut(cb) {
    fadeAlpha = 0; fadeSentido = 1; fadeCallback = cb;
}
function iniciarFadeIn(cb) {
    fadeAlpha = 1; fadeSentido = -1; fadeCallback = cb;
}
function atualizarFade() {
    if (fadeSentido === 0) return;
    fadeAlpha += fadeSentido * 0.04;
    if (fadeSentido === 1 && fadeAlpha >= 1) {
        fadeAlpha = 1; fadeSentido = 0;
        const cb = fadeCallback; fadeCallback = null; if (cb) cb();
    }
    if (fadeSentido === -1 && fadeAlpha <= 0) {
        fadeAlpha = 0; fadeSentido = 0;
        const cb = fadeCallback; fadeCallback = null; if (cb) cb();
    }
}
function desenharFade() {
    if (fadeAlpha <= 0) return;
    ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --------------------------------
// HELPER: converter % da imagem para pixels do canvas
// A imagem da recepção é 896x1344
// Usamos proporção para que funcione em qualquer resolução
// --------------------------------

function px(xPct, yPct, wPct, hPct) {
    return {
        x:       (xPct  / 896)  * canvas.width,
        y:       (yPct  / 1344) * canvas.height,
        largura: (wPct  / 896)  * canvas.width,
        altura:  (hPct  / 1344) * canvas.height,
    };
}

// --------------------------------
// JOGADOR
// --------------------------------

const jogador = {
    x: 0, y: 0,
    largura: 28, altura: 28,
    velocidade: 3,
    vida: 100, vidaMax: 100,
    cor: "#00aaff",
    atacando: false,
    tempoAtaque: 0,
    tempoAniAtaque: 0,
    parryAtivo: false,
    tempoParry: 0,
    tempoParryCd: 0,
    invencivel: false,
    tempoInvencivel: 0,
};

// --------------------------------
// EFEITOS VISUAIS
// --------------------------------

let efeitos = [];
function adicionarEfeito(x, y, texto, cor) {
    efeitos.push({ x, y, texto, cor, vida: 40 });
}
function atualizarEfeitos() {
    for (let i = efeitos.length - 1; i >= 0; i--) {
        efeitos[i].y -= 0.8;
        efeitos[i].vida--;
        if (efeitos[i].vida <= 0) efeitos.splice(i, 1);
    }
}
function desenharEfeitos() {
    for (const e of efeitos) {
        ctx.globalAlpha = e.vida / 40;
        ctx.fillStyle = e.cor;
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.fillText(e.texto, e.x, e.y);
    }
    ctx.globalAlpha = 1;
}

// --------------------------------
// TECLAS
// --------------------------------

const teclas = {};
window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    teclas[e.key] = true;
    if (e.key === "Escape")              alternarPausa();
    if (e.key === " ")                   atacar();
    if (e.key === "q" || e.key === "Q")  fazerParry();
    if (e.key === "e" || e.key === "E")  interagir();
    if (e.key === "F1")                  debugColisoes = !debugColisoes;
});
window.addEventListener("keyup", (e) => { teclas[e.key] = false; });

// --------------------------------
// PAUSA
// --------------------------------

const pauseMenu    = document.getElementById("pauseMenu");
const btnContinuar = document.getElementById("btnContinuar");
function alternarPausa() {
    if (transicionando) return;
    pausado = !pausado;
    pauseMenu.style.display = pausado ? "flex" : "none";
}
btnContinuar.addEventListener("click", alternarPausa);

// --------------------------------
// HUD
// --------------------------------

const barraVida = document.getElementById("vida");
const textoVida = document.getElementById("textoVida");
function atualizarHUD() {
    const pct = (jogador.vida / jogador.vidaMax) * 100;
    barraVida.style.width = pct + "%";
    textoVida.textContent = "Vida: " + Math.max(Math.floor(jogador.vida), 0);
    if (pct > 60)      barraVida.style.background = "red";
    else if (pct > 30) barraVida.style.background = "orange";
    else               barraVida.style.background = "darkred";
}

// --------------------------------
// COLISÃO
// --------------------------------

function colidindo(a, b) {
    return (
        a.x < b.x + b.largura  &&
        a.x + a.largura > b.x  &&
        a.y < b.y + b.altura   &&
        a.y + a.altura > b.y
    );
}
function distancia(a, b) {
    const ax = a.x + a.largura / 2, ay = a.y + a.altura / 2;
    const bx = b.x + b.largura / 2, by = b.y + b.altura / 2;
    return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// --------------------------------
// MAPAS
// Colisões da recepção mapeadas pixel a pixel na imagem 896x1344
// --------------------------------

function gerarColisoesMapa0() {
    return [
        // ── Bordas da sala (área preta ao redor) ──
        px(0,    0,    896,  70),    // topo
        px(0,    1300, 996,  100),    // base
        px(0,    0,    95,   1344),  // esquerda
        px(800,  0,    96,   1344),  // direita

        // ── Porta dupla (topo centro) - bloqueada inicialmente ──
        // (será substituída pela zona interativa)
        px(150, 200, 900, 60),

        // lado esquerdo
        px(300, 431, 75, 180),

        // lado direito
        px(515, 431, 75, 180),

        // parte de baixo
        px(300, 500, 285, 125),

        // ── Cadeiras/sofás esquerda ──
        px(100,   630,  50,  170),

        // ── Armário/objeto direita ──
        px(720,  975,  70,   175),

        // ── caidera de rodas ──
        px(720, 720, 70, 75),

        // ── Vaso/planta canto superior esquerdo ──
        px(95,   195,  65,   80),

        // ── Vaso/planta canto superior direito ──
        px(730,  195,  65,   80),

        // ── Vaso/planta canto inferior direito ──
        px(575, 1200, 50, 75),

         // ── Vaso/planta canto inferior direito ──
        px(265, 1200, 50, 75),
        
        // ── Parede interna esquerda baixo (chanfro) ──
        px(0,    1245, 250,  120),

        // ── Parede interna direita baixo (chanfro) ──
        px(650,  1245, 250,  120),

    ];
}

function gerarColisoesMapa1() {
    // Corredor_kkk2 (horizontal) - imagem ~1366x768
    return [
        { x: 0,    y: 0,   largura: canvas.width, altura: canvas.height * 0.17 },  // topo
        { x: 0,    y: canvas.height * 0.82, largura: canvas.width, altura: canvas.height * 0.18 }, // base
        { x: 0,    y: 0,   largura: canvas.width * 0.05, altura: canvas.height }, // esquerda
        { x: canvas.width * 0.95, y: 0, largura: canvas.width * 0.05, altura: canvas.height }, // direita
    ];
}

function gerarColisoesMapa2() {
    // Corredor_da_saida (vertical)
    return [
        { x: 0,   y: 0,   largura: canvas.width, altura: canvas.height * 0.05 },
        { x: 0,   y: canvas.height * 0.95, largura: canvas.width, altura: canvas.height * 0.05 },
        { x: 0,   y: 0,   largura: canvas.width * 0.12, altura: canvas.height },
        { x: canvas.width * 0.88, y: 0, largura: canvas.width * 0.12, altura: canvas.height },
    ];
}

function gerarColisoesMapa3() {
    // Quarto do João - imagem ~1024x1024
    return [
        { x: 0,   y: 0,   largura: canvas.width, altura: canvas.height * 0.06 },
        { x: 0,   y: canvas.height * 0.93, largura: canvas.width, altura: canvas.height * 0.07 },
        { x: 0,   y: 0,   largura: canvas.width * 0.06, altura: canvas.height },
        { x: canvas.width * 0.94, y: 0, largura: canvas.width * 0.06, altura: canvas.height },
        // Cama direita
        { x: canvas.width * 0.62, y: canvas.height * 0.11, largura: canvas.width * 0.32, altura: canvas.height * 0.40 },
        // Escrivaninha esquerda baixo
        { x: canvas.width * 0.06, y: canvas.height * 0.55, largura: canvas.width * 0.22, altura: canvas.height * 0.18 },
        // Armário esquerda
        { x: canvas.width * 0.06, y: canvas.height * 0.28, largura: canvas.width * 0.18, altura: canvas.height * 0.22 },
        // Banheiro canto superior esquerdo
        { x: canvas.width * 0.06, y: canvas.height * 0.06, largura: canvas.width * 0.21, altura: canvas.height * 0.20 },
    ];
}

const MAPAS = [

    // ── MAPA 0: Recepção ──
    {
        nome: "Recepção",
        fundo: "../assets/game/background/recepcao.png",
        get colisoes() { return gerarColisoesMapa0(); },
        inimigos: [
            {
                // Infectado no centro-baixo da recepção
                xPct: 0.48, yPct: 0.65,
                largura: 28, altura: 28,
                velocidade: 0.8,
                vida: 30, vidaMax: 30,
                cor: "#8b0000", tempoDano: 0, dano: 10,
            },
        ],
        portas: [
            {
                // Porta dupla no topo — zona interativa
                get x()       { return canvas.width  * 0.355; },
                get y()       { return canvas.height * 0.068; },
                get largura() { return canvas.width  * 0.215; },
                get altura()  { return canvas.height * 0.060; },
                label: "[E] Corredor",
                destinoMapa: 1,
                destinoX: null, destinoY: null, // calculado em carregarMapa
                destinoXPct: 0.12, destinoYPct: 0.50,
            },
        ],
    },

    // ── MAPA 1: Corredor ──
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
                destinoXPct: 0.48, destinoYPct: 0.88,
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

    // ── MAPA 2: Corredor da Saída ──
    {
        nome: "Corredor da Saída",
        fundo: "../assets/game/background/Corredor_da_saida.png",
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

    // ── MAPA 3: Quarto do João ──
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

    // Cópia fresca dos inimigos com posição em % do canvas
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
// MOVIMENTAÇÃO COM COLISÃO
// --------------------------------

function moverJogador() {
    const cols = MAPAS[mapaAtualIdx].colisoes;
    let nx = jogador.x, ny = jogador.y;

    if (teclas["w"] || teclas["W"] || teclas["ArrowUp"])    ny -= jogador.velocidade;
    if (teclas["s"] || teclas["S"] || teclas["ArrowDown"])  ny += jogador.velocidade;
    if (teclas["a"] || teclas["A"] || teclas["ArrowLeft"])  nx -= jogador.velocidade;
    if (teclas["d"] || teclas["D"] || teclas["ArrowRight"]) nx += jogador.velocidade;

    const testX = { x: nx, y: jogador.y, largura: jogador.largura, altura: jogador.altura };
    const testY = { x: jogador.x, y: ny, largura: jogador.largura, altura: jogador.altura };

    let bX = false, bY = false;
    for (const c of cols) {
        if (colidindo(testX, c)) bX = true;
        if (colidindo(testY, c)) bY = true;
    }

    if (!bX) jogador.x = nx;
    if (!bY) jogador.y = ny;

    jogador.x = Math.max(0, Math.min(canvas.width  - jogador.largura, jogador.x));
    jogador.y = Math.max(0, Math.min(canvas.height - jogador.altura,  jogador.y));
}

// --------------------------------
// ATAQUE (Espaço)
// --------------------------------

function atacar() {
    if (jogador.tempoAtaque > 0) return;
    jogador.atacando = true;
    jogador.tempoAtaque = 35;
    jogador.tempoAniAtaque = 12;

    const area = {
        x: jogador.x - 30, y: jogador.y - 30,
        largura: jogador.largura + 60, altura: jogador.altura + 60,
    };

    for (let i = inimigosAtivos.length - 1; i >= 0; i--) {
        if (colidindo(area, inimigosAtivos[i])) {
            inimigosAtivos[i].vida -= 25;
            adicionarEfeito(inimigosAtivos[i].x + 14, inimigosAtivos[i].y - 10, "-25", "red");
            if (inimigosAtivos[i].vida <= 0) {
                adicionarEfeito(inimigosAtivos[i].x + 14, inimigosAtivos[i].y - 20, "MORTO", "orange");
                inimigosAtivos.splice(i, 1);
            }
        }
    }
    setTimeout(() => { jogador.atacando = false; }, 180);
}

// --------------------------------
// PARRY (Q)
// --------------------------------

function fazerParry() {
    if (jogador.tempoParryCd > 0) {
        adicionarEfeito(jogador.x + 14, jogador.y - 20, "PARRY CD!", "#aaa");
        return;
    }
    jogador.parryAtivo   = true;
    jogador.tempoParry   = 24;
    jogador.tempoParryCd = 90;
    adicionarEfeito(jogador.x + 14, jogador.y - 20, "PARRY!", "#00ffff");
}

// --------------------------------
// INTERAGIR (E)
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
// IA DOS INIMIGOS
// --------------------------------

function atualizarInimigos() {
    const cols = MAPAS[mapaAtualIdx].colisoes;
    for (let i = inimigosAtivos.length - 1; i >= 0; i--) {
        const ini = inimigosAtivos[i];
        const dx = jogador.x - ini.x, dy = jogador.y - ini.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            let nx = ini.x + (dx / dist) * ini.velocidade;
            let ny = ini.y + (dy / dist) * ini.velocidade;

            const testX = { x: nx, y: ini.y, largura: ini.largura, altura: ini.altura };
            const testY = { x: ini.x, y: ny, largura: ini.largura, altura: ini.altura };

            let colX = false, colY = false;
            for (const c of cols) {
                if (colidindo(testX, c)) colX = true;
                if (colidindo(testY, c)) colY = true;
            }

            if (!colX) ini.x = nx;
            if (!colY) ini.y = ny;
        }
        if (ini.tempoDano > 0) ini.tempoDano--;

        if (colidindo(jogador, ini) && ini.tempoDano <= 0) {
            if (jogador.parryAtivo) {
                ini.vida -= 40;
                adicionarEfeito(ini.x + 14, ini.y - 10, "PARRY +40!", "#00ffff");
                if (ini.vida <= 0) { adicionarEfeito(ini.x + 14, ini.y - 20, "MORTO", "orange"); inimigosAtivos.splice(i, 1); }
                ini.tempoDano = 40;
                jogador.parryAtivo = false;
            } else if (!jogador.invencivel) {
                jogador.vida -= ini.dano ?? 10;
                adicionarEfeito(jogador.x + 14, jogador.y - 10, "-" + (ini.dano ?? 10), "yellow");
                ini.tempoDano = 60;
                jogador.invencivel = true;
                jogador.tempoInvencivel = 50;
                if (jogador.vida <= 0) { jogador.vida = 0; gameOver(); }
            }
        }
    }
}

// --------------------------------
// VERIFICAR PORTA PRÓXIMA
// --------------------------------

function verificarPortas() {
    const mapa = MAPAS[mapaAtualIdx];
    portaProxima = null;
    for (const porta of mapa.portas) {
        if (distancia(jogador, porta) < 150) { portaProxima = porta; break; }
    }
}

// --------------------------------
// COOLDOWNS
// --------------------------------

function atualizarCooldowns() {
    if (jogador.tempoAtaque     > 0) jogador.tempoAtaque--;
    if (jogador.tempoAniAtaque  > 0) jogador.tempoAniAtaque--;
    if (jogador.tempoParry      > 0) { jogador.tempoParry--; if (jogador.tempoParry <= 0) jogador.parryAtivo = false; }
    if (jogador.tempoParryCd    > 0) jogador.tempoParryCd--;
    if (jogador.tempoInvencivel > 0) { jogador.tempoInvencivel--; if (jogador.tempoInvencivel <= 0) jogador.invencivel = false; }
}

// --------------------------------
// DESENHO
// --------------------------------

function limparCanvas() { ctx.clearRect(0, 0, canvas.width, canvas.height); }

function desenharFundo() {
    if (imagemFundo && imagemFundo.complete && imagemFundo.naturalWidth > 0) {
        ctx.drawImage(imagemFundo, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function desenharDebugColisoes() {
    if (!debugColisoes) return;
    const cols = MAPAS[mapaAtualIdx].colisoes;
    ctx.strokeStyle = "rgba(255,0,0,0.6)";
    ctx.fillStyle   = "rgba(255,0,0,0.15)";
    ctx.lineWidth   = 1;
    for (const c of cols) {
        ctx.fillRect(c.x, c.y, c.largura, c.altura);
        ctx.strokeRect(c.x, c.y, c.largura, c.altura);
    }
    // Portas em verde
    const mapa = MAPAS[mapaAtualIdx];
    ctx.strokeStyle = "rgba(0,255,0,0.8)";
    ctx.fillStyle   = "rgba(0,255,0,0.2)";
    for (const p of mapa.portas) {
        ctx.fillRect(p.x, p.y, p.largura, p.altura);
        ctx.strokeRect(p.x, p.y, p.largura, p.altura);
    }
}

function desenharPortas() {
    if (!portaProxima) return;
    const p = portaProxima;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(p.x - 4, p.y - 30, 180, 24);
    ctx.fillStyle = "yellow";
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.fillText(p.label, p.x, p.y - 12);          
}

// SPRITE DO JOGADOR
const spriteJogador = new Image();
spriteJogador.src = "../assets/game/sprites/player/andando/personagem.png";

function desenharJogador() {
    if (jogador.parryAtivo) {
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
            jogador.x + jogador.largura / 2,
            jogador.y + jogador.altura / 2,
            30,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }

    if (jogador.tempoAniAtaque > 0) {
        ctx.fillStyle = "rgba(255,255,0,0.20)";
        ctx.fillRect(
            jogador.x - 30,
            jogador.y - 30,
            jogador.largura + 60,
            jogador.altura + 60
        );
    }

    if (
        jogador.invencivel &&
        Math.floor(Date.now() / 80) % 2 === 0
    ) return;

    ctx.drawImage(
    spriteJogador,
    jogador.x,
    jogador.y,
    jogador.largura,
    jogador.altura
);
}

function desenharInimigos() {
    for (const ini of inimigosAtivos) {
        ctx.fillStyle = ini.cor;
        ctx.fillRect(ini.x, ini.y, ini.largura, ini.altura);
        const pct = ini.vida / ini.vidaMax;
        ctx.fillStyle = "#444";
        ctx.fillRect(ini.x, ini.y - 10, ini.largura, 5);
        ctx.fillStyle = pct > 0.5 ? "lime" : "orange";
        ctx.fillRect(ini.x, ini.y - 10, ini.largura * pct, 5);
    }
}

function desenharHUDCombate() {
    const pronto = jogador.tempoParryCd === 0;
    ctx.fillStyle = pronto ? "#00ffff" : "#555";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "left";
    ctx.fillText(pronto ? "[Q] PARRY ✓" : `[Q] PARRY ${(jogador.tempoParryCd / 60).toFixed(1)}s`, 20, 70);
    const larg = 120, prench = pronto ? larg : larg * (1 - jogador.tempoParryCd / 90);
    ctx.fillStyle = "#333"; ctx.fillRect(20, 76, larg, 6);
    ctx.fillStyle = pronto ? "#00ffff" : "#007799"; ctx.fillRect(20, 76, prench, 6);

    if (debugColisoes) {
        ctx.fillStyle = "yellow";
        ctx.font = "12px Arial";
        ctx.fillText("[F1] Debug colisões: ON", 20, 100);
    }
}

function desenharNomeMapa() {
    const nome = MAPAS[mapaAtualIdx].nome;
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    const w = ctx.measureText(nome).width + 24;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(canvas.width / 2 - w / 2, 12, w, 24);
    ctx.fillStyle = "white";
    ctx.fillText(nome, canvas.width / 2, 29);
}

// --------------------------------
// GAME OVER
// --------------------------------

function gameOver() {
    pausado = true;
    ctx.fillStyle = "rgba(0,0,0,0.88)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red"; ctx.font = "bold 64px Arial"; ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = "white"; ctx.font = "22px Arial";
    ctx.fillText("Pressione F5 para reiniciar", canvas.width / 2, canvas.height / 2 + 50);
}

// --------------------------------
// LOOP
// --------------------------------

function update() {
    atualizarFade();
    if (pausado || transicionando) return;
    moverJogador();
    atualizarInimigos();
    atualizarCooldowns();
    atualizarEfeitos();
    verificarPortas();
    atualizarHUD();
}

function draw() {
    limparCanvas();
    desenharFundo();
    desenharDebugColisoes();
    desenharPortas();
    desenharInimigos();
    desenharJogador();
    desenharEfeitos();
    desenharHUDCombate();
    desenharNomeMapa();
    desenharFade();
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

// --------------------------------
// INICIAR
// --------------------------------
carregarMapa(0, 0.48, 0.88); // começa em baixo na recepção (entrada Bem-vindo)
loop();