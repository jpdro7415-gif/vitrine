const parametros = new URLSearchParams(window.location.search);
const slugLoja = parametros.get("loja");
const indiceProduto = parseInt(parametros.get("indice"), 10);

const dadosLoja = LOJAS_VITRINE[slugLoja];
const produto = dadosLoja ? dadosLoja.produtos[indiceProduto] : null;

if (!dadosLoja || !produto) {
    // Loja ou produto não encontrado — volta pra home
    window.location.replace("loading.html");
}

// Aplica a cor da loja
document.documentElement.style.setProperty("--cor-principal", dadosLoja.corPrincipal);

document.title = produto.nome + " — vitrine";

// Preenche a tela com os dados do produto
const imagens = produto.imagens && produto.imagens.length > 0 ? produto.imagens : [produto.imagem];

const imagemGrande = document.querySelector("#produto-imagem-grande");
imagemGrande.src = imagens[0];
imagemGrande.alt = produto.nome;

// Galeria: só mostra miniaturas se tiver mais de uma imagem
const miniaturasContainer = document.querySelector("#miniaturas-produto");

if (imagens.length > 1) {
    /**
     * @param {string} src
     * @param {number} indice
     */
    function criarMiniatura(src, indice) {
        const miniatura = document.createElement("img");
        miniatura.className = "miniatura-produto" + (indice === 0 ? " ativa" : "");
        miniatura.src = src;
        miniatura.alt = produto.nome + " " + (indice + 1);

        miniatura.addEventListener("click", () => {
            imagemGrande.src = src;

            document.querySelectorAll(".miniatura-produto").forEach((item) => {
                item.classList.remove("ativa");
            });
            miniatura.classList.add("ativa");
        });

        miniaturasContainer.appendChild(miniatura);
    }

    imagens.forEach(criarMiniatura);
}

// Linha da loja (ícone + nome), leva até a loja ao tocar
document.querySelector("#produto-loja-icone").src = dadosLoja.logo;
document.querySelector("#produto-loja-icone").alt = dadosLoja.nome;
document.querySelector("#produto-loja-nome").textContent = dadosLoja.nome;

document.querySelector("#produto-loja-linha").addEventListener("click", () => {
    history.back();
});

document.querySelector("#produto-nome-grande").textContent = produto.nome;
document.querySelector("#produto-preco-grande").textContent = produto.preco;

if (produto.precoOriginal) {
    document.querySelector("#produto-preco-original").textContent = produto.precoOriginal;
}

// Vendidos e estoque restante — só aparece o que estiver cadastrado
const areaVendidosEstoque = document.querySelector("#produto-vendidos-estoque");
const partesVendidosEstoque = [];

if (produto.vendidos) {
    partesVendidosEstoque.push(produto.vendidos.toLocaleString("pt-BR") + " vendidos");
}

if (produto.estoque !== undefined) {
    partesVendidosEstoque.push("restam " + produto.estoque + " unidades");
}

if (partesVendidosEstoque.length > 0) {
    areaVendidosEstoque.textContent = partesVendidosEstoque.join(" • ");
} else {
    areaVendidosEstoque.style.display = "none";
}

// Parcelamento — calcula o valor de cada parcela em cima do preço atual
const areaParcelamento = document.querySelector("#produto-parcelamento");

/** @param {string} precoTexto */
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

if (produto.parcelas && produto.parcelas > 1) {
    const total = precoParaNumero(produto.preco);
    const valorParcela = total / produto.parcelas;

    areaParcelamento.textContent =
        "ou " + produto.parcelas + "x de " + numeroParaPreco(valorParcela) +
        " sem juros (total: " + numeroParaPreco(total) + ")";
} else {
    areaParcelamento.style.display = "none";
}

// Avaliação (estrelas + quantidade), só aparece se o produto tiver
const areaAvaliacao = document.querySelector("#produto-avaliacao");

if (produto.avaliacao) {
    const notaArredondada = Math.round(produto.avaliacao);
    const estrelas = "★".repeat(notaArredondada) + "☆".repeat(5 - notaArredondada);
    const quantidade = produto.numeroAvaliacoes || 0;

    areaAvaliacao.innerHTML = `
        <span class="estrelas">${estrelas}</span>
        <span>${produto.avaliacao.toFixed(1)} (${quantidade} avaliações)</span>
    `;
} else {
    areaAvaliacao.style.display = "none";
}

// Frete
const areaFrete = document.querySelector("#produto-frete");

if (produto.freteGratis === true) {
    areaFrete.textContent = "🚚 Frete grátis";
    areaFrete.classList.add("gratis");
} else if (produto.freteGratis === false) {
    areaFrete.textContent = "🚚 Frete calculado no checkout";
    areaFrete.classList.add("pago");
} else {
    areaFrete.style.display = "none";
}

// Usa a descrição cadastrada do produto — se não tiver
// nenhuma, cai num texto genérico de aviso
document.querySelector("#produto-descricao").textContent =
    produto.descricao || ("Detalhes sobre " + produto.nome + " ainda não foram cadastrados nessa loja.");

// Botão de adicionar ao carrinho
const botaoAdicionar = document.querySelector("#botao-adicionar-carrinho");

botaoAdicionar.addEventListener("click", () => {
    adicionarAoCarrinho(dadosLoja.nome, produto.nome, produto.preco, produto.imagem, produto.precoOriginal);

    botaoAdicionar.textContent = "Adicionado ✓";
    botaoAdicionar.classList.add("adicionado");

    setTimeout(() => {
        botaoAdicionar.textContent = "Adicionar ao carrinho";
        botaoAdicionar.classList.remove("adicionado");
    }, 1500);
});

// Botão "Vá até a loja" — volta pra tela da loja (mesma lógica
// do botão de voltar do cabeçalho)
document.querySelector("#botao-ir-loja").addEventListener("click", () => {
    history.back();
});

// Botão de voltar — volta pra loja normalmente (a própria loja
// já sabe decidir se fica lá ou segue pra Vitrine, dependendo
// de quantas abas estavam abertas)
document.querySelector("#botao-voltar-produto").addEventListener("click", () => {
    history.back();
});
