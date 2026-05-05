/* ═══════════════════════════════════════════════════════════
   Aurora Cybersec Dashboard — Frontend App
   API base: /api  |  Auth: JWT in localStorage
═══════════════════════════════════════════════════════════ */
'use strict';

// ─── State ────────────────────────────────────────────────
const STATE = {
  token: localStorage.getItem('dba_token') || null,
  user:  JSON.parse(localStorage.getItem('dba_user') || 'null'),
  currentPage: 'dashboard',
  docsAll: [], usersAll: [], logsAll: [],
};

// ─── API Helper ───────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (STATE.token) opts.headers['Authorization'] = 'Bearer ' + STATE.token;
  if (body) opts.body = JSON.stringify(body);
  try {
    const res  = await fetch('/api' + path, opts);
    const data = await res.json();
    if (res.status === 401) { doLogout(); return null; }
    return data;
  } catch (e) {
    return null;
  }
}

// ─── Toast ────────────────────────────────────────────────
let _toastTimer;
function toast(msg, type) {
  type = type || 'info';
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function() { el.classList.remove('show'); }, 3000);
}

// ─── Auth Gate ────────────────────────────────────────────
function showApp() {
  document.getElementById('sidebar').style.display = 'flex';
  document.getElementById('topbar').style.display  = 'flex';
  document.getElementById('mainContent').style.marginLeft = 'var(--sidebar-w)';
  document.getElementById('page-login').classList.remove('active');
  // hide loading screen if present
  var loadingEl = document.getElementById('appLoading');
  if (loadingEl) loadingEl.style.display = 'none';
  var name = (STATE.user && STATE.user.username) ? STATE.user.username : '?';
  document.getElementById('sidebarUser').textContent = name;
  document.getElementById('topbarUser').textContent  = name;
  document.getElementById('userChip').querySelector('.user-avatar').textContent =
    name.charAt(0).toUpperCase();
  navigate('dashboard');
}

function showLogin() {
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('topbar').style.display  = 'none';
  document.getElementById('mainContent').style.marginLeft = '0';
  // hide loading screen if present
  var loadingEl = document.getElementById('appLoading');
  if (loadingEl) loadingEl.style.display = 'none';
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('page-login').classList.add('active');
  document.getElementById('loginError').textContent = '';
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
}

// ─── Login ────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn      = document.getElementById('loginBtn');
  var errEl    = document.getElementById('loginError');
  var username = document.getElementById('loginUsername').value.trim();
  var password = document.getElementById('loginPassword').value;

  if (!username || !password) {
    errEl.textContent = 'Username and password are required.';
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'AUTHENTICATING...';
  errEl.textContent = '';

  try {
    var res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password }),
    });
    var data = await res.json();

    if (data.status === 'success' && data.data && data.data.token) {
      STATE.token = data.data.token;
      STATE.user  = data.data.user;
      localStorage.setItem('dba_token', STATE.token);
      localStorage.setItem('dba_user',  JSON.stringify(STATE.user));
      showApp();
      toast('Welcome back, ' + STATE.user.username + '!', 'success');
    } else {
      errEl.textContent = data.message || 'Invalid credentials.';
    }
  } catch (err) {
    errEl.textContent = 'Connection error. Is the server running?';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'AUTHENTICATE';
  }
});

// ─── Logout ───────────────────────────────────────────────
async function doLogout() {
  if (STATE.token) {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + STATE.token },
    }).catch(function() {});
  }
  STATE.token = null;
  STATE.user  = null;
  localStorage.removeItem('dba_token');
  localStorage.removeItem('dba_user');
  showLogin();
  toast('Logged out.', 'info');
}

document.getElementById('logoutBtn').addEventListener('click', function(e) {
  e.preventDefault();
  doLogout();
});

