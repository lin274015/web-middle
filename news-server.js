const express = require('express');
const cors = require('cors');
const axios = require('axios');
const xml2js = require('xml2js'); // 用於解析 RSS XML

const app = express();
const PORT = 4000;

app.use(cors());

app.get('/mlb-news', async (req, res) => {
    console.log('收到 /mlb-news 請求');
    try {
        // 獲取 Yahoo Sports 的 RSS Feed
        const response = await axios.get('https://sports.yahoo.com/mlb/rss.xml');
        const rssData = response.data;

        // 打印原始 RSS 數據
        console.log('RSS 原始數據:', rssData);

        // 使用非嚴格模式解析 RSS XML 為 JSON
        const parser = new xml2js.Parser({ explicitArray: false, strict: false });
        parser.parseString(rssData, (err, result) => {
            if (err) {
                console.error('解析 RSS 失敗:', err);
                return res.status(500).json({ error: '無法解析新聞數據' });
            }

            // 打印解析後的 JSON 結構
            console.log('解析後的 JSON 數據:', JSON.stringify(result, null, 2));

            // 確認 result.RSS 和 result.RSS.CHANNEL 是否存在
            if (!result.RSS || !result.RSS.CHANNEL) {
                console.error('RSS 結構不符合預期:', result);
                return res.status(500).json({ error: 'RSS 結構不符合預期' });
            }

            // 提取前 5 個新聞項目
            const newsItems = result.RSS.CHANNEL.ITEM.slice(0, 5).map(item => ({
                title: item.TITLE,
                description: item.DESCRIPTION,
                url: item.LINK
            }));

            console.log('解析後的新聞數據:', newsItems);
            res.json(newsItems);
        });
    } catch (error) {
        console.error('獲取新聞數據失敗:', error.message);
        res.status(500).json({ error: '無法獲取新聞數據' });
    }
});
app.listen(PORT, () => {
    console.log(`新聞伺服器已啟動：http://localhost:${PORT}`);
});