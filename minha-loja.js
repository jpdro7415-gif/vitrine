/* =========================
   MINHA LOJA
   (mostra os dados da loja do
   lojista que fez login)
========================= */

const SUPABASE_URL = "https://wodfhcbzslrplbcfyrrz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZGZoY2J6c2xycGxiY2Z5cnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjY1NTMsImV4cCI6MjA4NzE0MjU1M30.8Wq4_b4jSwJniQfOkrMLRbklbsMc_rFrTL9CeRz-Knk";

/**
 * Escapa texto antes de inserir no HTML, pra evitar que nome
 * ou descrição de produto (que vem de sites externos, via robô)
 * consiga injetar código na página.
 * @param {string | null | undefined} texto
 * @returns {string}
 */
function escaparHtml(texto) {
    if (texto === null || texto === undefined) return "";

    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Decide se o período de teste grátis de 30 dias já acabou
 * e a loja ainda não está com o pagamento em dia.
 * @param {any} loja
 * @returns {boolean}
 */
function mensalidadeVencida(loja) {
    if (!loja.criado_em) return false;

    const agora = new Date();

    const fimDoTeste = new Date(loja.criado_em);
    fimDoTeste.setDate(fimDoTeste.getDate() + 30);

    const aindaNoTesteGratis = agora < fimDoTeste;
    if (aindaNoTesteGratis) return false;

    const pagoAte = loja.pago_ate ? new Date(loja.pago_ate + "T23:59:59") : null;
    const pagamentoEmDia = pagoAte && pagoAte >= agora;

    return !pagamentoEmDia;
}

/**
 * Monta o aviso mostrado quando o mês grátis acabou e a
 * loja ainda não está com o pagamento em dia.
 * @returns {string}
 */
function montarAvisoMensalidade() {
    return `
        <div class="aviso-mensalidade">
            <div class="aviso-mensalidade-titulo">⏰ Seu mês grátis acabou</div>
            <div class="aviso-mensalidade-texto">
                Pra continuar aparecendo na Vitrine, a mensalidade é de
                <span class="aviso-mensalidade-valor">R$ 15,00 por mês</span>.
                Fala com a gente pra continuar.
            </div>
            <a href="#" class="aviso-mensalidade-botao">Falar com a gente</a>
        </div>
    `;
}

/**
 * Monta o aviso destacado mostrado enquanto a loja
 * ainda está esperando aprovação manual.
 * @returns {string}
 */
function montarAvisoPendente() {
    return `
        <div class="aviso-mensalidade">
            <div class="aviso-mensalidade-titulo">⏳ Sua loja está em análise</div>
            <div class="aviso-mensalidade-texto">
                A gente confere manualmente se tudo está certinho
                (loja online funcionando, informações de entrega, etc.)
                antes de aprovar. Isso costuma levar pouco tempo.
                Assim que aprovarmos, sua loja aparece na Vitrine
                automaticamente — não precisa fazer mais nada.
            </div>
        </div>
    `;
}

/** @param {string} status */
function nomeAmigavelDoStatus(status) {
    if (status === "aprovado") return "Aprovado - já está na Vitrine";
    if (status === "pendente") return "Pendente - aguardando aprovação";
    return status;
}

/**
 * Tenta renovar o token de acesso usando o refresh_token
 * guardado no login. Retorna o novo token, ou null se não
 * conseguir renovar (aí sim precisa logar de novo).
 * @returns {Promise<string | null>}
 */
async function renovarSessao() {
    const refreshToken = localStorage.getItem("vitrine_refresh_token");
    if (!refreshToken) return null;

    try {
        const resposta = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token", {
            method: "POST",
            headers: {
                apikey: SUPABASE_ANON_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!resposta.ok) return null;

        const dados = await resposta.json();

        localStorage.setItem("vitrine_token", dados.access_token);
        localStorage.setItem("vitrine_refresh_token", dados.refresh_token);

        return dados.access_token;
    } catch {
        return null;
    }
}

async function carregarMinhaLoja() {
    let token = localStorage.getItem("vitrine_token");
    const conteudo = document.querySelector("#conteudo-minha-loja");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        let resposta = await fetch(SUPABASE_URL + "/rest/v1/lojas?select=*", {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: "Bearer " + token
            }
        });

        if (resposta.status === 401) {
            // Access token expirou -- tenta renovar com o refresh_token
            // antes de desistir e mandar pro login.
            const novoToken = await renovarSessao();

            if (!novoToken) {
                localStorage.removeItem("vitrine_token");
                localStorage.removeItem("vitrine_refresh_token");
                localStorage.removeItem("vitrine_user_id");
                window.location.href = "login.html";
                return;
            }

            token = novoToken;
            resposta = await fetch(SUPABASE_URL + "/rest/v1/lojas?select=*", {
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: "Bearer " + token
                }
            });
        }

        const lojas = await resposta.json();

        if (!lojas || lojas.length === 0) {
            conteudo.innerHTML = `
                <p>Não achamos nenhuma loja ligada a essa conta.</p>
            `;
            return;
        }

        const loja = lojas[0];
        const avisoMensalidadeHtml = mensalidadeVencida(loja) ? montarAvisoMensalidade() : "";
        const avisoPendenteHtml = loja.status === "pendente" ? montarAvisoPendente() : "";
        const inicialLoja = loja.nome ? loja.nome.trim().charAt(0).toUpperCase() : "?";

        conteudo.innerHTML = `
            ${avisoPendenteHtml}
            ${avisoMensalidadeHtml}
            <div class="minhaloja-card">
                <div class="minhaloja-avatar">${inicialLoja}</div>
                <div class="minhaloja-card-corpo">
                    <div class="minhaloja-nome">${escaparHtml(loja.nome)}</div>
                    <span class="minhaloja-status ${loja.status}">
                        ${nomeAmigavelDoStatus(loja.status)}
                    </span>
                    <div class="minhaloja-info">
                        Contato: ${escaparHtml(loja.contato) || "não informado"}
                    </div>
                </div>
            </div>
        `;

        // Libera a seção de produtos agora que sabemos o id da loja
        document.querySelector("#secao-produtos").style.display = "block";
        carregarProdutos(loja.id, token);
        prepararFormularioProduto(loja.id, token, loja.link_loja);
        prepararAcoesProdutos(loja.id, token);
    } catch {
        conteudo.innerHTML = `<p>Não conseguimos carregar sua loja agora. Tenta de novo em instantes.</p>`;
    }
}