// ─── Helper: extract rows from paginated or plain API response ───────────────
function extractRows(res) {
  if (!res || !res.data) return [];
  var d = res.data;
  // paginated: { total, data: [...] }
  if (d.data && Array.isArray(d.data)) return d.data;
  // plain array
  if (Array.isArray(d)) return d;
  // { rows: [...] }
  if (d.rows && Array.isArray(d.rows)) return d.rows;
  return [];
}

function extractTotal(res) {
  if (!res || !res.data) return 0;
  var d = res.data;
  if (d.total != null) return d.total;
  if (Array.isArray(d)) return d.length;
  if (d.data && Array.isArray(d.data)) return d.data.length;
  return 0;
}

// ─── Helper: get role name regardless of string or object ────────────────────
function userRole() {
  if (!STATE.user) return '';
  var r = STATE.user.role;
  if (!r) return '';
  if (typeof r === 'string') return r;
  if (typeof r === 'object' && r.name) return r.name;
  return String(r);
}
function isAdmin()   { return userRole() === 'admin'; }
function canEdit()   { var r = userRole(); return r === 'admin' || r === 'dba'; }
var PAGE_TITLES = {
  dashboard:   'Overview',
  dokumentasi: 'Dokumentasi DB',
  users:       'Users',
  logs:        'Activity Logs',
  monitoring:  'Monitoring',
};

function navigate(page) {
  STATE.currentPage = page;
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });

  var pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  var navEl = document.querySelector('[data-page="' + page + '"]');
  if (navEl) navEl.classList.add('active');

  document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || page;

  if (page === 'dashboard')   loadDashboard();
  if (page === 'dokumentasi') { initDocsToolbar(); loadDocs(); }
  if (page === 'users')       loadUsers();
  if (page === 'logs')        loadLogs();
  if (page === 'monitoring')  loadMonitoring();
}

document.querySelectorAll('.nav-item[data-page]').forEach(function(el) {
  el.addEventListener('click', function(e) {
    e.preventDefault();
    var page = el.dataset.page;
    if (page) navigate(page);
  });
});

document.getElementById('menuToggle').addEventListener('click', function() {
  document.getElementById('sidebar').classList.toggle('open');
});

// ─── Health Check ─────────────────────────────────────────
async function checkHealth() {
  try {
    var res  = await fetch('/health');
    var data = await res.json();
    var badge = document.getElementById('healthBadge');
    if (data.status === 'ok') {
      badge.className = 'health-badge';
      badge.innerHTML = '<span class="pulse"></span> SYSTEM ONLINE';
    } else {
      badge.className = 'health-badge error';
      badge.innerHTML = '&#9888; SYSTEM ERROR';
    }
    return data;
  } catch (e) {
    var badge = document.getElementById('healthBadge');
    badge.className = 'health-badge error';
    badge.innerHTML = '&#9888; OFFLINE';
    return null;
  }
}

