// ================================
// NASCIMENTOS HILLS - main.js
// Loop principal (update + draw) e inicialização do jogo
// Este é o ÚLTIMO arquivo a ser carregado — depende de tudo o resto
// ================================

// --------------------------------
// UPDATE: roda a lógica do jogo a cada frame
// --------------------------------

function update() {
    atualizarFade();
    if (pausado || transicionando) return;
    moverJogador();
    atualizarAnimacao();
    atualizarInimigos();
    atualizarCooldowns();
    atualizarEfeitos();
    verificarPortas();
    atualizarHUD();
}

// --------------------------------
// DRAW: desenha tudo na ordem correta (fundo -> entidades -> HUD -> fade)
// --------------------------------

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

// --------------------------------
// LOOP PRINCIPAL
// --------------------------------

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// --------------------------------
// INICIAR JOGO
// --------------------------------

carregarMapa(0, 0.48, 0.75);
loop();
