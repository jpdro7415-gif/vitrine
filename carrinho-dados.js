/* =========================
   CARRINHO — FUNÇÕES COMPARTILHADAS

   Usado tanto nas páginas de loja quanto
   na tela do carrinho. Guarda os itens no
   armazenamento local do celular (localStorage),
   então eles continuam salvos mesmo se o
   usuário fechar e abrir o app de novo.
========================= */

const CHAVE_CARRINHO = "vitrine-carrinho";

function obterCarrinho() {
    const dados = localStorage.getItem(CHAVE_CARRINHO);
    return dados ? JSON.parse(dados) : [];
}

/** @param {Array<Object>} itens */
function salvarCarrinho(itens) {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
}

/**
 * @param {string} loja
 * @param {string} nome
 * @param {string} preco
 * @param {string} imagem
 * @param {string} [precoOriginal]
 */
function adicionarAoCarrinho(loja, nome, preco, imagem, precoOriginal) {
    const itens = obterCarrinho();

    /** @param {Object} item */
    function ehOMesmoItem(item) {
        return item.loja === loja && item.nome === nome;
    }

    const existente = itens.find(ehOMesmoItem);

    if (existente) {
        existente.quantidade += 1;
    } else {
        itens.push({ loja, nome, preco, imagem, precoOriginal: precoOriginal || null, quantidade: 1 });
    }

    salvarCarrinho(itens);

    if (precoOriginal) {
        notificarSeTiverDesconto({ nome, preco, precoOriginal });
    }
}

/** @param {number} indice */
function removerDoCarrinho(indice) {
    const itens = obterCarrinho();
    itens.splice(indice, 1);
    salvarCarrinho(itens);
}

function contarItensCarrinho() {
    /**
     * @param {number} total
     * @param {Object} item
     */
    function somarQuantidade(total, item) {
        return total + item.quantidade;
    }

    return obterCarrinho().reduce(somarQuantidade, 0);
}


/* =========================
   NOTIFICAÇÃO DE DESCONTO

   Dispara uma notificação de verdade do
   celular (fora do app) quando um item com
   desconto entra no carrinho. Só funciona
   enquanto o navegador estiver aberto (mesmo
   que em segundo plano) — notificação que
   chega com o navegador fechado precisaria
   de um servidor por trás, o que esse projeto
   ainda não tem.
========================= */

/** @param {{nome: string, preco: string, precoOriginal: string}} item */
function notificarSeTiverDesconto(item) {
    if (!("Notification" in window)) return;

    function dispararNotificacao() {
        new Notification("Desconto no seu carrinho! 🏷️", {
            body: item.nome + " caiu de " + item.precoOriginal + " para " + item.preco,
        });
    }

    if (Notification.permission === "granted") {
        dispararNotificacao();
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permissao) => {
            if (permissao === "granted") {
                dispararNotificacao();
            }
        });
    }
}

// Deixa explícito que essas funções são usadas por outros
// arquivos (loja.js, carrinho.js), evitando o aviso de
// "não utilizada" — o editor analisa cada arquivo sozinho e
// não enxerga o uso feito em outro <script>.
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.removerDoCarrinho = removerDoCarrinho;
window.contarItensCarrinho = contarItensCarrinho;
window.obterCarrinho = obterCarrinho;
