
function calculateRisk() {

    // À ajouter au début de la fonction calculateRisk() dans script.js pour récupérer la date choisie (ou mettre aujourd'hui par défaut)
    const dateInput = document.getElementById("assessmentDate").value;
    const assessmentDate = dateInput ? new Date(dateInput).toLocaleDateString() : new Date().toLocaleDateString();
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
    else if (score <= 7) {
        badge.textContent = "Moderate risk";
        badge.style.background = "#fef3c7";
    }
    else {
        badge.textContent = "High risk";
        badge.style.background = "#fecaca";
    }

    document.getElementById("recommendationsList").innerHTML =
        "<ul>" + tips.map(t => "<li>" + t + "</li>").join("") + "</ul>";

    document.getElementById("resultsCard").classList.remove("hidden");
        const record = {
        date: assessmentDate,
        score: score,
        geneticsCount: genetics.length,
        environment: environment,
        nutrition: nutrition,
        age: age,
        smoking: smoking,
        activity: activity,
        riskLevel: badge.textContent
    };

    let history = JSON.parse(localStorage.getItem("healthDocHistory")) || [];
    history.push(record);
    localStorage.setItem("healthDocHistory", JSON.stringify(history));
}

// Script pour initialiser automatiquement le champ date du jour au chargement de la page (à ajouter dans un script ou dans script.js)
document.addEventListener("DOMContentLoaded", () => {
    const dateField = document.getElementById("assessmentDate");
    if (dateField) {
        const today = new Date().toISOString().split('T')[0];
        dateField.value = today;
    }
});