//grab-ticket use puppeteer from website https://tixcraft.com/activity/detail/25_casty

const {default: axios} = require("axios");
const puppeteer = require("puppeteer");
const {recognizeCaptcha} = require("./captcha");
// const { recognizeCaptcha } = require("./captchaRecognizer");
const fs = require("fs");
const path = require("path");
const {log} = require("console");
// use headless:false to see the browser
// const headless = true;
// const url = "https://tixcraft.com/activity/detail/24_jaychou"; //搶票網址-周杰倫
// const url = "https://tixcraft.com/activity/detail/25_casty"; //搶票網址-老菸槍測試


// 改這裡!!!!!!!!!!!!!!!!!!!!!!!!!
// 直接進座位區的網址
const urlArray = [
    "https://tixcraft.com/ticket/area/25_casty/17686", //搶票網址-老菸槍測試
    "https://tixcraft.com/ticket/area/25_casty/17686", //搶票網址-老菸槍測試
    // "https://tixcraft.com/ticket/area/24_jaychou/17763", //周餅倫-12/5
    // "https://tixcraft.com/ticket/area/24_jaychou/17764", //周餅倫-12/6
    // "https://tixcraft.com/ticket/area/24_jaychou/17765", //周餅倫-12/7
    // "https://tixcraft.com/ticket/area/24_jaychou/17766", //周餅倫-12/8
]
const count = "2"; //數量
const isProduct = true; //是否正式搶票

(async () => {

    // 取得 WebSocket 偵錯 URL，不適用無頭模式
    const wsKey = await axios.get("http://localhost:9222/json/version");
    const browser = await puppeteer.connect({
        browserWSEndpoint: wsKey.data.webSocketDebuggerUrl,
        defaultViewport: null, // 可選，設定為 null 以使用預設 port
    });

    // 創建多個頁面
    const pages = [];
    for (let i = 0; i < urlArray.length; i++) {
        const page = await browser.newPage();
        pages.push(page);
        await grabFlow(page, browser, urlArray[i]);
    }
    // for (let i = 0; i < numberOfWindows; i++) {
    //     const page = await grab(browser, url);
    //     pages.push(page)
    // }

    // await Promise.all(pages.map((page) => page.screenshot({path: "screenshot.png"})));
    await Promise.all(pages);

    //   await browser.close();
    process.exit(0);
})();

async function grabFlow(page, browser, url) {
    try {
        console.debug("[start] 搶票流程: ", url);
        await page.goto(url);

        // 監聽對話框事件
        page.on("dialog", async (dialog) => {
            console.log("對話框內容:", dialog.message()); // 印出對話框的內容
            await dialog.accept(); // 確認對話框
        });


        // // 立即購票
        // await page.waitForSelector("#tab-func > li.buy");
        // await page.click("#tab-func > li.buy");
        // //   await page.close();
        //
        // // 選擇日期場次
        // console.debug("選擇日期場次: ");
        // await page.waitForSelector(
        //     "#gameList > table > tbody > tr > td:nth-child(4) > button"
        // );
        // await page.click("#gameList > table > tbody > tr > td:nth-child(4) > button");
        // console.debug("選擇日期場次 OK");


        // 選擇座位區域
        console.debug("[start] 選擇座位區域");
        await chooseArea(page);
        console.debug("[end] 選擇座位區域");

        console.debug("[start] 選擇座位區域");
        await submit(page, browser, count);
        console.debug("[end] 選擇座位區域");


        try {
            page.screenshot({path: `grab_result_${url.split('/').pop()}.png`})
        } catch (e) {
            console.warn("screenshot Error:", e);
        }
        return page;
    } catch (e) {
        if (e.message.includes('重搶')) {
            console.warn(e.message);
            await grabFlow(page, browser, url);
        } else {
            console.error("grabFlow error:", e);
        }
    }
}

async function isElementClickable(page, selector) {
    try {
        // 等待元素出現
        await page.waitForSelector(selector, {visible: true});

        // 獲取元素的屬性
        const isDisabled = await page.$eval(selector, el => el.disabled);
        const isVisible = await page.$eval(selector, el => {
            const style = window.getComputedStyle(el);
            return style.visibility !== 'hidden' && style.display !== 'none';
        });

        // 如果元素被禁用或者不可見，則返回 false
        return isVisible && !isDisabled;
    } catch (error) {
        console.error(`Error checking element ${selector}:`, error);
        return false; // 如果出現錯誤，默認返回不可點擊
    }
}

