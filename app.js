const sitesContainer = document.getElementById('sites-container');
const monthDisplay = document.getElementById('current-month');
let state = { lastUpdate: new Date().getMonth(), sites: [] };

// Usiamo il client inizializzato nell'index
const db = window.supabaseClient;

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
            await db.from('webcheck').insert([{ id: 1, data: state }]);
            render();
        }
    } catch (err) {
        console.error("Errore caricamento:", err);
    }
}

async function saveToCloud() {
    try {
        await db.from('webcheck').update({ data: state }).eq('id', 1);
        render();
    } catch (err) {
        console.error("Errore salvataggio:", err);
    }
}

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
        sitesContainer.innerHTML = '<p class="text-center text-gray-500 py-10">Nessun sito aggiunto. Clicca "+" per iniziare.</p>';
        return;
    }

    sitesContainer.innerHTML = state.sites.map((site, sIdx) => `
        <div class="bg-white rounded-xl shadow-sm p-4 border-l-4 ${getStatusColor(site)} mb-4">
            <div class="flex justify-between items-center mb-3">
                <h2 class="font-bold text-lg text-gray-800">${site.name}</h2>
                <button onclick="removeSite(${sIdx})" class="text-red-400 hover:text-red-600 text-sm">Elimina</button>
            </div>
            <div class="grid grid-cols-1 gap-2 mb-4">
                ${site.tasks.map((task, tIdx) => `
                    <label class="flex items-center space-x-3 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                        <input type="checkbox" ${task.completed ? 'checked' : ''}
                            onchange="toggleTask(${sIdx}, ${tIdx})"
                            class="w-5 h-5 text-blue-600 rounded">
                        <span class="${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}">${task.name}</span>
                    </label>
                `).join('')}
            </div>
            <textarea
                oninput="updateNotes(${sIdx}, this.value)"
                placeholder="Note libere..."
                class="w-full p-2 text-sm bg-blue-50 rounded-lg outline-none border-none focus:ring-2 focus:ring-blue-200"
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

window.toggleTask = (sIdx, tIdx) => {
    state.sites[sIdx].tasks[tIdx].completed = !state.sites[sIdx].tasks[tIdx].completed;
    saveToCloud();
};

window.updateNotes = (sIdx, value) => {
    state.sites[sIdx].notes = value;
    clearTimeout(window.noteTimeout);
    window.noteTimeout = setTimeout(() => saveToCloud(), 1000);
};

window.removeSite = (idx) => {
    if (confirm('Eliminare il sito?')) {
        state.sites.splice(idx, 1);
        saveToCloud();
    }
};

document.getElementById('add-site-btn').onclick = () => {
    const name = prompt("Inserisci il nome del sito:");
    if (name) {
        state.sites.push({
            name,
            notes: "",
            tasks: [
                { name: "Backup Database", completed: false },
                { name: "Backup Spazio Web", completed: false },
                { name: "Update Core/Plugin", completed: false },
                { name: "Check Sicurezza", completed: false },
                { name: "Test Velocità", completed: false }
            ]
        });
        saveToCloud();
    }
};

// Caricamento iniziale
if (db) { loadData(); }

// Refresh immediato
document.getElementById('refresh-btn').onclick = () => {
  showToast("Lista aggiornata");
  setTimeout(() => window.location.reload(), 300);
};

// Toast UI
function showToast(message) {
  const toast = document.createElement("div");
  toast.innerText = message;
  toast.className = "fixed top-5 right-5 px-4 py-2 rounded-lg shadow-lg text-sm bg-green-600 text-white opacity-90 z-50";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// Mostra toast al reload dell'app
window.addEventListener("load", () => {
  showToast("Lista aggiornata");
});
