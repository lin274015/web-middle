const params = new URLSearchParams(window.location.search);
const playerId = params.get('id');

Promise.all([
    fetch(`/player?id=${playerId}`).then(r => r.json()),
    fetch(`/player-stats?id=${playerId}`).then(r => r.json()),
    fetch(`/league-average-stats`).then(r => r.json())
]).then(([player, stats, leagueAvg]) => {
    document.getElementById('playerName').textContent = `${player.name} 2021-2025 平均數據與聯盟平均對比`;

    // 過濾2021-2025年數據
    const filtered = stats.filter(s => s.season >= 2021 && s.season <= 2025);

    // 計算球員五年平均
    function avg(arr, key) {
        const nums = arr.map(s => parseFloat(s[key])).filter(n => !isNaN(n));
        return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
    }
    const playerAvg = {
        battingAverage: avg(filtered, 'battingAverage'),
        onBasePercentage: avg(filtered, 'onBasePercentage'),
        sluggingPercentage: avg(filtered, 'sluggingPercentage'),
        OPS: avg(filtered, 'OPS')
    };

    // 準備圖表資料
    const labels = ['打擊率', '上壘率', '長打率', 'OPS'];
    const playerData = [
        playerAvg.battingAverage,
        playerAvg.onBasePercentage,
        playerAvg.sluggingPercentage,
        playerAvg.OPS
    ];
    const leagueData = [
        leagueAvg.battingAverage,
        leagueAvg.onBasePercentage,
        leagueAvg.sluggingPercentage,
        leagueAvg.OPS
    ];

    new Chart(document.getElementById('myChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: player.name, data: playerData, backgroundColor: 'rgba(54,162,235,0.7)' },
                { label: '聯盟平均', data: leagueData, backgroundColor: 'rgba(255,99,132,0.7)' }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
});