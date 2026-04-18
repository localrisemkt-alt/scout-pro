const axios = require('axios');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// ==========================================
// CONFIGURAÇÃO TELEGRAM E LIGAS (TIER 1 E 2)
// ==========================================
const TELEGRAM_TOKEN = '8713617634:AAG8CeBPC5UtyYeXKMfypj0bBaLebAOLFEI';
const TELEGRAM_CHAT_ID = '-1002425308549';

const ligasPrincipais = [325, 17, 8, 23, 35, 34, 7, 384]; 
const ligasSecundarias = [326, 18, 37, 238, 242, 52, 2076]; 
const todasVip = [...ligasPrincipais, ...ligasSecundarias];

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// ==========================================
// MATEMÁTICA AVANÇADA (POISSON)
// ==========================================
function calcProbOver(linha, projecao) {
    let probUnder = 0;
    let maxK = Math.floor(linha); 
    for(let i = 0; i <= maxK; i++) {
        let p = 1.0;
        for(let j = 0; j < i; j++) { p *= (projecao / (j + 1)); }
        probUnder += p * Math.exp(-projecao);
    }
    return (1 - probUnder) * 100; 
}

function calcProbBTTS(projH, projA) {
    const probH_Marca = 1 - Math.exp(-projH);
    const probA_Marca = 1 - Math.exp(-projA);
    return (probH_Marca * probA_Marca) * 100;
}

function tendencia(temporada, recente) {
    if (recente > temporada * 1.1) return `🔥 <b>${recente.toFixed(2)}</b>`; // Aumentou mais de 10%
    if (recente < temporada * 0.9) return `❄️ <b>${recente.toFixed(2)}</b>`; // Caiu mais de 10%
    return `⚖️ <b>${recente.toFixed(2)}</b>`; // Estável
}