// ─── Dashboard ────────────────────────────────────────────
async function loadDashboard() {
  checkHealth();

  var results = await Promise.all([
    api('GET', '/users?limit=1'),
    api('GET', '/dokumentasi?limit=100'),
    api('GET', '/logs?limit=8'),
  ]);
  var usersRes = results[0];
  var docsRes  = results[1];
  var logsRes  = results[2];

  document.getElementById('statUsers').textContent = extractTotal(usersRes) || '—';

  var allDocs = extractRows(docsRes);
  document.getElementById('statDocs').textContent = extractTotal(docsRes) || allDocs.length || '—';

  var allLogs = extractRows(logsRes);
  document.getElementById('statLogs').textContent = extractTotal(logsRes) || allLogs.length || '—';

  var health = await checkHealth();
  var redisOk = health && health.services && health.services.redis === 'connected';
  document.getElementById('statRedis').textContent = redisOk ? 'Online' : 'Offline';

  // Recent activity
  var actEl = document.getElementById('recentActivity');
  var acts  = allLogs.slice(0, 8);
  if (!acts.length) {
    actEl.innerHTML = '<p style="color:var(--text-muted);font-size:.78rem;text-align:center;padding:1rem">No activity yet</p>';
  } else {
    actEl.innerHTML = acts.map(function(a) {
      return '<div class="activity-item">' +
        '<span class="activity-badge badge-' + (a.action||'') + '">' + esc(a.action||'') + '</span>' +
        '<div class="activity-meta">' +
          '<div class="activity-user">' + esc(a.username || String(a.user_id||'—')) + '</div>' +
          '<div class="activity-desc">' + esc(a.description || a.module || '') + '</div>' +
        '</div>' +
        '<span class="activity-time">' + fmtTime(a.created_at) + '</span>' +
      '</div>';
    }).join('');
  }

  // System health panel
  var healthEl = document.getElementById('systemHealth');
  if (health) {
    var mysqlOk = health.services && health.services.mysql === 'connected';
    var rOk     = health.services && health.services.redis === 'connected';
    healthEl.innerHTML =
      '<div class="health-item"><span class="health-key">APP</span><span class="health-val ok">' + esc(health.app||'DBA App') + '</span></div>' +
      '<div class="health-item"><span class="health-key">ENV</span><span class="health-val">' + esc(health.env||'—') + '</span></div>' +
      '<div class="health-item"><span class="health-key">MySQL</span><span class="health-val ' + (mysqlOk?'ok':'err') + '">' + esc(health.services.mysql||'—') + '</span></div>' +
      '<div class="health-item"><span class="health-key">Redis</span><span class="health-val ' + (rOk?'ok':'warn') + '">' + esc(health.services.redis||'—') + '</span></div>' +
      '<div class="health-item"><span class="health-key">Time</span><span class="health-val ok">' + fmtTime(health.timestamp) + '</span></div>';
  }

  // Latest docs
  var latestDocsEl = document.getElementById('latestDocs');
  var topDocs = allDocs.slice(0, 6);
  if (!topDocs.length) {
    latestDocsEl.innerHTML = '<p style="color:var(--text-muted);font-size:.78rem;text-align:center;padding:1rem">No docs yet</p>';
  } else {
    latestDocsEl.innerHTML = topDocs.map(function(d) {
      return '<div class="mini-doc-row" onclick="openDocDetail(' + d.id + ')">' +
        '<span class="doc-type-badge type-' + esc(d.db_type) + ' mini-doc-type">' + esc(d.db_type) + '</span>' +
        '<span class="mini-doc-title">' + esc(d.title) + '</span>' +
        '<span style="color:var(--text-muted);font-size:.7rem;font-family:var(--font-mono)">#' + (d.rank||0) + '</span>' +
      '</div>';
    }).join('');
  }
}

// ─── Dokumentasi (server-side pagination + sort + search) ─
var DOCS_STATE = {
  page: 1, limit: 10, sort: 'rank', order: 'asc',
  search: '', type: '',
  total: 0, totalPages: 1,
  _searchTimer: null,
};

// Wire up toolbar controls once DOM is ready
function initDocsToolbar() {
  var searchEl  = document.getElementById('docsSearch');
  var filterEl  = document.getElementById('docsFilter');
  var perPageEl = document.getElementById('docsPerPage');
  var newBtn    = document.getElementById('btnNewDoc');

  if (searchEl && !searchEl._wired) {
    searchEl._wired = true;
    searchEl.addEventListener('input', function() {
      clearTimeout(DOCS_STATE._searchTimer);
      DOCS_STATE._searchTimer = setTimeout(function() {
        DOCS_STATE.search = searchEl.value.trim();
        DOCS_STATE.page   = 1;
        loadDocs();
      }, 350);
    });
  }
  if (filterEl && !filterEl._wired) {
    filterEl._wired = true;
    filterEl.addEventListener('change', function() {
      DOCS_STATE.type = filterEl.value;
      DOCS_STATE.page = 1;
      loadDocs();
    });
  }
  if (perPageEl && !perPageEl._wired) {
    perPageEl._wired = true;
    perPageEl.addEventListener('change', function() {
      DOCS_STATE.limit = parseInt(perPageEl.value) || 10;
      DOCS_STATE.page  = 1;
      loadDocs();
    });
  }
  if (newBtn && !newBtn._wired) {
    newBtn._wired = true;
    newBtn.addEventListener('click', function() { openDocModal(); });
  }

  // Sortable column headers
  document.querySelectorAll('#docsTable .th-sort').forEach(function(th) {
    if (th._wired) return;
    th._wired = true;
    th.addEventListener('click', function() {
      var col = th.dataset.col;
      if (DOCS_STATE.sort === col) {
        DOCS_STATE.order = DOCS_STATE.order === 'asc' ? 'desc' : 'asc';
      } else {
        DOCS_STATE.sort  = col;
        DOCS_STATE.order = 'asc';
      }
      DOCS_STATE.page = 1;
      updateSortHeaders();
      loadDocs();
    });
  });
}

