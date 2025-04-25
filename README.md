啟銓MLB球員數據搜尋網站
專案介紹
本專案是一個提供 MLB 球員數據搜尋、即時新聞以及分區排名的網站，使用者可以透過簡單的搜尋介面快速獲取球員的詳細資料。

功能特色
球員搜尋：輸入球員名稱，顯示詳細資料，包括基本資訊與賽季數據。
即時新聞：顯示最新的 MLB 新聞。
分區排名：提供美聯與國聯的分區排名。
動態下拉建議：輸入球員名稱時，提供相關建議。
使用技術
前端：HTML5、CSS3、JavaScript
後端：Node.js、Express.js
資料來源：MLB Stats API
工具：Git、GitHub、Visual Studio Code
安裝與執行
下載專案：
git clone https://github.com/lin274015/web-middle.git
cd web-middle
安裝依賴套件： 確保您已安裝 Node.js，然後執行：
npm install
啟動伺服器： 本專案包含三個伺服器，分別運行於以下埠號：
# 啟動 3000 埠伺服器
node standingsServer.js
# 啟動 4000 埠伺服器
node newsServer.js
# 啟動 5000 埠伺服器
node searchPlayer.js
3000：提供 MLB 分區排名的 API。
4000：提供 MLB 新聞的 API。
5000：提供球員搜尋與詳細資料的 API。

專案結構
注意事項
確保您的電腦已安裝 Node.js。
啟動伺服器時，請確保埠號未被其他應用程式佔用。
如果需要修改埠號，請在相應的伺服器檔案中調整。

## sign in截圖
![sign in](https://raw.githubusercontent.com/lin274015/web-middle/main/sign%20in.png)

## myblog截圖
![myblog](https://github.com/lin274015/web-middle/blob/61eeedaf5556d0d662c6f72511999c8cded48cfb/blog.png)

## index截圖
![index](https://github.com/lin274015/web-middle/blob/61eeedaf5556d0d662c6f72511999c8cded48cfb/index.png)

## log in截圖
![log in](https://github.com/lin274015/web-middle/blob/61eeedaf5556d0d662c6f72511999c8cded48cfb/log%20in.png)

## searchPlayer範例截圖
![searchPlayer範例](https://github.com/lin274015/web-middle/blob/61eeedaf5556d0d662c6f72511999c8cded48cfb/searchPlayer.png)

## drop-down menu截圖
![drop-down menu](https://github.com/lin274015/web-middle/blob/61eeedaf5556d0d662c6f72511999c8cded48cfb/drop-down%20menu.png)
