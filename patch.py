import os

file_path = r"e:\github1\Hanzi-tracker\index.html"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = '.word-card-face.back{transform:rotateY(180deg);justify-content:flex-start;overflow-y:auto;}'
replacement1 = '.word-card-face.back{transform:rotateY(180deg);justify-content:center;overflow-y:auto;}'
content = content.replace(target1, replacement1)

target2 = '''  .word-example-zh{font-family:var(--font-hanzi);font-size:1.3rem;font-weight:700;line-height:1.45;color:var(--ink);}
  .word-example-en{font-family:var(--font-ui);font-size:1.05rem;font-weight:650;line-height:1.4;color:var(--ink-soft);margin-top:4px;}'''
replacement2 = '''  .word-example-zh{font-family:var(--font-hanzi);font-size:1.3rem;font-weight:700;line-height:1.45;color:var(--ink);}
  .word-example-py{font-family:var(--font-ui);font-size:1.1rem;font-weight:700;line-height:1.4;color:var(--gold-dark);margin-top:4px;font-variant-ligatures:none;font-feature-settings:"liga" 0,"clig" 0,"kern" 1;}
  .word-example-py[hidden]{display:none !important;}
  .word-example-en{font-family:var(--font-ui);font-size:1.05rem;font-weight:650;line-height:1.4;color:var(--ink-soft);margin-top:4px;}'''
content = content.replace(target2, replacement2)

target3 = """              (example ? '<div class="word-example-zh">'+escHtml(example.zh)+'</div><div class="word-example-en">'+escHtml(example.en)+'</div>' : '<div class="word-example-empty">No example sentence in the current corpus.</div>')+"""
replacement3 = """              (example ? '<div class="word-example-zh">'+escHtml(example.zh)+'</div>'+(window.pinyinPro&&typeof window.pinyinPro.pinyin==="function"?'<div class="word-example-py" '+(wordsShowPinyin?'':'hidden')+'>'+escHtml(window.pinyinPro.pinyin(example.zh,{toneType:"symbol",type:"string",v:true}))+'</div>':'')+'<div class="word-example-en">'+escHtml(example.en)+'</div>' : '<div class="word-example-empty">No example sentence in the current corpus.</div>')+"""
content = content.replace(target3, replacement3)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied")
