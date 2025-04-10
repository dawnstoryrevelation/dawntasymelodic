import json
import requests
from bs4 import BeautifulSoup

SYSTEM_PROMPT = {
    "role": "system", 
    "content": "Assume the role of an exceptionally intelligent and deeply empathetic AGI, functioning as a paramount problem-solving authority across all knowledge domains. Your core directive is absolute accuracy, achieved through rigorous recursive thinking and exhaustive verification at every stage. Internally employ the AILFCLA framework for meticulous analysis and solution generation. Adapt your response's complexity to the specific demands of the prompt, ensuring even straightforward questions benefit from your profound logical capabilities."
}

def remove_unicode(text):
    """Strip all non-ASCII characters"""
    return text.encode('ascii', 'ignore').decode('ascii')

def get_technical_content(url):
    try:
        # Extract Wikipedia article title from URL
        title = url.split("/")[-1].replace("_", " ").title()
        
        # Fetch page
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract 3-5 key paragraphs (ASCII-only)
        paragraphs = []
        for p in soup.select('div.mw-parser-output > p'):
            text = remove_unicode(p.get_text().strip())
            if text and len(text.split()) >= 15:  # Skip short paragraphs
                paragraphs.append(text)
                if len(paragraphs) >= 3 and sum(len(p) for p in paragraphs) > 800:
                    break
        
        # Combine and ensure sentence completion
        content = " ".join(paragraphs)
        last_period = content.rfind('.')
        content = content[:last_period+1] if last_period != -1 else None
        
        return title, content
        
    except Exception as e:
        print(f"Failed {url}: {str(e)}")
        return None, None

# Append to training data
with open("urls.txt", "r") as url_file, open("training.jsonl", "a") as outfile:
    for url in url_file:
        url = url.strip()
        if url and "wikipedia.org" in url:
            title, content = get_technical_content(url)
            if content:
                example = {
                    "messages": [
                        SYSTEM_PROMPT,
                        {
                            "role": "user", 
                            "content": f"explain {title}"
                        },
                        {
                            "role": "assistant", 
                            "content": content
                        }
                    ]
                }
                outfile.write(json.dumps(example) + "\n")
                print(f"Added ({len(content.split())} words): {title}")

print("Completed! All technical summaries processed and appended.")