name: Sync Kataeb Live

on:
  schedule:
    - cron: '*/5 * * * *' # غيت هاب يسمح برأس كل 5 دقائق كحد أقصى مجاني ومستقر
  workflow_dispatch: # لتشغيله يدوياً بضغطة زر في أي ثانية

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Fetch Live Data
      run: node index.js

    - name: Push Updates
      run: |
        git config --global user.name "Live Bot"
        git config --global user.email "bot@live.com"
        git add live-news.json
        git diff-index --quiet HEAD || git commit -m "نبض مباشر جديد ⚡" -a
        git push
