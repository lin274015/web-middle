const axios = require('axios');
const mysql = require('mysql2');

// 建立 MySQL 連接
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'wF@625771117',
    database: 'mlb_database',
    port: 3306
});

// 獲取所有球隊的球員名單
async function fetchAllPlayers() {
    try {
        const response = await axios.get('https://statsapi.mlb.com/api/v1/teams', {
            params: { sportId: 1 }
        });

        const teams = response.data.teams;
        const playerIds = [];

        for (const team of teams) {
            const rosterResponse = await axios.get(`https://statsapi.mlb.com/api/v1/teams/${team.id}/roster`);
            const roster = rosterResponse.data.roster;

            roster.forEach(player => {
                playerIds.push(player.person.id);
            });
        }

        return playerIds;
    } catch (error) {
        console.error('獲取現役球員失敗:', error.message);
        return [];
    }
}

// 獲取打者數據
async function fetchHitterStats(playerId, season) {
    try {
        const response = await axios.get(`https://statsapi.mlb.com/api/v1/people/${playerId}`, {
            params: {
                season,
                hydrate: 'stats(group=[hitting],type=[season])'
            }
        });

        const player = response.data.people[0];
        if (!player) {
            console.error(`球員 ${playerId} 的數據不存在`);
            return null;
        }

        const stats = player.stats?.[0]?.splits?.[0]?.stat || {};
        return {
            id: player.id,
            player_name: player.fullName,
            season,
            age: player.currentAge || null,
            team: player.currentTeam?.name || '未知',
            lg: player.currentTeam?.league?.name || '未知',
            war: stats.war || 0,
            game: stats.gamesPlayed || 0,
            pa: stats.plateAppearances || 0,
            ab: stats.atBats || 0,
            r: stats.runs || 0,
            h: stats.hits || 0,
            hr: stats.homeRuns || 0,
            rbi: stats.rbi || 0,
            sb: stats.stolenBases || 0,
            cs: stats.caughtStealing || 0,
            bb: stats.baseOnBalls || 0,
            so: stats.strikeOuts || 0,
            ba: stats.avg || 0,
            obp: stats.obp || 0,
            slg: stats.slg || 0,
            ops: stats.ops || 0,
            ops_plus: stats.opsPlus || 0,
            tb: stats.totalBases || 0,
            pos: player.primaryPosition?.abbreviation || '未知',
            ip: 0, // 默認值
            era: 0, // 默認值
            whip: 0, // 默認值
            wins: 0, // 默認值
            losses: 0, // 默認值
            saves: 0, // 默認值
            type: 'hitter' // 標記為打者
        };
    } catch (error) {
        console.error(`獲取打者 ${playerId} 數據失敗:`, error.message);
        return null;
    }
}

// 獲取投手數據
async function fetchPitcherStats(playerId, season) {
    try {
        const response = await axios.get(`https://statsapi.mlb.com/api/v1/people/${playerId}`, {
            params: {
                season,
                hydrate: 'stats(group=[pitching],type=[season])'
            }
        });

        const player = response.data.people[0];
        if (!player) {
            console.error(`球員 ${playerId} 的數據不存在`);
            return null;
        }

        const stats = player.stats?.[0]?.splits?.[0]?.stat || {};
        return {
            id: player.id,
            player_name: player.fullName,
            season,
            age: player.currentAge || null,
            team: player.currentTeam?.name || '未知',
            lg: player.currentTeam?.league?.name || '未知',
            war: stats.war || 0,
            game: stats.gamesPlayed || 0,
            pa: 0, // 默認值
            ab: 0, // 默認值
            r: 0, // 默認值
            h: 0, // 默認值
            hr: 0, // 默認值
            rbi: 0, // 默認值
            sb: 0, // 默認值
            cs: 0, // 默認值
            bb: 0, // 默認值
            so: 0, // 默認值
            ba: 0, // 默認值
            obp: 0, // 默認值
            slg: 0, // 默認值
            ops: 0, // 默認值
            ops_plus: 0, // 默認值
            tb: 0, // 默認值
            pos: player.primaryPosition?.abbreviation || '未知',
            ip: stats.inningsPitched || 0,
            era: stats.earnedRunAverage || 0,
            whip: stats.whip || 0,
            wins: stats.wins || 0,
            losses: stats.losses || 0,
            saves: stats.saves || 0,
            type: 'pitcher' // 標記為投手
        };
    } catch (error) {
        console.error(`獲取投手 ${playerId} 數據失敗:`, error.message);
        return null;
    }
}

