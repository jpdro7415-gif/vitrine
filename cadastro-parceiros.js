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
    const email = document.querySelector("#campo-email").value.trim();
    const senha = document.querySelector("#campo-senha").value;
    const contato = document.querySelector("#campo-contato").value.trim();
    const cor = document.querySelector("#campo-cor").value;
    const mensagem = document.querySelector("#campo-mensagem").value.trim();

    if (!nome || !email || !senha || !contato) return;

    botao.disabled = true;
    botao.textContent = "Enviando...";

    try {
        // Passo 1: cria a conta de login do lojista
        const respostaConta = await fetch(SUPABASE_URL + "/auth/v1/signup", {
            method: "POST",
            headers: {
                apikey: SUPABASE_ANON_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: email, password: senha })
        });

        const dadosConta = await respostaConta.json();

        if (!respostaConta.ok) {
            throw new Error(dadosConta.msg || "Falha ao criar a conta");
        }

        const tokenAcesso = dadosConta.access_token;
        const usuarioId = dadosConta.user ? dadosConta.user.id : null;

        if (!tokenAcesso || !usuarioId) {
            // Alguns projetos exigem confirmar o e-mail antes de liberar o acesso
            mostrarStatus(
                "Conta criada! Confirme seu e-mail (a gente te mandou um link) e depois faça login em Minha loja pra continuar o cadastro.",
                "sucesso"
            );
            document.querySelector("#form-parceiro").reset();
            botao.textContent = "Enviado!";
            return;
        }

        // Passo 2: cria a loja, já ligada a essa conta
        const corpo = {
            slug: gerarSlug(nome) + "-" + Date.now().toString().slice(-5),
            nome: nome,
            contato: contato,
            cor_principal: cor,
            ano_entrada: new Date().getFullYear(),
            user_id: usuarioId
        };

        if (mensagem) {
            corpo.mensagem_cadastro = mensagem;
        }

        const respostaLoja = await fetch(SUPABASE_URL + "/rest/v1/lojas", {
            method: "POST",
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: "Bearer " + tokenAcesso,
                "Content-Type": "application/json",
                Prefer: "return=minimal"
            },
            body: JSON.stringify(corpo)
        });

        if (!respostaLoja.ok) {
            throw new Error("Falha ao criar a loja");
        }

        mostrarStatus(
            "Recebemos seu cadastro! Assim que a gente aprovar, sua loja aparece na Vitrine. Você já pode entrar em \"Minha loja\" com seu e-mail e senha.",
            "sucesso"
        );
        document.querySelector("#form-parceiro").reset();
        botao.textContent = "Enviado!";
    } catch (erro) {
        mostrarStatus(
            "Erro: " + erro.message,
            "erro"
        );
        botao.disabled = false;
        botao.textContent = "Enviar cadastro";
    }
});
