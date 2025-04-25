const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path'); // 用於處理文件路徑

const app = express();
const PORT = 3000;

app.use(cors());

// 提供靜態文件（例如 HTML、CSS、JS）
app.use(express.static(path.join(__dirname, 'public')));

// 提供 MLB 分區排名的 API
app.get('/mlb-standings', async (req, res) => {
    console.log('收到 /mlb-standings 請求');
    try {
        // 從查詢參數中獲取聯盟 ID，默認為美聯（103）
        const leagueId = req.query.leagueId || 103;

        const response = await axios.get('https://statsapi.mlb.com/api/v1/standings', {
            params: {
                leagueId, // 使用查詢參數中的聯盟 ID
                season: 2025, // 當前賽季
                standingsType: 'regularSeason' // 正確參數名稱
            }
        });

        console.log('MLB Stats API 響應數據:', response.data);

        const standings = response.data.records.map(record => ({
            division: record.division.name,
            teams: record.teamRecords.map(team => ({
                name: team.team.name,
                w: team.wins,
                l: team.losses,
                pct: team.winningPercentage,
                gb: team.gamesBack,
                home: `${team.records.splitRecords[0].wins}-${team.records.splitRecords[0].losses}`,
                away: `${team.records.splitRecords[1].wins}-${team.records.splitRecords[1].losses}`,
                l10: `${team.records.splitRecords[2].wins}-${team.records.splitRecords[2].losses}`
            }))
        }));

        res.json(standings);
    } catch (error) {
        console.error('取得分區排名數據錯誤：', error.message);
        res.status(500).json({ error: '無法取得分區排名數據' });
    }
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