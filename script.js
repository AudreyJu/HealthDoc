// Global State for Documents
let documents = [
    { name: "23andMe Genetics Summary", label: "Genetics", date: "2026-01-15", fileName: "genetics_2026.pdf" },
    { name: "Annual Blood Panel", label: "Blood Work", date: "2026-03-10", fileName: "bloodwork.pdf" }
];

// Function to switch between Home and Test pages
function showPage(pageId) {
    // Hide all page sections
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show the requested page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // Reset scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Function to calculate risk and provide recommendations
function calculateRisk() {

    // Récupération des informations
    const genetics = [...document.querySelectorAll('input[name="genetics"]:checked')]
        .map(c => c.value);

    const environment = document.getElementById("environment").value;
    const nutrition = document.getElementById("nutrition").value;
    const age = parseInt(document.getElementById("age").value);
    const smoking = document.getElementById("smoking").value;
    const activity = document.getElementById("activity").value;

    // Vérification de l'âge
    if (isNaN(age) || age < 1 || age > 120) {
        alert("Please enter a valid age.");
        return;
    }

    let score = genetics.length;
    const tips = [];

    // Génétique
    if (genetics.includes("Diabetes"))
        tips.push("Limit sugar and get your blood glucose checked every year.");

    if (genetics.includes("Hypertension"))
        tips.push("Reduce salt and monitor your blood pressure regularly.");

    if (genetics.includes("Cardiovascular"))
        tips.push("Exercise 30 minutes a day and avoid smoking.");

    if (genetics.includes("Lactose"))
        tips.push("Choose lactose-free products and keep a food diary.");

    // Environnement
    if (environment === "Urban") {
        score += 1;
        tips.push("Avoid exercising near busy roads and use green spaces.");
    }

    if (environment === "Rural")
        tips.push("Enjoy the clean air: walk or cycle outdoors.");

    // Alimentation
    if (nutrition === "Processed") {
        score += 2;
        tips.push("Replace processed food with fresh fruit and vegetables.");
    }

    if (nutrition === "Mediterranean" || nutrition === "PlantBased")
        score -= 1;

    // Age
    if (age >= 50) {
        score += 1;
        tips.push("Schedule regular check-ups: blood pressure, cholesterol and glucose.");
    }
    else if (age < 18) {
        tips.push("Build healthy habits now: balanced meals and daily movement.");
    }

    // Tabac
    if (smoking !== "No") {
        score += 2;
        tips.push("Quitting smoking is the best way to protect your heart and lungs.");
    }

    // Activité physique
    if (activity === "Low") {
        score += 1;
        tips.push("Try to walk 30 minutes a day, even in small sessions.");
    }


    if (activity === "High")
        score -= 1;

    // Niveau de risque
    const badge = document.getElementById("riskBadge");

    if (score <= 3) {
        badge.textContent = "Low risk";
        badge.style.background = "#ccfbf1";
    }
    else if (score <= 8) {
        badge.textContent = "Moderate risk";
        badge.style.background = "#fef3c7";
    }
    else {
        badge.textContent = "High risk";
        badge.style.background = "#fecaca";
    }

    // Affichage des recommandations
    document.getElementById("recommendationsList").innerHTML =
        "<ul>" + tips.map(t => "<li>" + t + "</li>").join("") + "</ul>";

    document.getElementById("resultsCard").classList.remove("hidden");
}

// Function to save consent preferences
function saveConsent(event) {
    event.preventDefault();
    const authorized = [...document.querySelectorAll('input[name="authorized"]:checked')].map(c => c.value);
    const doctor = document.getElementById('specificDoctor').value;

    const statusMsg = document.getElementById('consentStatus');
    statusMsg.classList.remove('hidden');
    statusMsg.innerHTML = `✅ Preferences saved! Your medical data is authorized to be shared with: <strong>${authorized.length > 0 ? authorized.join(', ') : 'None'}</strong> ${doctor ? `(and ${doctor})` : ''}.`;
}

// Function to add a new document
function addDocument(event) {
    event.preventDefault();
    const name = document.getElementById('docName').value;
    const label = document.getElementById('docLabel').value;
    const fileInput = document.getElementById('docFile');
    const fileName = fileInput.files[0] ? fileInput.files[0].name : "document.pdf";
    const date = new Date().toISOString().split('T')[0];

    documents.push({ name, label, date, fileName });
    
    // Reset form & re-render
    document.getElementById('docForm').reset();
    renderDocuments(documents);
}

// Function to render documents in the list
function renderDocuments(docArray) {
    const list = document.getElementById('documentList');
    if (docArray.length === 0) {
        list.innerHTML = `<p class="empty-msg">No documents found matching your search.</p>`;
        return;
    }

    list.innerHTML = docArray.map((doc, index) => `
        <div class="doc-item">
            <div class="doc-header">
                <span class="doc-icon">📄</span>
                <div>
                    <h4 class="doc-title">${doc.name}</h4>
                    <span class="doc-date">Uploaded: ${doc.date} (${doc.fileName})</span>
                </div>
            </div>
            <span class="tag tag-${doc.label.toLowerCase().replace(/\s+/g, '')}">${doc.label}</span>
        </div>
    `).join('');
}

// Function to filter documents based on search input
function filterDocuments() {
    const searchTerm = document.getElementById('docSearch').value.toLowerCase();
    const filtered = documents.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm) || 
        doc.label.toLowerCase().includes(searchTerm)
    );
    renderDocuments(filtered);
}