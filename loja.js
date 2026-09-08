// Descobre qual loja foi aberta pelo endereço
// (ex: loja.html?loja=shopee)

/**
 * @typedef {Object} Produto
 * @property {string} nome
 * @property {string} preco
 * @property {string} imagem
 * @property {string} [precoOriginal]
 * @property {string} [descricao]
 * @property {string[]} [imagens]
 * @property {number} [avaliacao]
 * @property {number} [numeroAvaliacoes]
 * @property {number} [vendidos]
 * @property {number} [estoque]
 * @property {number} [parcelas]
 * @property {boolean} [freteGratis]
 */

const parametros = new URLSearchParams(window.location.search);
const slugLoja = parametros.get("loja");

const dadosLoja = LOJAS_VITRINE[slugLoja];

if (!dadosLoja) {
    // Loja não encontrada no banco de dados — volta pra home
    // (substitui a página atual, não empilha mais uma)
    window.location.replace("loading.html");
}

// Garante que o botão físico de voltar do celular sempre volte
// pra Vitrine a partir daqui, MAS só quando não tiver nenhuma
// "aba" aberta por cima da loja (tipo o carrinho). Se tiver uma
// aberta, voltar só fecha ela e te deixa na loja; só quando não
// sobrar nenhuma é que volta pra Vitrine de verdade.
const entradasNavegacao = performance.getEntriesByType("navigation");
const tipoNavegacao = entradasNavegacao.length > 0 ? entradasNavegacao[0].type : null;

const CHAVE_PROFUNDIDADE = "vitrine-profundidade-loja";

function obterProfundidadeLoja() {
    return parseInt(sessionStorage.getItem(CHAVE_PROFUNDIDADE) || "0", 10);
}

/** @param {number} valor */
function definirProfundidadeLoja(valor) {
    sessionStorage.setItem(CHAVE_PROFUNDIDADE, String(valor));
}

function tratarVoltarNaLoja() {
    const profundidade = obterProfundidadeLoja();

    if (profundidade > 0) {
        // Só tinha uma aba aberta (o carrinho, por exemplo) — ela
        // fechou sozinha ao voltar, então só atualiza a contagem
        // e continua aqui na loja.
        definirProfundidadeLoja(profundidade - 1);
    } else {
        // Não tinha nenhuma aba aberta — essa já era a tela padrão
        // da loja, então agora sim volta pra Vitrine.
        window.location.replace("loading.html");
    }
}

if (tipoNavegacao === "back_forward") {
    tratarVoltarNaLoja();
} else {
    // Chegada normal na loja (clicou nela na Vitrine, ou trocou
    // de loja) — zera a contagem de abas abertas.
    definirProfundidadeLoja(0);
}

// Reforço: registra uma marca no histórico e escuta o popstate
// também, caso o navegador suporte.
history.pushState({ vitrineLoja: true }, "");

window.addEventListener("popstate", () => {
    tratarVoltarNaLoja();
});

// Aplica a cor da loja em tudo que usa a variável --cor-principal
document.documentElement.style.setProperty("--cor-principal", dadosLoja.corPrincipal);

// O fundo usa a cor de fundo própria da loja, se ela tiver uma
// cadastrada — senão, cai de volta na cor principal
document.documentElement.style.setProperty("--cor-fundo", dadosLoja.corFundo || dadosLoja.corPrincipal);

// Preenche o cabeçalho
document.querySelector("#logo-loja").src = dadosLoja.logo;
document.querySelector("#logo-loja").alt = dadosLoja.nome;

document.title = dadosLoja.nome + " — vitrine";

// Monta a grade de produtos
const gradeProdutos = document.querySelector("#grade-produtos");
const lojaVazia = document.querySelector("#loja-vazia");

/**
 * @param {Produto} produto
 * @param {number} indice
 */
function criarCardProduto(produto, indice) {
    const card = document.createElement("div");
    card.className = "produto-card";

    card.innerHTML = `
        <img class="produto-imagem" src="${produto.imagem}" alt="${produto.nome}">
        <div class="produto-info">
            <div class="produto-nome">${produto.nome}</div>
            <div class="produto-preco">${produto.preco}</div>
        </div>
    `;

    card.addEventListener("click", () => {
        definirProfundidadeLoja(obterProfundidadeLoja() + 1);
        window.location.href = "produto.html?loja=" + slugLoja + "&indice=" + indice;
    });

    gradeProdutos.appendChild(card);
}

if (dadosLoja.produtos.length === 0) {
    lojaVazia.style.display = "block";
} else {
    dadosLoja.produtos.forEach(criarCardProduto);
}

// Ícone do carrinho: mostra quantos itens tem e leva pra tela dele
const carrinhoContador = document.querySelector("#carrinho-contador");

function atualizarContadorCarrinho() {
    const total = contarItensCarrinho();

    carrinhoContador.textContent = total;
    carrinhoContador.classList.toggle("visivel", total > 0);
}

atualizarContadorCarrinho();

document.querySelector("#opcao-carrinho").addEventListener("click", () => {
    definirProfundidadeLoja(obterProfundidadeLoja() + 1);
    window.location.href = "carrinho.html";
});

// Menu de lojas (abre ao tocar no ícone, igual na Vitrine)
const abreLogoLoja = document.querySelector("#logo-loja");
const menuLojas = document.querySelector("#menu-lojas");
const listaLojas = document.querySelector("#lista-lojas");

// Monta a lista: "Vitrine" primeiro (volta pra home),
// depois todas as lojas do banco de dados
/**
 * @param {string} nome
 * @param {string} logo
 * @param {() => void} aoClicar
 */
function criarItemLoja(nome, logo, aoClicar) {
    const item = document.createElement("div");
    item.className = "loja-item";

    item.innerHTML = `
        <img class="icone-loja-item" src="${logo}" alt="${nome}">
        <span>${nome}</span>
    `;

    item.addEventListener("click", (evento) => {
        evento.stopPropagation();
        aoClicar();
    });

    listaLojas.appendChild(item);
}

// Voltar pra Vitrine ou trocar de loja substitui a página atual
// no histórico — assim, o botão físico de voltar não fica
// "reproduzindo" cada troca de loja que você fez, ele já leva
// direto pra Vitrine (o único nível que fica empilhado de verdade
// é a ida inicial da Vitrine pra uma loja).
criarItemLoja("Vitrine", "Vitrine-logo.png", () => {
    window.location.replace("loading.html");
});

Object.keys(LOJAS_VITRINE).forEach((slug) => {
    const loja = LOJAS_VITRINE[slug];

    criarItemLoja(loja.nome, loja.logo, () => {
        window.location.replace("loja.html?loja=" + slug);
    });
});

abreLogoLoja.addEventListener("click", (evento) => {
    evento.stopPropagation();
    menuLojas.classList.toggle("aberto");
});

menuLojas.addEventListener("click", (evento) => {
    evento.stopPropagation();
});

document.addEventListener("click", () => {
    menuLojas.classList.remove("aberto");
});

// Menu de opções (três pontinhos)
const abreMenuOpcoes = document.querySelector("#menu-pontinhos-loja");
const menuOpcoesLoja = document.querySelector("#menu-opcoes-loja");

abreMenuOpcoes.addEventListener("click", (evento) => {
    evento.stopPropagation();
    menuOpcoesLoja.classList.toggle("aberto");
});

menuOpcoesLoja.addEventListener("click", (evento) => {
    evento.stopPropagation();
});

document.addEventListener("click", () => {
    menuOpcoesLoja.classList.remove("aberto");
});