function updateSortHeaders() {
  document.querySelectorAll('#docsTable .th-sort').forEach(function(th) {
    th.classList.remove('active');
    var icon = th.querySelector('.sort-icon');
    if (icon) icon.textContent = '⇅';
    if (th.dataset.col === DOCS_STATE.sort) {
      th.classList.add('active');
      if (icon) icon.textContent = DOCS_STATE.order === 'asc' ? '↑' : '↓';
    }
  });
}

async function loadDocs() {
  var tbody = document.getElementById('docsBody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading-cell"><div class="loading-dots"><span></span><span></span><span></span></div></td></tr>';

  var qs = '?page=' + DOCS_STATE.page +
           '&limit=' + DOCS_STATE.limit +
           '&sort='  + DOCS_STATE.sort +
           '&order=' + DOCS_STATE.order;
  if (DOCS_STATE.search) qs += '&search=' + encodeURIComponent(DOCS_STATE.search);
  if (DOCS_STATE.type)   qs += '&db_type=' + encodeURIComponent(DOCS_STATE.type);

  var res = await api('GET', '/dokumentasi' + qs);
  if (!res || !res.data) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem">Failed to load data.</td></tr>';
    return;
  }

  var meta = res.data;
  var rows = meta.data || [];
  DOCS_STATE.total      = meta.total      || 0;
  DOCS_STATE.totalPages = meta.totalPages || 1;

  renderDocsTable(rows);
  renderDocsPagination();
  updateSortHeaders();

  var infoEl = document.getElementById('docsInfo');
  if (infoEl) {
    var from = ((DOCS_STATE.page - 1) * DOCS_STATE.limit) + 1;
    var to   = Math.min(DOCS_STATE.page * DOCS_STATE.limit, DOCS_STATE.total);
    infoEl.textContent = DOCS_STATE.total
      ? 'Showing ' + from + '–' + to + ' of ' + DOCS_STATE.total + ' records'
      : 'No records found';
  }
}

function renderDocsTable(rows) {
  var tbody   = document.getElementById('docsBody');
  var _canEdit = canEdit();
  var _isAdmin = isAdmin();

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem">No dokumentasi found.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(function(d) {
    var tags    = parseTags(d.tags);
    var tagHtml = tags.slice(0, 3).map(function(t) {
      return '<span class="doc-tag">' + esc(t) + '</span>';
    }).join('') + (tags.length > 3 ? '<span class="doc-tag">+' + (tags.length - 3) + '</span>' : '');

    return '<tr>' +
      '<td class="td-mono" style="color:var(--text-muted)">' + d.id + '</td>' +
      '<td><span class="doc-type-badge type-' + esc(d.db_type) + '">' + esc(d.db_type) + '</span></td>' +
      '<td style="max-width:220px"><span style="cursor:pointer;color:var(--cyan)" onclick="openDocDetail(' + d.id + ')" title="' + esc(d.title) + '">' + esc(d.title) + '</span></td>' +
      '<td class="td-wrap" style="max-width:260px;color:var(--text-dim)">' + esc((d.summary || '').substring(0, 80)) + (d.summary && d.summary.length > 80 ? '…' : '') + '</td>' +
      '<td style="max-width:160px"><div style="display:flex;flex-wrap:wrap;gap:.2rem">' + tagHtml + '</div></td>' +
      '<td class="td-mono" style="text-align:center">' + (d.rank || 0) + '</td>' +
      '<td class="td-mono">' + fmtDate(d.createdAt) + '</td>' +
      '<td><div class="td-actions">' +
        '<button class="btn-sm" onclick="openDocDetail(' + d.id + ')">View</button>' +
        (_canEdit ? '<button class="btn-sm" onclick="openDocModal(' + d.id + ')">Edit</button>' : '') +
        (_isAdmin ? '<button class="btn-danger" onclick="deleteDoc(' + d.id + ')">Del</button>' : '') +
      '</div></td>' +
    '</tr>';
  }).join('');
}

