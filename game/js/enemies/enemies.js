// ================================
// NASCIMENTOS HILLS - enemies.js
// IA dos inimigos, dano por colisão e desenho
// ================================

// --------------------------------
// IA DOS INIMIGOS
// Persegue o jogador, respeita colisões do mapa,
// aplica dano ao jogador (ou recebe dano de parry)
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
                if (ini.vida <= 0) {
                    adicionarEfeito(ini.x + 14, ini.y - 20, "MORTO", "orange");
                    inimigosAtivos.splice(i, 1);
                }
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
// DESENHO DOS INIMIGOS (corpo + barra de vida)
// --------------------------------

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
