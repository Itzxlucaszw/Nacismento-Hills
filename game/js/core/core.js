// ================================
// NASCIMENTOS HILLS - core.js
// Canvas, estado global, fade de transição, helpers genéricos
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
// ESTADO GLOBAL DO JOGO
// --------------------------------

let pausado = false;
let transicionando = false;
let debugColisoes = false;

// --------------------------------
// FADE (transição entre mapas)
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
// HELPER: converter coordenadas da imagem para pixels do canvas
// A imagem da recepção é 896x1344
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
// COLISÃO E DISTÂNCIA (usados por jogador, inimigos e portas)
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
// TECLAS (input global)
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
