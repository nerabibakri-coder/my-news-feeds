const fs = require('fs');
const https = require('https');

function fetchLivePage() {
  const liveUrl = "https://kataeb.org";
  
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  };

  https.get(liveUrl, options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      // حفظ البيانات في الملف الذي تنتظره واجهة الـ HTML
      fs.writeFileSync('live-news.json', JSON.stringify({ updated: new Date().getTime(), html: data }), 'utf-8');
      console.log("تم تحديث نبض التغطية الحية بنجاح!");
    });

  }).on("error", (err) => {
    console.error("فشل الاتصال: " + err.message);
  });
}

fetchLivePage();
