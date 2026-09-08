/* =========================
   BANCO DE DADOS DAS LOJAS

   Pra adicionar uma loja nova,
   não precisa criar arquivo
   nenhum — só um bloco aqui
   igual aos outros.
========================= */

const LOJAS_VITRINE = {

    shopee: {
        nome: "Shopee",
        corPrincipal: "#FF5722",
        logo: "shopee-logo.png",
        produtos: [
            {
                nome: "Fone Bluetooth",
                preco: "R$ 45,90",
                precoOriginal: "R$ 59,90",
                imagem: "produto-exemplo.jpg",
                imagens: ["produto-exemplo.jpg", "produto-exemplo-2.jpg", "produto-exemplo-3.jpg"],
                avaliacao: 4.5,
                numeroAvaliacoes: 128,
                vendidos: 1240,
                estoque: 8,
                parcelas: 10,
                freteGratis: true,
                descricao: "Fone de ouvido sem fio com cancelamento de ruído, bateria de até 20 horas e resistência à água (IPX4). Conecta automaticamente ao celular assim que sai da caixinha."
            },
            { nome: "Capinha de celular", preco: "R$ 12,00", imagem: "produto-exemplo.jpg" },
            { nome: "Luminária LED", preco: "R$ 29,90", imagem: "produto-exemplo.jpg" },
            { nome: "Mochila impermeável", preco: "R$ 79,90", imagem: "produto-exemplo.jpg" }
        ]
    },

    temu: {
        nome: "Temu",
        corPrincipal: "#FA5F1D",
        logo: "temu.png",
        produtos: [
            { nome: "Relógio digital", preco: "R$ 19,90", imagem: "produto-exemplo.jpg" },
            { nome: "Organizador de gavetas", preco: "R$ 24,90", imagem: "produto-exemplo.jpg" },
            { nome: "Suporte para celular", preco: "R$ 9,90", imagem: "produto-exemplo.jpg" },
            { nome: "Kit de pincéis", preco: "R$ 34,90", imagem: "produto-exemplo.jpg" }
        ]
    },

    amazon: {
        nome: "Amazon",
        corPrincipal: "#B08D57",
        logo: "amazon-logo.png",
        produtos: []
    },

    aliexpress: {
        nome: "AliExpress",
        corPrincipal: "#E62E04",
        logo: "aliexpress-logo.png",
        produtos: []
    },

    shein: {
        nome: "Shein",
        corPrincipal: "#1a1a1a",
        logo: "shein-logo.png",
        produtos: []
    },

    mercadolivre: {
        nome: "Mercado Livre",
        corPrincipal: "#FFE600",
        logo: "mercadolivre-logo.png",
        produtos: []
    },

    magalu: {
        nome: "Magazine Luiza",
        corPrincipal: "#0086FF",
        logo: "magalu-logo.png",
        produtos: []
    },

    kabum: {
        nome: "Kabum",
        corPrincipal: "#FF6500",
        logo: "kabum-logo.png",
        produtos: []
    },

    netshoes: {
        nome: "Netshoes",
        corPrincipal: "#7C3AED",
        logo: "netshoes-logo.png",
        produtos: []
    },

    casasbahia: {
        nome: "Casas Bahia",
        corPrincipal: "#0033A0",
        logo: "casasbahia-logo.png",
        produtos: []
    },

    ifood: {
        nome: "iFood",
        corPrincipal: "#EA1D2C",
        logo: "ifood-logo.png",
        produtos: []
    },

    booking: {
        nome: "Booking.com",
        corPrincipal: "#003580",
        logo: "booking-logo.png",
        produtos: []
    }

};

// Deixa explícito que essa variável é usada por outros
// arquivos (loja.js), evitando o aviso de "não utilizada"
window.LOJAS_VITRINE = LOJAS_VITRINE;
