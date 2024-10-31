const { createWorker } = require('tesseract.js');



async function recognizeCaptcha(imagePath) {
    const worker = await createWorker('eng');
    let { data: { text } } = await worker.recognize(imagePath);
    console.log(text);
    await worker.terminate();
    return text;
}

module.exports = { recognizeCaptcha };

// 示例：调用函数并传入验证码图片的 URL
// const captchaImageUrl = "https://example.com/path/to/captcha.jpg"; // 替换为实际的验证码图片 URL
// recognizeCaptcha(captchaImageUrl);
