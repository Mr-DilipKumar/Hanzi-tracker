import re
import os

file_path = r"e:\github1\Hanzi-tracker\index.html"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Supabase script
target_script = '<script src="https://unpkg.com/pinyin-pro@3.28.1/dist/index.js"></script>'
replacement_script = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n<script src="https://unpkg.com/pinyin-pro@3.28.1/dist/index.js"></script>'
content = content.replace(target_script, replacement_script)

# 2. Replace Firebase init call
content = content.replace("initFirebase();", "initSupabase();")

# 3. Replace the entire Auth & Sync block
pattern = re.compile(r'/\* =========================================================\n\s*\*  FIREBASE AUTH.*?function setStatusRaw\(char, status\) \{.*?\n    \} catch\(e\) \{\}\n  \}', re.DOTALL)

supabase_code = """/* =========================================================
   *  SUPABASE AUTH & CLOUD SYNC
   * ========================================================= */

  const SUPABASE_URL = "YOUR_PROJECT_URL";
  const SUPABASE_PUBLISHABLE_KEY = "YOUR_PUBLISHABLE_KEY";
  
  let supabaseClient = null;
  let currentUser = null;
  let syncDebounceTimer = null;

  function initSupabase() {
    if (SUPABASE_URL === "YOUR_PROJECT_URL") {
      console.log("[Sync] Supabase not configured — running in local-only mode");
      return;
    }
    
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    
    supabaseClient.auth.onAuthStateChange((event, session) => {
      currentUser = session?.user || null;
      updateAuthUI(currentUser);
      if (currentUser && event === 'SIGNED_IN') {
        loadFromCloud();
      }
    });
    
    // Initial check
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      currentUser = session?.user || null;
      updateAuthUI(currentUser);
      if (currentUser) {
        loadFromCloud();
      }
    });
  }

  function updateAuthUI(user) {
    const signInBtn = el("auth-sign-in-btn");
    const userSection = el("auth-user");
    const avatar = el("auth-avatar");
    const nameEl = el("auth-name");

    if (user) {
      if (signInBtn) signInBtn.classList.add("hidden");
      if (userSection) userSection.classList.remove("hidden");
      if (avatar) avatar.src = "icons/icon-192.png";
      if (nameEl) nameEl.textContent = user.email?.split("@")[0] || "User";
    } else {
      if (signInBtn) signInBtn.classList.remove("hidden");
      if (userSection) userSection.classList.add("hidden");
    }
  }

  async function signInWithGoogle() {
    if (!supabaseClient) { showToast("Supabase not configured"); return; }
    const { error } = await supabaseClient.auth.signInWithOAuth({ provider: "google" });
    if (error) showToast("Sign-in failed: " + error.message);
  }

  async function signInWithEmail() {
    if (!supabaseClient) { showToast("Supabase not configured"); return; }
    const email = el("auth-email")?.value;
    const password = el("auth-password")?.value;
    if (!email || !password) { showToast("Enter email and password"); return; }
    
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      showToast("Sign-in failed: " + error.message);
    } else {
      closeAuthModal();
      showToast("Signed in!");
    }
  }

  async function signUpWithEmail() {
    if (!supabaseClient) { showToast("Supabase not configured"); return; }
    const email = el("auth-email")?.value;
    const password = el("auth-password")?.value;
    if (!email || !password) { showToast("Enter email and password"); return; }
    
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
      showToast("Sign-up failed: " + error.message);
    } else {
      closeAuthModal();
      showToast("Account created! Check your email to confirm if required.");
    }
  }

  async function signOutUser() {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signOut();
    if (!error) {
      currentUser = null;
      updateAuthUI(null);
      showToast("Signed out");
    }
  }

  function openAuthModal() {
    el("auth-modal")?.classList.remove("hidden");
  }

  function closeAuthModal() {
    el("auth-modal")?.classList.add("hidden");
  }

  let isSignUpMode = false;
  function toggleSignUpMode() {
    isSignUpMode = !isSignUpMode;
    const btn = el("auth-email-btn");
    const toggle = el("auth-signup-toggle");
    if (btn) btn.textContent = isSignUpMode ? "Create account" : "Sign in";
    if (toggle) toggle.textContent = isSignUpMode ? "Already have an account? Sign in" : "Don't have an account? Sign up";
  }

  async function syncToCloud() {
    if (!currentUser || !supabaseClient) return;
    const indicator = el("sync-indicator");
    if (indicator) indicator.classList.add("syncing");

    try {
      // Collect all character statuses to upsert
      const progressData = [];
      HANZI_DATA.forEach(h => {
        const status = getStatus(h.c);
        if (status !== "new") {
          // For simplicity, we just save the status here
          progressData.push({
            user_id: currentUser.id,
            character: h.c,
            status: status,
            attempts: 0,
            correct: 0,
            last_practiced: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
      
      // Batch upsert to Supabase
      if (progressData.length > 0) {
        const { error } = await supabaseClient
          .from("hanzi_progress")
          .upsert(progressData, { onConflict: "user_id,character" });
          
        if (error) {
           console.error("Supabase upsert error:", error);
        }
      }
    } catch(e) {
      console.warn("[Sync] Cloud save failed:", e);
    } finally {
      if (indicator) indicator.classList.remove("syncing");
    }
  }

  function debouncedSync() {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(syncToCloud, 2000);
  }

  async function loadFromCloud() {
    if (!currentUser || !supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from("hanzi_progress")
        .select("*")
        .eq("user_id", currentUser.id);
        
      if (error) throw error;
      if (!data || data.length === 0) return;
      
      data.forEach(row => {
         const current = getStatus(row.character);
         if (row.status && row.status !== current) {
           setStatusRaw(row.character, row.status);
         }
      });

      showToast("☁️ Data synced from cloud");
      renderBrowse();
      renderProgress();
      updateHeaderProgress();
      updateXPDisplay();
    } catch(e) {
      console.warn("[Sync] Cloud load failed:", e);
    }
  }

  // Helper: set status without triggering full re-render (for bulk import)
  function setStatusRaw(char, status) {
    const key = "hanzi-tracker-status";
    try {
      const all = JSON.parse(localStorage.getItem(key) || "{}");
      all[char] = status;
      localStorage.setItem(key, JSON.stringify(all));
    } catch(e) {}
  }"""

content = pattern.sub(supabase_code, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Supabase patch applied")
