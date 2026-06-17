// ================================
// NASCIMENTOS HILLS - player.js
// Estado do jogador, movimentação, ataque, parry, animação e desenho
// ================================

// --------------------------------
// TAMANHO DO SPRITE
// Mude aqui para ajustar o tamanho visual do personagem na tela
// --------------------------------
const SPRITE_W = 64;
const SPRITE_H = 64;

// --------------------------------
// JOGADOR (estado)
// --------------------------------

const jogador = {
    x: 0, y: 0,
    largura: 64, altura: 64,
    velocidade: 3,
    vida: 100, vidaMax: 100,
    cor: "#00aaff",

    frame: 0,
    direcao: 0, // 0=baixo | 1=cima | 2=esquerda | 3=direita

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
// MOVIMENTAÇÃO COM COLISÃO (suporta diagonal normalizada)
// --------------------------------

function moverJogador() {
    const cols = MAPAS[mapaAtualIdx].colisoes;

    // Lê as teclas pressionadas em cada eixo
    const cima     = teclas["w"] || teclas["W"] || teclas["ArrowUp"];
    const baixo    = teclas["s"] || teclas["S"] || teclas["ArrowDown"];
    const esquerda = teclas["a"] || teclas["A"] || teclas["ArrowLeft"];
    const direita  = teclas["d"] || teclas["D"] || teclas["ArrowRight"];

    // Vetor de movimento (-1, 0 ou 1 em cada eixo)
    let dx = 0, dy = 0;
    if (cima)     dy -= 1;
    if (baixo)    dy += 1;
    if (esquerda) dx -= 1;
    if (direita)  dx += 1;

    // Normaliza a diagonal para não andar mais rápido (dx=dy=1 teria magnitude √2)
    if (dx !== 0 && dy !== 0) {
        const fator = Math.SQRT1_2; // 1/√2
        dx *= fator;
        dy *= fator;
    }

    // Direção visual do sprite: como não há sprite diagonal,
    // usa horizontal se houver, senão usa vertical
    if (dx < 0)      jogador.direcao = 2; // esquerda
    else if (dx > 0) jogador.direcao = 3; // direita
    else if (dy < 0) jogador.direcao = 1; // cima
    else if (dy > 0) jogador.direcao = 0; // baixo

    const nx = jogador.x + dx * jogador.velocidade;
    const ny = jogador.y + dy * jogador.velocidade;

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
// COOLDOWNS DO JOGADOR
// --------------------------------

function atualizarCooldowns() {
    if (jogador.tempoAtaque     > 0) jogador.tempoAtaque--;
    if (jogador.tempoAniAtaque  > 0) jogador.tempoAniAtaque--;
    if (jogador.tempoParry      > 0) { jogador.tempoParry--; if (jogador.tempoParry <= 0) jogador.parryAtivo = false; }
    if (jogador.tempoParryCd    > 0) jogador.tempoParryCd--;
    if (jogador.tempoInvencivel > 0) { jogador.tempoInvencivel--; if (jogador.tempoInvencivel <= 0) jogador.invencivel = false; }
}

// --------------------------------
// ANIMAÇÃO DO SPRITE
// --------------------------------

let contadorAnimacao = 0;
const VELOCIDADE_ANI = 10;

function atualizarAnimacao() {
    const andando =
        teclas["w"] || teclas["W"] || teclas["ArrowUp"]    ||
        teclas["a"] || teclas["A"] || teclas["ArrowLeft"]  ||
        teclas["s"] || teclas["S"] || teclas["ArrowDown"]  ||
        teclas["d"] || teclas["D"] || teclas["ArrowRight"];

    if (andando) {
        contadorAnimacao++;
        if (contadorAnimacao >= VELOCIDADE_ANI) {
            contadorAnimacao = 0;
            jogador.frame = (jogador.frame + 1) % TOTAL_FRAMES;
        }
    } else {
        jogador.frame = 0;
        contadorAnimacao = 0;
    }
}

// --------------------------------
// SPRITE DO JOGADOR
// Spritesheet 1254x1254 → 6 colunas x 6 linhas = 209x209px por frame
// Linha 0=baixo | 1=cima | 2=esquerda | 3=direita (linhas 4 e 5 repetem)
// (Fundo já vem transparente no PNG, sem necessidade de processamento)
// --------------------------------

const FRAME_W = 209;
const FRAME_H = 209;
const TOTAL_FRAMES = 6; // frames de animação por direção

const spriteJogador = new Image();
spriteJogador.src = "../assets/game/sprites/player/andando/personagem.png";

// --------------------------------
// DESENHO DO JOGADOR
// --------------------------------

function desenharJogador() {
    // Centro da hitbox do jogador
    const cx = jogador.x + jogador.largura  / 2;
    const cy = jogador.y + jogador.altura   / 2;

    // Posição de desenho centralizada no jogador
    const dstX = cx - SPRITE_W / 2;
    const dstY = cy - SPRITE_H / 2;

    // Anel de parry
    if (jogador.parryAtivo) {
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Flash de ataque
    if (jogador.tempoAniAtaque > 0) {
        ctx.fillStyle = "rgba(255,255,0,0.20)";
        ctx.fillRect(dstX - 20, dstY - 20, SPRITE_W + 40, SPRITE_H + 40);
    }

    // Pisca quando invencível
    if (jogador.invencivel && Math.floor(Date.now() / 80) % 2 === 0) return;

    if (spriteJogador.complete && spriteJogador.naturalWidth > 0) {
        ctx.drawImage(
            spriteJogador,
            jogador.frame   * FRAME_W,
            jogador.direcao * FRAME_H,
            FRAME_W, FRAME_H,
            dstX, dstY,
            SPRITE_W, SPRITE_H
        );
    } else {
        ctx.fillStyle = jogador.cor;
        ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);
    }
}
