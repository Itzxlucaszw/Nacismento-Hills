// ================================
// NASCIMENTOS HILLS - ui.js
// Pausa, HUD (vida/combate), efeitos visuais flutuantes,
// nome do mapa, label de portas e tela de game over
// ================================

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
// HUD DE VIDA
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
// EFEITOS VISUAIS (textos flutuantes: dano, PARRY!, MORTO etc.)
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
// LABEL DE PORTA PRÓXIMA
// --------------------------------

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

// --------------------------------
// HUD DE COMBATE (cooldown do parry + debug)
// --------------------------------

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

// --------------------------------
// NOME DO MAPA (topo da tela)
// --------------------------------

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
// DEBUG: hitboxes de colisão e portas (F1)
// --------------------------------

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
    const mapa = MAPAS[mapaAtualIdx];
    ctx.strokeStyle = "rgba(0,255,0,0.8)";
    ctx.fillStyle   = "rgba(0,255,0,0.2)";
    for (const p of mapa.portas) {
        ctx.fillRect(p.x, p.y, p.largura, p.altura);
        ctx.strokeRect(p.x, p.y, p.largura, p.altura);
    }
}