// 插入數據到資料庫
async function savePlayerStats(player) {
    const query = `
        INSERT INTO player_stats (
            id, player_name, season, age, team, lg, war, game, pa, ab, r, h, hr, rbi, sb, cs, bb, so, ba, obp, slg, ops, ops_plus, tb, pos, ip, era, whip, wins, losses, saves, type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            age = VALUES(age),
            team = VALUES(team),
            lg = VALUES(lg),
            war = VALUES(war),
            game = VALUES(game),
            pa = VALUES(pa),
            ab = VALUES(ab),
            r = VALUES(r),
            h = VALUES(h),
            hr = VALUES(hr),
            rbi = VALUES(rbi),
            sb = VALUES(sb),
            cs = VALUES(cs),
            bb = VALUES(bb),
            so = VALUES(so),
            ba = VALUES(ba),
            obp = VALUES(obp),
            slg = VALUES(slg),
            ops = VALUES(ops),
            ops_plus = VALUES(ops_plus),
            tb = VALUES(tb),
            pos = VALUES(pos),
            ip = VALUES(ip),
            era = VALUES(era),
            whip = VALUES(whip),
            wins = VALUES(wins),
            losses = VALUES(losses),
            saves = VALUES(saves),
            type = VALUES(type)
    `;

    const values = [
        player.id, player.player_name, player.season, player.age, player.team, player.lg, player.war, player.game,
        player.pa || 0, player.ab || 0, player.r || 0, player.h || 0, player.hr || 0, player.rbi || 0, player.sb || 0,
        player.cs || 0, player.bb || 0, player.so || 0, player.ba || 0, player.obp || 0, player.slg || 0, player.ops || 0,
        player.ops_plus || 0, player.tb || 0, player.pos || '未知', player.ip || 0, player.era || 0, player.whip || 0,
        player.wins || 0, player.losses || 0, player.saves || 0, player.type || '未知'
    ];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('插入數據失敗:', err.message);
        } else {
            console.log(`球員 ${player.player_name} 賽季 ${player.season} 數據插入成功`);
        }
    });
}

// 批量處理所有球員
async function fetchAndSaveAllPlayers(season) {
    const playerIds = await fetchAllPlayers();

    for (const playerId of playerIds) {
        const hitterStats = await fetchHitterStats(playerId, season);
        const pitcherStats = await fetchPitcherStats(playerId, season);

        // 確保每個球員只插入一次數據
        if (hitterStats && pitcherStats) {
            // 如果同時有打者和投手數據，優先插入打者數據
            await savePlayerStats(hitterStats);
        } else if (hitterStats) {
            await savePlayerStats(hitterStats);
        } else if (pitcherStats) {
            await savePlayerStats(pitcherStats);
        }
    }

    console.log(`所有現役球員 ${season} 賽季數據已存入資料庫`);
}

// 批量處理多個年份
async function fetchAndSaveMultipleSeasons(startYear, endYear) {
    for (let year = startYear; year <= endYear; year++) {
        console.log(`正在刪除 ${year} 賽季的舊數據...`);
        await deleteSeasonData(year); // 刪除舊數據
        console.log(`正在處理 ${year} 賽季數據...`);
        await fetchAndSaveAllPlayers(year);
    }
}

// 刪除指定年份的數據
async function deleteSeasonData(season) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM player_stats WHERE season = ?`;
        db.query(query, [season], (err, results) => {
            if (err) {
                console.error(`刪除 ${season} 賽季數據失敗:`, err.message);
                reject(err);
            } else {
                console.log(`成功刪除 ${season} 賽季的舊數據`);
                resolve(results);
            }
        });
    });
}

// 連接資料庫並執行
db.connect(async (err) => {
    if (err) {
        console.error('資料庫連接失敗:', err.message);
    } else {
        console.log('成功連接到 MySQL 資料庫');
        await fetchAndSaveMultipleSeasons(2021, 2025); // 插入 2021 到 2025 年的數據
        db.end(); // 關閉資料庫連接
    }
});