function renderDocsPagination() {
  var el = document.getElementById('docsPagination');
  if (!el) return;
  var total = DOCS_STATE.totalPages;
  var cur   = DOCS_STATE.page;
  if (total <= 1) { el.innerHTML = ''; return; }

  var pages = [];
  // always show first, last, current ±2
  var show = {};
  [1, total].forEach(function(p) { show[p] = true; });
  for (var i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) show[i] = true;

  var sorted = Object.keys(show).map(Number).sort(function(a,b){return a-b;});
  var html = '';
  var prev = 0;
  sorted.forEach(function(p) {
    if (prev && p - prev > 1) html += '<span style="color:var(--text-muted);padding:0 .3rem">…</span>';
    html += '<button class="page-btn' + (p === cur ? ' active' : '') + '" onclick="docsGoPage(' + p + ')">' + p + '</button>';
    prev = p;
  });

  el.innerHTML =
    '<button class="page-btn" ' + (cur <= 1 ? 'disabled' : '') + ' onclick="docsGoPage(' + (cur-1) + ')">‹</button>' +
    html +
    '<button class="page-btn" ' + (cur >= total ? 'disabled' : '') + ' onclick="docsGoPage(' + (cur+1) + ')">›</button>';
}

function docsGoPage(p) {
  if (p < 1 || p > DOCS_STATE.totalPages) return;
  DOCS_STATE.page = p;
  loadDocs();
}

async function openDocDetail(id) {
  var res = await api('GET', '/dokumentasi/' + id);
  var d   = res && res.data;
  if (!d) return;

  var _canEdit = canEdit();
  var badge   = document.getElementById('docDetailBadge');
  var editBtn = document.getElementById('docDetailEditBtn');

  document.getElementById('docDetailTitle').textContent = d.title || '—';
  if (badge) { badge.className = 'doc-type-badge type-' + esc(d.db_type); badge.textContent = d.db_type; }
  if (editBtn) {
    editBtn.style.display = _canEdit ? 'inline-block' : 'none';
    editBtn.onclick = function() { closeModal('docDetailModal'); openDocModal(id); };
  }

  var tags = parseTags(d.tags);
  document.getElementById('docDetailMeta').innerHTML =
    '<span style="color:var(--text-muted);font-family:var(--font-mono);font-size:.7rem">Rank #' + (d.rank||0) + '</span>' +
    '<span style="color:var(--text-muted);font-family:var(--font-mono);font-size:.7rem">ID: ' + d.id + '</span>' +
    (d.summary ? '<span style="color:var(--text-dim);font-size:.78rem">' + esc(d.summary) + '</span>' : '') +
    tags.map(function(t){ return '<span class="doc-tag">' + esc(t) + '</span>'; }).join('');

  document.getElementById('docDetailContent').textContent = d.tutorial || d.tutor || '(no content)';
  openModal('docDetailModal');
}

