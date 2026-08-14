with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()
for i, line in enumerate(content.splitlines()):
    if "auth-google-btn" in line or "auth-github-btn" in line:
        print(f"{i+1}: {line.strip()}")
