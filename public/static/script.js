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
    const url = `http://localhost:4000/mlb-news`;

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
                    <p>${article.description || "無描述"}</p>
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
                const divisionTitle = document.createElement("h3");
                divisionTitle.textContent = rank.division !== "Unknown Division" ? rank.division : "未命名分區";
                container.appendChild(divisionTitle);

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

function showSuggestions() {
    const playerName = document.getElementById('playerNameInput').value.trim();
    const suggestionsContainer = document.getElementById('autocomplete-results');

    if (!playerName) {
        suggestionsContainer.innerHTML = ''; // 清空下拉選單
        return;
    }

    fetch(`/search-player?name=${encodeURIComponent(playerName)}`)
        .then(response => response.json())
        .then(data => {
            suggestionsContainer.innerHTML = ''; // 清空舊的結果
            if (!data || data.length === 0) {
                suggestionsContainer.innerHTML = '<p>找不到相關球員</p>';
                return;
            }

            // 渲染下拉選單
            data.forEach(player => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.textContent = player.fullName; // 顯示球員姓名
                suggestionItem.dataset.playerId = player.id;

                // 點擊選項時，填充輸入框並清空下拉選單
                suggestionItem.addEventListener('click', () => {
                    console.log(`選中了球員: ${player.fullName}`);
                    document.getElementById('playerNameInput').value =player.fullName;
                    suggestionsContainer.innerHTML = '';
                });

                suggestionsContainer.appendChild(suggestionItem);
            });
        })
        .catch(error => {
            console.error('自動補全失敗：', error);
            suggestionsContainer.innerHTML = '<p>無法載入建議</p>';
        });
}

function selectPlayer(playerName) {
    document.getElementById('playerNameInput').value = playerName; // 將選中的球員名稱填入輸入框
    document.getElementById('suggestions').innerHTML = ''; // 清空下拉選單
    searchPlayer(); // 自動執行搜尋
}

function searchPlayer() {
    const playerName = document.getElementById('playerNameInput').value.trim();
    if (!playerName) {
        alert('請輸入球員名稱');
        return;
    }

    fetch(`http://localhost:5000/player-stats?name=${encodeURIComponent(playerName)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('playerResult').innerHTML = `<p>${data.error}</p>`;
                return;
            }

            renderPlayerData(data);
        })
        .catch(error => {
            console.error('Error fetching player data:', error);
            document.getElementById('playerResult').innerHTML = `<p>查詢失敗，請稍後再試。</p>`;
        });
}

function renderPlayerData(data) {
    const playerResult = document.getElementById("playerResult");
    playerResult.innerHTML = `
        <h3>${data[0].player_name} 的數據：</h3>
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>賽季</th>
                    <th>年齡</th>
                    <th>比賽數</th>
                    <th>打席數</th>
                    <th>打數</th>
                    <th>得分</th>
                    <th>安打</th>
                    <th>全壘打</th>
                    <th>打點</th>
                    <th>盜壘</th>
                    <th>被盜壘</th>
                    <th>四壞球</th>
                    <th>三振</th>
                    <th>打擊率</th>
                    <th>上壘率</th>
                    <th>長打率</th>
                    <th>OPS</th>
                    <th>WAR</th>
                </tr>
            </thead>
            <tbody>
                ${data
                    .map(
                        row => `
                    <tr>
                        <td>${row.season}</td>
                        <td>${row.age}</td>
                        <td>${row.games}</td>
                        <td>${row.pa}</td>
                        <td>${row.ab}</td>
                        <td>${row.r}</td>
                        <td>${row.h}</td>
                        <td>${row.hr}</td>
                        <td>${row.rbi}</td>
                        <td>${row.sb}</td>
                        <td>${row.cs}</td>
                        <td>${row.bb}</td>
                        <td>${row.so}</td>
                        <td>${row.ba}</td>
                        <td>${row.obp}</td>
                        <td>${row.slg}</td>
                        <td>${row.ops}</td>
                        <td>${row.war}</td>
                    </tr>
                `
                    )
                    .join("")}
            </tbody>
        </table>
    `;
}
let playerList = [];

function showSuggestions() {
    const playerName = document.getElementById('playerNameInput').value.trim();
    const suggestionsContainer = document.getElementById('autocomplete-results');

    if (!playerName) {
        suggestionsContainer.innerHTML = '';
        playerList = [];
        return;
    }

    fetch(`/search-player?name=${encodeURIComponent(playerName)}`)
        .then(response => response.json())
        .then(data => {
            playerList = data; // 存下所有搜尋到的球員
            suggestionsContainer.innerHTML = '';
            if (!data || data.length === 0) {
                suggestionsContainer.innerHTML = '<p>找不到相關球員</p>';
                return;
            }
            data.forEach(player => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.textContent = player.fullName;
                suggestionItem.dataset.playerId = player.id;
                suggestionItem.addEventListener('click', () => {
                    document.getElementById('playerNameInput').value = player.fullName;
                    suggestionsContainer.innerHTML = '';
                });
                suggestionsContainer.appendChild(suggestionItem);
            });
        })
        .catch(error => {
            suggestionsContainer.innerHTML = '<p>無法載入建議</p>';
        });
}

// 攔截搜尋表單送出，跳轉到 player.html?id=xxx
document.querySelector('.search-container').addEventListener('submit', function(e) {
    e.preventDefault();
    const playerName = document.getElementById('playerNameInput').value.trim();
    const player = playerList.find(p => p.fullName === playerName);
    if (!player) {
        alert('請先選擇正確的球員');
        return;
    }
    window.location.href = `player.html?id=${player.id}`;
});