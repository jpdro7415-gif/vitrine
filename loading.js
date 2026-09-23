/* =========================
   SISTEMA GENÉRICO DE TELAS
   (usa o histórico do navegador
   pra integrar com o botão
   físico de voltar do celular)
========================= */

// Pra cadastrar uma tela/menu novo, só adicionar
// um item aqui — não precisa escrever JS novo.

/**
 * @typedef {Object} ConfigTela
 * @property {Element} gatilho - elemento que abre a tela
 * @property {Element} elemento - a tela/menu em si
 * @property {string} classe - classe CSS que exibe a tela
 * @property {boolean} fecharAoClicarFora - fecha ao tocar fora?
 * @property {() => void} [aoAbrir] - função opcional ao abrir
 * @property {() => void} [aoFechar] - função opcional ao fechar
 */

/** @type {ConfigTela[]} */
const CONFIG_TELAS = [
    {
        gatilho: document.querySelector("#abre-pesquisa"),
        elemento: document.querySelector("#tela-pesquisa"),
        classe: "aberta",
        fecharAoClicarFora: false,
        aoAbrir: () => document.querySelector("#campo-pesquisa-tela").focus(),
        aoFechar: () => document.querySelector("#campo-pesquisa-tela").value = ""
    },
    {
        gatilho: document.querySelector("#botao-categorias"),
        elemento: document.querySelector("#quadro-categorias"),
        classe: "aberto",
        fecharAoClicarFora: true
    },
    {
        gatilho: document.querySelector("#opcao-filtro"),
        elemento: document.querySelector("#painel-filtro"),
        classe: "aberto",
        fecharAoClicarFora: true
    }
];

let pilhaTelas = [];
let ignorarProximoPopstate = false;

/** @param {ConfigTela} config */
function telaEstaAberta(config) {
    return pilhaTelas.includes(config);
}

/** @param {ConfigTela} config */
function abrirTela(config) {
    if (telaEstaAberta(config)) return;

    config.elemento.classList.add(config.classe);
    pilhaTelas.push(config);

    history.pushState({ vitrineTela: pilhaTelas.length }, "");

    if (config.aoAbrir) config.aoAbrir();
}

// Fecha a tela do topo visualmente (usada tanto no fechamento
// manual quanto quando o botão físico de voltar é pressionado)
function fecharTelaDoTopoNaTela() {
    const config = pilhaTelas.pop();

    if (!config) return;

    config.elemento.classList.remove(config.classe);

    if (config.aoFechar) config.aoFechar();
}

/** @param {ConfigTela} config */
function fecharTela(config) {
    if (!telaEstaAberta(config)) return;

    // Fecha na hora, sem esperar o histórico responder —
    // isso evita a tela ficar "fantasma" na pilha caso o
    // navegador demore ou se comporte de forma diferente
    // ao processar o history.back().
    fecharTelaDoTopoNaTela();

    // Consome a entrada do histórico que foi criada ao abrir,
    // mas avisa o listener de popstate pra não fechar de novo
    // (já fechamos aqui em cima).
    ignorarProximoPopstate = true;
    history.back();
}

/** @param {ConfigTela} config */
CONFIG_TELAS.forEach((config) => {
    config.gatilho.addEventListener("click", (evento) => {
        evento.stopPropagation();

        if (telaEstaAberta(config)) {
            fecharTela(config);
        } else {
            abrirTela(config);
        }
    });

    config.elemento.addEventListener("click", (evento) => {
        evento.stopPropagation();
    });
});

// Fecha a tela do topo ao clicar fora dela
document.addEventListener("click", () => {
    const topo = pilhaTelas[pilhaTelas.length - 1];

    if (topo && topo.fecharAoClicarFora) {
        fecharTela(topo);
    }
});

// Qualquer botão com data-fechar-tela fecha a tela do topo
document.querySelectorAll("[data-fechar-tela]").forEach((botao) => {
    botao.addEventListener("click", (evento) => {
        evento.stopPropagation();

        const topo = pilhaTelas[pilhaTelas.length - 1];

        if (topo) {
            fecharTela(topo);
        }
    });
});

