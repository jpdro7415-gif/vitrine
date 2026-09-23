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

        // Libera a seção de produtos agora que sabemos o id da loja
        document.querySelector("#secao-produtos").style.display = "block";
        carregarProdutos(loja.id, token);
        prepararFormularioProduto(loja.id, token);
    } catch (erro) {
        conteudo.innerHTML = `<p>Não conseguimos carregar sua loja agora. Tenta de novo em instantes.</p>`;
    }
}

/**
 * @typedef {Object} ProdutoLoja
 * @property {string} nome
 * @property {number} preco
 * @property {number} estoque
 * @property {boolean} permite_busca_automatica
 */

/**
 * Monta o HTML de um item de produto na lista.
 * @param {ProdutoLoja} produto
 * @returns {string}
 */
function montarItemProduto(produto) {
    return `
        <div class="produto-item">
            <div class="produto-item-nome">${produto.nome}</div>
            <div class="produto-item-info">
                R$ ${Number(produto.preco).toFixed(2)} · Estoque: ${produto.estoque}<br>
                ${produto.permite_busca_automatica ? "🤖 Robô autorizado a atualizar preço" : "Atualização manual"}
            </div>
        </div>
    `;
}

/**
 * Busca e lista os produtos da loja logada.
 * @param {string} lojaId
 * @param {string} token
 */
async function carregarProdutos(lojaId, token) {
    const lista = document.querySelector("#lista-produtos");
    lista.innerHTML = `<p class="minhaloja-carregando">Carregando produtos...</p>`;

    try {
        const resposta = await fetch(
            SUPABASE_URL + "/rest/v1/produtos?loja_id=eq." + lojaId + "&select=*",
            {
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: "Bearer " + token
                }
            }
        );

        /** @type {ProdutoLoja[]} */
        const produtos = await resposta.json();

        if (!produtos || produtos.length === 0) {
            lista.innerHTML = `<p class="minhaloja-carregando">Você ainda não cadastrou nenhum produto.</p>`;
            return;
        }

        lista.innerHTML = produtos.map(montarItemProduto).join("");
    } catch (erro) {
        lista.innerHTML = `<p class="minhaloja-carregando">Não foi possível carregar os produtos agora.</p>`;
    }
}

/**
 * URL da Edge Function que busca e atualiza os dados do produto.
 * Precisa bater com o projeto Supabase da Vitrine.
 */
const URL_ROBO_ATUALIZAR = SUPABASE_URL + "/functions/v1/atualizar-precos";

/**
 * Prepara o envio do formulário de novo produto.
 * @param {string} lojaId
 * @param {string} token
 */
function prepararFormularioProduto(lojaId, token) {
    const form = document.querySelector("#form-produto");
    const mensagem = document.querySelector("#form-produto-mensagem");

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        mensagem.textContent = "Salvando link do produto...";

        const novoProduto = {
            loja_id: lojaId,
            nome: "Carregando...",
            preco: 0,
            estoque: 0,
            parcelas: Number(document.querySelector("#produto-parcelas").value) || 1,
            frete_gratis: document.querySelector("#produto-frete-gratis").checked,
            link_produto: document.querySelector("#produto-link").value.trim(),
            permite_busca_automatica: true
        };

        try {
            const resposta = await fetch(SUPABASE_URL + "/rest/v1/produtos", {
                method: "POST",
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: "Bearer " + token,
                    "Content-Type": "application/json",
                    Prefer: "return=minimal"
                },
                body: JSON.stringify(novoProduto)
            });

            if (!resposta.ok) {
                mensagem.textContent = "Nao conseguimos salvar o produto. Confira o link e tente de novo.";
                return;
            }

            mensagem.textContent = "Link salvo! Buscando dados do produto na sua loja...";
            form.reset();
            document.querySelector("#produto-parcelas").value = 1;
            document.querySelector("#produto-frete-gratis").checked = false;

            // Aciona o robo agora mesmo, sem esperar a proxima rodada programada.
            try {
                await fetch(URL_ROBO_ATUALIZAR, {
                    method: "POST",
                    headers: { Authorization: "Bearer " + SUPABASE_ANON_KEY }
                });
            } catch (erroRobo) {
                // Se o robo falhar agora, a proxima rodada programada ainda pega esse produto.
            }

            mensagem.textContent = "Produto adicionado!";
            carregarProdutos(lojaId, token);
        } catch (erro) {
            mensagem.textContent = "Erro de conexao. Tenta de novo em instantes.";
        }
    });
}

document.querySelector("#botao-sair").addEventListener("click", () => {
    localStorage.removeItem("vitrine_token");
    localStorage.removeItem("vitrine_user_id");
    window.location.href = "login.html";
});

carregarMinhaLoja();
