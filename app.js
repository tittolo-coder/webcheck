const sitesContainer = document.getElementById('sites-container');
const monthDisplay = document.getElementById('current-month');
let state = { lastUpdate: new Date().getMonth(), sites: [] };

// 1. CARICA DATI DAL CLOUD
async function loadData() {
    const { data, error } = await supabase
        .from('webcheck')
        .select('data')
        .eq('id', 1) // Usiamo l'ID 1 come record unico per i tuoi siti
        .single();

    if (data) {
        state = data.data;
        checkMonthlyReset();
        render();
    } else {
        // Se non esiste il record ID 1, lo creiamo
        await supabase.from('webcheck').insert([{ id: 1, data: state }]);
        render();
    }
}

// 2. SALVA DATI NEL CLOUD
async function saveToCloud() {
    await supabase
        .from('webcheck')
        .update({ data: state })
        .eq('id', 1);
    render();
}

// Controllo reset mensile
const checkMonthlyReset = () => {
    const currentMonth = new Date().getMonth();
    if (state.lastUpdate !== currentMonth) {
        state.sites.forEach(site => {
            site.tasks.forEach(t => t.completed = false);
        });
        state.lastUpdate = currentMonth;
        saveToCloud();
    }
};

const render = () => {
    const months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    monthDisplay.innerText = `Manutenzione di ${months[new Date().getMonth()]}`;

    sitesContainer.innerHTML = state.sites.map((site, sIdx) => `
        <div class="bg-white rounded-xl shadow-sm p-4 border-l-4 ${getStatusColor(site)} mb-4">
            <div class="flex justify-between items-center mb-3">
                <h2 class="font-bold text-lg">${site.name}</h2>
                <button onclick="removeSite(${sIdx})" class="text-red-400 text-sm">Elimina</button>
            </div>
            <div class="grid grid-cols-1 gap-2 mb-4">
                ${site.tasks.map((task, tIdx) => `
                    <label class="flex items-center space-x-3 p-2 bg-gray-50 rounded cursor-pointer">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} 
                            onchange="toggleTask(${sIdx}, ${tIdx})"
                            class="w-5 h-5 text-blue-600">
                        <span class="${task.completed ? 'line-through text-gray-400' : ''}">${task.name}</span>
                    </label>
                `).join('')}
            </div>
            <textarea 
                oninput="updateNotes(${sIdx}, this.value)"
                placeholder="Note libere..."
                class="w-full p-2 text-sm bg-blue-50 rounded-lg outline-none border-none"
                rows="2">${site.notes || ''}</textarea>
        </div>
    `).join('');
};

const getStatusColor = (site) => {
    const done = site.tasks.filter(t => t.completed).length;
    if (done === 0) return 'border-red-500';
    if (done === site.tasks.length) return 'border-green-500';
    return 'border-yellow-500';
};

// Funzioni Globali
window.toggleTask = (sIdx, tIdx) => {
    state.sites[sIdx].tasks[tIdx].completed = !state.sites[sIdx].tasks[tIdx].completed;
    saveToCloud();
};

window.updateNotes = (sIdx, value) => {
    clearTimeout(window.noteTimeout);
    window.noteTimeout = setTimeout(() => {
        state.sites[sIdx].notes = value;
        saveToCloud();
    }, 1000); // Salva dopo 1 secondo che hai smesso di scrivere
};

window.removeSite = (idx) => {
    if(confirm('Eliminare il sito?')) {
        state.sites.splice(idx, 1);
        saveToCloud();
    }
};

document.getElementById('add-site-btn').onclick = () => {
    const name = prompt("Nome del sito:");
    if (name) {
        state.sites.push({
            name,
            notes: "",
            tasks: [
                {name: "Backup Database", completed: false},
                {name: "Backup Spazio Web", completed: false},
                {name: "Update Core/Plugin", completed: false},
                {name: "Check Sicurezza", completed: false},
                {name: "Test Velocità", completed: false}
            ]
        });
        saveToCloud();
    }
};

// Avvio
loadData();