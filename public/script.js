document.addEventListener("DOMContentLoaded", () => {
    fetchNews("mlb", "mlbNews");
    fetchStandings(103); // 默認加載美聯分區排名

    // 綁定按鈕事件
    document.getElementById("americanLeagueBtn").addEventListener("click", () => {
        fetchStandings(103); // 美聯
    });

    document.getElementById("nationalLeagueBtn").addEventListener("click", () => {
        fetchStandings(104); // 國聯
    });
});

function fetchNews(keyword, targetId) {
    const url = `http://localhost:4000/mlb-news`; // 使用 Fangraphs 的新聞 API

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById(targetId);
            container.innerHTML = "";

            if (!data || data.length === 0) {
                container.innerHTML = "<p>暫無新聞</p>";
                return;
            }

            data.forEach(article => {
                const div = document.createElement("div");
                div.className = "news-item";
                div.innerHTML = `
                    <a href="${article.url}" target="_blank">${article.title}</a>
                    <p>${article.description || ""}</p>
                `;
                container.appendChild(div);
            });
        })
        .catch(error => {
            console.error("新聞載入失敗:", error);
            document.getElementById(targetId).innerHTML = "<p>無法載入新聞。</p>";
        });
}

function fetchStandings(leagueId) {
    const url = `http://localhost:3000/mlb-standings?leagueId=${leagueId}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById("mlbRankings");
            container.innerHTML = "";

            data.forEach(rank => {
                // 分區標題
                const divisionTitle = document.createElement("h3");
                divisionTitle.textContent = rank.division;
                container.appendChild(divisionTitle);

                // 分區表格
                const table = document.createElement("table");
                table.className = "ranking-table";
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>隊伍</th>
                            <th>勝場</th>
                            <th>敗場</th>
                            <th>勝率</th>
                            <th>勝差</th>
                            <th>主場</th>
                            <th>客場</th>
                            <th>近10場</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rank.teams
                            .map(
                                team => `
                            <tr>
                                <td>${team.name}</td>
                                <td>${team.w}</td>
                                <td>${team.l}</td>
                                <td>${team.pct}</td>
                                <td>${team.gb}</td>
                                <td>${team.home}</td>
                                <td>${team.away}</td>
                                <td>${team.l10}</td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                `;
                container.appendChild(table);
            });
        })
        .catch(error => {
            console.error("分區排名載入失敗:", error);
            document.getElementById("mlbRankings").innerHTML = "<p>無法載入分區排名。</p>";
        });
}

function searchPlayer() {
    const playerName = document.getElementById('playerNameInput').value.trim();
    if (!playerName) {
        alert('請輸入球員名稱');
        return;
    }

    fetch(`http://localhost:5000/search-player?name=${encodeURIComponent(playerName)}`)
        .then(response => response.json())
        .then(data => {
            console.log('Search Player Response:', data); // 調試代碼

            if (data.error) {
                document.getElementById('playerResult').innerHTML = `<p>${data.error}</p>`;
                return;
            }

            // 如果返回多個球員，顯示選擇列表
            if (Array.isArray(data) && data.length > 1) {
                const playerList = data.map(player => `
                    <li>
                        <button onclick="window.location.href='player.html?id=${player.id}'">${player.name}</button>
                    </li>
                `).join('');
                document.getElementById('playerResult').innerHTML = `
                    <h2>請選擇球員：</h2>
                    <ul>${playerList}</ul>
                `;
            } else if (data.length === 1) {
                // 單個結果直接跳轉到詳細頁面
                window.location.href = `player.html?id=${data[0].id}`;
            } else {
                document.getElementById('playerResult').innerHTML = `<p>找不到相關球員。</p>`;
            }
        })
        .catch(error => {
            console.error('Error fetching player data:', error); // 調試代碼
            document.getElementById('playerResult').innerHTML = `<p>查詢失敗，請稍後再試。</p>`;
        });
}

function getPlayerDetails(playerId) {
    fetch(`http://localhost:5000/player?id=${playerId}`)
        .then(response => response.json())
        .then(player => {
            document.getElementById('playerResult').innerHTML = `
                <h1>${player.name}</h1>
                <img src="${player.photo}" alt="${player.name}">
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
            document.getElementById('playerResult').innerHTML = `<p>無法獲取球員數據。</p>`;
        });
}

function showSuggestions() {
    const playerName = document.getElementById('playerNameInput').value.trim();
    const suggestionsContainer = document.getElementById('suggestions');

    if (!playerName) {
        suggestionsContainer.innerHTML = ''; // 清空下拉選單
        return;
    }

    fetch(`http://localhost:5000/search-player?name=${encodeURIComponent(playerName)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error || !Array.isArray(data)) {
                suggestionsContainer.innerHTML = '<p>找不到相關球員</p>';
                return;
            }

            const suggestions = data.map(player => `
                <div class="suggestion-item" onclick="selectPlayer('${player.name}')">
                    ${player.name}
                </div>
            `).join('');
            suggestionsContainer.innerHTML = suggestions;
        })
        .catch(error => {
            console.error('Error fetching suggestions:', error);
            suggestionsContainer.innerHTML = '<p>無法載入建議</p>';
        });
}

function selectPlayer(playerName) {
    document.getElementById('playerNameInput').value = playerName; // 將選中的球員名稱填入輸入框
    document.getElementById('suggestions').innerHTML = ''; // 清空下拉選單
    searchPlayer(); // 自動執行搜尋
}