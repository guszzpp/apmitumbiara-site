import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
const sb = createClient('https://yocxquqiflybgdujfatv.supabase.co', 'sb_publishable_wEq-0uV-3qlq0GfK6SfUqg_GSszMXmX', {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }
});
const $ = id => document.getElementById(id);
let records = [];
function showLogin(message = '') {
  closePasswordPanel();
  $('login-panel').hidden = false; $('courses-panel').hidden = true;
  $('cursos-status').hidden = true; $('login-error').textContent = message;
}
function showStatus(message) {
  $('login-panel').hidden = true; $('courses-panel').hidden = true;
  $('cursos-status').hidden = false; $('cursos-status').textContent = message;
}
function approved(user) {
  return Boolean(user && user.email && !user.is_anonymous);
}
function cell(tr, value, link = false, label = '') {
  const td = document.createElement('td');
  if (link) {
    const a = document.createElement('a'); a.href = value;
    a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = label || 'Acessar';
    td.append(a);
  } else { td.textContent = value; }
  tr.append(td);
}
function render() {
  const search = $('filter-text').value.trim().toLocaleLowerCase('pt-BR');
  const org = $('filter-instituicao').value;
  const list = records.filter(r => (!org || r.instituicao === org) &&
    (!search || (r.curso + ' ' + r.instituicao + ' ' + r.categoria).toLocaleLowerCase('pt-BR').includes(search)));
  $('course-count').textContent = list.length + ' curso(s) encontrado(s)';
  const root = $('courses-root'); root.replaceChildren();
  let current = '', tbody = null;
  for (const item of list) {
    const group = item.instituicao + '|' + item.categoria;
    if (group !== current) {
      current = group;
      const section = document.createElement('section'); section.className = 'cursos-group';
      const title = document.createElement('h3');
      title.textContent = item.instituicao + (item.categoria ? ' — ' + item.categoria : '');
      const scroll = document.createElement('div'); scroll.className = 'cursos-table-scroll';
      const table = document.createElement('table'); table.className = 'cursos-table';
      const thead = document.createElement('thead'); const tr = document.createElement('tr');
      for (const h of ['Curso', 'Carga horária', 'Link']) {
        const th = document.createElement('th'); th.scope = 'col'; th.textContent = h; tr.append(th);
      }
      thead.append(tr); tbody = document.createElement('tbody');
      table.append(thead, tbody); scroll.append(table); section.append(title, scroll); root.append(section);
    }
    const tr = document.createElement('tr');
    cell(tr, item.curso); cell(tr, item.carga_horaria);
    cell(tr, item.link, true, item.rotulo_link); tbody.append(tr);
  }
}
async function load() {
  showStatus('Verificando acesso…');
  const { data: { user }, error: userError } = await sb.auth.getUser();
  if (userError || !user) return showLogin();
  if (!approved(user)) {
    await sb.auth.signOut(); return showLogin('Sua conta não tem autorização de associado.');
  }
  const { data, error } = await sb.from('cursos_apmi')
    .select('instituicao,categoria,curso,carga_horaria,link,rotulo_link,ordem').order('ordem').limit(500);
  if (error) return showStatus('Não foi possível carregar os cursos. Atualize a página.');
  records = data || [];
  if (!records.length) {
    await sb.auth.signOut();
    return showLogin('Seu e-mail não está autorizado a acessar os cursos.');
  }
  $('filter-instituicao').replaceChildren(new Option('Todas as instituições', ''));
  [...new Set(records.map(x => x.instituicao))].forEach(s => $('filter-instituicao').add(new Option(s, s)));
  $('user-label').textContent = user.email || '';
  closePasswordPanel();
  $('courses-panel').hidden = false;
  $('login-panel').hidden = true; $('cursos-status').hidden = true;
  render();
}

const passwordField = $('password');
const passwordToggle = $('password-toggle');
passwordToggle.addEventListener('click', () => {
  const visible = passwordField.type === 'password';
  passwordField.type = visible ? 'text' : 'password';
  passwordToggle.setAttribute('aria-pressed', String(visible));
  passwordToggle.setAttribute('aria-label', visible ? 'Ocultar senha' : 'Mostrar senha');
  passwordToggle.title = visible ? 'Ocultar senha' : 'Mostrar senha';
});

$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const button = $('login-submit'); button.disabled = true; $('login-error').textContent = '';
  const { error } = await sb.auth.signInWithPassword({
    email: $('email').value.trim(), password: $('password').value
  });
  button.disabled = false;
  if (error) return showLogin('E-mail ou senha inválidos.');
  $('password').value = ''; await load();
});
// A alteração da senha é sempre opcional e requer uma sessão autenticada.
function closePasswordPanel() {
  $('change-password-panel').hidden = true;
  $('change-password-button').setAttribute('aria-expanded', 'false');
  $('change-password-form').reset();
  $('change-password-feedback').textContent = '';
  $('change-password-feedback').classList.remove('is-error', 'is-success');
}
$('change-password-button').addEventListener('click', () => {
  const opening = $('change-password-panel').hidden;
  closePasswordPanel();
  if (opening) {
    $('change-password-panel').hidden = false;
    $('change-password-button').setAttribute('aria-expanded', 'true');
    $('current-password').focus();
  }
});
$('cancel-password-button').addEventListener('click', closePasswordPanel);
$('change-password-form').addEventListener('submit', async event => {
  event.preventDefault();
  const oldPassword = $('current-password').value;
  const newPassword = $('new-password').value;
  const confirmed = $('confirm-password').value;
  const feedback = $('change-password-feedback');
  feedback.textContent = '';
  feedback.classList.remove('is-error', 'is-success');
  if (newPassword.length < 8) {
    feedback.textContent = 'A nova senha precisa ter pelo menos oito caracteres.';
    feedback.classList.add('is-error');
    return;
  }
  if (newPassword !== confirmed) {
    feedback.textContent = 'As duas digitações da nova senha não coincidem.';
    feedback.classList.add('is-error');
    return;
  }
  if (newPassword === oldPassword) {
    feedback.textContent = 'Escolha uma senha diferente da atual.';
    feedback.classList.add('is-error');
    return;
  }
  const submit = $('save-password-button');
  submit.disabled = true;
  try {
    const { data: { user }, error: userError } = await sb.auth.getUser();
    if (userError || !user) {
      feedback.textContent = 'Sua sessão expirou. Entre novamente para alterar a senha.';
      feedback.classList.add('is-error');
      return;
    }
    const { error } = await sb.auth.updateUser({
      password: newPassword,
      current_password: oldPassword
    });
    if (error) {
      feedback.textContent = 'Não foi possível alterar a senha. Verifique a senha atual e, se necessário, saia e entre novamente.';
      feedback.classList.add('is-error');
      return;
    }
    $('change-password-form').reset();
    feedback.textContent = 'Senha atualizada. Utilize a nova senha no próximo login.';
    feedback.classList.add('is-success');
  } catch {
    feedback.textContent = 'Não foi possível concluir a alteração. Tente novamente.';
    feedback.classList.add('is-error');
  } finally {
    submit.disabled = false;
  }
});
$('logout-button').addEventListener('click', async () => { await sb.auth.signOut(); records = []; showLogin(); });
$('filter-text').addEventListener('input', render);
$('filter-instituicao').addEventListener('change', render);
load().catch(() => showLogin('Não foi possível verificar seu acesso.'));