function openDocModal(id) {
  id = id || null;
  document.getElementById('docId').value = id || '';
  document.getElementById('docModalTitle').textContent = id ? 'Edit Dokumentasi' : 'New Dokumentasi';
  document.getElementById('docForm').reset();
  if (id) {
    api('GET', '/dokumentasi/' + id).then(function(res) {
      var d = res && res.data;
      if (!d) return;
      document.getElementById('docDbType').value   = d.db_type   || 'mysql';
      document.getElementById('docRank').value     = d.rank      || 0;
      document.getElementById('docTitle').value    = d.title     || '';
      document.getElementById('docSummary').value  = d.summary   || '';
      document.getElementById('docTutorial').value = d.tutorial  || d.tutor || '';
      document.getElementById('docTags').value     = parseTags(d.tags).join(', ');
    });
  }
  openModal('docModal');
}

document.getElementById('docForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  var id   = document.getElementById('docId').value;
  var body = {
    db_type:  document.getElementById('docDbType').value,
    rank:     parseInt(document.getElementById('docRank').value) || 0,
    title:    document.getElementById('docTitle').value.trim(),
    summary:  document.getElementById('docSummary').value.trim(),
    tutorial: document.getElementById('docTutorial').value.trim(),
    tags:     document.getElementById('docTags').value.trim(),
    flag:     1,
  };
  if (!body.title) { toast('Title is required', 'error'); return; }
  var res = id ? await api('PUT', '/dokumentasi/' + id, body) : await api('POST', '/dokumentasi', body);
  if (res && res.status === 'success') {
    toast(id ? 'Doc updated!' : 'Doc created!', 'success');
    closeModal('docModal');
    loadDocs();
  } else {
    toast((res && res.message) || 'Save failed', 'error');
  }
});

async function deleteDoc(id) {
  if (!confirm('Delete this dokumentasi? This cannot be undone.')) return;
  var res = await api('DELETE', '/dokumentasi/' + id);
  if (res && res.status === 'success') {
    toast('Deleted.', 'success'); loadDocs();
  } else {
    toast((res && res.message) || 'Delete failed', 'error');
  }
}

// ─── Users ────────────────────────────────────────────────
async function loadUsers() {
  document.getElementById('usersBody').innerHTML =
    '<tr><td colspan="7" class="loading-cell"><div class="loading-dots"><span></span><span></span><span></span></div></td></tr>';
  var res = await api('GET', '/users?limit=200');
  STATE.usersAll = extractRows(res);
  renderUsers(STATE.usersAll);
}

function renderUsers(users) {
  var tbody   = document.getElementById('usersBody');
  var _isAdmin = isAdmin();
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem">No users found.</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(function(u) {
    var roleName = (u.role && u.role.name) ? u.role.name : 'user';
    return '<tr>' +
      '<td class="td-mono">' + u.id + '</td>' +
      '<td><strong>' + esc(u.username) + '</strong></td>' +
      '<td>' + esc(u.email || '—') + '</td>' +
      '<td><span class="role-badge role-' + roleName + '">' + roleName + '</span></td>' +
      '<td><span class="status-badge ' + (u.active ? 'status-active' : 'status-inactive') + '">' + (u.active ? 'Active' : 'Inactive') + '</span></td>' +
      '<td class="td-mono">' + (u.last_login ? fmtDate(u.last_login) : '—') + '</td>' +
      '<td><div class="td-actions">' +
        (_isAdmin ? '<button class="btn-sm" onclick="openUserModal(' + u.id + ')">Edit</button>' : '') +
        (_isAdmin ? '<button class="btn-danger" onclick="deleteUser(' + u.id + ')">Del</button>' : '') +
      '</div></td>' +
    '</tr>';
  }).join('');
}

function filterUsers() {
  var q = document.getElementById('usersSearch').value.toLowerCase();
  var filtered = STATE.usersAll.filter(function(u) {
    return !q || (u.username && u.username.toLowerCase().indexOf(q) >= 0) ||
                 (u.email    && u.email.toLowerCase().indexOf(q) >= 0);
  });
  renderUsers(filtered);
}

