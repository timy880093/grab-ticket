### 前言
目前僅適用[拓元網站](https://tixcraft.com/)

### 準備
1. 打開 terminal 安裝 nodejs
    * WINDOWS
      * scoop
        ```
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
        Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
        ```
      * nodejs
        ```
        scoop install nodejs
        ```
    * MAC
      * homebrew
        ```
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        ```
      * nodejs:
        ```
        brew install node
        ```
2. 切換到當前目錄，安裝套件
    ```
    cd C:\_Code\Nodejs\grab-ticket
    ```
    ```
    npm install
    npm i pnpm -g
    ```
3. 打開 chrome debug 模式
    * WINDOWS
      1. 按開始，搜尋 chrome，點右鍵「開啟檔案位置」，複製路徑
      2. 輸入指令即可打開 chrome
      ```
      "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
      ```
    * MAC
      1. 打開 terminal
      2. 輸入指令即可打開 chrome
        ```
        /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
        ```
4. 註冊/登入拓元網站

### 使用
1. 打開 index.js 修改搶票網址、數量
2. 在當前目錄執行指令
    ```
    node index.js
    ```