// ==========================================
// UI/UX DESIGN PREMIUM (NOVO VISUAL)
// ==========================================
const cabecalhoHTML = (titulo) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${titulo}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        :root { 
            --bg: #0f172a; --card: #1e293b; --border: #334155; --text: #f8fafc; 
            --gray: #94a3b8; --primary: #10b981; --primary-glow: rgba(16, 185, 129, 0.15); 
            --secondary: #3b82f6; --warning: #f59e0b; 
        }
        
        * { box-sizing: border-box; font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--text); padding: 20px 15px; -webkit-font-smoothing: antialiased; }
        .container { max-width: 800px; margin: auto; padding-bottom: 40px; }
        
        h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 24px; color: #fff; }
        .header-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .voltar { color: var(--gray); text-decoration: none; font-weight: 600; font-size: 14px; transition: color 0.2s; }
        .voltar:hover { color: var(--text); }
        
        .btn-dashboard { background: var(--warning); color: #000; padding: 16px; border-radius: 12px; text-align: center; font-size: 15px; font-weight: 700; text-decoration: none; display: block; margin-bottom: 24px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2); }
        .btn-dashboard:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3); }
        
        .btn-telegram { background: var(--secondary); color: white; padding: 16px; border-radius: 12px; text-align: center; font-weight: 700; text-decoration: none; display: block; margin-bottom: 24px; border: none; width: 100%; cursor: pointer; font-size: 15px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2); }
        .btn-telegram:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3); }
        
        .filtro-box { background: var(--card); padding: 20px; border-radius: 16px; margin-bottom: 24px; border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .filtro-box form { display: flex; flex-direction: column; gap: 12px; }
        .filtro-box select, .filtro-box input { padding: 14px 16px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 14px; font-weight: 500; outline: none; transition: border-color 0.2s; }
        .filtro-box select:focus, .filtro-box input:focus { border-color: var(--secondary); }
        @media(min-width: 600px) { .filtro-box form { flex-direction: row; } }
        
        .liga-card { background: var(--card); margin-bottom: 24px; border-radius: 16px; overflow: hidden; border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .liga-nome { padding: 14px 20px; background: rgba(255,255,255,0.02); font-weight: 700; font-size: 13px; color: var(--gray); text-transform: uppercase; border-bottom: 1px solid var(--border); letter-spacing: 0.5px; }
        .jogo-item { display: flex; flex-direction: column; padding: 16px 20px; border-top: 1px solid var(--border); text-decoration: none; color: var(--text); transition: background 0.2s; gap: 12px; }
        .jogo-item:first-of-type { border-top: none; }
        .jogo-item:hover { background: rgba(255,255,255,0.03); }
        .jogo-nomes { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .jogo-nomes .vs { color: var(--gray); font-size: 13px; font-weight: 400; }
        .btn-analise { background: var(--primary-glow); color: var(--primary); padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 12px; text-transform: uppercase; display: inline-block; align-self: flex-start; border: 1px solid rgba(16,185,129,0.2); }
        @media(min-width: 600px) { .jogo-item { flex-direction: row; justify-content: space-between; align-items: center; } .btn-analise { align-self: center; } }

        .dash-section { margin-bottom: 32px; }
        .dash-title { color: var(--text); font-size: 15px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .dash-item { background: var(--card); padding: 16px 20px; border-radius: 12px; margin-bottom: 12px; border: 1px solid var(--border); text-decoration: none; color: var(--text); display: block; transition: transform 0.2s, border-color 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .dash-item:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .dash-jogo { font-weight: 700; font-size: 15px; }
        .badge-prob { background: var(--primary); color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: 800; box-shadow: 0 2px 8px var(--primary-glow); }
        .badge-prob.chutes { background: var(--warning); box-shadow: 0 2px 8px rgba(245,158,11,0.2); color: #000; }
        .dash-projecao { color: var(--gray); font-size: 13px; display: flex; justify-content: space-between; font-weight: 500; }
        .dash-projecao b { color: var(--text); }
        
        .bilhete-box { background: linear-gradient(145deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02)); border: 1px solid rgba(16,185,129,0.3); padding: 20px; border-radius: 16px; margin-bottom: 32px; }
        .bilhete-titulo { color: var(--primary); font-size: 12px; text-transform: uppercase; font-weight: 800; margin-bottom: 12px; display: block; letter-spacing: 0.5px; }
        .bilhete-itens { font-size: 15px; font-weight: 500; line-height: 1.8; color: var(--text); }
        
        .grid-scout { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @media(min-width: 600px) { .grid-scout { grid-template-columns: 1fr 1fr; } }
        .card-stat { background: var(--card); padding: 20px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .titulo-stat { font-size: 13px; color: var(--gray); margin-bottom: 16px; display: flex; align-items: center; gap: 6px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
        
        .linha-time { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
        .linha-time:last-of-type { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .nome-time { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 12px; display: block; }
        .barra-stats { display: flex; justify-content: space-between; font-size: 14px; color: var(--gray); margin-bottom: 8px; align-items: center; }
        .barra-stats span { font-weight: 500; }
        .barra-stats b { font-size: 14px; color: var(--text); font-weight: 600; background: var(--bg); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); }
        
        .projecao-box { background: var(--bg); padding: 16px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 16px; border: 1px solid var(--border); }
        .proj-detalhe { display: flex; flex-direction: column; text-align: left; gap: 4px; }
        .proj-label { font-size: 11px; color: var(--gray); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .proj-valor { font-size: 15px; font-weight: 700; color: var(--text); }
        .proj-chance { font-size: 22px; font-weight: 800; color: var(--primary); }
        .proj-chance.baixa { color: var(--gray); }
    </style>
</head>
<body>
<div class="container">
`;
const rodapeHTML = `</div></body></html>`;

// ==========================================
// FUNÇÕES DA API E AUXILIARES
// ==========================================
async function buscarJogosDoDia(data) {
    try {
        const url = `https://api.sofascore.com/api/v1/sport/football/scheduled-events/${data}`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        return res.data.events || [];
    } catch (e) { return []; }
}

async function puxarEstatisticasEquipe(teamId, tournamentId, seasonId) {
    const d = { fez: 0, sofreu: 0, cantos: 0, chutes: 0, cartoes: 0 };
    if (!teamId || !tournamentId || !seasonId) return d;
    try {
        const url = `https://api.sofascore.com/api/v1/team/${teamId}/unique-tournament/${tournamentId}/season/${seasonId}/statistics/overall`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const s = res.data.statistics; const m = s.matches || 1;
        return { 
            fez: parseFloat((s.goalsScored / m).toFixed(2)), 
            sofreu: parseFloat((s.goalsConceded / m).toFixed(2)), 
            cantos: parseFloat((s.corners / m).toFixed(2)), 
            chutes: parseFloat(((s.shots || s.totalShots || 0) / m).toFixed(2)), 
            cartoes: parseFloat((s.yellowCards / m).toFixed(2)) 
        };
    } catch (e) { return d; }
}

// NOVA FUNÇÃO: Busca os placares dos Últimos 5 Jogos do time para calcular a Tendência
async function puxarFormaGols(teamId) {
    try {
        const url = `https://api.sofascore.com/api/v1/team/${teamId}/events/last/0`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const eventos = res.data.events.filter(e => e.status.type === 'finished').slice(0, 5);
        
        if (eventos.length === 0) return { fez: 0, sofreu: 0 };
        
        let golsFeitos = 0;
        let golsSofridos = 0;
        
        eventos.forEach(e => {
            if (e.homeTeam.id == teamId) {
                golsFeitos += e.homeScore.current || 0;
                golsSofridos += e.awayScore.current || 0;
            } else {
                golsFeitos += e.awayScore.current || 0;
                golsSofridos += e.homeScore.current || 0;
            }
        });
        
        return { 
            fez: parseFloat((golsFeitos / eventos.length).toFixed(2)), 
            sofreu: parseFloat((golsSofridos / eventos.length).toFixed(2)) 
        };
    } catch (e) { 
        return { fez: 0, sofreu: 0 }; 
    }
}

function filtrarJogosPorCategoria(jogos, categoria) {
    let base = jogos.filter(j => j.status?.type !== 'finished');
    if (categoria === 'principal') return base.filter(j => ligasPrincipais.includes(j.tournament.uniqueTournament?.id));
    if (categoria === 'demais') return base.filter(j => ligasSecundarias.includes(j.tournament.uniqueTournament?.id));
    if (categoria === 'todas') return base.filter(j => todasVip.includes(j.tournament.uniqueTournament?.id));
    return base.filter(j => String(j.tournament.uniqueTournament?.id) === String(categoria));
}

// ==========================================
// ROTA: HOME (RADAR)
// ==========================================
app.get('/', async (req, res) => {
    const dataAlvo = req.query.data || new Date().toISOString().split('T')[0];
    const ligaFiltro = req.query.liga || 'principal'; 
    const jogos = await buscarJogosDoDia(dataAlvo);
    const filtrados = filtrarJogosPorCategoria(jogos, ligaFiltro);

    const agrupados = {};
    filtrados.forEach(j => {
        const n = j.tournament.name;
        if (!agrupados[n]) agrupados[n] = [];
        agrupados[n].push(j);
    });

    let html = cabecalhoHTML("Radar Scout Pro") + `
        <div class="header-nav"><h1>📡 Radar Scout Pro</h1></div>
        
        <a href="/dashboard?data=${dataAlvo}&liga=${ligaFiltro}" class="btn-dashboard">
            🎯 Abrir Filtro Sniper
        </a>

        <div class="filtro-box">
            <form action="/" method="get">
                <input type="date" name="data" value="${dataAlvo}" onchange="this.form.submit()" style="flex: 1;">
                <select name="liga" onchange="this.form.submit()" style="flex: 2;">
                    <optgroup label="Visão Geral">
                        <option value="principal" ${ligaFiltro === 'principal' ? 'selected' : ''}>🌟 Ligas Principais</option>
                        <option value="demais" ${ligaFiltro === 'demais' ? 'selected' : ''}>🌎 Demais Ligas (Tier 2)</option>
                        <option value="todas" ${ligaFiltro === 'todas' ? 'selected' : ''}>🔥 Todas Ligas VIP</option>
                    </optgroup>
                    <optgroup label="Ligas Específicas">
                        <option value="325" ${ligaFiltro === '325' ? 'selected' : ''}>🇧🇷 Brasileirão Série A</option>
                        <option value="17" ${ligaFiltro === '17' ? 'selected' : ''}>🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League</option>
                        <option value="8" ${ligaFiltro === '8' ? 'selected' : ''}>🇪🇸 La Liga</option>
                        <option value="23" ${ligaFiltro === '23' ? 'selected' : ''}>🇮🇹 Serie A</option>
                        <option value="35" ${ligaFiltro === '35' ? 'selected' : ''}>🇩🇪 Bundesliga</option>
                        <option value="7" ${ligaFiltro === '7' ? 'selected' : ''}>🇪🇺 Champions League</option>
                        <option value="384" ${ligaFiltro === '384' ? 'selected' : ''}>🌎 Copa Libertadores</option>
                        <option value="52" ${ligaFiltro === '52' ? 'selected' : ''}>🇹🇷 Turquia Süper Lig</option>
                        <option value="2076" ${ligaFiltro === '2076' ? 'selected' : ''}>🇸🇦 Saudi Pro League</option>
                    </optgroup>
                </select>
            </form>
        </div>`;

    if(Object.keys(agrupados).length === 0) html += "<p style='text-align:center; color:#888; margin-top:40px;'>Nenhum jogo disponível ou todos já foram encerrados.</p>";

    for (const liga in agrupados) {
        html += `<div class="liga-card"><div class="liga-nome">🏆 ${liga}</div>`;
        agrupados[liga].forEach(j => {
            html += `
                <a href="/analisar?h=${encodeURIComponent(j.homeTeam.name)}&a=${encodeURIComponent(j.awayTeam.name)}&hId=${j.homeTeam.id}&aId=${j.awayTeam.id}&tId=${j.tournament.uniqueTournament?.id}&sId=${j.season?.id}" class="jogo-item">
                    <div class="jogo-nomes"><span>${j.homeTeam.name}</span> <span class="vs">x</span> <span>${j.awayTeam.name}</span></div>
                    <div class="btn-analise">Raio-X</div>
                </a>`;
        });
        html += `</div>`;
    }
    res.send(html + rodapeHTML);
});

// ==========================================
// ROTA: DASHBOARD SNIPER
// ==========================================
app.get('/dashboard', async (req, res) => {
    const dataAlvo = req.query.data || new Date().toISOString().split('T')[0];
    const ligaFiltro = req.query.liga || 'principal'; 
    
    const jogos = await buscarJogosDoDia(dataAlvo);
    const filtrados = filtrarJogosPorCategoria(jogos, ligaFiltro);

    const topGols = [], topBtts = [], topCantos = [], topChutes = [], topCartoes = [];

    res.write(cabecalhoHTML("Dashboard Sniper") + `
        <div class="header-nav"><a href="/" class="voltar">← Voltar ao Radar</a></div>
        <h1>🎯 Bilhetes Sniper</h1>
        
        <form action="/enviar-telegram" method="POST">
            <input type="hidden" name="data" value="${dataAlvo}">
            <input type="hidden" name="liga" value="${ligaFiltro}">
            <button type="submit" class="btn-telegram">🚀 Disparar Relatório no Telegram</button>
        </form>

        <p style="color:var(--gray); font-weight:500; margin-bottom: 24px;">Analisando ${filtrados.length} jogos... Aguarde.</p>
    `);

    for (const j of filtrados) {
        const tId = j.tournament.uniqueTournament?.id;
        const sId = j.season?.id;
        
        const sH = await puxarEstatisticasEquipe(j.homeTeam.id, tId, sId);
        const sA = await puxarEstatisticasEquipe(j.awayTeam.id, tId, sId);
        
        await delay(300); // Proteção Anti-Ban

        const projH = (sH.fez + sA.sofreu) / 2;
        const projA = (sA.fez + sH.sofreu) / 2;
        const projGolsT = projH + projA;

        const probGols = calcProbOver(1.5, projGolsT);
        const probBtts = calcProbBTTS(projH, projA);
        const probCantos = calcProbOver(8.5, sH.cantos + sA.cantos);
        const probChutes = calcProbOver(19.5, sH.chutes + sA.chutes);
        const probCartoes = calcProbOver(3.5, sH.cartoes + sA.cartoes);

        const nomeJogo = `${j.homeTeam.name} x ${j.awayTeam.name}`;
        const link = `/analisar?h=${encodeURIComponent(j.homeTeam.name)}&a=${encodeURIComponent(j.awayTeam.name)}&hId=${j.homeTeam.id}&aId=${j.awayTeam.id}&tId=${tId}&sId=${sId}`;

        if (probGols >= 85.0) topGols.push({ nome: nomeJogo, chance: probGols, detalhe: projGolsT.toFixed(2), link });
        if (probBtts >= 85.0) topBtts.push({ nome: nomeJogo, chance: probBtts, detalhe: `${projH.toFixed(1)} x ${projA.toFixed(1)}`, link });
        if (probCantos >= 85.0) topCantos.push({ nome: nomeJogo, chance: probCantos, detalhe: (sH.cantos + sA.cantos).toFixed(1), link });
        
        // CORTA-FOGO: Finalizações agora exigem 95% de assertividade matemática
        if (probChutes >= 95.0) topChutes.push({ nome: nomeJogo, chance: probChutes, detalhe: (sH.chutes + sA.chutes).toFixed(1), link });
        
        if (probCartoes >= 85.0) topCartoes.push({ nome: nomeJogo, chance: probCartoes, detalhe: (sH.cartoes + sA.cartoes).toFixed(1), link });
    }

    const renderSniper = (titulo, lista, icone, textoLinha, sufixo, classeBadge = '') => {
        let block = `<div class="dash-section"><span class="dash-title">${icone} ${titulo}</span>`;
        if (lista.length === 0) block += `<div class="dash-item" style="color:var(--gray); padding:16px; justify-content:center;">Nenhum jogo atingiu a meta hoje.</div>`;
        else {
            lista.sort((a, b) => b.chance - a.chance).forEach(item => {
                block += `<a href="${item.link}" class="dash-item"><div class="dash-header"><span class="dash-jogo">${item.nome}</span><span class="badge-prob ${classeBadge}">${item.chance.toFixed(1)}%</span></div><div class="dash-projecao"><span>Mercado: <b>${textoLinha}</b></span><span>Proj. Média: <b>${item.detalhe}</b> ${sufixo}</span></div></a>`;
            });
        }
        return block + `</div>`;
    };

    let conteudoFinal = renderSniper("Over 1.5 Gols (+85%)", topGols, "⚽", "+1.5 Gols", "gols");
    conteudoFinal += renderSniper("Ambas Marcam (+85%)", topBtts, "⚔️", "BTTS: Sim", "gols esperados");
    conteudoFinal += renderSniper("Over Escanteios (+85%)", topCantos, "🚩", "+8.5 Cantos", "cantos");
    conteudoFinal += renderSniper("Over Cartões (+85%)", topCartoes, "🟨", "+3.5 Cartões", "cartões");
    // Finalizações com Badge Amarela para destacar que é +95%
    conteudoFinal += renderSniper("Finalizações Totais (+95%)", topChutes, "👟", "+19.5 Chutes", "chutes", "chutes");

    res.end(conteudoFinal + rodapeHTML);
});

// ==========================================
// ROTA: DISPARO TELEGRAM (MENSAGENS SEPARADAS)
// ==========================================
app.use(express.urlencoded({ extended: true }));
app.post('/enviar-telegram', async (req, res) => {
    const { data, liga } = req.body;
    const jogos = await buscarJogosDoDia(data);
    const filtrados = filtrarJogosPorCategoria(jogos, liga);

    const partesData = data.split('-');
    const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

    let listaGols = [], listaBtts = [], listaCantos = [], listaCartoes = [], listaChutes = [];

    for (const j of filtrados) {
        const sH = await puxarEstatisticasEquipe(j.homeTeam.id, j.tournament.uniqueTournament?.id, j.season?.id);
        const sA = await puxarEstatisticasEquipe(j.awayTeam.id, j.tournament.uniqueTournament?.id, j.season?.id);
        await delay(300);

        const pH = (sH.fez + sA.sofreu) / 2; const pA = (sA.fez + sH.sofreu) / 2;
        const probG = calcProbOver(1.5, pH + pA);
        const probB = calcProbBTTS(pH, pA);
        const probC = calcProbOver(8.5, sH.cantos + sA.cantos);
        const probY = calcProbOver(3.5, sH.cartoes + sA.cartoes);
        const probF = calcProbOver(19.5, sH.chutes + sA.chutes);

        const jogoStr = `${j.homeTeam.name} x ${j.awayTeam.name}`;

        if(probG >= 85) listaGols.push(`▪️ ${jogoStr}\n📊 Chance: ${probG.toFixed(1)}%\n`);
        if(probB >= 85) listaBtts.push(`▪️ ${jogoStr}\n📊 Chance: ${probB.toFixed(1)}%\n`);
        if(probC >= 85) listaCantos.push(`▪️ ${jogoStr}\n📊 Chance: ${probC.toFixed(1)}%\n`);
        if(probY >= 85) listaCartoes.push(`▪️ ${jogoStr}\n📊 Chance: ${probY.toFixed(1)}%\n`);
        // Restrição rigorosa de 95% para chutes no Telegram
        if(probF >= 95) listaChutes.push(`▪️ ${jogoStr}\n📊 Chance: ${probF.toFixed(1)}%\n`);
    }

    let enviouAlgo = false;

    const dispararMensagem = async (titulo, lista, icone) => {
        if (lista.length > 0) {
            let msg = `🎯 *BILHETE SNIPER* 🎯\n📅 *Data:* ${dataFormatada}\n\n${icone} *${titulo}*\n\n${lista.join('\n')}\n🚀 _Scout Pro IA_`;
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, { chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' });
            await delay(500); 
            enviouAlgo = true;
        }
    };

    try {
        await dispararMensagem("OVER 1.5 GOLS (+85%)", listaGols, "⚽");
        await dispararMensagem("AMBAS MARCAM (+85%)", listaBtts, "⚔️");
        await dispararMensagem("OVER 8.5 CANTOS (+85%)", listaCantos, "🚩");
        await dispararMensagem("OVER 3.5 CARTÕES (+85%)", listaCartoes, "🟨");
        await dispararMensagem("OVER 19.5 FINALIZAÇÕES (+95%)", listaChutes, "👟");

        if (!enviouAlgo) {
            let msgVazia = `🎯 *BILHETE SNIPER* 🎯\n📅 *Data:* ${dataFormatada}\n\n⚠️ Nenhuma entrada de elite encontrada hoje.\n\n🚀 _Scout Pro IA_`;
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, { chat_id: TELEGRAM_CHAT_ID, text: msgVazia, parse_mode: 'Markdown' });
        }
        res.send("<script>alert('🚀 Relatórios enviados para o Telegram (Chutes filtrados em 95%)!'); window.history.back();</script>");
    } catch (e) { res.send("Erro ao enviar: " + e.message); }
});

// ==========================================
// ROTA: ANALISAR (RAIO-X COM TENDÊNCIA)
// ==========================================
app.get('/analisar', async (req, res) => {
    const { h, a, hId, aId, tId, sId } = req.query;
    
    // Busca os dados Gerais (Temporada Completa)
    const sH = await puxarEstatisticasEquipe(hId, tId, sId);
    const sA = await puxarEstatisticasEquipe(aId, tId, sId);

    // Busca os dados de Forma (Últimos 5 Jogos)
    const fH = await puxarFormaGols(hId);
    const fA = await puxarFormaGols(aId);

    const projH = (sH.fez + sA.sofreu) / 2;
    const projA = (sA.fez + sH.sofreu) / 2;
    const pGT = (projH + projA).toFixed(2);
    const pCT = (sH.cantos + sA.cantos).toFixed(1);
    const pFT = (sH.chutes + sA.chutes).toFixed(1);
    const pYT = (sH.cartoes + sA.cartoes).toFixed(1);

    const probGols = calcProbOver(1.5, pGT);
    const probBtts = calcProbBTTS(projH, projA);
    const probCantos = calcProbOver(8.5, pCT);
    const probChutes = calcProbOver(19.5, pFT);
    const probCartoes = calcProbOver(3.5, pYT);
    
    let b = [];
    if(probGols >= 85) b.push(`Mais de 1.5 Gols <span style="float:right; color:var(--primary)">${probGols.toFixed(1)}%</span>`);
    if(probBtts >= 85) b.push(`Ambas Marcam (Sim) <span style="float:right; color:var(--primary)">${probBtts.toFixed(1)}%</span>`);
    if(probCantos >= 85) b.push(`Mais de 8.5 Escanteios <span style="float:right; color:var(--primary)">${probCantos.toFixed(1)}%</span>`);
    if(probCartoes >= 85) b.push(`Mais de 3.5 Cartões <span style="float:right; color:var(--primary)">${probCartoes.toFixed(1)}%</span>`);
    if(probChutes >= 95) b.push(`Mais de 19.5 Finalizações <span style="float:right; color:var(--warning)">${probChutes.toFixed(1)}% (+95%)</span>`);

    const tB = b.length > 0 ? `<div style="display:flex; flex-direction:column; gap:8px;">✅ ${b.join("<br>✅ ")}</div>` : "<span style='color:var(--warning)'>⚠️ Nenhuma linha atinge os filtros de segurança.</span>";

    let html = cabecalhoHTML(`Raio-X: ${h}`) + `
        <div class="header-nav"><a href="/" class="voltar">← Voltar ao Radar</a></div>
        <h1 style="font-size: 22px;">📊 ${h} x ${a}</h1>
        
        <div class="bilhete-box">
            <span class="bilhete-titulo">🤖 IA: Entradas Sniper</span>
            <div class="bilhete-itens" style="font-weight:600;">${tB}</div>
        </div>

        <div class="grid-scout">
            <div class="card-stat"><span class="titulo-stat">⚔️ Ambas Marcam (BTTS)</span>
                <div class="barra-stats"><span>${h} (Proj.):</span> <b>${projH.toFixed(2)}</b></div>
                <div class="barra-stats"><span>${a} (Proj.):</span> <b>${projA.toFixed(2)}</b></div>
                <div class="projecao-box"><div class="proj-detalhe"><span class="proj-label">Probabilidade</span><span class="proj-valor">BTTS - SIM</span></div><span class="proj-chance ${probBtts >= 85 ? '' : 'baixa'}">${probBtts.toFixed(1)}%</span></div>
            </div>

            <div class="card-stat"><span class="titulo-stat">⚽ Tendência de Gols (Últimos 5)</span>
                <div class="linha-time">
                    <span class="nome-time">🏠 ${h}</span>
                    <div class="barra-stats"><span>Marca (Geral):</span> <b>${sH.fez.toFixed(2)}</b></div>
                    <div class="barra-stats"><span>Marca (Últimos 5):</span> <span>${tendencia(sH.fez, fH.fez)}</span></div>
                </div>
                <div class="linha-time" style="border:none;">
                    <span class="nome-time">✈️ ${a}</span>
                    <div class="barra-stats"><span>Marca (Geral):</span> <b>${sA.fez.toFixed(2)}</b></div>
                    <div class="barra-stats"><span>Marca (Últimos 5):</span> <span>${tendencia(sA.fez, fA.fez)}</span></div>
                </div>
                <div class="projecao-box"><div class="proj-detalhe"><span class="proj-label">Proj. Geral</span><span class="proj-valor">${pGT} Gols</span></div><span class="proj-chance ${probGols >= 85 ? '' : 'baixa'}">${probGols.toFixed(1)}%</span></div>
            </div>

            <div class="card-stat"><span class="titulo-stat">🚩 Escanteios</span>
                <div class="barra-stats"><span>${h}:</span> <b>${sH.cantos.toFixed(1)}</b></div><div class="barra-stats"><span>${a}:</span> <b>${sA.cantos.toFixed(1)}</b></div>
                <div class="projecao-box"><div class="proj-detalhe"><span class="proj-label">Proj. Cantos</span><span class="proj-valor">${pCT}</span></div><span class="proj-chance ${probCantos >= 85 ? '' : 'baixa'}">${probCantos.toFixed(1)}%</span></div>
            </div>

            <div class="card-stat"><span class="titulo-stat">🟨 Cartões</span>
                <div class="barra-stats"><span>${h}:</span> <b>${sH.cartoes.toFixed(1)}</b></div><div class="barra-stats"><span>${a}:</span> <b>${sA.cartoes.toFixed(1)}</b></div>
                <div class="projecao-box"><div class="proj-detalhe"><span class="proj-label">Proj. Cartões</span><span class="proj-valor">${pYT}</span></div><span class="proj-chance ${probCartoes >= 85 ? '' : 'baixa'}">${probCartoes.toFixed(1)}%</span></div>
            </div>

            <div class="card-stat"><span class="titulo-stat">👟 Finalizações</span>
                <div class="barra-stats"><span>${h}:</span> <b>${sH.chutes.toFixed(1)}</b></div><div class="barra-stats"><span>${a}:</span> <b>${sA.chutes.toFixed(1)}</b></div>
                <div class="projecao-box"><div class="proj-detalhe"><span class="proj-label">Filtro Rígido</span><span class="proj-valor">+95% Exigido</span></div><span class="proj-chance ${probChutes >= 95 ? '' : 'baixa'}">${probChutes.toFixed(1)}%</span></div>
            </div>
        </div>
    `;
    res.send(html + rodapeHTML);
});

app.listen(port, () => console.log(`\n🚀 SCOUT PRO ONLINE: http://localhost:${port}`));