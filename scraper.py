import time
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from feedgen.feed import FeedGenerator

TARGET_URL = "https://kataeb.org"
OUTPUT_FILE = "kataeb.xml"

def fetch_kataeb_live():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] جاري سحب الأخبار العاجلة باستخدام الفئات الذكية...")
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
        
        # البحث الذكي عن أي وسم span يحتوي كلاس يبدأ بـ ng-tns- لتغطية كل الأخبار العاجلة
        news_items = soup.find_all('span', class_=lambda x: x and 'ng-tns-' in x)
        
        # إذا لم يجدها (في حال اختلاف الاستجابة السحابية)، سيبحث في فئات حاوية الأخبار العاجلة العامة
        if not news_items:
            news_items = soup.find_all('span', attrs={"_ngcontent-kataeb-c48": True})

        count = 0
        seen_texts = set() # لمنع تكرار نفس الخبر في الخلاصة

        for item in news_items:
            text_content = item.get_text(strip=True)
            
            # تصفية النصوص الثابتة، والتأكد من طول الخبر، ومنع التكرار
            if len(text_content) > 15 and text_content not in seen_texts:
                if "شريط الأخبار" in text_content or "التغطيات الشاملة" in text_content or "متابعة" in text_content:
                    continue
                    
                seen_texts.add(text_content)
                
                fe = fg.add_entry()
                fe.title(text_content)
                fe.link(href=TARGET_URL)
                fe.description(text_content)
                count += 1
                
            if count >= 20: # جلب آخر 20 خبر عاجل
                break
                
        if count > 0:
            fg.rss_file(OUTPUT_FILE)
            print(f"✓ نجاح كامل! تم تحديث الـ RSS وجلب {count} خبر عاجل حقيقي.")
        else:
            print("⚠️ تم قراءة الصفحة ولكن لم يظهر محتوى الأخبار في كود السيرفر المباشر.")
            
    except Exception as e:
        print(f"❌ خطأ: {e}")

if __name__ == "__main__":
    fetch_kataeb_live()
