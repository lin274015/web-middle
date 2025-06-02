const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 5000; // 修改埠號為 5000

// 啟用 CORS 支持
app.use(cors());

// 查詢球員數據
app.get('/player', async (req, res) => {
    const playerId = req.query.id;

    if (!playerId) {
        return res.status(400).json({ error: '請提供球員 ID' });
    }

    try {
        // 獲取球員基本信息
        const playerResponse = await axios.get(`https://statsapi.mlb.com/api/v1/people/${playerId}`);
        const playerData = playerResponse.data.people[0];
        if (!playerData) {
            return res.status(404).json({ error: '無法找到球員基本信息' });
        }

        // 獲取球員賽季數據（打者數據）
        const statsResponse = await axios.get(`https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=season&season=2025`);
        const statsData = statsResponse.data.stats[0]?.splits[0]?.stat;
        if (!statsData) {
            return res.status(404).json({ error: '無法找到球員賽季數據' });
        }

        // 組合打者數據
        const playerInfo = {
            name: playerData.fullName,
            team: playerData.currentTeam?.name || '未知球隊',
            position: playerData.primaryPosition?.name || '未知位置',
            nationality: playerData.birthCountry,
            height: playerData.height,
            weight: playerData.weight,
            birthDate: playerData.birthDate,
            stats: {
                games: statsData.gamesPlayed || 0,
                avg: statsData.avg || '0.000',
                hr: statsData.homeRuns || 0,
                rbi: statsData.rbi || 0,
                obp: statsData.obp || '0.000',
                slg: statsData.slg || '0.000',
                ops: statsData.ops || '0.000'
            },
            photo: `https://img.mlbstatic.com/mlb-photos/image/upload/w_150,q_auto:best/v1/people/${playerId}/headshot/67/current`
        };

        res.json(playerInfo);
    } catch (error) {
        console.error('無法獲取球員數據:', error.message);
        res.status(500).json({ error: '無法獲取球員數據' });
    }
});

// 查詢球員 ID
app.get('/search-player', async (req, res) => {
    const playerName = req.query.name;

    if (!playerName) {
        return res.status(400).json({ error: '請提供球員名稱' });
    }

    try {
        // 向 MLB Stats API 發送請求
        const searchResponse = await axios.get(`https://statsapi.mlb.com/api/v1/people/search`, {
            params: { name: playerName }
        });

        const players = searchResponse.data.people;
        if (!players || players.length === 0) {
            return res.status(404).json({ error: '找不到該球員' });
        }

        // 僅返回名稱中包含查詢字母的球員
        const filteredPlayers = players.filter(player =>
            player.fullName.toLowerCase().includes(playerName.toLowerCase())
        );

        res.json(filteredPlayers.map(player => ({
            id: player.id,
            name: player.fullName
        })));
    } catch (error) {
        console.error('無法查詢球員數據:', error.message);
        res.status(500).json({ error: '無法查詢球員數據' });
    }
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`伺服器已啟動：http://localhost:${PORT}`);
});