const sitesContainer = document.getElementById('sites-container');
const monthDisplay = document.getElementById('current-month');

// Stato dell'app
let state = JSON.parse(localStorage.getItem('webCheckData')) || {
    lastUpdate: new Date().getMonth(),
    sites: []
};

// Controllo reset mensile
const checkMonthlyReset = () => {
    const currentMonth = new Date().getMonth();
    if (state.lastUpdate !== currentMonth) {
        state.sites.forEach(site => {
            site.tasks.forEach(t => t.completed = false);
        });
        state.lastUpdate = currentMonth;
        save();
    }
};

const save = () => {
    localStorage.setItem('webCheckData', JSON.stringify(state));
    render();
};

const render = () => {
    const months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    monthDisplay.innerText = `Manutenzione di ${months[new Date().getMonth()]}`;

    sitesContainer.innerHTML = state.sites.map((site, sIdx) => `
        <div class="bg-white rounded-xl shadow-sm p-4 border-l-4 ${getStatusColor(site)}">
            <div class="flex justify-between items-center mb-3">
                <h2 class="font-bold text-lg">${site.name}</h2>
                <button onclick="removeSite(${sIdx})" class="text-red-400 text-sm">Elimina</button>
            </div>
            <div class="grid grid-cols-1 gap-2">
                ${site.tasks.map((task, tIdx) => `
                    <label class="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} 
                            onchange="toggleTask(${sIdx}, ${tIdx})"
                            class="w-5 h-5 text-blue-600">
                        <span class="${task.completed ? 'line-through text-gray-400' : ''}">${task.name}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');
};

const getStatusColor = (site) => {
    const done = site.tasks.filter(t => t.completed).length;
    if (done === 0) return 'border-red-500';
    if (done === site.tasks.length) return 'border-green-500';
    return 'border-yellow-500';
};

// Funzioni API
window.toggleTask = (sIdx, tIdx) => {
    state.sites[sIdx].tasks[tIdx].completed = !state.sites[sIdx].tasks[tIdx].completed;
    save();
};

window.removeSite = (idx) => {
    if(confirm('Eliminare questo sito?')) {
        state.sites.splice(idx, 1);
        save();
    }
};

document.getElementById('add-site-btn').onclick = () => {
    const name = prompt("Nome del sito:");
    if (name) {
        state.sites.push({
            name,
            tasks: [
                {name: "Backup Database", completed: false},
                {name: "Update Core/Plugin", completed: false},
                {name: "Check Sicurezza", completed: false},
                {name: "Test Velocità", completed: false}
            ]
        });
        save();
    }
};

checkMonthlyReset();
render();