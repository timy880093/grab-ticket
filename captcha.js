const { default: DdddOcr } = require("ddddocr");
const path = require("path");

async function recognizeCaptcha(file) {
    const ddddocr = await DdddOcr.create();
    let verifyCode = await ddddocr.classification(file);
    if(verifyCode.length !== 4){
        verifyCode = parse(verifyCode);
        if(verifyCode.length !== 4){
            console.log(`verifyCode ${verifyCode}長度太短，重新辨識`);
            verifyCode = await recognizeCaptcha(file);
        }
    }
    // while(verifyCode.length !== 4){
    //   console.log("regenerate: ", verifyCode);
    //   // verifyCode = regenerate(verifyCode);
    //   verifyCode = recognizeCaptcha(verifyCode);
    // }
    return verifyCode;
    
}

function parse(input) {
    let str = input.toLowerCase();
    if(str.length === 4){
        return str;
    }

    let result = '';
    let prevChar = ''; // 用於記錄前一個字元
    for (let i = 0; i < str.length; i++) {
        if (str[i] !== prevChar) { // 如果當前字母與前一個字母不同
            result += str[i];
            prevChar = str[i];
        }
    }
    
    // 確保結果符合要求
    // while (result.length !== 4) {
    //     result = '';
    //     let prevChar = ''; // 用於記錄前一個字元
    //
    //     for (let i = 0; i < str.length; i++) {
    //         if (str[i] !== prevChar) { // 如果當前字母與前一個字母不同
    //             result += str[i];
    //             prevChar = str[i];
    //         }
    //         if (result.length === 4) break; // 結果長度達到4時停止
    //     }
    //
    //     // // 如果結果不符合條件，將字串隨機洗牌後再重新處理
    //     // if (result.length !== 4) {
    //     //     str = shuffleString(str);
    //     // }
    // }
    
    return result;
}

// 洗牌字串的輔助函數
function shuffleString(str) {
    let arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}



module.exports = { recognizeCaptcha };
// recognizeCaptcha(path.join(__dirname, "downloaded-image.png")).then((res) => {
    //   console.log(res);
// });
