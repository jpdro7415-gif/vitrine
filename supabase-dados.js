/* =========================
   CARREGA OS DADOS DO SUPABASE
   (substitui o antigo lojas-dados.js
   fixo por dados de verdade, vindos
   do banco de dados)
========================= */

const SUPABASE_URL = "https://wodfhcbzslrplbcfyrrz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZGZoY2J6c2xycGxiY2Z5cnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjY1NTMsImV4cCI6MjA4NzE0MjU1M30.8Wq4_b4jSwJniQfOkrMLRbklbsMc_rFrTL9CeRz-Knk";

// Transforma um número (45.9) no formato de texto que o
// resto do código já espera ("R$ 45,90")
/** @param {number | null} numero */
function formatarPreco(numero) {
    if (numero === null || numero === undefined) return null;
    return "R$ " + Number(numero).toFixed(2).replace(".", ",");
}

async function carregarDadosSupabase() {
    const headers = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: "Bearer " + SUPABASE_ANON_KEY
    };

    const [respostaLojas, respostaProdutos] = await Promise.all([
        fetch(SUPABASE_URL + "/rest/v1/lojas?select=*&status=eq.aprovado", { headers }),
        fetch(SUPABASE_URL + "/rest/v1/produtos?select=*", { headers })
    ]);

    const lojas = await respostaLojas.json();
    const produtos = await respostaProdutos.json();

    // Monta o objeto LOJAS_VITRINE na mesma "forma" de antes,
    // pra loja.js e produto.js não precisarem mudar nada
    const lojasVitrine = {};

    /** @param {any} loja */
    const montarLoja = (loja) => {
        lojasVitrine[loja.slug] = {
            nome: loja.nome,
            corPrincipal: loja.cor_principal,
            corFundo: loja.cor_fundo || undefined,
            logo: loja.logo,
            anoEntrada: loja.ano_entrada || undefined,
            produtos: []
        };
    };

    lojas.forEach(montarLoja);

    // Mapa de id da loja -> dados da loja, pra achar a loja de
    // cada produto sem precisar de outra função anônima
    /** @type {Object.<string, any>} */
    const lojasPorId = {};
    for (let i = 0; i < lojas.length; i++) {
        lojasPorId[lojas[i].id] = lojas[i];
    }

    /** @param {any} produto */
    const montarProduto = (produto) => {
        if (produto.oculto === true) return;

        const loja = lojasPorId[produto.loja_id];
        if (!loja || !lojasVitrine[loja.slug]) return;

        lojasVitrine[loja.slug].produtos.push({
            nome: produto.nome,
            preco: formatarPreco(produto.preco),
            precoOriginal: formatarPreco(produto.preco_original),
            imagem: produto.imagem,
            avaliacao: produto.avaliacao || undefined,
            numeroAvaliacoes: produto.numero_avaliacoes || undefined,
            vendidos: produto.vendidos || undefined,
            estoque: produto.estoque || undefined,
            parcelas: produto.parcelas || undefined,
            freteGratis: produto.frete_gratis === true,
            descricao: produto.descricao || undefined
        });
    };

    produtos.forEach(montarProduto);

    window.LOJAS_VITRINE = lojasVitrine;

    // Avisa o resto do código que os dados já chegaram
    window.dispatchEvent(new Event("vitrine-dados-prontos"));
}

carregarDadosSupabase();
