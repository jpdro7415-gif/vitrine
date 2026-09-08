const listaCarrinho = document.querySelector("#lista-carrinho");
const carrinhoVazio = document.querySelector("#carrinho-vazio");
const rodapeCarrinho = document.querySelector("#rodape-carrinho");
const totalCarrinhoTexto = document.querySelector("#total-carrinho");

/**
 * Converte um preço tipo "R$ 45,90" num número (45.90)
 * @param {string} precoTexto
 */
function precoParaNumero(precoTexto) {
    const somenteNumeros = precoTexto
        .replace("R$", "")
        .trim()
        .replace(".", "")
        .replace(",", ".");

    return parseFloat(somenteNumeros) || 0;
}

/** @param {number} valor */
function numeroParaPreco(valor) {
    return "R$ " + valor.toFixed(2).replace(".", ",");
}

function renderizarCarrinho() {
    const itens = obterCarrinho();

    listaCarrinho.innerHTML = "";

    if (itens.length === 0) {
        carrinhoVazio.style.display = "block";
        rodapeCarrinho.classList.remove("visivel");
        return;
    }

    carrinhoVazio.style.display = "none";

    let total = 0;

    /**
     * @param {Object} item
     * @param {number} indice
     */
    function renderizarItem(item, indice) {
        total += precoParaNumero(item.preco) * item.quantidade;

        const linha = document.createElement("div");
        linha.className = "item-carrinho";

        linha.innerHTML = `
            <img class="item-carrinho-imagem" src="${item.imagem}" alt="${item.nome}">
            <div class="item-carrinho-info">
                <div class="item-carrinho-loja">${item.loja}</div>
                <div class="item-carrinho-nome">${item.nome}</div>
                <span class="item-carrinho-preco">${item.preco}</span><span class="item-carrinho-quantidade">x${item.quantidade}</span>
            </div>
            <button class="item-carrinho-remover" data-indice="${indice}">✕</button>
        `;

        listaCarrinho.appendChild(linha);
    }

    itens.forEach(renderizarItem);

    rodapeCarrinho.classList.add("visivel");
    totalCarrinhoTexto.textContent = numeroParaPreco(total);

    /** @param {HTMLElement} botao */
    function ligarBotaoRemover(botao) {
        botao.addEventListener("click", () => {
            const indice = parseInt(botao.dataset.indice, 10);

            removerDoCarrinho(indice);
            renderizarCarrinho();
        });
    }

    document.querySelectorAll(".item-carrinho-remover").forEach(ligarBotaoRemover);
}

renderizarCarrinho();

document.querySelector("#botao-voltar-carrinho").addEventListener("click", () => {
    history.back();
});
