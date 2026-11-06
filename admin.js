const SUPABASE_URL = "https://wxoramxooliutqfixxlm.supabase.co";
const SUPABASE_KEY = "sb_publishable_qBpw3GuwugmxOgrvomQO1w_QCDFTmDW";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const loginForm = document.getElementById("loginForm");
const addForm = document.getElementById("addForm");
const statusMsg = document.getElementById("statusMsg");
const logoutBtn = document.getElementById("logoutBtn");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const manageSection = document.getElementById("manageSection");
const quizletList = document.getElementById("quizletList");
const adminSearch = document.getElementById("adminSearch");

let editingId = null;
let allQuizlets = [];

async function checkSession() {
    const { data } = await db.auth.getSession();
    const loggedIn = !!data.session;
    loginForm.style.display = loggedIn ? "none" : "flex";
    addForm.style.display = loggedIn ? "flex" : "none";
    manageSection.style.display = loggedIn ? "block" : "none";
    if (loggedIn) loadList();
}

// ---------- Load and show the list ----------
async function loadList() {
    const { data, error } = await db
        .from("quizlets")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        quizletList.textContent = "Couldn't load quizlets: " + error.message;
        return;
    }
    allQuizlets = data;
    renderList();
}

function renderList() {
    const term = adminSearch.value.toLowerCase().trim();
    const shown = allQuizlets.filter(q => q.title.toLowerCase().includes(term));

    quizletList.replaceChildren();

    if (shown.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No quizlets found.";
        quizletList.appendChild(empty);
        return;
    }

    shown.forEach(q => {
        const row = document.createElement("div");
        row.className = "admin-item";

        const info = document.createElement("div");
        info.className = "admin-item-info";

        const name = document.createElement("strong");
        name.textContent = q.title;

        const meta = document.createElement("span");
        meta.textContent = q.subject;
        meta.className = "admin-item-subject";

        info.append(name, meta);

        const actions = document.createElement("div");
        actions.className = "admin-item-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn btn-secondary";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => startEdit(q));

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn btn-danger";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteQuizlet(q));

        actions.append(editBtn, deleteBtn);
        row.append(info, actions);
        quizletList.appendChild(row);
    });
}

adminSearch.addEventListener("input", renderList);

// ---------- Edit ----------
function startEdit(q) {
    editingId = q.id;
    document.getElementById("title").value = q.title;
    document.getElementById("subject").value = q.subject;
    document.getElementById("url").value = q.url;

    formTitle.textContent = "Edit Quizlet";
    submitBtn.textContent = "Save changes";
    cancelEditBtn.style.display = "block";
    statusMsg.textContent = "";

    addForm.scrollIntoView({ behavior: "smooth" });
}

function stopEdit() {
    editingId = null;
    addForm.reset();
    formTitle.textContent = "Add a Quizlet";
    submitBtn.textContent = "Add quizlet";
    cancelEditBtn.style.display = "none";
}

cancelEditBtn.addEventListener("click", () => {
    stopEdit();
    statusMsg.textContent = "";
});

// ---------- Delete ----------
async function deleteQuizlet(q) {
    if (!confirm(`Delete "${q.title}"? This can't be undone.`)) return;

    const { data, error } = await db
        .from("quizlets")
        .delete()
        .eq("id", q.id)
        .select();

    if (error) {
        statusMsg.textContent = "Error: " + error.message;
        return;
    }
    if (!data || data.length === 0) {
        statusMsg.textContent = "Nothing was deleted. Check that you're logged in and the delete policy exists.";
        return;
    }

    if (editingId === q.id) stopEdit();
    statusMsg.textContent = "Deleted.";
    loadList();
}

// ---------- Login / logout ----------
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { error } = await db.auth.signInWithPassword({
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    });
    if (error) {
        alert("Login failed: " + error.message);
        return;
    }
    loginForm.reset();
    checkSession();
});

logoutBtn.addEventListener("click", async () => {
    await db.auth.signOut();
    statusMsg.textContent = "";
    stopEdit();
    checkSession();
});

// ---------- Add or save ----------
addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusMsg.textContent = editingId ? "Saving..." : "Adding...";

    const values = {
        title: document.getElementById("title").value.trim(),
        subject: document.getElementById("subject").value,
        url: document.getElementById("url").value.trim()
    };

    let error;
    let changed = true;

    if (editingId) {
        const result = await db
            .from("quizlets")
            .update(values)
            .eq("id", editingId)
            .select();
        error = result.error;
        changed = result.data && result.data.length > 0;
    } else {
        const result = await db.from("quizlets").insert(values);
        error = result.error;
    }

    if (error) {
        statusMsg.textContent = "Error: " + error.message;
        return;
    }
    if (!changed) {
        statusMsg.textContent = "Nothing was saved. Check that you're logged in and the update policy exists.";
        return;
    }

    statusMsg.textContent = editingId ? "Saved!" : "Added!";
    stopEdit();
    loadList();
});

checkSession();