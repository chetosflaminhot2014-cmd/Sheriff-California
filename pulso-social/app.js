const $ = s => document.querySelector(s);
const checks = [...document.querySelectorAll('#signals input')];
const STORAGE_KEY = 'pulsoSocial.history.v1';
let imageFile = null, timer, historyItems = [], historyMode = 'history';

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('show'), 2500);
}
function selected() { return checks.filter(x => x.checked).map(x => x.value); }
function update() {
  const n = selected().length;
  $('#count').textContent = n + ' seleccionada' + (n === 1 ? '' : 's');
  $('#hint').textContent = n >= 3 ? n + ' señales · listo para analizar.' : n + ' señales · marca al menos 3 para comenzar.';
  $('#go').disabled = n < 3;
}
checks.forEach(x => x.addEventListener('change', update));
update();

function loadHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    historyItems = Array.isArray(stored) ? stored : [];
  } catch { historyItems = []; }
}
function persistHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historyItems.slice(0, 30)));
  } catch { toast('No se pudo guardar: el almacenamiento del navegador está lleno.'); }
}
function makeButton(label, className, action) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', action);
  return button;
}
function renderHistory() {
  const list = $('#historyList');
  if (!list) return;
  list.replaceChildren();
  const visible = historyMode === 'favorites'
    ? historyItems.map(entry => ({...entry, messages: entry.messages.filter(m => m.favorite)})).filter(entry => entry.messages.length)
    : historyItems;
  $('#historyCount').textContent = historyMode === 'favorites'
    ? historyItems.reduce((n, entry) => n + entry.messages.filter(m => m.favorite).length, 0) + ' favoritos'
    : historyItems.length + ' sesiones';
  $('#historyEmpty').hidden = visible.length > 0;
  visible.forEach(entry => {
    const section = document.createElement('article');
    section.className = 'history-entry';
    const head = document.createElement('div');
    head.className = 'history-entry-head';
    const meta = document.createElement('div');
    const date = document.createElement('small');
    date.textContent = new Date(entry.createdAt).toLocaleString('es-MX', {dateStyle:'medium', timeStyle:'short'});
    const detail = document.createElement('p');
    detail.textContent = entry.detail ? 'Detalle: ' + entry.detail : 'Intereses: ' + entry.signals.join(', ');
    meta.append(date, detail);
    head.append(meta);
    section.append(head);
    entry.messages.forEach(message => {
      const item = document.createElement('div');
      item.className = 'history-message';
      const p = document.createElement('p');
      p.textContent = message.text;
      const actions = document.createElement('div');
      actions.className = 'history-actions';
      actions.append(
        makeButton('Copiar', 'mini-action', () => copy(message.text)),
        makeButton(message.favorite ? '★ Favorito' : '☆ Guardar', 'mini-action favorite-action', () => {
          const original = historyItems.find(x => x.id === entry.id);
          const target = original?.messages.find(x => x.id === message.id);
          if (!target) return;
          target.favorite = !target.favorite;
          persistHistory();
          renderHistory();
          toast(target.favorite ? 'Añadido a favoritos.' : 'Quitado de favoritos.');
        })
      );
      item.append(p, actions);
      section.append(item);
    });
    list.append(section);
  });
}
function copy(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast('Copiado.')).catch(() => fallbackCopy(text));
  } else fallbackCopy(text);
}
function fallbackCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  document.body.append(area);
  area.select();
  try { document.execCommand('copy'); toast('Copiado.'); }
  catch { toast('No se pudo copiar.'); }
  area.remove();
}
function saveSession(data, payload) {
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
    detail: payload.detail || '',
    signals: payload.signals.map(value => checks.find(x => x.value === value)?.parentElement?.textContent.trim() || value),
    messages: data.messages.slice(0, 3).map((text, i) => ({
      id: i + '-' + Date.now().toString(36),
      text: String(text),
      favorite: false
    }))
  };
  historyItems.unshift(entry);
  historyItems = historyItems.slice(0, 30);
  persistHistory();
  renderHistory();
}
function b64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

$('#image').addEventListener('change', () => {
  const file = $('#image').files[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    toast('Usa JPG, PNG o WEBP de menos de 5 MB.');
    $('#image').value = '';
    return;
  }
  imageFile = file;
  $('#preview').hidden = false;
  $('#preview').replaceChildren();
  const img = document.createElement('img');
  img.alt = 'Vista previa';
  img.style.cssText = 'width:52px;height:52px;object-fit:cover;border-radius:8px;margin-top:10px';
  img.src = URL.createObjectURL(file);
  $('#preview').append(img, makeButton('Quitar imagen ×', 'message button', () => {
    imageFile = null;
    $('#image').value = '';
    $('#preview').hidden = true;
  }));
});

$('#go').addEventListener('click', async () => {
  const signals = selected();
  if (signals.length < 3) return;
  const button = $('#go');
  button.disabled = true;
  button.firstChild.textContent = 'Analizando…';
  $('#empty').hidden = true;
  $('#results').hidden = true;
  $('#loading').hidden = false;
  try {
    const payload = {
      name: $('#name').value.trim(),
      signals,
      detail: $('#detail').value.trim(),
      tone: $('#tone').value,
      style: $('#style').value
    };
    if (imageFile) payload.image = {name:imageFile.name, type:imageFile.type, data:await b64(imageFile)};
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); }
    catch { throw new Error('El servidor no devolvió JSON. Revisa que el backend Node.js de Render use la carpeta pulso-social y el comando npm start.'); }
    if (!response.ok) throw new Error(data.error || 'No se pudo analizar.');
    if (!Array.isArray(data.messages) || data.messages.length < 3) throw new Error('La IA no devolvió tres mensajes válidos. Inténtalo otra vez.');
    $('#analysis').textContent = data.analysis || '';
    const box = $('#messages');
    box.replaceChildren();
    data.messages.slice(0, 3).forEach((message, index) => {
      const card = document.createElement('article');
      card.className = 'message';
      const label = document.createElement('small');
      label.textContent = 'OPCIÓN 0' + (index + 1);
      const paragraph = document.createElement('p');
      paragraph.textContent = message;
      card.append(label, paragraph, makeButton('Copiar mensaje ⧉', '', () => copy(message)));
      box.append(card);
    });
    saveSession(data, payload);
    $('#results').hidden = false;
    toast('Mensajes listos. Se guardaron en tu historial.');
  } catch (error) {
    toast(error.message || 'Error de conexión.');
    $('#empty').hidden = false;
  } finally {
    $('#loading').hidden = true;
    button.disabled = selected().length < 3;
    button.firstChild.textContent = 'Crear mis mensajes';
  }
});
$('#copyAll').addEventListener('click', () => copy([...document.querySelectorAll('#messages p')].map((p, i) => (i + 1) + '. ' + p.textContent).join('\n\n')));
$('#showHistory').addEventListener('click', () => {
  historyMode = 'history';
  $('#showHistory').classList.add('active');
  $('#showFavorites').classList.remove('active');
  renderHistory();
});
$('#showFavorites').addEventListener('click', () => {
  historyMode = 'favorites';
  $('#showFavorites').classList.add('active');
  $('#showHistory').classList.remove('active');
  renderHistory();
});
$('#clearHistory').addEventListener('click', () => {
  if (!historyItems.length) return toast('El historial ya está vacío.');
  if (!confirm('¿Borrar todo el historial y los favoritos guardados en este dispositivo?')) return;
  historyItems = [];
  persistHistory();
  renderHistory();
  toast('Historial borrado.');
});
loadHistory();
renderHistory();
