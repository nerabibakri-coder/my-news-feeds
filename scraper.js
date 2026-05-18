import time
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from feedgen.feed import FeedGenerator

TARGET_URL = "https://kataeb.org"
OUTPUT_FILE = "kataeb.xml" # جعلناه يطابق الاسم الموجود بحسابك

def fetch_kataeb_live():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] جاري سحب الأخبار...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3'
    }
    try:
        response = requests.get(TARGET_URL, headers=headers, timeout=20)
        if response.status_code != 200:
            print(f"⚠️ كود الاستجابة: {response.status_code}")
            return
            
        soup = BeautifulSoup(response.text, 'html.parser')
        fg = FeedGenerator()
        fg.title('موقع الكتائب - بث مباشر')
        fg.link(href=TARGET_URL, rel='alternate')
        fg.description('خلاصة RSS مخصصة لتحديثات موقع الكتائب اللبنانية المباشرة')
        fg.language('ar')
        
        # البحث في الروابط والعناوين المباشرة بالصفحة
        news_items = soup.find_all('h1') or soup.find_all('li')
        count = 0
        for item in news_items:
            text_content = item.get_text(strip=True)
            if len(text_content) > 15 and count < 15:
                link_tag = item.find('a')
                item_link = link_tag['href'] if link_tag and 'href' in link_tag.attrs else TARGET_URL
                if not item_link.startswith('http'):
                    item_link = "https://kataeb.org" + item_link

                fe = fg.add_entry()
                fe.title(text_content)
                fe.link(href=item_link)
                fe.description(text_content)
                count += 1
                
        if count > 0:
            fg.rss_file(OUTPUT_FILE)
            print(f"✓ تم تحديث الخلاصة بنجاح (تم جلب {count} خبر)")
        else:
            print("⚠️ لم يتم العثور على أخبار جديدة توافق البنية.")
    except Exception as e:
        print(f"❌ خطأ: {e}")

if __name__ == "__main__":
    fetch_kataeb_live()
