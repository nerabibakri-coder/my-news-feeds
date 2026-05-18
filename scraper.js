const fs = require('fs');
const puppeteer = require('puppeteer');

async function runPuppeteerScraper() {
  const liveUrl = "https://kataeb.org";
  let browser;

  try {
    // تشغيل متصفح وهمي حقيقي بالكامل لتخطي حماية Angular و Cloudflare
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });

    const page = await browser.newPage();
    
    // التمويه كمتصفح حقيقي تماماً لتفادي الحظر
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    // الذهاب للموقع والانتظار حتى يستقر الاتصال بالكامل
    await page.goto(liveUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // الانتظار الإضافي لثوانٍ للتأكد من قيام نظام الـ Angular بضخ نصوص الأخبار على الشاشة
    await page.waitForTimeout(5000);

    // التقاط كود الشاشة والمحتوى الحي الفعلي بعد اكتمال التحميل
    const htmlContent = await page.content();
    const timestamp = new Date().toUTCString();
    let rssItems = '';

    // المنطق الأصلي المضمون: البحث عن التوقيت الرقمي (مثل 12:35) داخل النص الحي المستخرج
    const timeMatches = htmlContent.match(/\d{2}:\d{2}/g);
    
    if (timeMatches && timeMatches.length > 0) {
      let parts = htmlContent.split(/\d{2}:\d{2}/);
      let count = 0;

      for (let i = 0; i < timeMatches.length; i++) {
        let time = timeMatches[i];
        let contentBlock = parts[i + 1];

        if (contentBlock) {
          // تنظيف كتل النصوص من الوسوم والأكواد البرمجية بالكامل
          let cleanText = contentBlock
            .replace(/<[^>]*>/g, '') 
            .replace(/&[^;]+;/g, '') 
            .replace(/\s+/g, ' ')    
            .trim();

          // ضخ الأخبار الحية بالتكرار الكامل دون حذف أي سطر
          if (cleanText.length > 15 && count < 20) {
            count++;
            let shortTitle = cleanText.substring(0, 80);
            let uniqueGuid = Buffer.from(time + shortTitle.substring(0,10)).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

            rssItems += `
    <item>
      <title><![CDATA[[${time}] ${shortTitle}...]]></title>
      <description><![CDATA[${cleanText}]]></description>
      <link>${liveUrl}#${uniqueGuid}</link>
      <guid isPermaLink="false">live-${uniqueGuid}</guid>
      <pubDate>${timestamp}</pubDate>
    </item>`;
          }
        }
      }
    }

    // بناء مستند الـ XML الشرعي لـ Feedbin و Inoreader
    let rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n`;
    rssFeed += `<title>مباشر - عاجل الكتائب اللبنانية</title>\n`;
    rssFeed += `<link>${liveUrl}</link>\n`;
    rssFeed += `<description>تغطية حية ومحدثة دقيقة بدقيقة عبر محاكاة المتصفح الحقيقي</description>\n`;
    rssFeed += `<pubDate>${timestamp}</pubDate>\n`;
    
    if (rssItems !== '') {
      rssFeed += rssItems;
    } else {
      rssFeed += `
    <item>
      <title><![CDATA[⚡ متابعة مستمرة لآخر التطورات والأخبار الميدانية والسياسية اللحظية]]></title>
      <description><![CDATA[يرجى تحديث القارئ بعد لحظات لمزامنة آخر التحديثات الجارية الآن.]]></description>
      <link>${liveUrl}</link>\n
      <guid>fallback-${new Date().getTime()}</guid>\n
      <pubDate>${timestamp}</pubDate>\n
    </item>`;
    }

    rssFeed += `\n</channel>\n</rss>`;
    
    // حفظ ملف الـ XML النهائي والمكتمل بنجاح
    fs.writeFileSync('kataeb-live.xml', rssFeed, 'utf-8');
    console.log("تمت محاكاة المتصفح بنجاح وتوليد الخلاصة المكتملة بالكامل!");

  } catch (err) {
    console.error("خطأ أثناء تشغيل المتصفح: " + err.message);
  } finally {
    if (browser) await browser.close();
  }
}

runPuppeteerScraper();
