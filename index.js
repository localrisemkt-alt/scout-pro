const axios = require('axios');
const express = require('express');
const app = express();
const port = 3000;

// ==========================================
// 1. DESIGN: CSS RESPONSIVO
// ==========================================
const CSS = `
<style>
    :root { --bg: #0f0f0f; --card: #1a1a1a; --green: #00e676; --text: #fff; --gray: #888; --blue: #4fc3f7; }
    * { box-sizing: border-box; font-family: 'Segoe UI', Roboto, Helvetica, sans-serif; }
    body { background: var(--bg); color: var(--text); margin: 0; padding: 15px; }
    .container { max-width: 900px; margin: auto; }
    
    .header-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .voltar { color: var(--green); text-decoration: none; font-weight: bold; font-size: 16px; padding: 10px 0; display: inline-block; transition: 0.2s; }
    .voltar:hover { opacity: 0.8; }
    h1 { font-size: 24px; margin: 0 0 20px 0; line-height: 1.3; }

    .filtro-box { background: var(--card); padding: 15px; border-radius: 10px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px; border: 1px solid #333; }
    .filtro-box select, .filtro-box input { padding: 12px; border-radius: 6px; border: 1px solid #444; background: #222; color: white; width: 100%; font-size: 15px; cursor: pointer; }
    
    .liga-card { background: var(--card); margin-bottom: 20px; border-radius: 10px; overflow: hidden; border: 1px solid #333; }
    .liga-nome { padding: 12px 15px; background: #252525; font-weight: bold; font-size: 14px; color: var(--green); text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #333; }
    .jogo-item { display: flex; flex-direction: column; padding: 15px; border-top: 1px solid #333; text-decoration: none; color: white; gap: 12px; transition: 0.2s; }
    .jogo-item:hover { background: #2a2a2a; }
    .btn-analise { background: var(--green); color: black; padding: 10px 15px; border-radius: 6px; font-weight: bold; text-align: center; font-size: 13px; text-transform: uppercase; }

    @media(min-width: 600px) { 
        .filtro-box form { flex-direction: row; } 
        .jogo-item { flex-direction: row; justify-content: space-between; align-items: center; } 
        .btn-analise { width: auto; }
    }

    .bilhete-box { background: linear-gradient(145deg, #122b15, #0a1f0d); border: 1px dashed var(--green); padding: 20px; border-radius: 10px; margin-bottom: 25px; }
    .bilhete-titulo { color: var(--green); font-size: 13px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-bottom: 12px; display: block; }
    .bilhete-itens { font-size: 16px; font-weight: bold; line-height: 1.8; color: #fff; }

    .grid-scout { display: grid; grid-template-columns: 1fr; gap: 15px; }
    @media(min-width: 600px) { .grid-scout { grid-template-columns: 1fr 1fr; } }
    .card-stat { background: var(--card); padding: 20px; border-radius: 10px; border-left: 4px solid var(--green); border: 1px solid #333; }
    .titulo-stat { font-size: 13px; color: var(--gray); margin-bottom: 15px; display: block; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
    
    .linha-time { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #333; }
    .nome-time { font-size: 14px; font-weight: bold; color: var(--blue); margin-bottom: 5px; display: block; }
    .barra-stats { display: flex; justify-content: space-between; font-size: 14px; align-items: center; color: #ccc; margin-bottom: 5px; }
    .barra-stats b { font-size: 16px; color: #fff; }
    
    .projecao-box { background: #252525; padding: 10px; border-radius: 6px; text-align: center; margin-top: 15px; border-left: 3px solid var(--blue); }
    .proj-label { font-size: 12px; color: #aaa; text-transform: uppercase; display: block; margin-bottom: 3px; }
    .proj-valor { font-size: 20px; font-weight: bold; color: #fff; }

    .sugestao-card { margin-top: 10px; font-size: 13px; font-weight: bold; text-align: center; }
    .sug-green { color: var(--green); }
    .sug-red { color: #ff5252; }
    .sug-neutro { color: #ffaa00; }
</style>
`;

