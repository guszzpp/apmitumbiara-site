import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
const sb = createClient('https://yocxquqiflybgdujfatv.supabase.co', 'sb_publishable_wEq-0uV-3qlq0GfK6SfUqg_GSszMXmX', {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
});
const $ = id => document.getElementById(id);
let records = [];
function hideAccessPanels() {
  $('login-panel').hidden = true;
  $('email-panel').hidden = true;
  $('set-password-panel').hidden = true;
  $('courses-panel').hidden = true;
  $('cursos-status').hidden = true;
}
function showLogin(message = '') {
  closePasswordPanel();
  hideAccessPanels();
  $('login-panel').hidden = false;
  $('login-error').textContent = message;
}
function showStatus(message) {
  hideAccessPanels();
  $('cursos-status').hidden = false;
  $('cursos-status').textContent = message;
}
function showEmailPanel(mode) {
  hideAccessPanels();
  $('email-panel').hidden = false;
  $('email-request-feedback').textContent = '';
  $('email-request-feedback').classList.remove('is-error', 'is-success');
  $('email-request-form').reset();
  $('email-panel-title').textContent = mode === 'recover' ? 'Recuperar senha' : 'Primeiro acesso';
  $('email-panel-description').textContent = mode === 'recover'
    ? 'Informe seu e-mail de cadastro para receber um link que permitirá escolher outra senha.'
    : 'Informe o e-mail cadastrado na APMI para receber um link seguro e definir sua senha.';
  $('access-email').value = $('email').value.trim();
  $('access-email').focus();
}
function firstAccessLinkPending() {
  return new URLSearchParams(window.location.search).get('definir_senha') === '1';
}
function clearAccessLink() {
  if (firstAccessLinkPending()) window.history.replaceState(null, '', '/cursos.html');
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
  if (userError || !user) {
    if (firstAccessLinkPending()) return showLogin('O link não é válido ou expirou. Solicite outro em Primeiro acesso.');
    return showLogin();
  }
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
  if (firstAccessLinkPending()) {
    hideAccessPanels();
    $('set-password-panel').hidden = false;
    $('set-password-email').textContent = user.email || '';
    $('setup-new-password').focus();
    return;
  }
  hideAccessPanels();
  $('courses-panel').hidden = false;
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

// Primeiro acesso e recuperação usam link de verificação de propriedade do e-mail.
// O link funciona apenas para contas já cadastradas no Auth; somente
// e-mails autorizados pela APMI passam pela política RLS dos cursos.
$('first-access-button').addEventListener('click', () => showEmailPanel('first'));
$('forgot-password-button').addEventListener('click', () => showEmailPanel('recover'));
$('back-login-button').addEventListener('click', () => showLogin());
$('email-request-form').addEventListener('submit', async e => {
  e.preventDefault();
  const feedback = $('email-request-feedback');
  const submit = $('email-request-submit');
  feedback.textContent = '';
  feedback.classList.remove('is-error', 'is-success');
  submit.disabled = true;
  try {
    const email = $('access-email').value.trim().toLowerCase();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: 'https://apmitumbiara.org/cursos.html?definir_senha=1'
      }
    });
    if (error) {
      feedback.textContent = 'Não foi possível enviar o e-mail. O serviço de envio precisa estar configurado pela APMI ou o limite de mensagens foi atingido.';
      feedback.classList.add('is-error');
      return;
    }
    feedback.textContent = 'Se o endereço estiver autorizado e o serviço de envio habilitado, você receberá um link. Verifique também a pasta de spam.';
    feedback.classList.add('is-success');
  } catch {
    feedback.textContent = 'Não foi possível enviar a solicitação. Tente novamente.';
    feedback.classList.add('is-error');
  } finally { submit.disabled = false; }
});
$('set-password-form').addEventListener('submit', async e => {
  e.preventDefault();
  const feedback = $('set-password-feedback');
  const submit = $('setup-password-submit');
  feedback.textContent = '';
  feedback.classList.remove('is-error', 'is-success');
  const password = $('setup-new-password').value;
  if (password.length < 10) {
    feedback.textContent = 'Sua senha deve ter pelo menos 10 caracteres.';
    feedback.classList.add('is-error');
    return;
  }
  if (password !== $('setup-confirm-password').value) {
    feedback.textContent = 'As senhas informadas não coincidem.';
    feedback.classList.add('is-error');
    return;
  }
  submit.disabled = true;
  try {
    const { error } = await sb.auth.updateUser({ password });
    if (error) {
      feedback.textContent = 'Não foi possível cadastrar a senha. Solicite um novo link ou entre em contato com a APMI.';
      feedback.classList.add('is-error');
      return;
    }
    $('set-password-form').reset();
    clearAccessLink();
    await load();
  } catch {
    feedback.textContent = 'Não foi possível salvar sua senha. Tente novamente.';
    feedback.classList.add('is-error');
  } finally { submit.disabled = false; }
});
$('cancel-password-setup').addEventListener('click', async () => {
  await sb.auth.signOut();
  clearAccessLink();
  records = [];
  showLogin();
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