function openUserModal(id) {
  id = id || null;
  document.getElementById('userId').value = id || '';
  document.getElementById('userModalTitle').textContent = id ? 'Edit User' : 'New User';
  document.getElementById('userForm').reset();
  if (id) {
    api('GET', '/users/' + id).then(function(res) {
      var u = res && res.data;
      if (!u) return;
      document.getElementById('userUsername').value = u.username  || '';
      document.getElementById('userEmail').value    = u.email     || '';
      document.getElementById('userFullName').value = u.full_name || '';
      document.getElementById('userActive').value   = (u.active != null) ? u.active : 1;
    });
  }
  openModal('userModal');
}

document.getElementById('userForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  var id   = document.getElementById('userId').value;
  var body = {
    username:  document.getElementById('userUsername').value.trim(),
    email:     document.getElementById('userEmail').value.trim(),
    full_name: document.getElementById('userFullName').value.trim(),
    active:    parseInt(document.getElementById('userActive').value),
  };
  var pw = document.getElementById('userPassword').value;
  if (pw) body.password = pw;
  if (!body.username)  { toast('Username is required', 'error'); return; }
  if (!id && !pw)      { toast('Password is required for new user', 'error'); return; }
  var res = id ? await api('PUT', '/users/' + id, body) : await api('POST', '/users', body);
  if (res && res.status === 'success') {
    toast(id ? 'User updated!' : 'User created!', 'success');
    closeModal('userModal'); loadUsers();
  } else {
    toast((res && res.message) || 'Save failed', 'error');
  }
});

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  var res = await api('DELETE', '/users/' + id);
  if (res && res.status === 'success') {
    toast('User deleted.', 'success'); loadUsers();
  } else {
    toast((res && res.message) || 'Delete failed', 'error');
  }
}

// ─── Logs ─────────────────────────────────────────────────
async function loadLogs() {
  document.getElementById('logsBody').innerHTML =
    '<tr><td colspan="7" class="loading-cell"><div class="loading-dots"><span></span><span></span><span></span></div></td></tr>';
  var action = document.getElementById('logsActionFilter').value;
  var url    = '/logs?limit=200' + (action ? '&action=' + action : '');
  var res    = await api('GET', url);
  STATE.logsAll = extractRows(res);
  renderLogs(STATE.logsAll);
}

function renderLogs(logs) {
  var tbody = document.getElementById('logsBody');
  if (!logs.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem">No logs found.</td></tr>';
    return;
  }
  tbody.innerHTML = logs.map(function(l) {
    var statusClass = l.status === 'success' ? 'status-success' : 'status-failed';
    return '<tr>' +
      '<td class="td-mono">' + fmtDate(l.created_at) + '</td>' +
      '<td>' + esc(l.username || String(l.user_id||'—')) + '</td>' +
      '<td><span class="activity-badge badge-' + esc(l.action||'') + '">' + esc(l.action||'—') + '</span></td>' +
      '<td class="td-mono">' + esc(l.module||'—') + '</td>' +
      '<td>' + esc(l.description||'—') + '</td>' +
      '<td class="td-mono">' + esc(l.ip_address||'—') + '</td>' +
      '<td><span class="status-badge ' + statusClass + '">' + esc(l.status||'—') + '</span></td>' +
    '</tr>';
  }).join('');
}

function filterLogs() {
  var q = document.getElementById('logsSearch').value.toLowerCase();
  var filtered = STATE.logsAll.filter(function(l) {
    return !q || (l.username    && l.username.toLowerCase().indexOf(q) >= 0) ||
                 (l.description && l.description.toLowerCase().indexOf(q) >= 0) ||
                 (l.module      && l.module.toLowerCase().indexOf(q) >= 0);
  });
  renderLogs(filtered);
}