// ==========================================
// 2. FUNÇÕES DA API DO SOFASCORE
// ==========================================
async function buscarJogosDoDia(data) {
    try {
        const url = `https://api.sofascore.com/api/v1/sport/football/scheduled-events/${data}`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        return res.data.events || [];
    } catch (e) { return []; }
}

async function puxarEstatisticasEquipe(teamId, tournamentId, seasonId) {
    const defaultStats = { fez: 0, sofreu: 0, cantos: 0, chutes: 0, cartoes: 0 };
    if (!teamId || !tournamentId || !seasonId) return defaultStats;

    try {
        const url = `https://api.sofascore.com/api/v1/team/${teamId}/unique-tournament/${tournamentId}/season/${seasonId}/statistics/overall`;
        const res = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0', 
                'Origin': 'https://www.sofascore.com',
                'Referer': 'https://www.sofascore.com/' 
            }
        });
        
        const s = res.data.statistics;
        if (!s) return defaultStats;

        const matches = s.matches || 1;

        return {
            fez: parseFloat((s.goalsScored / matches).toFixed(2)) || 0,
            sofreu: parseFloat((s.goalsConceded / matches).toFixed(2)) || 0,
            cantos: parseFloat((s.corners / matches).toFixed(2)) || 0,
            chutes: parseFloat(((s.shots || s.totalShots) / matches).toFixed(2)) || 0,
            cartoes: parseFloat((s.yellowCards / matches).toFixed(2)) || 0
        };
    } catch (e) {
        return defaultStats;
    }
}

// ==========================================
// 3. ROTA PRINCIPAL: O RADAR
// ==========================================
app.get('/', async (req, res) => {
    const dataAlvo = req.query.data || new Date().toISOString().split('T')[0];
    const ligaFiltro = req.query.liga || 'todas'; 
    
    const jogos = await buscarJogosDoDia(dataAlvo);
    
    const ligasVip = [325, 17, 8, 23, 35, 34, 7, 384]; 
    let filtrados = jogos.filter(j => ligasVip.includes(j.tournament.uniqueTournament?.id));

    if (ligaFiltro !== 'todas') {
        filtrados = filtrados.filter(j => String(j.tournament.uniqueTournament?.id) === String(ligaFiltro));
    }

    const agrupados = {};
    filtrados.forEach(j => {
        const nome = j.tournament.name;
        if (!agrupados[nome]) agrupados[nome] = [];
        agrupados[nome].push(j);
    });

    let html = `<div class="container">${CSS}
        <div class="header-nav"><h1 style="margin:0;">📡 Radar Scout Pro</h1></div>
        
        <div class="filtro-box">
            <form action="/" method="get" style="width:100%; display:flex; gap:10px; align-items:center; flex-wrap: wrap;">
                <input type="date" name="data" value="${dataAlvo}" onchange="this.form.submit()" style="flex: 1; min-width: 140px;">
                <select name="liga" onchange="this.form.submit()" style="flex: 2; min-width: 200px;">
                    <option value="todas" ${ligaFiltro === 'todas' ? 'selected' : ''}>🌍 Todas as Ligas VIP</option>
                    <option value="325" ${ligaFiltro === '325' ? 'selected' : ''}>🇧🇷 Brasileirão Série A</option>
                    <option value="17" ${ligaFiltro === '17' ? 'selected' : ''}>🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League</option>
                    <option value="8" ${ligaFiltro === '8' ? 'selected' : ''}>🇪🇸 La Liga</option>
                    <option value="23" ${ligaFiltro === '23' ? 'selected' : ''}>🇮🇹 Serie A (Itália)</option>
                    <option value="35" ${ligaFiltro === '35' ? 'selected' : ''}>🇩🇪 Bundesliga</option>
                    <option value="34" ${ligaFiltro === '34' ? 'selected' : ''}>🇫🇷 Ligue 1</option>
                    <option value="7" ${ligaFiltro === '7' ? 'selected' : ''}>🇪🇺 Champions League</option>
                    <option value="384" ${ligaFiltro === '384' ? 'selected' : ''}>🌎 Copa Libertadores</option>
                </select>
            </form>
        </div>`;

    if(Object.keys(agrupados).length === 0) {
        html += "<p style='text-align:center; color:#888; margin-top: 40px; font-size: 18px;'>Nenhum jogo encontrado para este filtro.</p>";
    }

    for (const liga in agrupados) {
        html += `<div class="liga-card"><div class="liga-nome">🏆 ${liga}</div>`;
        agrupados[liga].forEach(jogo => {
            const hName = encodeURIComponent(jogo.homeTeam.name);
            const aName = encodeURIComponent(jogo.awayTeam.name);
            const hId = jogo.homeTeam.id;
            const aId = jogo.awayTeam.id;
            const tId = jogo.tournament.uniqueTournament?.id;
            const sId = jogo.season?.id;

            html += `
                <a href="/analisar?home=${hName}&away=${aName}&hId=${hId}&aId=${aId}&tId=${tId}&sId=${sId}" class="jogo-item">
                    <span><b>${jogo.homeTeam.name}</b> x <b style="color:#bbb;">${jogo.awayTeam.name}</b></span>
                    <div class="btn-analise">ABRIR RAIO-X</div>
                </a>`;
        });
        html += `</div>`;
    }
    html += `</div>`;
    res.send(html);
});

