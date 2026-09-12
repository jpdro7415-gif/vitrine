/* =========================
   MINHA LOJA
   (mostra os dados da loja do
   lojista que fez login)
========================= */

const SUPABASE_URL = "https://wodfhcbzslrplbcfyrrz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZGZoY2J6c2xycGxiY2Z5cnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjY1NTMsImV4cCI6MjA4NzE0MjU1M30.8Wq4_b4jSwJniQfOkrMLRbklbsMc_rFrTL9CeRz-Knk";

/** @param {string} status */
function nomeAmigavelDoStatus(status) {
    if (status === "aprovado") return "Aprovado - já está na Vitrine";
    if (status === "pendente") return "Pendente - aguardando aprovação";
    return status;
}

async function carregarMinhaLoja() {
    const token = localStorage.getItem("vitrine_token");
    const conteudo = document.querySelector("#conteudo-minha-loja");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const resposta = await fetch(SUPABASE_URL + "/rest/v1/lojas?select=*", {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: "Bearer " + token
            }
        });

        if (resposta.status === 401) {
            // Sessão expirou, manda pro login de novo
            localStorage.removeItem("vitrine_token");
            localStorage.removeItem("vitrine_user_id");
            window.location.href = "login.html";
            return;
        }

        const lojas = await resposta.json();

        if (!lojas || lojas.length === 0) {
            conteudo.innerHTML = `
                <p>Não achamos nenhuma loja ligada a essa conta.</p>
            `;
            return;
        }

        const loja = lojas[0];

        conteudo.innerHTML = `
            <div class="minhaloja-card">
                <div class="minhaloja-nome">${loja.nome}</div>
                <span class="minhaloja-status ${loja.status}">
                    ${nomeAmigavelDoStatus(loja.status)}
                </span>
                <div class="minhaloja-info">
                    Contato: ${loja.contato || "não informado"}<br>
                    Cor da loja: ${loja.cor_principal}
                </div>
            </div>
        `;
    } catch (erro) {
        conteudo.innerHTML = `<p>Não conseguimos carregar sua loja agora. Tenta de novo em instantes.</p>`;
    }
}

document.querySelector("#botao-sair").addEventListener("click", () => {
    localStorage.removeItem("vitrine_token");
    localStorage.removeItem("vitrine_user_id");
    window.location.href = "login.html";
});

carregarMinhaLoja();
