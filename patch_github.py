import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<button class="auth-google-btn" id="auth-google-btn">\\n      Sign in with Google\\n    </button>',
    '<button class="auth-google-btn" id="auth-github-btn">\\n      Sign in with GitHub\\n    </button>'
)

content = content.replace(
    'async function signInWithGoogle() {\\n    if (!supabaseClient) { showToast("Supabase not configured"); return; }\\n    const { error } = await supabaseClient.auth.signInWithOAuth({ provider: "google" });\\n    if (error) showToast("Sign-in failed: " + error.message);\\n  }',
    'async function signInWithGithub() {\\n    if (!supabaseClient) { showToast("Supabase not configured"); return; }\\n    const { error } = await supabaseClient.auth.signInWithOAuth({ provider: "github" });\\n    if (error) showToast("Sign-in failed: " + error.message);\\n  }'
)

content = content.replace(
    'el("auth-google-btn")?.addEventListener("click", signInWithGoogle);',
    'el("auth-github-btn")?.addEventListener("click", signInWithGithub);'
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully.")
