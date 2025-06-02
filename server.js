const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path'); // 用於處理文件路徑

const app = express();
const PORT = 3000;

app.use(cors());

// 提供靜態文件（例如 HTML、CSS、JS）
app.use(express.static(path.join(__dirname, 'public')));

// 建立 MySQL 連接
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // 替換為您的 MySQL 使用者名稱
    password: 'your_password', // 替換為您的 MySQL 密碼
    database: 'mlb_database' // 替換為您的資料庫名稱
});

// 測試資料庫連接
db.connect((err) => {
    if (err) {
        console.error('資料庫連接失敗:', err.message);
    } else {
        console.log('成功連接到 MySQL 資料庫');
    }
});

// 提供 MLB 分區排名的 API
app.get('/mlb-standings', async (req, res) => {
    console.log('收到 /mlb-standings 請求');
    try {
        const leagueId = req.query.leagueId || 103;

        const response = await axios.get('https://statsapi.mlb.com/api/v1/standings', {
            params: {
                leagueId,
                season: 2025,
                standingsType: 'regularSeason'
            }
        });

        console.log('MLB Stats API 響應數據:', response.data);

        const standings = response.data.records.map(record => ({
            division: record.division.name,
            teams: record.teamRecords.map(team => {
                return {
                    name: team.team.name,
                    w: team.wins,
                    l: team.losses,
                    pct: team.winningPercentage,
                    gb: team.gamesBack,
                    home: `${team.records.splitRecords[0].wins}-${team.records.splitRecords[0].losses}`,
                    away: `${team.records.splitRecords[1].wins}-${team.records.splitRecords[1].losses}`
                };
            })
        }));

        res.json(standings);
    } catch (error) {
        console.error('取得分區排名數據錯誤：', error.message);
        res.status(500).json({ error: '無法取得分區排名數據' });
    }
});

// 搜尋球員的 API
app.get('/search-player', (req, res) => {
    const playerName = req.query.name;

    if (!playerName) {
        return res.status(400).json({ error: '未提供球員名稱' });
    }

    const query = `
        SELECT id, player_name AS name
        FROM player_stats
        WHERE player_name LIKE ?
        LIMIT 10
    `;

    db.query(query, [`%${playerName}%`], (err, results) => {
        if (err) {
            console.error('查詢失敗:', err.message);
            return res.status(500).json({ error: '無法查詢球員數據' });
        }

        res.json(results);
    });
});

// 提供單個球員詳細數據的 API
app.get('/player', (req, res) => {
    const playerId = req.query.id;

    if (!playerId) {
        return res.status(400).json({ error: '未提供球員 ID' });
    }

    const query = `
        SELECT 
            id, player_name AS name, team, pos AS position, ba, hr, rbi, obp, slg, ops
        FROM player_stats
        WHERE id = ?
    `;

    db.query(query, [playerId], (err, results) => {
        if (err) {
            console.error('查詢球員數據失敗:', err.message);
            return res.status(500).json({ error: '無法查詢球員數據' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: '找不到該球員的數據' });
        }

        const player = results[0];
        res.json({
            id: player.id,
            name: player.name,
            team: player.team,
            position: player.position,
            stats: {
                avg: player.ba,
                hr: player.hr,
                rbi: player.rbi,
                obp: player.obp,
                slg: player.slg,
                ops: player.ops
            }
        });
    });
});

// 根路徑處理，返回 index.html
app.get('/', (req, res) => {
    console.log('根路徑請求已收到');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`伺服器已啟動：http://localhost:${PORT}`);
});