/**
 * @typedef {Object} ProdutoLoja
 * @property {string} id
 * @property {string} nome
 * @property {number} preco
 * @property {number} estoque
 * @property {boolean} permite_busca_automatica
 * @property {boolean} [oculto]
 */

/**
 * Monta o HTML de um item de produto na lista.
 * @param {ProdutoLoja} produto
 * @returns {string}
 */
function montarItemProduto(produto) {
    const imagemHtml = produto.imagem
        ? `<img src="${escaparHtml(produto.imagem)}" alt="${escaparHtml(produto.nome)}">`
        : "";

    const estaOculto = produto.oculto === true;

    return `
        <div class="produto-item ${estaOculto ? "produto-item-oculto" : ""}">
            <div class="produto-item-imagem">${imagemHtml}</div>
            <div class="produto-item-corpo">
                <div class="produto-item-nome">${escaparHtml(produto.nome)}</div>
                <div class="produto-item-info">
                    <span class="produto-item-preco">R$ ${Number(produto.preco).toFixed(2)}</span>
                    · Estoque: ${produto.estoque}<br>
                    ${produto.permite_busca_automatica ? "🤖 Robô autorizado a atualizar preço" : "Atualização manual"}
                    ${estaOculto ? "<br>🙈 Oculto da Vitrine" : ""}
                </div>
                <div class="produto-item-acoes">
                    <button type="button" class="produto-item-btn" data-acao="${estaOculto ? "mostrar" : "ocultar"}" data-id="${produto.id}">
                        ${estaOculto ? "Mostrar" : "Ocultar"}
                    </button>
                    <button type="button" class="produto-item-btn produto-item-btn-excluir" data-acao="excluir" data-id="${produto.id}">
                        Excluir
                    </button>
                </div>
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
            lista.innerHTML = `<div class="minhaloja-vazio">Você ainda não cadastrou nenhum produto.</div>`;
            return;
        }

        lista.innerHTML = produtos.map(montarItemProduto).join("");
    } catch {
        lista.innerHTML = `<p class="minhaloja-carregando">Não foi possível carregar os produtos agora.</p>`;
    }
}

/**
 * URL da Edge Function que busca e atualiza os dados do produto.
 * Precisa bater com o projeto Supabase da Vitrine.
 */
const URL_ROBO_ATUALIZAR = SUPABASE_URL + "/functions/v1/atualizar-precos";

/**
 * Prepara os cliques nos botões de ocultar/mostrar/excluir
 * produto, usando delegação de evento (funciona mesmo depois
 * da lista ser redesenhada).
 * @param {string} lojaId
 * @param {string} token
 */
function prepararAcoesProdutos(lojaId, token) {
    const lista = document.querySelector("#lista-produtos");

    lista.addEventListener("click", async (evento) => {
        const botao = evento.target.closest(".produto-item-btn");
        if (!botao) return;

        const acao = botao.dataset.acao;
        const id = botao.dataset.id;

        if (acao === "excluir") {
            const confirmou = window.confirm("Excluir esse produto de vez? Essa ação não pode ser desfeita.");
            if (!confirmou) return;

            botao.disabled = true;

            await fetch(SUPABASE_URL + "/rest/v1/produtos?id=eq." + id, {
                method: "DELETE",
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: "Bearer " + token
                }
            });

            carregarProdutos(lojaId, token);
            return;
        }

        if (acao === "ocultar" || acao === "mostrar") {
            botao.disabled = true;

            await fetch(SUPABASE_URL + "/rest/v1/produtos?id=eq." + id, {
                method: "PATCH",
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: "Bearer " + token,
                    "Content-Type": "application/json",
                    Prefer: "return=minimal"
                },
                body: JSON.stringify({ oculto: acao === "ocultar" })
            });

            carregarProdutos(lojaId, token);
        }
    });
}

/**
 * @param {string} lojaId
 * @param {string} token
 * @param {string | null | undefined} linkLoja
 */
function prepararFormularioProduto(lojaId, token, linkLoja) {
    const form = document.querySelector("#form-produto");
    const mensagem = document.querySelector("#form-produto-mensagem");
    const container = document.querySelector("#lista-campos-links");

    /**
     * @param {string} url
     * @returns {string | null}
     */
    function extrairDominio(url) {
        try {
            return new URL(url).hostname.replace(/^www\./, "");
        } catch {
            return null;
        }
    }

    const dominioDaLoja = linkLoja ? extrairDominio(linkLoja) : null;

    /** Cria uma linha de link nova e vazia. */
    function criarLinhaLink() {
        const linha = document.createElement("div");
        linha.className = "linha-link";
        linha.innerHTML = `
            <input type="url" class="campo-link-item" placeholder="https://...">
            <div class="linha-link-status"></div>
            <button type="button" class="linha-link-remover" aria-label="Remover link">×</button>
        `;
        return linha;
    }

    // Garante que sempre sobra uma linha vazia no final, pra
    // o lojista poder colar o próximo link sem precisar
    // criar a linha manualmente.
    function garantirLinhaVaziaNoFinal() {
        const camposLink = container.querySelectorAll(".campo-link-item");
        const ultimoCampo = camposLink[camposLink.length - 1];

        if (ultimoCampo && ultimoCampo.value.trim().length > 0) {
            container.appendChild(criarLinhaLink());
        }
    }

    // Marca em vermelho qualquer linha cujo link se repete em
    // outra linha já preenchida.
    function marcarLinksRepetidos() {
        const linhas = Array.from(container.querySelectorAll(".linha-link"));
        const valores = linhas.map((linha) => linha.querySelector(".campo-link-item").value.trim());

        linhas.forEach((linha, indice) => {
            const valor = valores[indice];
            const repetido = valor.length > 0 && valores.filter((v) => v === valor).length > 1;

            linha.classList.toggle("repetido", repetido);
        });
    }

    /** @param {string} texto */
    function pareceLink(texto) {
        try {
            new URL(texto);
            return true;
        } catch {
            return false;
        }
    }

    /** @param {string} pedaco */
    function removerEspacos(pedaco) {
        return pedaco.trim();
    }

    /**
     * Mostra (ou esconde) um aviso pequeno embaixo da linha,
     * avisando quando o link colado não parece ser da mesma
     * loja cadastrada. Não bloqueia o envio, é só um alerta.
     * @param {Element} linha
     */
    function checarDominioDaLinha(linha) {
        if (!dominioDaLoja) {
            linha.classList.remove("fora-do-dominio");
            return;
        }

        const valor = linha.querySelector(".campo-link-item").value.trim();

        if (!valor) {
            linha.classList.remove("fora-do-dominio");
            return;
        }

        const dominioDoLink = extrairDominio(valor);
        const foraDoDominio = Boolean(dominioDoLink) && dominioDoLink !== dominioDaLoja;

        linha.classList.toggle("fora-do-dominio", foraDoDominio);

        // DEBUG TEMPORÁRIO -- lê a cor de verdade que o navegador está usando
        const estiloReal = window.getComputedStyle(linha);
        alert(
            "DEBUG cor real | className: " + linha.className +
            " | border-color: " + estiloReal.borderColor +
            " | background: " + estiloReal.backgroundColor
        );
    }

    // Depois de qualquer mudança no campo (digitando ou colando),
    // checa se o texto tem mais de um link junto -- se tiver,
    // separa em linhas diferentes. Checar assim (em vez de tentar
    // "pegar" o momento exato de colar) é bem mais confiável no
    // celular, onde o evento de colar às vezes não dispara direito.
    container.addEventListener("input", (evento) => {
        if (!evento.target.classList.contains("campo-link-item")) return;

        const campo = evento.target;
        const links = campo.value.split(/\s+/).map(removerEspacos).filter(pareceLink);

        if (links.length > 1) {
            const linhaAtual = campo.closest(".linha-link");
            campo.value = links[0];

            for (let i = 1; i < links.length; i++) {
                const novaLinha = criarLinhaLink();
                novaLinha.querySelector(".campo-link-item").value = links[i];
                linhaAtual.insertAdjacentElement("afterend", novaLinha);
                checarDominioDaLinha(novaLinha);
            }
        }

        checarDominioDaLinha(campo.closest(".linha-link"));
        garantirLinhaVaziaNoFinal();
        marcarLinksRepetidos();
    });

    // Apaga a linha clicada no botão ×. Sempre garante que
    // sobra pelo menos uma linha vazia no final.
    container.addEventListener("click", (evento) => {
        const botaoRemover = evento.target.closest(".linha-link-remover");
        if (!botaoRemover) return;

        botaoRemover.closest(".linha-link").remove();

        if (container.children.length === 0) {
            container.appendChild(criarLinhaLink());
        }

        garantirLinhaVaziaNoFinal();
        marcarLinksRepetidos();
    });

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        /** @param {Element} linha */
        function linhaTemLinkPreenchido(linha) {
            const campo = linha.querySelector(".campo-link-item");
            return campo.value.trim().length > 0;
        }

        const todasAsLinhas = Array.from(container.querySelectorAll(".linha-link"));
        const linhasPreenchidas = todasAsLinhas.filter(linhaTemLinkPreenchido);

        if (linhasPreenchidas.length === 0) {
            mensagem.textContent = "Cole pelo menos um link antes de enviar.";
            return;
        }

        marcarLinksRepetidos();
        const temRepetido = linhasPreenchidas.some((linha) => linha.classList.contains("repetido"));

        if (temRepetido) {
            mensagem.textContent = "Tem link repetido (em vermelho). Corrige antes de enviar.";
            return;
        }

        mensagem.textContent = "Salvando " + linhasPreenchidas.length + " link(s)...";
        linhasPreenchidas.forEach((linha) => linha.classList.add("carregando"));

        const parcelas = Number(document.querySelector("#produto-parcelas").value) || 1;
        const freteGratis = document.querySelector("#produto-frete-gratis").checked;

        /** @param {Element} linha */
        function montarNovoProdutoDaLinha(linha) {
            const campo = linha.querySelector(".campo-link-item");
            return {
                loja_id: lojaId,
                nome: "Carregando...",
                preco: 0,
                estoque: 0,
                parcelas: parcelas,
                frete_gratis: freteGratis,
                link_produto: campo.value.trim(),
                permite_busca_automatica: true
            };
        }

        const novosProdutos = linhasPreenchidas.map(montarNovoProdutoDaLinha);

        try {
            const resposta = await fetch(SUPABASE_URL + "/rest/v1/produtos", {
                method: "POST",
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: "Bearer " + token,
                    "Content-Type": "application/json",
                    Prefer: "return=representation"
                },
                body: JSON.stringify(novosProdutos)
            });

            if (!resposta.ok) {
                linhasPreenchidas.forEach((linha) => linha.classList.remove("carregando"));
                mensagem.textContent = "Nao conseguimos salvar os links. Confira e tente de novo.";
                return;
            }

            mensagem.textContent = "Links salvos! Buscando dados dos produtos na sua loja...";

            /** @type {any[]} */
            const produtosCriados = await resposta.json();

            // Liga cada linha da tela ao id do produto que acabou de
            // ser criado (mesma ordem de envio e de retorno).
            const linhaPorId = {};
            linhasPreenchidas.forEach((linha, indice) => {
                const produtoCriado = produtosCriados[indice];
                if (produtoCriado) linhaPorId[produtoCriado.id] = linha;
            });

            // Aciona o robo agora mesmo, sem esperar a proxima rodada programada.
            let resultadosRobo = null;
            try {
                const respostaRobo = await fetch(URL_ROBO_ATUALIZAR, {
                    method: "POST",
                    headers: { Authorization: "Bearer " + SUPABASE_ANON_KEY }
                });
                const corpoRobo = await respostaRobo.json();
                resultadosRobo = corpoRobo.resultados;
            } catch {
                // Se o robo falhar agora, a proxima rodada programada ainda pega esses produtos.
            }

            const statusComErro = ["falha ao acessar o link", "preco nao encontrado na pagina", "erro de conexao", "erro ao salvar"];

            linhasPreenchidas.forEach((linha) => linha.classList.remove("carregando"));

            /** @param {any} resultado */
            function aplicarResultadoNaLinha(resultado) {
                const linha = linhaPorId[resultado.id];
                if (!linha) return;

                /** @param {string} statusEsperado */
                function statusComecaCom(statusEsperado) {
                    return Boolean(resultado.status) && resultado.status.startsWith(statusEsperado);
                }

                const deuErro = statusComErro.some(statusComecaCom);
                linha.classList.add(deuErro ? "erro" : "pronto");
            }

            if (resultadosRobo) {
                resultadosRobo.forEach(aplicarResultadoNaLinha);
            } else {
                // Robô não respondeu agora -- marca como pronto mesmo assim,
                // a rodada programada ainda vai completar os dados.
                linhasPreenchidas.forEach((linha) => linha.classList.add("pronto"));
            }

            mensagem.textContent = linhasPreenchidas.length + " produto(s) adicionado(s)!";

            document.querySelector("#produto-parcelas").value = 1;
            document.querySelector("#produto-frete-gratis").checked = false;

            carregarProdutos(lojaId, token);

            // Depois de mostrar o resultado por um instante, volta pra uma
            // única linha vazia, pronta pro próximo lote de links.
            setTimeout(() => {
                container.innerHTML = "";
                container.appendChild(criarLinhaLink());
            }, 1200);
        } catch {
            linhasPreenchidas.forEach((linha) => linha.classList.remove("carregando"));
            mensagem.textContent = "Erro de conexao. Tenta de novo em instantes.";
        }
    });
}

document.querySelector("#botao-sair").addEventListener("click", () => {
    const confirmou = window.confirm("Tem certeza que quer sair da conta?");
    if (!confirmou) return;

    localStorage.removeItem("vitrine_token");
    localStorage.removeItem("vitrine_refresh_token");
    localStorage.removeItem("vitrine_user_id");
    window.location.href = "login.html";
});

carregarMinhaLoja();
