document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const playerId = params.get('id');

    if (!playerId) {
        document.getElementById('playerInfo').innerHTML = '<p>未提供球員 ID。</p>';
        return;
    }

    // 先抓基本資料
    fetch(`/player?id=${playerId}`)
        .then(response => response.json())
        .then(player => {
            if (player.error) {
                document.getElementById('playerInfo').innerHTML = `<p>${player.error}</p>`;
                return;
            }
            document.getElementById('playerInfo').innerHTML = `
                <h1 style="margin-bottom:10px;">${player.name}</h1>
                <p style="margin:0 0 20px 0;"><strong>位置：</strong>${player.position || '-'}</p>
                <div id="statsTable"></div>
                <div style="margin-top:20px;">
                    <a href="index.html" style="color:#007bff;text-decoration:none;margin-right:20px;">
                        🔙 回到搜尋
                    </a>
                    <button id="analysisBtn" style="padding:6px 18px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;">
                        圖像化分析
                    </button>
                </div>
            `;

            document.getElementById('analysisBtn').onclick = function() {
                window.location.href = `analysis.html?id=${playerId}`;
            };

            // 再抓年度數據
            fetch(`/player-stats?id=${playerId}`)
                .then(res => res.json())
                .then(stats => {
                    const container = document.getElementById('statsTable');
                    if (!stats.length) {
                        container.innerHTML = '<p>查無數據</p>';
                        return;
                    }
                    let html = `
                        <h2 style="margin-bottom:15px;">2021-2025 年度數據</h2>
                        <table class="stats-table" style="margin:0 auto;">
                        <thead>
                            <tr>
                                <th>年份</th>
                                <th>球隊</th>
                                <th>出賽</th>
                                <th>打數</th>
                                <th>得分</th>
                                <th>安打</th>
                                <th>全壘打</th>
                                <th>打點</th>
                                <th>打擊率</th>
                                <th>上壘率</th>
                                <th>長打率</th>
                                <th>OPS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.map(s => `
                                <tr>
                                    <td>${s.season}</td>
                                    <td>${s.team || '-'}</td>
                                    <td>${s.games || '-'}</td>
                                    <td>${s.atBats || '-'}</td>
                                    <td>${s.runs || '-'}</td>
                                    <td>${s.hits || '-'}</td>
                                    <td>${s.homeRuns || '-'}</td>
                                    <td>${s.RBIs || '-'}</td>
                                    <td>${s.battingAverage || '-'}</td>
                                    <td>${s.onBasePercentage || '-'}</td>
                                    <td>${s.sluggingPercentage || '-'}</td>
                                    <td>${s.OPS || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        </table>`;
                    container.innerHTML = html;
                })
                .catch(() => {
                    document.getElementById('statsTable').innerHTML = '<p>無法載入年度數據。</p>';
                });
        })
        .catch(error => {
            console.error('Error fetching player details:', error);
            document.getElementById('playerInfo').innerHTML = '<p>無法載入球員資料。</p>';
        });
});