const btnIniciar = document.getElementById("btnIniciar");
const videoMenu = document.getElementById("videoMenu");
const fade = document.getElementById("fade");

btnIniciar.addEventListener("click", () => {

    // Esconde o botão
    btnIniciar.style.display = "none";

    // Zoom no vídeo (simula entrar na porta)
    videoMenu.style.transform = "scale(1.8)";
    videoMenu.style.transition = "transform 3s ease";

    // Fade para preto
    setTimeout(() => {
        fade.style.opacity = "1";
    }, 1500);

    // Entrar no jogo
    setTimeout(() => {
        window.location.href = "game/jogo.html";
    }, 3500);

});