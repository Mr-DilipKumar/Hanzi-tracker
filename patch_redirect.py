import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const { error } = await supabaseClient.auth.signInWithOAuth({ provider: "github" });',
    'const { error } = await supabaseClient.auth.signInWithOAuth({ provider: "github", options: { redirectTo: window.location.origin + window.location.pathname } });'
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully.")
