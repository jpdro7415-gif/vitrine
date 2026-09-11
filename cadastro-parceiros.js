/* =========================
   CADASTRO DE LOJA PARCEIRA
   (envia os dados do formulário
   direto pro Supabase, com status
   "pendente" pra você aprovar depois)
========================= */

const SUPABASE_URL = "https://wodfhcbzslrplbcfyrrz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZGZoY2J6c2xycGxiY2Z5cnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjY1NTMsImV4cCI6MjA4NzE0MjU1M30.8Wq4_b4jSwJniQfOkrMLRbklbsMc_rFrTL9CeRz-Knk";

/** @param {string} texto */
function gerarSlug(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

/**
 * @param {string} mensagem
 * @param {string} tipo
 */
function mostrarStatus(mensagem, tipo) {
    const status = document.querySelector("#status-envio");
    status.textContent = mensagem;
    status.className = "parceiro-status mostrar " + tipo;
}

document.querySelector("#form-parceiro").addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const botao = document.querySelector("#botao-enviar");
    const nome = document.querySelector("#campo-nome").value.trim();
    const contato = document.querySelector("#campo-contato").value.trim();
    const cor = document.querySelector("#campo-cor").value;
    const mensagem = document.querySelector("#campo-mensagem").value.trim();

    if (!nome || !contato) return;

    botao.disabled = true;
    botao.textContent = "Enviando...";

    const corpo = {
        slug: gerarSlug(nome) + "-" + Date.now().toString().slice(-5),
        nome: nome,
        contato: contato,
        cor_principal: cor,
        ano_entrada: new Date().getFullYear()
    };

    if (mensagem) {
        corpo.mensagem_cadastro = mensagem;
    }

    try {
        const resposta = await fetch(SUPABASE_URL + "/rest/v1/lojas", {
            method: "POST",
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: "Bearer " + SUPABASE_ANON_KEY,
                "Content-Type": "application/json",
                Prefer: "return=minimal"
            },
            body: JSON.stringify(corpo)
        });

        if (!resposta.ok) {
            throw new Error("Falha no envio");
        }

        mostrarStatus(
            "Recebemos seu cadastro! Assim que a gente aprovar, sua loja aparece na Vitrine.",
            "sucesso"
        );
        document.querySelector("#form-parceiro").reset();
        botao.textContent = "Enviado!";
    } catch (erro) {
        mostrarStatus(
            "Não conseguimos enviar agora. Tenta de novo em instantes.",
            "erro"
        );
        botao.disabled = false;
        botao.textContent = "Enviar cadastro";
    }
});