// ==========================================
// 4. ROTA DE ANÁLISE COM MATEMÁTICA AVANÇADA
// ==========================================
app.get('/analisar', async (req, res) => {
    const { home, away, hId, aId, tId, sId } = req.query;

    const statsCasa = await puxarEstatisticasEquipe(hId, tId, sId);
    const statsFora = await puxarEstatisticasEquipe(aId, tId, sId);

    // ==========================================
    // CÁLCULOS DO COEFICIENTE DE CONFRONTO
    // ==========================================
    // Gols: Média do ataque de um contra a defesa do outro
    const projGolsCasa = (statsCasa.fez + statsFora.sofreu) / 2;
    const projGolsFora = (statsFora.fez + statsCasa.sofreu) / 2;
    const projGolsTotal = (projGolsCasa + projGolsFora).toFixed(2);

    // Outros: Soma direta das médias das equipes
    const projCantosTotal = (statsCasa.cantos + statsFora.cantos).toFixed(1);
    const projChutesTotal = (statsCasa.chutes + statsFora.chutes).toFixed(1);
    const projCartoesTotal = (statsCasa.cartoes + statsFora.cartoes).toFixed(1);

    // ==========================================
    // LÓGICA DA IA (Sugestões Baseadas na Projeção)
    // ==========================================
    let sugGols = (projGolsTotal >= 2.8) 
        ? '<div class="sug-green">🔥 Excelente p/ +1.5 Gols</div>' 
        : '<div class="sug-neutro">⚠️ Mercado Equilibrado</div>';
        
    let sugCantos = (projCantosTotal >= 10.5) 
        ? '<div class="sug-green">🚩 Tendência Over Cantos</div>' 
        : '<div class="sug-neutro">⚠️ Analisar ao vivo</div>';
        
    let sugChutes = (projChutesTotal >= 25.0) 
        ? '<div class="sug-green">👟 Jogo Aberto (+20 Chutes)</div>' 
        : '<div class="sug-red">📉 Tendência Truncada</div>';
        
    let sugCartoes = (projCartoesTotal >= 5.0) 
        ? '<div class="sug-green">🟨 Jogo Faltoso (+4.5 Cartões)</div>' 
        : '<div class="sug-red">📉 Times pouco punidos</div>';

    let bilhete = [];
    if(projGolsTotal >= 2.8) bilhete.push("Mais de 1.5 Gols na partida");
    if(projCantosTotal >= 10.5) bilhete.push("Mais de 8.5 Escanteios");
    if(projChutesTotal >= 25.0) bilhete.push("Mais de 18.5 Finalizações");
    if(projCartoesTotal >= 5.0) bilhete.push("Mais de 3.5 Cartões");

    let textoBilhete = bilhete.length > 0 
        ? `✅ ${bilhete.join(" <br>✅ ")}` 
        : "<span style='color:#ffaa00;'>Cenário imprevisível matematicamente. Melhor operar ao vivo.</span>";

    let html = `<div class="container">${CSS}
        <a href="/" class="voltar">⬅ Voltar ao Radar</a>
        <h1 style="color:white;">📊 Raio-X: ${home} x ${away}</h1>
        
        <div class="bilhete-box">
            <span class="bilhete-titulo">🤖 IA: Sugestão de Criar Aposta</span>
            <div class="bilhete-itens">${textoBilhete}</div>
        </div>

        <div class="grid-scout">
            <div class="card-stat">
                <span class="titulo-stat">⚽ Panorama de Gols</span>
                
                <div class="linha-time">
                    <span class="nome-time">🏠 ${home}</span>
                    <div class="barra-stats"><span>Marca:</span> <b>${statsCasa.fez}</b></div>
                    <div class="barra-stats"><span>Sofre:</span> <b>${statsCasa.sofreu}</b></div>
                </div>
                
                <div class="linha-time" style="border:none;">
                    <span class="nome-time">✈️ ${away}</span>
                    <div class="barra-stats"><span>Marca:</span> <b>${statsFora.fez}</b></div>
                    <div class="barra-stats"><span>Sofre:</span> <b>${statsFora.sofreu}</b></div>
                </div>

                <div class="projecao-box">
                    <span class="proj-label">Projeção do Confronto</span>
                    <span class="proj-valor">${projGolsTotal} Gols</span>
                </div>
                ${sugGols}
            </div>

            <div class="card-stat">
                <span class="titulo-stat">🚩 Escanteios (Médias)</span>
                <div class="barra-stats"><span>${home}:</span> <b>${statsCasa.cantos}</b></div>
                <div class="barra-stats"><span>${away}:</span> <b>${statsFora.cantos}</b></div>
                <div class="projecao-box">
                    <span class="proj-label">Projeção Somada</span>
                    <span class="proj-valor">${projCantosTotal}</span>
                </div>
                ${sugCantos}
            </div>

            <div class="card-stat">
                <span class="titulo-stat">👟 Finalizações Totais</span>
                <div class="barra-stats"><span>${home}:</span> <b>${statsCasa.chutes}</b></div>
                <div class="barra-stats"><span>${away}:</span> <b>${statsFora.chutes}</b></div>
                <div class="projecao-box">
                    <span class="proj-label">Projeção Somada</span>
                    <span class="proj-valor">${projChutesTotal}</span>
                </div>
                ${sugChutes}
            </div>

            <div class="card-stat">
                <span class="titulo-stat">🟨 Cartões Amarelos</span>
                <div class="barra-stats"><span>${home}:</span> <b>${statsCasa.cartoes}</b></div>
                <div class="barra-stats"><span>${away}:</span> <b>${statsFora.cartoes}</b></div>
                <div class="projecao-box">
                    <span class="proj-label">Projeção Somada</span>
                    <span class="proj-valor">${projCartoesTotal}</span>
                </div>
                ${sugCartoes}
            </div>
        </div>
    </div>`;
    
    res.send(html);
});

app.listen(port, () => console.log(`🚀 SCOUT PRO ONLINE: http://localhost:${port}`));

const port = process.env.PORT || 3000; // Render usa portas dinâmicas
app.listen(port, '0.0.0.0', () => console.log(`🚀 Online na porta ${port}`));