// Botão físico de voltar do celular
window.addEventListener("popstate", () => {
    if (ignorarProximoPopstate) {
        // Esse popstate é só o eco do fechamento manual
        // (seta ou toque fora) que já resolvemos na hora.
        ignorarProximoPopstate = false;
        return;
    }

    fecharTelaDoTopoNaTela();
});

// Remover item de pesquisas recentes
document.querySelectorAll(".remover-recente").forEach((botao) => {
    botao.addEventListener("click", (evento) => {
        evento.stopPropagation();

        botao.closest(".item-recente").remove();
        atualizarSecaoRecentes();
    });
});

// Clicar num item recente preenche o campo de pesquisa
document.querySelectorAll(".item-recente").forEach((item) => {
    item.addEventListener("click", () => {
        const texto = item.querySelector(".texto-recente").textContent;
        const campoPesquisaTela = document.querySelector("#campo-pesquisa-tela");

        campoPesquisaTela.value = texto;
        campoPesquisaTela.focus();
    });
});

// Some com a seção "Pesquisas recentes" inteira se não sobrar
// nenhum item — a seção "Populares" garante que a tela nunca
// fica vazia mesmo assim
function atualizarSecaoRecentes() {
    const secaoRecentes = document.querySelector("#secao-recentes");
    const temItens = document.querySelector("#lista-recentes").children.length > 0;

    secaoRecentes.style.display = temItens ? "" : "none";
}

atualizarSecaoRecentes();

// Clicar numa pesquisa popular também preenche o campo de busca
document.querySelectorAll(".item-popular").forEach((item) => {
    item.addEventListener("click", () => {
        const texto = item.querySelector(".texto-popular").textContent;
        const campoPesquisaTela = document.querySelector("#campo-pesquisa-tela");

        campoPesquisaTela.value = texto;
        campoPesquisaTela.focus();
    });
});

/* =========================
   RENDERIZA AS LOJAS PARCEIRAS
   (gerado a partir dos dados que vêm do
   Supabase, em vez de ficar fixo no HTML)
========================= */

/**
 * Converte um preço já formatado ("R$ 29,90") de volta pra
 * número (29.9), pra poder calcular o valor da parcela.
 * Aceita também um número puro, se algum dia vier assim.
 * @param {string | number | null | undefined} precoFormatado
 * @returns {number | null}
 */
function paraNumero(precoFormatado) {
    if (typeof precoFormatado === "number") return precoFormatado;
    if (!precoFormatado) return null;

    const limpo = precoFormatado.replace("R$", "").trim().replace(".", "").replace(",", ".");
    const numero = Number(limpo);

    return Number.isFinite(numero) ? numero : null;
}

/**
 * Formata um número puro como preço em reais — usado só
 * internamente pro cálculo de parcelas, já que o preço
 * principal do produto já vem formatado do supabase-dados.js.
 * @param {number} valor
 * @returns {string}
 */
