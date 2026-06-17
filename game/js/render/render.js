// ================================
// NASCIMENTOS HILLS - render.js
// Limpeza de tela e desenho do fundo do mapa atual
// ================================

function limparCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function desenharFundo() {
    if (imagemFundo && imagemFundo.complete && imagemFundo.naturalWidth > 0) {
        ctx.drawImage(imagemFundo, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}
