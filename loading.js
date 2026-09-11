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
        gatilho: document.querySelector(".logo-vitrine"),
        elemento: document.querySelector(".menu-aplicativos"),
        classe: "aberta",
        fecharAoClicarFora: true
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

/** @param {any} produto */
function criarCardProdutoHome(produto) {
    const card = document.createElement("div");
    card.className = "card";

    const imagemHtml = produto.imagem
        ? `<img src="${produto.imagem}" alt="${produto.nome}">`
        : "";

    card.innerHTML = `
        <span class="card-titulo">${produto.nome}</span>
        <div class="card-info">${imagemHtml}</div>
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

    const produtosMostrados = loja.produtos.slice(0, 4);

    /** @param {any} produto */
    function adicionarCardNaFileira(produto) {
        fileira.appendChild(criarCardProdutoHome(produto));
    }

    produtosMostrados.forEach(adicionarCardNaFileira);

    grupo.appendChild(titulo);
    grupo.appendChild(fileira);

    return grupo;
}

/**
 * @param {string} slug
 * @param {any} loja
 */
function criarIconeMenu(slug, loja) {
    const item = document.createElement("div");
    item.className = "aplicativo";
    item.dataset.app = slug;
    item.innerHTML = `
        <img src="${loja.logo || ''}" class="icone-aplicativo" alt="${loja.nome}">
        <span>${loja.nome}</span>
    `;
    return item;
}

function renderizarLojasParceiras() {
    const containerAbas = document.querySelector("#abas-lojas");
    const containerMenu = document.querySelector("#lista-aplicativos-parceiras");

    if (!containerAbas || !containerMenu) return;

    containerAbas.innerHTML = "";
    containerMenu.innerHTML = "";

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

    slugs.forEach((slug) => {
        const loja = LOJAS_VITRINE[slug];
        containerAbas.appendChild(criarGrupoLoja(slug, loja));
        containerMenu.appendChild(criarIconeMenu(slug, loja));
    });
}

function iniciarLojasEFiltros() {
renderizarLojasParceiras();

    // Clicar numa loja da lista leva pra página daquela loja
    // (a "vitrine" fica em casa, o resto abre loja.html)
    document.querySelectorAll(".aplicativo").forEach((item) => {
        item.addEventListener("click", (evento) => {
            evento.stopPropagation();

            const loja = item.dataset.app;

            if (loja && loja !== "vitrine") {
                window.location.href = "loja.html?loja=" + loja;
            }
        });
    });

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