// ─── Monitoring ───────────────────────────────────────────
async function loadMonitoring() {
  var health  = await checkHealth();
  var mysqlEl = document.getElementById('mysqlMonitor');
  var redisEl = document.getElementById('redisMonitor');

  if (health && health.services) {
    var mysqlOk = health.services.mysql === 'connected';
    var redisOk = health.services.redis === 'connected';
    mysqlEl.innerHTML =
      '<div class="monitor-row"><span class="monitor-key">Status</span>' +
        '<span class="monitor-val" style="color:' + (mysqlOk ? 'var(--green)' : 'var(--red)') + '">' + esc(health.services.mysql||'unknown') + '</span></div>' +
      '<div class="monitor-row"><span class="monitor-key">Host</span><span class="monitor-val">localhost:3306</span></div>' +
      '<div class="monitor-row"><span class="monitor-key">Database</span><span class="monitor-val">homebrew</span></div>' +
      '<div class="monitor-row"><span class="monitor-key">User</span><span class="monitor-val">dba_user</span></div>' +
      '<div class="monitor-row"><span class="monitor-key">Checked</span><span class="monitor-val">' + fmtTime(health.timestamp) + '</span></div>';

    redisEl.innerHTML =
      '<div class="monitor-row"><span class="monitor-key">Status</span>' +
        '<span class="monitor-val" style="color:' + (redisOk ? 'var(--green)' : 'var(--orange)') + '">' + esc(health.services.redis||'unknown') + '</span></div>' +
      '<div class="monitor-row"><span class="monitor-key">Host</span><span class="monitor-val">127.0.0.1:6379</span></div>' +
      '<div class="monitor-row"><span class="monitor-key">User</span><span class="monitor-val">redis</span></div>' +
      '<div class="monitor-row"><span class="monitor-key">Checked</span><span class="monitor-val">' + fmtTime(health.timestamp) + '</span></div>';
  } else {
    mysqlEl.innerHTML = '<p style="color:var(--red);font-size:.8rem;padding:.5rem">Cannot reach server</p>';
    redisEl.innerHTML = '<p style="color:var(--red);font-size:.8rem;padding:.5rem">Cannot reach server</p>';
  }
}

// ─── Modal Helpers ────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ─── Utilities ────────────────────────────────────────────
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch (e) { /* fall through */ }
  return String(tags).split(',').map(function(t){ return t.trim(); }).filter(Boolean);
}

function fmtDate(iso) {
  if (!iso) return '—';
  var d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) +
    ' ' + d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
}

function fmtTime(iso) {
  if (!iso) return '—';
  var d = new Date(iso);
  return d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

// ─── Expose globals for inline onclick ────────────────────
window.navigate      = navigate;
window.openDocModal  = openDocModal;
window.openDocDetail = openDocDetail;
window.deleteDoc     = deleteDoc;
window.docsGoPage    = docsGoPage;
window.openUserModal = openUserModal;
window.deleteUser    = deleteUser;
window.filterUsers   = filterUsers;
window.filterLogs    = filterLogs;
window.loadLogs      = loadLogs;
window.closeModal    = closeModal;

// ─── Boot ─────────────────────────────────────────────────
(function init() {
  // If we have a stored token, verify it silently before showing anything.
  // This prevents the login flash on refresh.
  if (STATE.token && STATE.user) {
    // Show a minimal loading state — neither login nor app yet
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('topbar').style.display  = 'none';
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    // Show loading indicator
    var loadingEl = document.getElementById('appLoading');
    if (loadingEl) loadingEl.style.display = 'flex';

    fetch('/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + STATE.token },
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.status === 'success') {
          // Merge fresh user data (role may be nested)
          var u = data.data || STATE.user;
          if (u && u.role && typeof u.role === 'object') u.role = u.role.name || u.role;
          STATE.user = u;
          localStorage.setItem('dba_user', JSON.stringify(STATE.user));
          showApp();
        } else {
          STATE.token = null; STATE.user = null;
          localStorage.removeItem('dba_token');
          localStorage.removeItem('dba_user');
          showLogin();
        }
      })
      .catch(function() { showLogin(); });
  } else {
    showLogin();
  }
})();
