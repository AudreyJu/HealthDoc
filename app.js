function calculateRisk() {
    // Gather user input
    const selectedGenetics = Array.from(document.querySelectorAll('input[name="genetics"]:cheked')).map(el =>el.value);
    const environment = document.getElementById('environment').value;
    const nutrition = document.getElementById('nutrition').value;

    let score = 0;
    let recommendations = [];

    // Rule-Based Prevention Engine
    if (selectedGenetics.includes('Diabetes')) {
        score += 2;
        if(nutrition === 'Processed') {
            recommendations.push({
                type: 'danger',
                title: 'High Diabetes Predisposition Triggered',
                text: 'Your high-sugar diet heavily amplifies your genetic risk for Type 2 Diabetes. Action: Transition immediately to a low-glycemic, high-fiber eating pattern to stabilize insulin sensitivity.'
            });
        }else
        recommendations.push({
            type: 'success',
            title: 'Diabetes Risk Suppressed',
            text: 'Great job! Your current nutritional choices successfully counterbalance your genetic predisposition toward insulin resistance.'
        });
    }

    if (selectedGenetics.includes('Cardiovascular') || selectedGenetics.includes('Hypertension')) {
        score += 2;
        if (environment === 'Urban') {
            recommendations.push({
                type: 'danger',
                title: 'Cardiovascular & Environmental Pollution Risk',
                text: 'Urban particulate matter combined with your vascular predisposition increases heart strain. Action: Avoid high-traffic outdoor exercise during rush hour and consider installing HEPA air filters at home.'
            });
        } else {
            recommendations.push({
                type: 'success',
                title: 'Cardiovascular Environment Neutralized',
                text: 'Your living environment helps mitigate cardiovascular stress. Maintain regular aerobic exercise tailored to your heart rate zone.'
            });
        }
    }

    if (recommendations.length === 0) {
        recommendations.push({
            type: 'success',
            title: 'Optimal Health Alignment',
            text: 'Your genetics, diet, and environment show low risk collision. Maintain your current lifestyle habits and check back annually.'
        });
    }

    // Render results on screen
    const resultsCard = document.getElementById('resultsCard');
    const riskBadge = document.getElementById('riskBadge');
    const listContainer =  document.getElementById('recommendationsList');

    resultsCard.classList.remove('hidden');

    // Set badge appearance based on score
    if(score >= 3) {
        riskBadge.innerText = "Elevated Risk Profile"
    } else if(score > 0) {
        riskBadge.innerText = "Moderate Risk Profile"
    } else {
        riskBadge.innerText = "Low Risk Profile"
    }

    // Build recommendation Card
    listContainer.innerHTML = '';
    recommendations.forEach(rec => {
        const bgClass = rec.type === 'danger'? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900';
        const icon = rec.type === 'danger' ? '⚠️' : '✅';

        listContainer.innerHTML += `
            <div class="p-4 rounded-xl border ${bgClass}">
                <div class="flex items-center space-x-2 font-semibold mb-1">
                    <span>${icon}</span>
                    <h4>${rec.title}</h4>
                </div>
                <p class="text-sm opacity-90">${rec.text}</p>
            </div>
        `;
    })

    // Smooth scroll down to results
    resultsCard.scrollIntoView({behavior: 'smooth'});
}