function formatarPrecoHome(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** @param {any} produto */
function criarInfoProdutoHome(produto) {
    const info = document.createElement("div");
    info.className = "info-produto-home";

    let precoOriginalHtml = "";
    const precoOriginalNumero = paraNumero(produto.precoOriginal);
    const precoAtualNumero = paraNumero(produto.preco);

    if (precoOriginalNumero !== null && precoAtualNumero !== null && precoOriginalNumero > precoAtualNumero) {
        precoOriginalHtml = `<span class="preco-original-home">${produto.precoOriginal}</span>`;
    }

    let parcelasHtml = "";
    if (produto.parcelas && produto.parcelas > 1 && precoAtualNumero !== null) {
        const valorParcela = precoAtualNumero / produto.parcelas;
        parcelasHtml = `<div class="parcelas-home">${produto.parcelas}x de ${formatarPrecoHome(valorParcela)} sem juros</div>`;
    }

    let freteHtml = "";
    if (produto.freteGratis) {
        freteHtml = `<div class="frete-gratis-home">Frete grátis</div>`;
    }

    info.innerHTML = `
        <div class="preco-linha-home">
            ${precoOriginalHtml}
            <span class="preco-atual-home">${produto.preco ?? ""}</span>
        </div>
        ${parcelasHtml}
        ${freteHtml}
    `;

    return info;
}

/**
 * Gera uma versão curta ("seca") do nome do produto, cortando
 * antes da primeira palavra de ligação (em, de, com, para, sem...)
 * ou de um traço — mantendo só o núcleo do nome.
 * @param {string} nomeCompleto
 * @returns {string}
 */
function nomeSecoProduto(nomeCompleto) {
    if (!nomeCompleto) return nomeCompleto;

    // Corta primeiro em separadores fortes (traço, dois pontos)
    const base = nomeCompleto.split(/\s+-\s+|:/)[0].trim();

    const conectores = ["em", "de", "com", "para", "sem", "no", "na", "nos", "nas", "e"];
    const palavras = base.split(/\s+/);

    let indiceCorte = palavras.length;
    for (let i = 1; i < palavras.length; i++) {
        const palavraLimpa = palavras[i].toLowerCase().replace(/[^a-zà-úçõãâêô]/gi, "");
        if (conectores.includes(palavraLimpa)) {
            indiceCorte = i;
            break;
        }
    }

    const resultado = palavras.slice(0, indiceCorte).join(" ").trim();
    return resultado || nomeCompleto;
}

/** @param {any} produto */
function criarCardProdutoHome(produto) {
    const card = document.createElement("div");
    card.className = "card";

    const imagemHtml = produto.imagem
        ? `<img src="${produto.imagem}" alt="${produto.nome}">`
        : "";

    card.innerHTML = `
        <div class="card-info">${imagemHtml}</div>
        <span class="card-titulo">${nomeSecoProduto(produto.nome)}</span>
    `;

    return card;
}

/**
 * @param {string} slug
 * @param {any} loja
 */
function criarGrupoLoja(slug, loja) {
    const grupo = document.createElement("div");
    grupo.className = "grupo-abas";
    grupo.dataset.loja = slug;

    const titulo = document.createElement("div");
    titulo.className = "grupo-titulo";
    titulo.innerHTML = `
        <img src="${loja.logo || ''}" class="icone-titulo" alt="${loja.nome}">
        <h2>${loja.nome}</h2>
    `;
    titulo.style.cursor = "pointer";
    titulo.addEventListener("click", (evento) => {
        evento.stopPropagation();
        window.location.href = "loja.html?loja=" + slug;
    });

    const fileira = document.createElement("div");
    fileira.className = "fileira-abas";

    /** @param {any} produto */
    function adicionarCardNaFileira(produto) {
        fileira.appendChild(criarCardProdutoHome(produto));
    }

    /** @param {any} produto */
    function produtoTemEstoque(produto) {
        return produto.estoque > 0;
    }

    const produtosComEstoque = loja.produtos.filter(produtoTemEstoque);
    const produtoDestaque = produtosComEstoque.length > 0 ? produtosComEstoque[0] : null;

    if (produtoDestaque) {
        adicionarCardNaFileira(produtoDestaque);
    }

    grupo.appendChild(fileira);

    if (produtoDestaque) {
        const nomeCompleto = document.createElement("p");
        nomeCompleto.className = "nome-completo-home";
        nomeCompleto.textContent = produtoDestaque.nome;
        grupo.appendChild(nomeCompleto);

        grupo.appendChild(criarInfoProdutoHome(produtoDestaque));
    }

    grupo.appendChild(titulo);

    return grupo;
}

function renderizarLojasParceiras() {
    const containerAbas = document.querySelector("#abas-lojas");

    if (!containerAbas) return;

    containerAbas.innerHTML = "";

    const slugs = Object.keys(LOJAS_VITRINE);

    if (slugs.length === 0) {
        containerAbas.innerHTML = `
            <p class="vitrine-sem-lojas">
                Ainda não temos lojas parceiras por aqui.
                Quer ser a primeira? Fale com a gente!
            </p>
        `;
        return;
    }

    const colunaEsquerda = document.createElement("div");
    colunaEsquerda.className = "coluna-abas";

    const colunaDireita = document.createElement("div");
    colunaDireita.className = "coluna-abas";

    containerAbas.appendChild(colunaEsquerda);
    containerAbas.appendChild(colunaDireita);

    slugs.forEach((slug, indice) => {
        const loja = LOJAS_VITRINE[slug];
        const grupo = criarGrupoLoja(slug, loja);

        // Alterna entre as duas colunas pra distribuir o peso visual
        const colunaDeDestino = indice % 2 === 0 ? colunaEsquerda : colunaDireita;
        colunaDeDestino.appendChild(grupo);
    });
}

function iniciarLojasEFiltros() {
renderizarLojasParceiras();

    // Contador do carrinho no painel de categorias
    const carrinhoContadorVitrine = document.querySelector("#carrinho-contador-vitrine");

    function atualizarContadorCarrinhoVitrine() {
        const total = contarItensCarrinho();

        carrinhoContadorVitrine.textContent = total;
        carrinhoContadorVitrine.classList.toggle("visivel", total > 0);
    }

    atualizarContadorCarrinhoVitrine();

    document.querySelector("#opcao-carrinho-vitrine").addEventListener("click", (evento) => {
        evento.stopPropagation();
        window.location.href = "carrinho.html";
    });


    /* =========================
       FILTRO DE LOJAS

       "Lojas mais confiáveis" = tem mais de 1 ano na Vitrine
       "Com promoção" = algum produto com preço original (desconto)
       "Frete grátis" = algum produto com frete grátis
    ========================= */

    const filtrosAtivos = new Set();

    /** @param {string} slug */
    function lojaEhConfiavel(slug) {
        const loja = LOJAS_VITRINE[slug];

        if (!loja || !loja.anoEntrada) return false;

        const anoAtual = new Date().getFullYear();

        return (anoAtual - loja.anoEntrada) >= 1;
    }

    /** @param {Object} produto */
    function temDesconto(produto) {
        return Boolean(produto.precoOriginal);
    }

    /** @param {string} slug */
    function lojaTemPromocao(slug) {
        const loja = LOJAS_VITRINE[slug];

        if (!loja) return false;

        return loja.produtos.some(temDesconto);
    }

    /** @param {Object} produto */
    function temFreteGratis(produto) {
        return produto.freteGratis === true;
    }

    /** @param {string} slug */
    function lojaTemFreteGratis(slug) {
        const loja = LOJAS_VITRINE[slug];

        if (!loja) return false;

        return loja.produtos.some(temFreteGratis);
    }

    /** @param {string} slug */
    function lojaPassaNosFiltros(slug) {
        if (filtrosAtivos.has("confiavel") && !lojaEhConfiavel(slug)) return false;
        if (filtrosAtivos.has("promocao") && !lojaTemPromocao(slug)) return false;
        if (filtrosAtivos.has("frete") && !lojaTemFreteGratis(slug)) return false;

        return true;
    }

    function aplicarFiltros() {
        document.querySelectorAll(".grupo-abas").forEach((grupo) => {
            const slug = grupo.dataset.loja;

            grupo.style.display = lojaPassaNosFiltros(slug) ? "" : "none";
        });
    }

    document.querySelectorAll(".filtro-item").forEach((item) => {
        item.addEventListener("click", (evento) => {
            evento.stopPropagation();

            const chave = item.dataset.filtro;

            if (filtrosAtivos.has(chave)) {
                filtrosAtivos.delete(chave);
                item.classList.remove("ativo");
            } else {
                filtrosAtivos.add(chave);
                item.classList.add("ativo");
            }

            aplicarFiltros();
        });
    });

    document.querySelector("#filtro-limpar").addEventListener("click", (evento) => {
        evento.stopPropagation();

        filtrosAtivos.clear();

        document.querySelectorAll(".filtro-item").forEach((item) => {
            item.classList.remove("ativo");
        });

        aplicarFiltros();
    });
}

// Espera os dados das lojas parceiras chegarem do Supabase.
// Se já estiverem prontos (carregamento rápido), inicia na hora.
if (window.LOJAS_VITRINE) {
    iniciarLojasEFiltros();
} else {
    window.addEventListener("vitrine-dados-prontos", iniciarLojasEFiltros);
}
