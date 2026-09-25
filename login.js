/* =========================
   LOGIN DO LOJISTA
   (autentica no Supabase e guarda
   a sessão pra usar em "Minha loja")
========================= */

const SUPABASE_URL = "https://wodfhcbzslrplbcfyrrz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZGZoY2J6c2xycGxiY2Z5cnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjY1NTMsImV4cCI6MjA4NzE0MjU1M30.8Wq4_b4jSwJniQfOkrMLRbklbsMc_rFrTL9CeRz-Knk";

/**
 * @param {string} mensagem
 * @param {string} tipo
 */
function mostrarStatus(mensagem, tipo) {
    const status = document.querySelector("#status-login");
    status.textContent = mensagem;
    status.className = "login-status mostrar " + tipo;
}

document.querySelector("#form-login").addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const botao = document.querySelector("#botao-entrar");
    const email = document.querySelector("#campo-email").value.trim();
    const senha = document.querySelector("#campo-senha").value;

    if (!email || !senha) return;

    botao.disabled = true;
    botao.textContent = "Entrando...";

    try {
        const resposta = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
            method: "POST",
            headers: {
                apikey: SUPABASE_ANON_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: email, password: senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.error_description || dados.msg || "Login inválido");
        }

        // Guarda a sessão no navegador, pra "Minha loja" usar depois
        localStorage.setItem("vitrine_token", dados.access_token);
        localStorage.setItem("vitrine_refresh_token", dados.refresh_token);
        localStorage.setItem("vitrine_user_id", dados.user.id);

        window.location.href = "minha-loja.html";
    } catch (erro) {
        mostrarStatus("E-mail ou senha incorretos. Tenta de novo.", "erro");
        botao.disabled = false;
        botao.textContent = "Entrar";
    }
});
