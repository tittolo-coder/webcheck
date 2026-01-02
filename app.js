const sitesContainer = document.getElementById('sites-container');
const monthDisplay = document.getElementById('current-month');

// Stato locale dell'applicazione
let state = { lastUpdate: new Date().getMonth(), sites: [] };

// Recupero il client Supabase inizializzato nell'index
const db = window.dbClient;

// --- FUNZIONI DI COMUNICAZIONE CLOUD ---

async function loadData() {
    try {
        const { data, error } = await db
            .from('webcheck')
            .select('data')
            .eq('id', 1)
            .single();

        if (data) {
            state = data.data;
            checkMonthlyReset();
            render();
        } else {
            // Se il database è vuoto (prima installazione), crea il record iniziale
            console.log("Inizializzazione database...");
            await db.from('webcheck').insert([{ id: 1, data: state }]);
            render();
        }
    } catch (err) {
        console.error("Errore di caricamento:", err);
        sitesContainer.innerHTML = `<p class="text-red-500 text-center">Errore di connessione. Verifica la tabella 'webcheck' su Supabase.</p>`;
    }
}

async function saveToCloud() {
    const { error } = await db
        .from('webcheck')
        .update({ data: state })
        .eq('id', 1);
    
    if (error) {
        console.error("Errore durante il salvataggio:", error);
    }
    render();
}

// --- LOGICA APPLICATIVA ---

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

    if (state.sites.length === 0) {
        sitesContainer.innerHTML = `<p class="text-center text-gray-400 mt-10 italic">Nessun sito presente. Clicca sul tasto + in basso.</p>`;
        return;
    }

    sitesContainer.innerHTML = state.sites.map((site, sIdx) => `
        <div class="bg-white rounded-xl shadow-sm p-4 border-l-4 ${getStatusColor(site)} transition-all">
            <div class="flex justify-between items-center mb-3">
                <h2 class="font-bold text-lg text-gray-800">${site.name}</h2>
                <button onclick="removeSite(${sIdx})" class="text-red-300 hover:text-red-500 text-sm transition-colors">Elimina</button>
            </div>
            <div class="grid grid-cols-1 gap-2 mb-4">
                ${site.tasks.map((task, tIdx) => `
                    <label class="flex items-center space-x-3 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} 
                            onchange="toggleTask(${sIdx}, ${tIdx})"
                            class="w-5 h-5 text-blue-600 rounded border-gray-300">
                        <span class="${task.completed ? 'line-through text-gray-400' : 'text-gray-700'} font-medium text-sm">${task.name}</span>
                    </label>
                `).join('')}
            </div>
            <textarea 
                oninput="updateNotes(${sIdx}, this.value)"
                placeholder="Note libere (es. credenziali, scadenze...)"
                class="w-full p-2 text-sm bg-blue-50 border-none rounded-lg focus:ring-2 focus:ring-blue-100 outline-none resize-none placeholder-blue-300"
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

// --- AZIONI UTENTE (WINDOW PER SCOPE GLOBALE) ---

window.toggleTask = (sIdx, tIdx) => {
    state.sites[sIdx].tasks[tIdx].completed = !state.sites[sIdx].tasks[tIdx].completed;
    saveToCloud();
};

window.updateNotes = (sIdx, value) => {
    state.sites[sIdx].notes = value;
    clearTimeout(window.noteTimeout);
    window.noteTimeout = setTimeout(() => {
        saveToCloud();
    }, 1000); 
};

window.removeSite = (idx) => {
    if(confirm('Sei sicuro di voler eliminare questo sito e i relativi dati di manutenzione?')) {
        state.sites.splice(idx, 1);
        saveToCloud();
    }
};

document.getElementById('add-site-btn').onclick = () => {
    const name = prompt("Inserisci il nome o l'URL del sito:");
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

// --- AVVIO ---
document.addEventListener('DOMContentLoaded', loadData);