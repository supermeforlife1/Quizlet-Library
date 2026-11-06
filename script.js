const subjectSelect = document.getElementById("SubjectSelect");
const searchBar = document.getElementById("searchBar");
const results = document.getElementById("quizletResults");

subjectSelect.addEventListener("change", displayQuizlets);
searchBar.addEventListener("input", displayQuizlets);
searchBar.addEventListener("focus", displayQuizlets);

// Close the dropdown when clicking outside the search area (but not on the subject select)
document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container") && e.target !== subjectSelect) {
        results.style.display = "none";
    }
});

function displayQuizlets() {
    const selectedSubject = subjectSelect.value;
    const searchTerm = searchBar.value.toLowerCase().trim();

    results.replaceChildren();

    // Only require a subject. An empty search shows everything in that subject.
    if (!selectedSubject) {
        results.style.display = "none";
        return;
    }

    const filteredQuizlets = quizlets.filter(quizlet => {
        const matchesSubject = quizlet.subject === selectedSubject;
        const matchesSearch = quizlet.title.toLowerCase().includes(searchTerm);
        return matchesSubject && matchesSearch;
    });

    filteredQuizlets.sort((a, b) => {
        return a.title.toLowerCase().indexOf(searchTerm) -
               b.title.toLowerCase().indexOf(searchTerm);
    });

    if (filteredQuizlets.length === 0) {
        const message = document.createElement("div");
        message.textContent = "No matching Quizlets found.";
        message.style.padding = "12px";
        results.appendChild(message);
        results.style.display = "block";
        return;
    }

    filteredQuizlets.forEach(quizlet => {
        const link = document.createElement("a");
        link.href = quizlet.url;
        link.textContent = quizlet.title;
        results.appendChild(link);
    });

    results.style.display = "block";
}

const confirmDialog = document.getElementById("confirmDialog");
const stayBtn = document.getElementById("stayBtn");
const continueBtn = document.getElementById("continueBtn");

let pendingUrl = "";


results.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    e.preventDefault();
    pendingUrl = link.href;
    confirmDialog.showModal();
});

stayBtn.addEventListener("click", () => {
    confirmDialog.close();
});

continueBtn.addEventListener("click", () => {
    confirmDialog.close();
    window.location.href = pendingUrl;
});

// Clicking the dark area outside the box also counts as "Stay"
confirmDialog.addEventListener("click", (e) => {
    if (e.target === confirmDialog) {
        confirmDialog.close();
    }
});



// const quizlets = [
//     {
//         title: "History Unit 1 Review",
//         subject: "history",
//         url: "QUIZLET_LINK"
//     },
//     {
//         title: "History Unit 2 Vocabulary",
//         subject: "history",
//         url: "QUIZLET_LINK"
//     },
//     {
//         title: "Chemistry Final",
//         subject: "science",
//         url: "https://quizlet.com/1186960817/chemistry-final-flash-cards/"
//     },
//     {
//         title: "Chemistry 1",
//         subject: "science",
//         url: "https://quizlet.com/1186960817/chemistry-final-flash-cards/"
//     },
//     {
//         title: "Chemistry 4",
//         subject: "science",
//         url: "https://quizlet.com/1186960817/chemistry-final-flash-cards/"
//     },
//     {
//         title: "Chemistry 3",
//         subject: "science",
//         url: "https://quizlet.com/1186960817/chemistry-final-flash-cards/"
//     },
//     {
//         title: "Algebra Review",
//         subject: "math",
//         url: "QUIZLET_LINK"
//     }
// ];

const SUPABASE_URL = "https://wxoramxooliutqfixxlm.supabase.co";
const SUPABASE_KEY = "sb_publishable_qBpw3GuwugmxOgrvomQO1w_QCDFTmDW"; // the anon / publishable key, NOT the service_role key

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let quizlets = [];

async function loadQuizlets() {
    const { data, error } = await db.from("quizlets").select("*");
    if (error) {
        console.error(error);
        return;
    }
    quizlets = data;
    displayQuizlets();
}

loadQuizlets();
