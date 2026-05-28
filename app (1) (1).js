/* ===== LUCKY777 PREMIUM BETTING WEBSITE - Enhanced JavaScript ===== */

const ODDS_API_KEY = '6d566a9aae3c248bbe72cdd489c17be6';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4/sports';

let betSlip = [];
let currentTab = 'inplay';
let matchData = { cricket:[], football:[], tennis:[], basketball:[], esports:[] };
let featuredIndex = 0;
let betStake = 100;

// ===== API FETCH =====
async function fetchJSON(url) {
    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.json();
    } catch(err) {
        console.warn('Fetch failed:', url, err.message);
        return null;
    }
}

// ===== LOAD ALL DATA (with rate-limit-friendly sequential fetch) =====
async function fetchWithDelay(url, delayMs) {
    await new Promise(r => setTimeout(r, delayMs));
    return fetchJSON(url);
}

async function loadAllData() {
    const key = ODDS_API_KEY;
    const base = ODDS_API_BASE;

    // Use fewer endpoints per sport to avoid 429 rate limiting
    // Fetch sequentially with small delays between requests
    const allUrls = [
        // Cricket
        { sport:'cricket', url:`${base}/cricket_ipl/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        { sport:'cricket', url:`${base}/cricket_t20_blast/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        { sport:'cricket', url:`${base}/cricket_test_match/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        // Football
        { sport:'football', url:`${base}/soccer_epl/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        { sport:'football', url:`${base}/soccer_uefa_champs_league/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        { sport:'football', url:`${base}/soccer_germany_bundesliga/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        { sport:'football', url:`${base}/soccer_spain_la_liga/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        { sport:'football', url:`${base}/soccer_italy_serie_a/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        { sport:'football', url:`${base}/soccer_france_ligue_one/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        { sport:'football', url:`${base}/soccer_norway_eliteserien/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        { sport:'football', url:`${base}/soccer_conmebol_copa_libertadores/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        { sport:'football', url:`${base}/soccer_fifa_world_cup/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        // Tennis
        { sport:'tennis', url:`${base}/tennis_atp_french_open/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        { sport:'tennis', url:`${base}/tennis_wta_french_open/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        // Basketball
        { sport:'basketball', url:`${base}/basketball_nba/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
        { sport:'basketball', url:`${base}/basketball_wnba/odds/?apiKey=${key}&regions=eu&oddsFormat=decimal` },
    ];

    const results = { cricket:[], football:[], tennis:[], basketball:[] };
    let fetchSuccess = false;
    
    // Fetch with 350ms delay between requests to avoid rate limiting
    for (let i = 0; i < allUrls.length; i++) {
        const item = allUrls[i];
        const data = await fetchWithDelay(item.url, i > 0 ? 350 : 0);
        if (data && Array.isArray(data)) {
            results[item.sport].push(...data);
            fetchSuccess = true;
        }
    }
    
    // If no data was fetched at all (all 429/401), keep existing data
    if (!fetchSuccess) {
        console.log('⚠️ API rate limited - keeping existing data');
        if (matchData.cricket.length || matchData.football.length) {
            renderCurrentTab();
            return;
        }
        // If no existing data either, use fallback
        console.log('📋 Using fallback demo data');
        loadFallbackData();
        renderCurrentTab();
        return;
    }

    matchData.cricket = results.cricket || [];
    matchData.football = results.football || [];
    matchData.tennis = results.tennis || [];
    matchData.basketball = results.basketball || [];
    matchData.esports = generateEsportsData();

    // If any sport got no data, supplement with fallback
    if (!matchData.cricket.length) matchData.cricket = getFallbackCricket();
    if (!matchData.football.length) matchData.football = getFallbackFootball();
    if (!matchData.tennis.length) matchData.tennis = getFallbackTennis();
    if (!matchData.basketball.length) matchData.basketball = getFallbackBasketball();

    // Sort each by commence_time
    for (const k of Object.keys(matchData)) {
        matchData[k].sort((a,b) => new Date(a.commence_time) - new Date(b.commence_time));
    }

    console.log('✅ Data loaded:', {
        cricket: matchData.cricket.length,
        football: matchData.football.length,
        tennis: matchData.tennis.length,
        basketball: matchData.basketball.length,
        esports: matchData.esports.length
    });

    updateTicker();
    renderCurrentTab();
}

// ===== FALLBACK DATA =====
function loadFallbackData() {
    matchData.cricket = getFallbackCricket();
    matchData.football = getFallbackFootball();
    matchData.tennis = getFallbackTennis();
    matchData.basketball = getFallbackBasketball();
    matchData.esports = generateEsportsData();
    for (const k of Object.keys(matchData)) {
        matchData[k].sort((a,b) => new Date(a.commence_time) - new Date(b.commence_time));
    }
}

function getFallbackCricket() {
    const now = new Date();
    const d = (h) => new Date(now.getTime() + h*3600000).toISOString();
    return [
        { id:'c1', sport_key:'cricket_test', sport_title:'Test Matches', commence_time:d(-1), home_team:'India', away_team:'New Zealand', league_title:'Test Matches',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'India',price:1.22},{name:'New Zealand',price:4.50}]}]}] },
        { id:'c2', sport_key:'cricket_ipl', sport_title:'IPL', commence_time:d(3), home_team:'Gujarat Titans', away_team:'Rajasthan Royals', league_title:'IPL 2025',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Gujarat Titans',price:2.00},{name:'Rajasthan Royals',price:1.80}]}]}] },
        { id:'c3', sport_key:'cricket_t20', sport_title:'T20 Blast', commence_time:d(5), home_team:'Worcestershire', away_team:'Birmingham Bears', league_title:'T20 Blast',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Worcestershire',price:1.69},{name:'Birmingham Bears',price:2.10}]}]}] },
        { id:'c4', sport_key:'cricket_t20', sport_title:'T20 Blast', commence_time:d(6), home_team:'Derbyshire', away_team:'Nottinghamshire', league_title:'T20 Blast',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Derbyshire',price:2.20},{name:'Nottinghamshire',price:1.64}]}]}] },
        { id:'c5', sport_key:'cricket_t20', sport_title:'T20 Blast', commence_time:d(6), home_team:'Durham', away_team:'Yorkshire', league_title:'T20 Blast',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Durham',price:1.88},{name:'Yorkshire',price:1.90}]}]}] },
        { id:'c6', sport_key:'cricket_t20', sport_title:'T20 Blast', commence_time:d(6), home_team:'Kent', away_team:'Essex', league_title:'T20 Blast',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Kent',price:1.58},{name:'Essex',price:2.38}]}]}] },
        { id:'c7', sport_key:'cricket_t20', sport_title:'T20 Blast', commence_time:d(6), home_team:'Glamorgan', away_team:'Somerset', league_title:'T20 Blast',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Glamorgan',price:2.28},{name:'Somerset',price:1.57}]}]}] },
        { id:'c8', sport_key:'cricket_t20', sport_title:'T20 Blast', commence_time:d(6), home_team:'Northamptonshire', away_team:'Gloucestershire', league_title:'T20 Blast',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Northamptonshire',price:1.50},{name:'Gloucestershire',price:2.50}]}]}] },
        { id:'c9', sport_key:'cricket_t20', sport_title:'T20 Blast', commence_time:d(6), home_team:'Lancashire', away_team:'Leicestershire', league_title:'T20 Blast',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Lancashire',price:1.69},{name:'Leicestershire',price:2.15}]}]}] },
        { id:'c10', sport_key:'cricket_t20', sport_title:'T20 Blast', commence_time:d(7), home_team:'Hampshire', away_team:'Surrey', league_title:'T20 Blast',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Hampshire',price:2.10},{name:'Surrey',price:1.72}]}]}] },
        { id:'c11', sport_key:'cricket_t20', sport_title:'T20 Blast', commence_time:d(24), home_team:'Sussex', away_team:'Middlesex', league_title:'T20 Blast',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Sussex',price:1.45},{name:'Middlesex',price:2.65}]}]}] },
        { id:'c12', sport_key:'cricket_odi', sport_title:'ODI', commence_time:d(48), home_team:'England', away_team:'Australia', league_title:'ODI Series',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'England',price:2.10},{name:'Australia',price:1.75}]}]}] },
    ];
}

function getFallbackFootball() {
    const now = new Date();
    const d = (h) => new Date(now.getTime() + h*3600000).toISOString();
    return [
        { id:'f1', sport_key:'soccer_conmebol_copa_libertadores', sport_title:'Copa Libertadores', commence_time:d(2), home_team:'Cerro Porteño', away_team:'Sporting Cristal', league_title:'Copa Libertadores',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Cerro Porteño',price:1.68},{name:'Draw',price:3.68},{name:'Sporting Cristal',price:5.76}]}]}] },
        { id:'f2', sport_key:'soccer_conmebol_copa_libertadores', sport_title:'Copa Libertadores', commence_time:d(2), home_team:'Palmeiras', away_team:'Junior FC', league_title:'Copa Libertadores',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Palmeiras',price:1.25},{name:'Draw',price:5.50},{name:'Junior FC',price:10.00}]}]}] },
        { id:'f3', sport_key:'soccer_conmebol_copa_libertadores', sport_title:'Copa Libertadores', commence_time:d(4), home_team:'Cruzeiro', away_team:'Barcelona SC', league_title:'Copa Libertadores',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Cruzeiro',price:1.27},{name:'Draw',price:4.80},{name:'Barcelona SC',price:8.00}]}]}] },
        { id:'f4', sport_key:'soccer_conmebol_copa_libertadores', sport_title:'Copa Libertadores', commence_time:d(4), home_team:'Boca Juniors', away_team:'Universidad Católica', league_title:'Copa Libertadores',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Boca Juniors',price:1.50},{name:'Draw',price:4.12},{name:'Universidad Católica',price:7.50}]}]}] },
        { id:'f5', sport_key:'soccer_norway_eliteserien', sport_title:'Eliteserien', commence_time:d(19), home_team:'Aalesund', away_team:'HamKam', league_title:'Eliteserien - Norway',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Aalesund',price:2.06},{name:'Draw',price:3.50},{name:'HamKam',price:3.20}]}]}] },
        { id:'f6', sport_key:'soccer_uefa_champs_league', sport_title:'UEFA Champions League', commence_time:d(30), home_team:'Paris Saint Germain', away_team:'Arsenal', league_title:'UEFA Champions League',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Paris Saint Germain',price:2.36},{name:'Draw',price:3.34},{name:'Arsenal',price:3.24}]}]}] },
        { id:'f7', sport_key:'soccer_epl', sport_title:'Premier League', commence_time:d(48), home_team:'Manchester City', away_team:'Liverpool', league_title:'Premier League',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Manchester City',price:2.10},{name:'Draw',price:3.40},{name:'Liverpool',price:3.50}]}]}] },
        { id:'f8', sport_key:'soccer_epl', sport_title:'Premier League', commence_time:d(48), home_team:'Arsenal', away_team:'Chelsea', league_title:'Premier League',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Arsenal',price:1.85},{name:'Draw',price:3.60},{name:'Chelsea',price:4.50}]}]}] },
        { id:'f9', sport_key:'soccer_germany_bundesliga', sport_title:'Bundesliga', commence_time:d(50), home_team:'Bayern Munich', away_team:'Borussia Dortmund', league_title:'Bundesliga',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Bayern Munich',price:1.45},{name:'Draw',price:4.50},{name:'Borussia Dortmund',price:6.50}]}]}] },
        { id:'f10', sport_key:'soccer_spain_la_liga', sport_title:'La Liga', commence_time:d(50), home_team:'Real Madrid', away_team:'Barcelona', league_title:'La Liga - Spain',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Real Madrid',price:2.30},{name:'Draw',price:3.25},{name:'Barcelona',price:3.10}]}]}] },
        { id:'f11', sport_key:'soccer_fifa_world_cup', sport_title:'FIFA World Cup', commence_time:d(72), home_team:'Brazil', away_team:'Argentina', league_title:'FIFA World Cup 2026',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Brazil',price:2.50},{name:'Draw',price:3.10},{name:'Argentina',price:2.90}]}]}] },
        { id:'f12', sport_key:'soccer_italy_serie_a', sport_title:'Serie A', commence_time:d(50), home_team:'Inter Milan', away_team:'AC Milan', league_title:'Serie A - Italy',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Inter Milan',price:1.70},{name:'Draw',price:3.80},{name:'AC Milan',price:5.00}]}]}] },
    ];
}

function getFallbackTennis() {
    const now = new Date();
    const d = (h) => new Date(now.getTime() + h*3600000).toISOString();
    return [
        { id:'t1', sport_key:'tennis_atp', sport_title:'ATP French Open', commence_time:d(-1), home_team:'Jannik Sinner', away_team:'Juan Manuel Cerundolo', league_title:'ATP French Open',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Jannik Sinner',price:1.15},{name:'Juan Manuel Cerundolo',price:5.50}]}]}] },
        { id:'t2', sport_key:'tennis_atp', sport_title:'ATP French Open', commence_time:d(-1), home_team:'Hubert Hurkacz', away_team:'Frances Tiafoe', league_title:'ATP French Open',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Hubert Hurkacz',price:2.10},{name:'Frances Tiafoe',price:1.75}]}]}] },
        { id:'t3', sport_key:'tennis_atp', sport_title:'ATP French Open', commence_time:d(0), home_team:'Carlos Alcaraz', away_team:'Novak Djokovic', league_title:'ATP French Open',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Carlos Alcaraz',price:1.65},{name:'Novak Djokovic',price:2.25}]}]}] },
        { id:'t4', sport_key:'tennis_wta', sport_title:'WTA French Open', commence_time:d(-1), home_team:'Iga Swiatek', away_team:'Coco Gauff', league_title:'WTA French Open',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Iga Swiatek',price:1.30},{name:'Coco Gauff',price:3.50}]}]}] },
        { id:'t5', sport_key:'tennis_wta', sport_title:'WTA French Open', commence_time:d(0), home_team:'Aryna Sabalenka', away_team:'Elena Rybakina', league_title:'WTA French Open',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Aryna Sabalenka',price:1.55},{name:'Elena Rybakina',price:2.45}]}]}] },
        { id:'t6', sport_key:'tennis_atp', sport_title:'ATP French Open', commence_time:d(2), home_team:'Andrey Rublev', away_team:'Nuno Borges', league_title:'ATP French Open',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Andrey Rublev',price:1.34},{name:'Nuno Borges',price:3.24}]}]}] },
    ];
}

function getFallbackBasketball() {
    const now = new Date();
    const d = (h) => new Date(now.getTime() + h*3600000).toISOString();
    return [
        { id:'b1', sport_key:'basketball_nba', sport_title:'NBA', commence_time:d(1), home_team:'LA Lakers', away_team:'Boston Celtics', league_title:'NBA Playoffs',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'LA Lakers',price:2.15},{name:'Boston Celtics',price:1.72}]}]}] },
        { id:'b2', sport_key:'basketball_nba', sport_title:'NBA', commence_time:d(1), home_team:'Golden State Warriors', away_team:'Denver Nuggets', league_title:'NBA Playoffs',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Golden State Warriors',price:1.90},{name:'Denver Nuggets',price:1.95}]}]}] },
        { id:'b3', sport_key:'basketball_nba', sport_title:'NBA', commence_time:d(3), home_team:'Miami Heat', away_team:'Milwaukee Bucks', league_title:'NBA Playoffs',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Miami Heat',price:2.40},{name:'Milwaukee Bucks',price:1.58}]}]}] },
        { id:'b4', sport_key:'basketball_nba', sport_title:'NBA', commence_time:d(3), home_team:'Dallas Mavericks', away_team:'Oklahoma City Thunder', league_title:'NBA Playoffs',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'Dallas Mavericks',price:2.05},{name:'Oklahoma City Thunder',price:1.78}]}]}] },
        { id:'b5', sport_key:'basketball_nba', sport_title:'NBA', commence_time:d(24), home_team:'New York Knicks', away_team:'Philadelphia 76ers', league_title:'NBA Playoffs',
          bookmakers:[{markets:[{key:'h2h',outcomes:[{name:'New York Knicks',price:1.65},{name:'Philadelphia 76ers',price:2.30}]}]}] },
    ];
}

// ===== ESPORTS GENERATOR =====
function generateEsportsData() {
    const games = [
        { league:'CS2 - ESL Pro League', teams:[['Team Vitality','Natus Vincere'],['FaZe Clan','G2 Esports'],['Astralis','Team Liquid'],['Heroic','MOUZ']] },
        { league:'DOTA 2 - The International', teams:[['Team Spirit','OG'],['PSG.LGD','Team Secret'],['Tundra Esports','Gaimin Gladiators']] },
        { league:'Valorant - Champions Tour', teams:[['LOUD','Fnatic'],['DRX','Sentinels'],['Paper Rex','EDward Gaming']] },
    ];
    const matches = [];
    const now = Date.now();
    games.forEach(g => {
        g.teams.forEach((pair,i) => {
            const d = new Date(now + (i+1)*3600000 + Math.random()*7200000);
            const homeOdds = parseFloat((1.4+Math.random()*0.8).toFixed(2));
            const awayOdds = parseFloat((1.6+Math.random()*0.8).toFixed(2));
            matches.push({
                id:`esports-${g.league.substring(0,3)}-${i}-${pair[0].replace(/\s/g,'-')}`,
                sport_key:'esports', sport_title:'Esports',
                commence_time:d.toISOString(),
                home_team:pair[0], away_team:pair[1],
                league_title:g.league,
                bookmakers:[{markets:[{key:'h2h',outcomes:[
                    {name:pair[0],price:homeOdds},
                    {name:pair[1],price:awayOdds}
                ]}]}]
            });
        });
    });
    return matches;
}

// ===== LIVE SCORE SIMULATOR =====
function generateLiveScore(match) {
    const seed = (match.home_team||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    const isCricket = match.sport_key?.includes('cricket');
    const isFootball = match.sport_key?.includes('soccer');
    const isTennis = match.sport_key?.includes('tennis');
    const isBasketball = match.sport_key?.includes('basketball');

    if (isCricket) {
        const homeRuns = 100 + (seed % 80);
        const homeWickets = seed % 8;
        const awayRuns = 80 + ((seed*3) % 90);
        const awayWickets = (seed*7) % 9;
        const overs = (10 + seed % 10) + '.' + (seed % 6);
        return { home: `${homeRuns}/${homeWickets}`, away: `${awayRuns}/${awayWickets}`, detail: `Ov ${overs}` };
    }
    if (isFootball) {
        const h = seed % 4;
        const a = (seed*3) % 4;
        const min = 15 + (seed % 75);
        return { home: h, away: a, detail: `${min}'` };
    }
    if (isTennis) {
        const sets = [[6,4],[3,6],[4,3]];
        const setNum = 1 + (seed % 3);
        const games = [3+seed%4, 2+(seed*2)%5];
        return { home: sets.slice(0,setNum).filter(s=>s[0]>s[1]).length, away: sets.slice(0,setNum).filter(s=>s[1]>s[0]).length, detail: `Set ${setNum} ${games[0]}-${games[1]}` };
    }
    if (isBasketball) {
        const h = 70 + (seed % 30);
        const a = 65 + ((seed*3) % 35);
        const qtr = 1 + (seed % 4);
        return { home: h, away: a, detail: `Q${qtr}` };
    }
    return { home: 0, away: 0, detail: 'LIVE' };
}

// ===== FORMAT HELPERS =====
function formatMatchDate(dateStr) {
    const d = new Date(dateStr);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
}

function formatMatchTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false});
}

function formatDateRange(dateStr) {
    const d = new Date(dateStr);
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const end = new Date(d.getTime() + 4*86400000);
    // Ensure end day is valid
    const endDay = Math.min(end.getDate(), 28);
    return `${d.getDate()} ${months[d.getMonth()]} - ${endDay} ${months[end.getMonth()]} ${d.getFullYear()}`;
}

function getTeamInitial(name) {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return name.substring(0,2).toUpperCase();
    return words.map(w => w[0]).join('').substring(0,3).toUpperCase();
}

// ===== GET ODDS =====
function getOdds(match) {
    if (!match.bookmakers || !match.bookmakers.length) return null;
    const bk = match.bookmakers[0];
    if (!bk.markets || !bk.markets.length) return null;
    return bk.markets[0].outcomes || null;
}

// ===== IS LIVE CHECK =====
function isMatchLive(dateStr) {
    const now = new Date();
    const commence = new Date(dateStr);
    return commence <= now && (now - commence) < 3*3600000;
}

// ===== RENDER MATCH ROW =====
function renderMatchRow(match, hasDraw) {
    const homeTeam = match.home_team || 'Team A';
    const awayTeam = match.away_team || 'Team B';
    const dateStr = match.commence_time || new Date().toISOString();
    const league = match.league_title || match.sport_title || '';
    const outcomes = getOdds(match);
    const isLive = isMatchLive(dateStr);
    const matchId = (match.id || `${homeTeam}-${awayTeam}`).replace(/[^a-zA-Z0-9-]/g,'-').toLowerCase();
    const existingBet = betSlip.find(b => b.id === matchId);

    // Live score
    let liveScoreHTML = '';
    if (isLive) {
        const score = generateLiveScore(match);
        liveScoreHTML = `<div class="live-score"><span class="score-home">${score.home}</span><span class="score-sep">-</span><span class="score-away">${score.away}</span><span class="score-detail">${score.detail}</span></div>`;
    }

    let oddsHTML = '';
    if (outcomes && outcomes.length >= 2) {
        const homeOdds = outcomes.find(o => o.name === homeTeam) || outcomes[0];
        const awayOdds = outcomes.find(o => o.name === awayTeam) || outcomes[outcomes.length-1];
        const drawOdds = outcomes.find(o => o.name === 'Draw');

        if (hasDraw && drawOdds) {
            oddsHTML = `
                <div class="odds-btn home ${existingBet?.selection==='1'?'selected':''}" onclick="event.stopPropagation();addBet('${matchId}','1','${homeTeam}',${homeOdds.price},'${homeTeam} vs ${awayTeam}')">
                    <span class="odds-label">1</span><span class="odds-value">${homeOdds.price.toFixed(2)}</span>
                </div>
                <div class="odds-btn draw ${existingBet?.selection==='X'?'selected':''}" onclick="event.stopPropagation();addBet('${matchId}','X','Draw',${drawOdds.price},'${homeTeam} vs ${awayTeam}')">
                    <span class="odds-label">X</span><span class="odds-value">${drawOdds.price.toFixed(2)}</span>
                </div>
                <div class="odds-btn away ${existingBet?.selection==='2'?'selected':''}" onclick="event.stopPropagation();addBet('${matchId}','2','${awayTeam}',${awayOdds.price},'${homeTeam} vs ${awayTeam}')">
                    <span class="odds-label">2</span><span class="odds-value">${awayOdds.price.toFixed(2)}</span>
                </div>`;
        } else {
            oddsHTML = `
                <div class="odds-btn home ${existingBet?.selection==='1'?'selected':''}" onclick="event.stopPropagation();addBet('${matchId}','1','${homeTeam}',${homeOdds.price},'${homeTeam} vs ${awayTeam}')">
                    <span class="odds-label">1</span><span class="odds-value">${homeOdds.price.toFixed(2)}</span>
                </div>
                <div class="odds-btn away ${existingBet?.selection==='2'?'selected':''}" onclick="event.stopPropagation();addBet('${matchId}','2','${awayTeam}',${awayOdds.price},'${homeTeam} vs ${awayTeam}')">
                    <span class="odds-label">2</span><span class="odds-value">${awayOdds.price.toFixed(2)}</span>
                </div>`;
        }
    } else {
        const seed = (homeTeam+awayTeam).split('').reduce((a,c)=>a+c.charCodeAt(0),0);
        const h = parseFloat((1.3+(seed%15)/10).toFixed(2));
        const a = parseFloat((1.3+((seed*7)%15)/10).toFixed(2));
        const d = parseFloat((2.0+(seed%12)/10).toFixed(2));
        if (hasDraw) {
            oddsHTML = `
                <div class="odds-btn home ${existingBet?.selection==='1'?'selected':''}" onclick="event.stopPropagation();addBet('${matchId}','1','${homeTeam}',${h},'${homeTeam} vs ${awayTeam}')">
                    <span class="odds-label">1</span><span class="odds-value">${h.toFixed(2)}</span>
                </div>
                <div class="odds-btn draw ${existingBet?.selection==='X'?'selected':''}" onclick="event.stopPropagation();addBet('${matchId}','X','Draw',${d},'${homeTeam} vs ${awayTeam}')">
                    <span class="odds-label">X</span><span class="odds-value">${d.toFixed(2)}</span>
                </div>
                <div class="odds-btn away ${existingBet?.selection==='2'?'selected':''}" onclick="event.stopPropagation();addBet('${matchId}','2','${awayTeam}',${a},'${homeTeam} vs ${awayTeam}')">
                    <span class="odds-label">2</span><span class="odds-value">${a.toFixed(2)}</span>
                </div>`;
        } else {
            oddsHTML = `
                <div class="odds-btn home ${existingBet?.selection==='1'?'selected':''}" onclick="event.stopPropagation();addBet('${matchId}','1','${homeTeam}',${h},'${homeTeam} vs ${awayTeam}')">
                    <span class="odds-label">1</span><span class="odds-value">${h.toFixed(2)}</span>
                </div>
                <div class="odds-btn away ${existingBet?.selection==='2'?'selected':''}" onclick="event.stopPropagation();addBet('${matchId}','2','${awayTeam}',${a},'${homeTeam} vs ${awayTeam}')">
                    <span class="odds-label">2</span><span class="odds-value">${a.toFixed(2)}</span>
                </div>`;
        }
    }

    const sportIcon = match.sport_key?.includes('cricket')?'fa-solid fa-baseball':
        match.sport_key?.includes('soccer')?'fa-solid fa-futbol':
        match.sport_key?.includes('tennis')?'fa-solid fa-table-tennis-paddle-ball':
        match.sport_key?.includes('basketball')?'fa-solid fa-basketball':
        'fa-solid fa-gamepad';

    return `
        <div class="match-row ${isLive?'match-live':''}">
            <div class="match-time-area">
                <div class="match-date">${formatMatchDate(dateStr)}</div>
                <div class="match-time ${isLive?'live-time':''}">
                    ${isLive?'<span class="live-dot"></span> LIVE':`<i class="fa-regular fa-clock"></i> ${formatMatchTime(dateStr)}`}
                </div>
            </div>
            <div class="match-teams-area">
                <div class="team-line">
                    <span class="team-badge home-badge">${getTeamInitial(homeTeam)}</span>
                    <span class="team-name">${homeTeam}</span>
                    ${isLive?`<span class="team-score">${generateLiveScore(match).home}</span>`:''}
                </div>
                <div class="team-line">
                    <span class="team-badge away-badge">${getTeamInitial(awayTeam)}</span>
                    <span class="team-name">${awayTeam}</span>
                    ${isLive?`<span class="team-score">${generateLiveScore(match).away}</span>`:''}
                </div>
                ${league?`<div class="match-league"><i class="fa-solid fa-trophy" style="margin-right:3px;font-size:9px;color:var(--gold);"></i>${league}</div>`:''}
                ${isLive?`<div class="live-detail">${generateLiveScore(match).detail}</div>`:''}
            </div>
            <div class="match-odds">${oddsHTML}</div>
            <div class="match-fav" onclick="event.stopPropagation();toggleFav(this)"><i class="fa-regular fa-heart"></i></div>
        </div>`;
}

// ===== RENDER SPORT SECTION =====
function renderSportSection(title, icon, iconClass, matches, hasDraw, limit) {
    limit = limit || 5;
    hasDraw = hasDraw !== undefined ? hasDraw : true;
    const isLiveTab = currentTab === 'inplay';
    if (!matches || !matches.length) {
        return `
            <div class="sport-section">
                <div class="sport-header">
                    <div class="sport-title-area">
                        <div class="sport-icon ${iconClass}"><i class="${icon}"></i></div>
                        <div class="sport-title">${title}</div>
                    </div>
                </div>
                <div class="matches-container">
                    <div class="empty-state">
                        <i class="fa-solid fa-calendar-xmark"></i>
                        <p>No ${title.toLowerCase()} matches available right now</p>
                    </div>
                </div>
            </div>`;
    }
    const displayMatches = matches.slice(0, limit);
    const hasLive = displayMatches.some(m => isMatchLive(m.commence_time));
    const liveCount = displayMatches.filter(m => isMatchLive(m.commence_time)).length;
    return `
        <div class="sport-section">
            <div class="sport-header">
                <div class="sport-title-area">
                    <div class="sport-icon ${iconClass}"><i class="${icon}"></i></div>
                    <div class="sport-title">${title}</div>
                    ${hasLive?`<span class="sport-live-badge"><span class="live-dot" style="margin-right:4px;"></span>${liveCount} LIVE</span>`:''}
                </div>
                ${!isLiveTab || matches.length > limit ? `<div class="sport-view-all" onclick="showAllMatches('${title.toLowerCase()}')">
                    View All <i class="fa-solid fa-chevron-right"></i>
                </div>` : ''}
            </div>
            <div class="matches-container">
                ${displayMatches.map(m => renderMatchRow(m, hasDraw)).join('')}
            </div>
        </div>`;
}

// ===== SHOW ALL =====
function showAllMatches(sport) {
    const map = {cricket:'cricket',football:'football',tennis:'tennis',basketball:'basketball',esports:'esports'};
    currentTab = map[sport] || 'inplay';
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.tab === currentTab) el.classList.add('active');
    });
    renderCurrentTab();
    window.scrollTo({top:0,behavior:'smooth'});
}

// ===== TAB RENDERING =====
function renderCurrentTab() {
    const el = document.getElementById('mainContent');
    if (!el) return;
    let html = '';
    switch(currentTab) {
        case 'inplay': html = renderInPlayTab(); break;
        case 'cricket': html = renderSportSection('Cricket','fa-solid fa-baseball','cricket',matchData.cricket,false,50); break;
        case 'football': html = renderSportSection('Football','fa-solid fa-futbol','football',matchData.football,true,50); break;
        case 'tennis': html = renderSportSection('Tennis','fa-solid fa-table-tennis-paddle-ball','tennis',matchData.tennis,false,50); break;
        case 'basketball': html = renderSportSection('Basketball','fa-solid fa-basketball','basketball',matchData.basketball,false,50); break;
        case 'esports': html = renderSportSection('Esports','fa-solid fa-gamepad','esports',matchData.esports,false,20); break;
        case 'casino': html = renderCasinoTab(); break;
        case 'aviator': html = renderAviatorTab(); break;
        default: html = renderInPlayTab();
    }
    el.innerHTML = html;
    updateBetSlip(); // Re-mark selected odds
}

function renderInPlayTab() {
    let sections = '';
    sections += renderFeaturedBanner();
    // Popular Bets
    sections += renderPopularBets();
    sections += renderSportSection('Cricket','fa-solid fa-baseball','cricket',matchData.cricket,false,5);
    sections += renderSportSection('Football','fa-solid fa-futbol','football',matchData.football,true,5);
    sections += renderSportSection('Tennis','fa-solid fa-table-tennis-paddle-ball','tennis',matchData.tennis,false,5);
    sections += renderSportSection('Basketball','fa-solid fa-basketball','basketball',matchData.basketball,false,5);
    sections += renderSportSection('Esports','fa-solid fa-gamepad','esports',matchData.esports,false,3);
    return sections;
}

// ===== FEATURED BANNER =====
function renderFeaturedBanner() {
    const allMatches = [...matchData.football, ...matchData.cricket, ...matchData.tennis, ...matchData.basketball];
    const fm = allMatches[featuredIndex % Math.max(allMatches.length, 1)] || null;
    let team1='BLUE KNIGHTS', team2='RED DRAGONS', dateStr=new Date().toISOString(), league='GRAND STADIUM';
    if (fm) {
        team1=fm.home_team||team1; team2=fm.away_team||team2;
        dateStr=fm.commence_time||dateStr; league=fm.league_title||fm.sport_title||league;
    }

    const isLive = isMatchLive(dateStr);
    const outcomes = fm ? getOdds(fm) : null;
    let oddsHTML = '';
    if (outcomes && outcomes.length >= 2) {
        const hOdds = outcomes.find(o => o.name === team1) || outcomes[0];
        const aOdds = outcomes.find(o => o.name === team2) || outcomes[outcomes.length-1];
        oddsHTML = `
            <div class="featured-odds">
                <div class="featured-odds-btn" onclick="addBet('featured-1','1','${team1}',${hOdds.price},'${team1} vs ${team2}')">
                    <span class="fodds-label">1</span><span class="fodds-val">${hOdds.price.toFixed(2)}</span>
                </div>
                <div class="featured-odds-btn" onclick="addBet('featured-2','2','${team2}',${aOdds.price},'${team1} vs ${team2}')">
                    <span class="fodds-label">2</span><span class="fodds-val">${aOdds.price.toFixed(2)}</span>
                </div>
            </div>`;
    }

    return `
        <div class="featured-banner">
            <div class="featured-label"><i class="fa-solid fa-star"></i> FEATURED MATCH</div>
            ${isLive?'<div class="featured-live"><span class="live-dot"></span> LIVE NOW</div>':''}
            <div class="featured-content">
                <div class="featured-date">${formatDateRange(dateStr)}</div>
                <div class="featured-teams">
                    <div class="featured-team">
                        <div class="featured-team-logo team1"><i class="fa-solid fa-shield-halved"></i></div>
                        <div class="featured-team-name">${team1.toUpperCase()}</div>
                    </div>
                    <div class="featured-vs">VS</div>
                    <div class="featured-team">
                        <div class="featured-team-logo team2"><i class="fa-solid fa-dragon"></i></div>
                        <div class="featured-team-name">${team2.toUpperCase()}</div>
                    </div>
                </div>
                <div class="featured-info">
                    <span><i class="fa-regular fa-clock"></i> STARTS AT ${formatMatchTime(dateStr)}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${league}</span>
                </div>
                ${oddsHTML}
                <div class="featured-dots">
                    <div class="featured-dot ${featuredIndex%3===0?'active':''}" onclick="featuredIndex=0;renderCurrentTab()"></div>
                    <div class="featured-dot ${featuredIndex%3===1?'active':''}" onclick="featuredIndex=1;renderCurrentTab()"></div>
                    <div class="featured-dot ${featuredIndex%3===2?'active':''}" onclick="featuredIndex=2;renderCurrentTab()"></div>
                </div>
            </div>
        </div>`;
}

// ===== POPULAR BETS =====
function renderPopularBets() {
    const allMatches = [...matchData.football, ...matchData.cricket, ...matchData.tennis, ...matchData.basketball];
    // Pick matches with highest odds (most interesting)
    const popular = allMatches
        .filter(m => getOdds(m))
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

    if (!popular.length) return '';

    return `
        <div class="sport-section">
            <div class="sport-header">
                <div class="sport-title-area">
                    <div class="sport-icon" style="background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;"><i class="fa-solid fa-fire"></i></div>
                    <div class="sport-title">Popular Bets</div>
                    <span class="sport-live-badge" style="background:var(--gold);color:#000;">HOT</span>
                </div>
            </div>
            <div class="popular-grid">
                ${popular.map(m => {
                    const outcomes = getOdds(m);
                    if (!outcomes || outcomes.length < 2) return '';
                    const hOdds = outcomes.find(o => o.name === m.home_team) || outcomes[0];
                    const aOdds = outcomes.find(o => o.name === m.away_team) || outcomes[outcomes.length-1];
                    const isLive = isMatchLive(m.commence_time);
                    return `
                        <div class="popular-card" onclick="addBet('pop-${m.id||Math.random()}','1','${m.home_team}',${hOdds.price},'${m.home_team} vs ${m.away_team}')">
                            ${isLive?'<span class="popular-live"><span class="live-dot"></span> LIVE</span>':''}
                            <div class="popular-teams">${m.home_team} vs ${m.away_team}</div>
                            <div class="popular-league">${m.league_title||m.sport_title||''}</div>
                            <div class="popular-odds-row">
                                <div class="popular-odds-btn">${hOdds.price.toFixed(2)}</div>
                                <div class="popular-odds-btn away">${aOdds.price.toFixed(2)}</div>
                            </div>
                        </div>`;
                }).join('')}
            </div>
        </div>`;
}

// ===== CASINO TAB =====
function renderCasinoTab() {
    const games = [
        {icon:'fa-solid fa-dice',title:'Roulette',desc:'Live Casino',color:'#ef4444'},
        {icon:'fa-solid fa-heart',title:'Blackjack',desc:'Card Games',color:'#ec4899'},
        {icon:'fa-solid fa-star',title:'Slots',desc:'Slot Machines',color:'#f59e0b'},
        {icon:'fa-solid fa-diamond',title:'Poker',desc:'Card Games',color:'#8b5cf6'},
        {icon:'fa-solid fa-gem',title:'Baccarat',desc:'Live Casino',color:'#3b82f6'},
        {icon:'fa-solid fa-coins',title:'Teen Patti',desc:'Indian Poker',color:'#22c55e'},
        {icon:'fa-solid fa-crown',title:'Andar Bahar',desc:'Indian Classic',color:'#d4af37'},
        {icon:'fa-solid fa-bolt',title:'Lightning Dice',desc:'Live Game Shows',color:'#f97316'},
        {icon:'fa-solid fa-7',title:'Lucky 7',desc:'Instant Win',color:'#ef4444'},
    ];
    return `
        <div class="sport-section">
            <div class="sport-header">
                <div class="sport-title-area">
                    <div class="sport-icon esports"><i class="fa-solid fa-crown"></i></div>
                    <div class="sport-title">Casino Games</div>
                </div>
            </div>
            <div class="casino-grid">
                ${games.map(g=>`
                    <div class="casino-card" onclick="showNotification('Opening ${g.title}...')">
                        <div class="casino-card-icon" style="color:${g.color}"><i class="${g.icon}"></i></div>
                        <div class="casino-card-title">${g.title}</div>
                        <div class="casino-card-desc">${g.desc}</div>
                    </div>
                `).join('')}
            </div>
        </div>`;
}

// ===== AVIATOR TAB =====
function renderAviatorTab() {
    return `
        <div class="sport-section">
            <div class="sport-header">
                <div class="sport-title-area">
                    <div class="sport-icon" style="background:linear-gradient(135deg,#dc2626,#f97316);"><i class="fa-solid fa-plane"></i></div>
                    <div class="sport-title">Aviator</div>
                    <span class="nav-badge new">NEW</span>
                </div>
            </div>
            <div class="aviator-container">
                <div class="aviator-sky">
                    <div class="aviator-plane"><i class="fa-solid fa-plane-departure"></i></div>
                    <div class="aviator-multiplier">2.45x</div>
                    <div class="aviator-curve"></div>
                </div>
                <div class="aviator-controls">
                    <div class="aviator-bet-row">
                        <div class="aviator-stake">
                            <button class="stake-btn" onclick="adjustStake(-10)">-</button>
                            <input type="number" class="stake-input" value="100" id="aviatorStake">
                            <button class="stake-btn" onclick="adjustStake(10)">+</button>
                        </div>
                        <button class="aviator-bet-btn" onclick="showNotification('Aviator: Place your bet via WhatsApp!')">
                            <i class="fa-solid fa-paper-plane"></i> BET
                        </button>
                    </div>
                </div>
                <div class="aviator-history">
                    <span class="avh-win">3.24x</span>
                    <span class="avh-win">1.56x</span>
                    <span class="avh-lose">1.12x</span>
                    <span class="avh-win">5.78x</span>
                    <span class="avh-win">2.01x</span>
                </div>
            </div>
        </div>`;
}

function adjustStake(delta) {
    const input = document.getElementById('aviatorStake');
    if (!input) return;
    let val = parseInt(input.value) || 100;
    val = Math.max(10, val + delta);
    input.value = val;
}

// ===== BET SLIP =====
function addBet(id, selection, selectionName, odds, matchName) {
    const idx = betSlip.findIndex(b => b.id === id);
    if (idx >= 0) {
        if (betSlip[idx].selection === selection) { betSlip.splice(idx,1); }
        else { betSlip[idx].selection=selection; betSlip[idx].selectionName=selectionName; betSlip[idx].odds=parseFloat(odds); }
    } else {
        betSlip.push({id,selection,selectionName,odds:parseFloat(odds),matchName});
    }
    updateBetSlip();
    renderCurrentTab();
    if (betSlip.length > 0) {
        showNotification(`${selectionName} @ ${parseFloat(odds).toFixed(2)} added to bet slip!`);
    }
}

function removeBet(id) {
    betSlip = betSlip.filter(b => b.id !== id);
    updateBetSlip();
    renderCurrentTab();
}

function updateBetSlip() {
    const countEl=document.getElementById('betCount');
    const itemsEl=document.getElementById('betSlipItems');
    const totalEl=document.getElementById('betSlipTotal');
    const placeBtn=document.getElementById('btnPlaceBet');
    const stakeEl=document.getElementById('betStake');
    const payoutEl=document.getElementById('betPayout');
    if(!countEl) return;
    countEl.textContent = betSlip.length;
    if(!betSlip.length) {
        if(itemsEl) itemsEl.innerHTML='<div class="empty-state" style="padding:20px"><i class="fa-solid fa-receipt" style="font-size:24px;"></i><p>Your bet slip is empty</p></div>';
        if(totalEl) totalEl.innerHTML='<span>Total Odds</span><span>-</span>';
        if(placeBtn) placeBtn.disabled=true;
        if(payoutEl) payoutEl.textContent='₹0.00';
        return;
    }
    if(itemsEl) {
        itemsEl.innerHTML = betSlip.map(b=>`
            <div class="bet-item">
                <div class="bet-item-info">
                    <div class="bet-item-match">${b.matchName}</div>
                    <div class="bet-item-selection"><i class="fa-solid fa-check-circle" style="color:var(--green-primary);margin-right:4px;font-size:10px;"></i>${b.selectionName}</div>
                </div>
                <div class="bet-item-odds">${b.odds.toFixed(2)}</div>
                <div class="bet-item-remove" onclick="removeBet('${b.id}')"><i class="fa-solid fa-xmark"></i></div>
            </div>`).join('');
    }
    const combined = betSlip.reduce((a,b)=>a*b.odds,1);
    if(totalEl) totalEl.innerHTML=`<span>Total Odds</span><span style="color:var(--green-primary);font-size:16px;font-weight:700;">${combined.toFixed(2)}</span>`;
    if(placeBtn) placeBtn.disabled=false;
    // Calculate potential payout
    const stake = parseInt(stakeEl?.value) || betStake;
    const payout = (stake * combined).toFixed(2);
    if(payoutEl) payoutEl.textContent=`₹${payout}`;
}

function updateStake(val) {
    betStake = Math.max(10, parseInt(val) || 100);
    updateBetSlip();
}

function toggleBetSlip() {
    const panel=document.getElementById('betSlipPanel');
    if(panel) panel.classList.toggle('open');
}

function placeBet() {
    if(!betSlip.length) return;
    const combined=betSlip.reduce((a,b)=>a*b.odds,1);
    const stake = betStake;
    const payout = (stake * combined).toFixed(2);
    showNotification(`🎉 Bet placed! Stake: ₹${stake} | Potential Win: ₹${payout}`);
    betSlip=[];
    updateBetSlip();
    renderCurrentTab();
}

// ===== FAVORITES =====
function toggleFav(el) {
    el.classList.toggle('active');
    const icon=el.querySelector('i');
    if(el.classList.contains('active')) { icon.className='fa-solid fa-heart'; icon.style.color='var(--gold)'; showNotification('Added to favorites!'); }
    else { icon.className='fa-regular fa-heart'; icon.style.color=''; }
}

// ===== NOTIFICATION =====
function showNotification(msg) {
    const notif=document.getElementById('notification');
    const textEl=document.getElementById('notificationText');
    if(!notif||!textEl) return;
    textEl.textContent=msg;
    notif.classList.add('show');
    setTimeout(()=>notif.classList.remove('show'),3000);
}

// ===== SEARCH =====
function toggleSearch() {
    const sb=document.getElementById('searchBox');
    if(sb) sb.classList.toggle('open');
}

function searchMatches(query) {
    if(!query||query.length<2) { renderCurrentTab(); return; }
    const q=query.toLowerCase();
    const all=[...matchData.cricket,...matchData.football,...matchData.tennis,...matchData.basketball,...matchData.esports];
    const filtered=all.filter(m=>
        (m.home_team||'').toLowerCase().includes(q)||
        (m.away_team||'').toLowerCase().includes(q)||
        (m.league_title||m.sport_title||'').toLowerCase().includes(q)
    );
    const el=document.getElementById('mainContent');
    if(el) {
        if (filtered.length) {
            el.innerHTML=`
                <div class="sport-section">
                    <div class="sport-header">
                        <div class="sport-title-area">
                            <div class="sport-icon cricket"><i class="fa-solid fa-magnifying-glass"></i></div>
                            <div class="sport-title">Search Results (${filtered.length})</div>
                        </div>
                    </div>
                    <div class="matches-container">
                        ${filtered.map(m=>renderMatchRow(m,m.sport_key?.includes('soccer'))).join('')}
                    </div>
                </div>`;
        } else {
            el.innerHTML=`
                <div class="sport-section">
                    <div class="sport-header">
                        <div class="sport-title-area">
                            <div class="sport-icon cricket"><i class="fa-solid fa-magnifying-glass"></i></div>
                            <div class="sport-title">No results found</div>
                        </div>
                    </div>
                    <div class="matches-container">
                        <div class="empty-state">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <p>No matches found for "${query}"</p>
                        </div>
                    </div>
                </div>`;
        }
    }
}

// ===== LIVE TICKER =====
function updateTicker() {
    const ticker = document.getElementById('liveTicker');
    if (!ticker) return;
    const all = [...matchData.football, ...matchData.cricket, ...matchData.tennis, ...matchData.basketball];
    const liveMatches = all.filter(m => isMatchLive(m.commence_time));
    if (liveMatches.length === 0) {
        const upcoming = all.filter(m => {
            const d = new Date(m.commence_time);
            return d > new Date() && (d - new Date()) < 24*3600000;
        }).slice(0, 5);
        if (upcoming.length) {
            ticker.innerHTML = upcoming.map(m => {
                const score = generateLiveScore(m);
                return `<span class="ticker-item"><i class="fa-regular fa-clock" style="margin-right:4px;"></i>${m.home_team} vs ${m.away_team} - ${formatMatchTime(m.commence_time)}</span>`;
            }).join('<span class="ticker-sep">|</span>');
        } else {
            ticker.innerHTML = '<span class="ticker-item"><i class="fa-solid fa-star" style="color:var(--gold);margin-right:4px;"></i>Welcome to Lucky777 - Premium Sports Betting!</span>';
        }
    } else {
        ticker.innerHTML = liveMatches.map(m => {
            const score = generateLiveScore(m);
            return `<span class="ticker-item"><span class="live-dot"></span> ${m.home_team} ${score.home} - ${score.away} ${m.away_team} <span style="color:var(--text-muted);font-size:10px;">${score.detail}</span></span>`;
        }).join('<span class="ticker-sep">|</span>');
    }
}

// ===== NAVIGATION =====
function switchTab(tab) {
    currentTab=tab;
    document.querySelectorAll('.nav-item').forEach(el=>{
        el.classList.remove('active');
        if(el.dataset.tab===tab) el.classList.add('active');
    });
    renderCurrentTab();
    window.scrollTo({top:0,behavior:'smooth'});
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('.nav-item').forEach(el=>{
        el.addEventListener('click',()=>switchTab(el.dataset.tab));
    });
    loadAllData();
    // Auto refresh every 5 minutes (to avoid rate limiting)
    setInterval(loadAllData,300000);
    // Rotate featured banner every 8 seconds
    setInterval(()=>{
        const allM = [...matchData.football,...matchData.cricket,...matchData.tennis,...matchData.basketball];
        if (allM.length) {
            featuredIndex = (featuredIndex + 1) % allM.length;
            if (currentTab === 'inplay') renderCurrentTab();
        }
    }, 8000);
    // Update ticker every 30s
    setInterval(updateTicker, 30000);
});
