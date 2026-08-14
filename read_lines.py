with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines[6390:6450]):
    print(f"{i+6391}: {line.rstrip()}")
