from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify
import mysql.connector
import requests
import os

app = Flask(__name__, template_folder="public", static_folder="public/static")

# 資料庫連接配置
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'wF@625771117',  
    'database': 'mlb_database',
    'port': 3306
}

# 驗證用戶名和密碼
def validate_user(username, password):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        query = "SELECT * FROM users WHERE username = %s AND password = %s"
        cursor.execute(query, (username, password))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        return user
    except mysql.connector.Error as err:
        print(f"資料庫錯誤: {err}")
        return None

# 新增用戶到資料庫
def register_user(username, password):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        query = "INSERT INTO users (username, password) VALUES (%s, %s)"
        cursor.execute(query, (username, password))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except mysql.connector.Error as err:
        print(f"資料庫錯誤: {err}")
        return False

# 搜尋球員的 API
@app.route("/search-player", methods=["GET"])
def search_player():
    player_name = request.args.get("name", "").lower()
    if not player_name:
        return jsonify({"error": "未提供球員名稱"}), 400

    try:
        # 調用 MLB 官方 API 搜索球員
        response = requests.get(f"https://statsapi.mlb.com/api/v1/people/search?name={player_name}")
        response.raise_for_status()
        data = response.json()
        people = data.get("people", [])

        # 只保留 fullName 包含搜尋字串的球員（可改成 startswith 更精確）
        filtered = [
            p for p in people
            if player_name in p.get("fullName", "").lower()
        ]

        return jsonify(filtered)
    except requests.RequestException as e:
        print(f"取得球員搜索數據錯誤: {e}")
        return jsonify({"error": "無法取得球員搜索數據"}), 500

# 單個球員詳細數據的 API
@app.route("/player", methods=["GET"])
def get_player_details():
    player_id = request.args.get("id")
    if not player_id:
        return jsonify({"error": "未提供球員 ID"}), 400

    try:
        # 調用 MLB 官方 API 獲取球員數據
        response = requests.get(f"https://statsapi.mlb.com/api/v1/people/{player_id}?season=2025")
        response.raise_for_status()
        data = response.json()

        # 提取需要的數據
        player = data.get("people", [])[0]  # 獲取第一個球員數據
        if not player:
            return jsonify({"error": "找不到該球員的數據"}), 404

        # 返回格式化的數據
        return jsonify({
            "name": player.get("fullName"),
            "birthDate": player.get("birthDate"),
            "height": player.get("height"),
            "weight": player.get("weight"),
            "position": player.get("primaryPosition", {}).get("name"),
            "team": player.get("currentTeam", {}).get("name"),
            "stats": player.get("stats", [])
        })
    except requests.RequestException as e:
        print(f"取得球員數據錯誤: {e}")
        return jsonify({"error": "無法取得球員數據"}), 500

# 提供 2021-2025 年的球員數據
@app.route("/player-stats", methods=["GET"])
def get_player_stats():
    player_id = request.args.get("id")
    if not player_id:
        return jsonify({"error": "未提供球員 ID"}), 400

    stats = []
    try:
        # 循環獲取 2021-2025 年的數據
        for year in range(2021, 2026):
            response = requests.get(f"https://statsapi.mlb.com/api/v1/people/{player_id}/stats?stats=yearByYear&season={year}")
            response.raise_for_status()
            data = response.json()

            # 提取需要的數據
            year_stats = data.get("stats", [])[0].get("splits", [])
            for stat in year_stats:
                if stat.get("season") == str(year):
                    s = stat.get("stat", {})
                    stats.append({
                        "season": year,
                        "team": stat.get("team", {}).get("name"),
                        "games": s.get("gamesPlayed"),
                        "atBats": s.get("atBats"),
                        "runs": s.get("runs"),
                        "hits": s.get("hits"),
                        "homeRuns": s.get("homeRuns"),
                        "RBIs": s.get("rbi"),
                        "battingAverage": s.get("avg"),
                        "onBasePercentage": s.get("obp"),
                        "sluggingPercentage": s.get("slg"),
                        "OPS": s.get("ops"),
                        "WAR": s.get("war") or s.get("winsAboveReplacement") or "-",
                        "OPSPlus": s.get("opsPlus") or "-"
                    })

        return jsonify(stats)
    except requests.RequestException as e:
        print(f"取得球員數據錯誤: {e}")
        return jsonify({"error": "無法取得球員數據"}), 500

# 登入頁面
@app.route("/lab2_login.html", methods=["GET", "POST"])
def lab2_login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        user = validate_user(username, password)
        if user:
            return redirect(url_for('home'))  # 登入成功後跳轉到首頁
        else:
            return "登入失敗，請檢查用戶名和密碼！"
    return render_template("lab2_login.html")

@app.route("/index.html")
def index():
    return render_template("index.html")  
# 註冊頁面
@app.route("/lab2_sign_in.html", methods=["GET", "POST"])
def lab2_sign_in():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        # 檢查用戶名和密碼是否有效
        if not username or not password:
            return "❌ 請輸入帳號和密碼！"

        # 將用戶存入資料庫
        if register_user(username, password):
            return redirect(url_for('lab2_login'))  # 註冊成功後跳轉到登入頁面
        else:
            return "❌ 註冊失敗，請稍後再試！"

    return render_template("lab2_sign_in.html")

# Blog 頁面
@app.route("/blog.html", methods=["GET"])
def blog():
    return render_template("blog.html")

# 靜態文件處理
@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(os.path.join(app.root_path, "public/static"), filename)

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/autocomplete-player", methods=["GET"])
def autocomplete_player():
    query = request.args.get("query", "").lower()
    if not query:
        return jsonify([])

    try:
        # 調用 MLB 官方 API 搜索球員
        response = requests.get(f"https://statsapi.mlb.com/api/v1/people/search?name={query}")
        response.raise_for_status()
        data = response.json()

        # 提取球員名稱
        players = [
            {"id": player["id"], "name": player["fullName"]}
            for player in data.get("people", [])
        ]
        return jsonify(players)
    except requests.RequestException as e:
        print(f"取得球員自動補全數據錯誤: {e}")
        return jsonify([]), 500

@app.route('/player.html')
def player_html():
    return send_from_directory(os.path.join(app.root_path, "public"), "player.html")

from pybaseball import batting_stats

@app.route('/league-average-stats')
def league_average_stats():
    years = range(2021, 2026)
    all_stats = []
    for year in years:
        df = batting_stats(year)
        df = df[df['AB'] > 0]  # 過濾掉沒有打席的球員
        avg = {
            "battingAverage": round(df['AVG'].mean(), 3),
            "onBasePercentage": round(df['OBP'].mean(), 3),
            "sluggingPercentage": round(df['SLG'].mean(), 3),
            "OPS": round(df['OPS'].mean(), 3)
        }
        all_stats.append(avg)
    # 計算五年平均
    avg_stats = {
        "battingAverage": round(sum([a["battingAverage"] for a in all_stats]) / len(all_stats), 3),
        "onBasePercentage": round(sum([a["onBasePercentage"] for a in all_stats]) / len(all_stats), 3),
        "sluggingPercentage": round(sum([a["sluggingPercentage"] for a in all_stats]) / len(all_stats), 3),
        "OPS": round(sum([a["OPS"] for a in all_stats]) / len(all_stats), 3)
    }
    return jsonify(avg_stats)

@app.route('/analysis.html')
def analysis_html():
    return send_from_directory(os.path.join(app.root_path, "public"), "analysis.html")

@app.route('/index.html')
def index_html():
    return send_from_directory(os.path.join(app.root_path, "public"), "index.html")
# 啟動伺服器
if __name__ == "__main__":
    app.run(debug=True)