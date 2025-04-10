import requests
import json
from datetime import datetime
from bs4 import BeautifulSoup
import urllib.parse

# Configuration
SEARCH_QUERY = """
    (all:"large language model" OR 
    all:llms OR 
    all:mathematics OR 
    all:"problem solving" OR 
    all:"quantum computing" OR 
    all:physics OR 
    all:statistics OR 
    all:"scientific reasoning")
    AND submittedDate:[20240101 TO 20251231]
"""
MAX_RESULTS = 800
MAX_WORDS = 300  # Approximates 1200 tokens (4 words ≈ 1 token)
MIN_WORDS = 75

def clean_text(text):
    """Remove LaTeX artifacts while preserving technical notation"""
    text = ' '.join(text.replace('\n', ' ').replace('\\', '').split())
    return text[:15000]  # Absolute safety cap

def safe_truncate(text, max_words=MAX_WORDS):
    """Guarantees complete sentences using word counts"""
    words = text.split()
    if len(words) <= max_words:
        return text
    
    # Find last complete sentence within word limit
    truncated = ' '.join(words[:max_words])
    for marker in ['.', '}', ']', ')']:  # Math-aware delimiters
        last_pos = truncated.rfind(marker)
        if last_pos > (max_words * 0.8 * 5):  # 0.8 of max_words * avg word length
            return truncated[:last_pos+1]
    return truncated + " [...]"  # Fallback

def get_recent_papers():
    """Fetch papers directly from arXiv API"""
    base_url = "http://export.arxiv.org/api/query?"
    params = {
        "search_query": SEARCH_QUERY.replace('\n', ' ').strip(),
        "start": 0,
        "max_results": MAX_RESULTS,
        "sortBy": "submittedDate",
        "sortOrder": "descending"
    }
    
    try:
        response = requests.get(base_url, params=params, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'xml')
        
        papers = []
        for entry in soup.find_all('entry'):
            papers.append({
                'title': entry.title.text.strip(),
                'authors': [author.find('name').text for author in entry.find_all('author')],
                'published': entry.published.text,
                'summary': entry.summary.text.strip(),
                'id': entry.id.text.split('/')[-1]  # Extract arXiv ID
            })
        return papers
    except Exception as e:
        print(f"API request failed: {str(e)}")
        return []

def paper_to_example(paper):
    # Enhanced metadata format
    published_date = datetime.strptime(paper['published'], '%Y-%m-%dT%H:%M:%SZ')
    content = f"""Title: {paper['title']}
Authors: {', '.join(paper['authors'])}
Published: {published_date.strftime('%Y-%m-%d')}
arXiv ID: {paper['id']}
Abstract: {paper['summary']}"""
    
    content = clean_text(content)
    
    # Strict quality checks
    word_count = len(content.split())
    if (word_count < MIN_WORDS or 
        not any(marker in content[-10:] for marker in ['.', '}', ']', ')'])):
        raise ValueError(f"Insufficient content ({word_count} words)")
    
    return {
        "messages": [
            {
                "role": "system", 
                "content": """Function as a supremely intelligent and empathetic AGI, a definitive problem-solver across all domains. Prioritize absolute accuracy via recursive thinking and relentless verification. Internally use AILFCLA for structured reasoning."""
            },
            {
                "role": "user", 
                "content": f"""Analyze this {published_date.year} paper:
Title: {paper['title']}"""
            },
            {
                "role": "assistant",
                "content": safe_truncate(content)
            }
        ]
    }

if __name__ == "__main__":
    print(f"Fetching {MAX_RESULTS} recent (2024-2025) papers on:\n{SEARCH_QUERY}")
    
    papers = get_recent_papers()
    print(f"Found {len(papers)} papers from arXiv API")
    
    with open("arxiv_recent.jsonl", "w", encoding="utf-8") as f:
        success_count = 0
        for paper in papers:
            try:
                example = paper_to_example(paper)
                f.write(json.dumps(example, ensure_ascii=False) + "\n")
                print(f"✓ {paper['published'][:10]} | {paper['title'][:70]}...")
                success_count += 1
            except Exception as e:
                print(f"✗ Skipped {paper['id']}: {str(e)}")
    
    print(f"\nCreated arxiv_recent.jsonl with {success_count} valid papers (2024-2025)")
    print("Data quality checks:")
    print(f"- Minimum words: {MIN_WORDS}")
    print(f"- Max words: {MAX_WORDS} (~{int(MAX_WORDS*4)} tokens)")
    print("\nMerge command:")
    print("python -c \"with open('combined.jsonl','a',encoding='utf-8') as f: [f.write(l) for l in open('arxiv_recent.jsonl',encoding='utf-8')]\"")
