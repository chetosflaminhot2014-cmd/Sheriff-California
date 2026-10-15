const $ = selector => document.querySelector(selector);
const STORAGE_KEY = 'asistenteJuan.conversations.v1';
let conversations = [], activeId = null, busy = false, toastTimer;
function toast(message) {
  const el = $('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}
function id() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function current() { return conversations.find(item => item.id === activeId); }
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, 60))); }
  catch { toast('No se pudo guardar. El almacenamiento del navegador está lleno.'); }
}
function load() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    conversations = Array.isArray(value) ? value.filter(x => x && x.id && Array.isArray(x.messages)) : [];
  } catch { conversations = []; }
  conversations.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  if (conversations.length) activeId = conversations[0].id;
}
function newConversation() {
  if (busy) return;
  activeId = null;
  renderAll();
  $('#messageInput').focus();
  $('#sidebar').classList.remove('open');
}
function renderSidebar() {
  const list = $('#conversationList'); list.replaceChildren();
  if (!conversations.length) {
    const empty = document.createElement('p'); empty.className = 'side-empty'; empty.textContent = 'Tus chats nuevos aparecerán aquí.'; list.append(empty); return;
  }
  conversations.forEach(conversation => {
    const row = document.createElement('div'); row.className = 'conversation-row' + (conversation.id === activeId ? ' active' : '');
    const open = document.createElement('button'); open.type = 'button'; open.className = 'conversation-open'; open.textContent = conversation.title || 'Nueva conversación';
    open.addEventListener('click', () => { if (busy) return; activeId = conversation.id; renderAll(); $('#sidebar').classList.remove('open'); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'conversation-delete'; remove.textContent = '×'; remove.title = 'Eliminar conversación'; remove.setAttribute('aria-label','Eliminar conversación');
    remove.addEventListener('click', () => {
      if (busy) return;
      conversations = conversations.filter(item => item.id !== conversation.id);
      if (activeId === conversation.id) activeId = conversations[0]?.id || null;
      persist(); renderAll(); toast('Conversación eliminada.');
    });
    row.append(open, remove); list.append(row);
  });
}
function addMessage(role, content) {
  const wrap = document.createElement('article'); wrap.className = 'chat-message ' + role;
  const avatar = document.createElement('div'); avatar.className = 'message-avatar'; avatar.textContent = role === 'assistant' ? 'J' : 'Tú';
  const body = document.createElement('div'); body.className = 'message-body';
  const label = document.createElement('div'); label.className = 'message-label'; label.textContent = role === 'assistant' ? 'ASISTENTE DE JUAN' : 'TÚ';
  const text = document.createElement('div'); text.className = 'message-text'; text.textContent = content;
  body.append(label, text);
  if (role === 'assistant') {
    const actions = document.createElement('div'); actions.className = 'message-actions';
    const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copiar respuesta';
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(content); toast('Respuesta copiada.'); }
      catch { const area = document.createElement('textarea'); area.value = content; document.body.append(area); area.select(); document.execCommand('copy'); area.remove(); toast('Respuesta copiada.'); }
    });
    actions.append(copy); body.append(actions);
  }
  wrap.append(avatar, body); $('#messages').append(wrap);
}
function renderAll() {
  renderSidebar();
  const conversation = current();
  $('#messages').replaceChildren();
  const hasMessages = !!conversation && conversation.messages.length > 0;
  $('#welcome').hidden = hasMessages;
  if (conversation) conversation.messages.forEach(message => addMessage(message.role, message.content));
  $('#chatArea').scrollTop = $('#chatArea').scrollHeight;
}
function setBusy(value) {
  busy = value; $('#sendButton').disabled = value; $('#messageInput').disabled = value;
  $('#typing').hidden = !value;
  if (value) $('#chatArea').scrollTop = $('#chatArea').scrollHeight;
}
async function sendMessage(raw) {
  const content = String(raw || '').trim();
  if (!content || busy) return;
  if (!activeId || !current()) {
    const now = new Date().toISOString();
    const conversation = {id:id(), title:content.slice(0,42) + (content.length > 42 ? '…' : ''), createdAt:now, updatedAt:now, messages:[]};
    conversations.unshift(conversation); activeId = conversation.id;
  }
  const conversation = current();
  conversation.messages.push({role:'user',content});
  conversation.updatedAt = new Date().toISOString();
  if (conversation.messages.filter(m => m.role === 'user').length === 1) conversation.title = content.replace(/\s+/g,' ').slice(0,42) + (content.length > 42 ? '…' : '');
  persist(); renderAll(); $('#messageInput').value = ''; resizeInput(); setBusy(true);
  try {
    const response = await fetch('/api/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:conversation.messages.slice(-20).map(m=>({role:m.role,content:m.content}))})
    });
    const rawResponse = await response.text(); let data;
    try { data = JSON.parse(rawResponse); } catch { throw new Error('El servidor no respondió correctamente. Comprueba que Render haya terminado de iniciar.'); }
    if (!response.ok) throw new Error(data.error || 'No se pudo obtener una respuesta.');
    if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('La IA devolvió una respuesta vacía. Inténtalo de nuevo.');
    conversation.messages.push({role:'assistant',content:data.reply.trim()});
    conversation.updatedAt = new Date().toISOString();
    conversations.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    persist(); renderAll();
  } catch (error) {
    // Keep the user message in the conversation so it can be retried or revisited.
    toast(error.message || 'Error de conexión con Gemini.');
  } finally { setBusy(false); $('#messageInput').focus(); }
}
function resizeInput() { const input = $('#messageInput'); input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 180) + 'px'; }
$('#chatForm').addEventListener('submit', event => { event.preventDefault(); sendMessage($('#messageInput').value); });
$('#messageInput').addEventListener('input', resizeInput);
$('#messageInput').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('#chatForm').requestSubmit(); }
});
$('#newChat').addEventListener('click', newConversation);
$('#mobileMenu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => sendMessage(button.dataset.prompt)));
$('#clearChats').addEventListener('click', () => {
  if (!conversations.length) return toast('No hay conversaciones guardadas.');
  if (!confirm('¿Borrar todas las conversaciones guardadas en este navegador?')) return;
  conversations = []; activeId = null; persist(); renderAll(); toast('Conversaciones borradas.');
});
load(); renderAll();