async function chooseArea(page) {
    // await page.waitForSelector("#group_1 > li:nth-child(1)");

    let groupElements = await page.$$eval('[data-id^="group_"]', elems => {
        return elems.map(el => {
            return {id: el.getAttribute('data-id'), text: el.querySelector('b').innerText || ''}
        }); // 獲取每個元素的 id
    });
    // 移除第一個元素
    groupElements = groupElements.slice(1).filter(el => {
        return !el.text.includes('身心障礙')
            && !el.text.includes('站')
    });
    // groupElements = groupElements.filter(el => !el.text.includes('身心障礙'));
    if (groupElements.length === 0) {
        throw new Error("重搶，沒有位置可選擇，請檢查是否已經開賣或已經搶完");
    }

    let isClickable = false;
    while (isClickable === false) {
        for (const el of groupElements) {
            const {id} = el;
            // console.log(`Processing group: ${id}`);

            const listItems = await page.$$eval(`#${id} li`, elems => {
                return elems.map((el, index) => ({
                    id: el.id,
                    text: el.innerText,
                    isClickable: !el.disabled && el.offsetParent !== null, // 判断是否可见且不被禁用
                    hasLink: !!el.querySelector('a') && !el.innerText.includes('1 seat(s)') && !el.innerText.includes('Sold out'), // 检查是否包含 <a> 标签
                    count: index + 1 // 計數
                }));
            });
            // console.log(`List items:`, listItems)

            const seats = listItems.filter(item => item.hasLink);
            if (seats.length === 0) {
                throw new Error("重搶，沒有位置可選擇，請檢查是否已經開賣或已經搶完");
            }

            for (const item of seats) {
                console.debug(`${item.text} 已點擊`);
                await page.click(`#${id} > li:nth-child(${item.count})`); // 点击可选的 li 元素
                isClickable = true;
                break;
            }
            if (isClickable) {
                break;
            }
        }
    }
}

async function fillCaptcha(page, browser) {
    // 開新分頁處理驗證碼圖片
    const captchaImageUrl = await page.$eval(
        "#TicketForm_verifyCode-image",
        (img) => img.src
    );
    console.debug("驗證碼圖片:", captchaImageUrl);
    const imagePage = await browser.newPage();
    const viewSource = await imagePage.goto(captchaImageUrl);
    fs.writeFileSync(
        path.join(__dirname, "downloaded-image.png"),
        await viewSource.buffer()
        // response.data
        // Buffer.from(imageBuffer)
    );
    await imagePage.close();

    // // 使用 axios 獲取圖片 buffer
    // const response = await axios.get(captchaImageUrl, { responseType: 'arraybuffer' });

    // //   使用 page.evaluate() 獲取圖片 buffer
    //   const imageBuffer = await page.evaluate(async (url) => {
    //     const response = await fetch(url);
    //     const buffer = await response.arrayBuffer();
    //     return Array.from(new Uint8Array(buffer)); // 將 ArrayBuffer 轉換為數組
    //   }, imageUrl);

    // 驗證碼
    const captcha = await recognizeCaptcha(
        path.join(__dirname, "downloaded-image.png")
    );
    await page.type("#TicketForm_verifyCode", captcha);
    // await page.type("#TicketForm_verifyCode", 'aaaa');
    return captcha;
}

async function verifyAndSubmit(page, browser, count) {
    console.debug("選擇數量");

    let countElement = await page.$$eval('[id^=TicketForm_ticketPrice_]', elems => {
        const array = elems.map(el => {
            return {id: el.getAttribute('id')}
        }); // 獲取每個元素的 id
        if (Array.isArray(array) && array.length > 0) {
            return array[0];
        } else {
            return array;
        }
    });
    if (!countElement || countElement.length === 0)
        return;
    console.debug("countElement:", countElement)
    await page.select(`#${countElement.id}`, count);
    //   await page.click("#TicketForm_ticketPrice_01");
    console.debug("選擇數量 OK: ", count);


    const captcha = await fillCaptcha(page, browser);
    console.debug("驗證碼 OK: ", captcha);

    // 隱私權條款
    await page.click("#form-ticket-ticket > div:nth-child(4) > div > label");
    // 提交送出
    if (isProduct) {
        await page.click(
            "#form-ticket-ticket > div.mgt-32.col-lg-12.col-md-12.col-sm-12.col-xs-12.col-12.text-center > button.btn.btn-primary.btn-green"
        );
    }

}

async function submit(page, browser, count) {
    try {
        const submitUrl = page.url();
        await verifyAndSubmit(page, browser, count);

        // 使用 Promise.race 来同时等待对话框和超时
        // const dialogPromise = checkDialog();
        // const timeoutPromise = new Promise(resolve => setTimeout(resolve, 500));
        // const result = await Promise.race([dialogPromise, timeoutPromise]);

        await new Promise(resolve => setTimeout(resolve, 500));
        const newUrl = page.url();
        if (submitUrl !== newUrl) {
            console.log("送出訂票 OK!!!!");
            return;
        }

        // 检查结果
        const dialog = await checkDialog(); // 再次检查对话框
        if (dialog) {
            await dialog.click(); // 点击确认按钮
            // await verifyAndSubmit(page, browser, count); // 递归调用主流程
            throw new Error("重搶，送出訂票失敗，重跑流程...");
        }
    } catch (e) {
        console.error("重搶主流程...請檢查是否有成功訂票，如果有請按 ctrl+C 結束程式: ", e);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await submit(page, browser, count); // 在发生错误时重跑主流程
    }
}

async function checkDialog(page) {
    const dialogSelector = 'button:contains("確定")'; // 根据实际情况调整选择器
    return await page.$(dialogSelector);
}