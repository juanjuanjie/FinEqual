import sys
import requests

sys.stdout.reconfigure(encoding="utf-8")

url = "https://www.marketgrep.com/api/sentiment-report"
data = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30).json()

print(f"报告日期: {data['report_date']}")
print("=" * 60)
print(data["report_markdown"])
print(data["report_events"])
