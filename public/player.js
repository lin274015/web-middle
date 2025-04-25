document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const playerId = params.get('id');

    if (!playerId) {
        document.getElementById('playerInfo').innerHTML = '<p>未提供球員 ID。</p>';
        return;
    }

    fetch(`http://localhost:5000/player?id=${playerId}`)
        .then(response => response.json())
        .then(player => {
            if (player.error) {
                document.getElementById('playerInfo').innerHTML = `<p>${player.error}</p>`;
                return;
            }

            document.getElementById('playerInfo').innerHTML = `
                <img src="${player.photo}" alt="${player.name}">
                <h1>${player.name}</h1>
                <p><strong>球隊：</strong>${player.team}</p>
                <p><strong>位置：</strong>${player.position}</p>
                <p><strong>國籍：</strong>${player.nationality}</p>
                <p><strong>身高：</strong>${player.height}</p>
                <p><strong>體重：</strong>${player.weight} 磅</p>
                <p><strong>出生日期：</strong>${player.birthDate}</p>
                <h2>2025 賽季數據</h2>
                <p><strong>打擊率：</strong>${player.stats.avg}</p>
                <p><strong>全壘打：</strong>${player.stats.hr}</p>
                <p><strong>打點：</strong>${player.stats.rbi}</p>
                <p><strong>上壘率：</strong>${player.stats.obp}</p>
                <p><strong>長打率：</strong>${player.stats.slg}</p>
                <p><strong>OPS：</strong>${player.stats.ops}</p>
                <a href="index.html">🔙 回到搜尋</a>
            `;
        })
        .catch(error => {
            console.error('Error fetching player details:', error);
            document.getElementById('playerInfo').innerHTML = '<p>無法載入球員資料。</p>';
        });
});