'use strict';

// Frontend prototype: all personal input lives in this tab's memory only.
// No AI API, analytics, storage, authentication, or server requests are used.
const $ = (selector, root = document) => root.querySelector(selector);
document.body.dataset.input = 'pointer';
document.addEventListener('pointerdown', () => { document.body.dataset.input = 'pointer'; }, { passive: true });
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const today = new Date();
const dateAt = offset => { const date = new Date(today); date.setDate(date.getDate() + offset); return date; };
const dateText = (date = today) => new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(date);
const shortDate = date => `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
const timeText = () => new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());

const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 10 10 0 0 1-4-.8L3 21l1.6-5A8.5 8.5 0 0 1 3 11.5a9 9 0 0 1 18 0Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>',
  book: '<path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1v15"/>',
  report: '<path d="M14 2H5a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8Z"/><path d="M14 2v6h6M8 12h8M8 16h6"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2"/>',
  leaf: '<path d="M20 3C9 1 2 8 5 16c5 8 17 1 15-13Z"/><path d="M3 22c0-6 7-10 11-13"/>',
  sparkle: '<path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8ZM20 2v4M18 4h4"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m3 10v-3a6 6 0 0 0-3-5"/>',
  settings: '<path d="m10 3-.7 2.2-2 .8L5 5l-2 4 1.8 1.5v3L3 15l2 4 2.3-1 2 .8.7 2.2h4l.7-2.2 2-.8 2.3 1 2-4-1.8-1.5v-3L21 9l-2-4-2.3 1-2-.8L14 3Z"/><circle cx="12" cy="12" r="3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 8.5a2.5 2.5 0 0 1 5 .5c0 2-2.5 2-2.5 4M12 17h.01"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  send: '<path d="m21 3-7 18-4-8-8-4 19-6ZM10 13 21 3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="m6 6 12 12M6 18 18 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  chart: '<path d="M3 3v18h18M7 14l4-4 4 3 6-7"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  link: '<path d="m10 13 4-4m-6 6-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 2 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(1 1) scale(.9)"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  edit: '<path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM13 6l5 5"/>',
};
function icon(name, extra = '') { return `<svg class="icon ${extra}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.heart}</svg>`; }
const brandSymbol = '<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 32C9 25 6 17 10 12c4-5 10-3 10 3 0-6 6-8 10-3 4 5 1 13-10 20Z" stroke="currentColor" stroke-width="2.1"/><path d="M20 27c-1-6 0-11 4-15M16 8c-1-3 1-6 4-7 2 3 1 6-2 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
const moods = [
  { label: '많이 힘들어요', short: '많이 힘듦', color: '#dedfeb', ink: '#9699b5' },
  { label: '조금 지쳐요', short: '조금 지침', color: '#e2e7f0', ink: '#93a1bb' },
  { label: '그저 그래요', short: '보통', color: '#f3ecd9', ink: '#c1ae7c' },
  { label: '괜찮아요', short: '괜찮음', color: '#e2ebdc', ink: '#9cb38c' },
  { label: '기분 좋아요', short: '좋음', color: '#f7e5d8', ink: '#cba185' },
];
function moodFace(index) {
  const mood = moods[index];
  const mouths = ['M15 30q9-10 18 0', 'M16 28q8-7 16 0', 'M17 27h14', 'M16 25q8 9 16 0', 'M15 24q9 13 18 0'];
  return `<svg class="mood-face" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="${mood.color}"/><circle cx="17" cy="20" r="1.5" fill="${mood.ink}"/><circle cx="31" cy="20" r="1.5" fill="${mood.ink}"/><path d="${mouths[index]}" stroke="${mood.ink}" stroke-width="1.7" stroke-linecap="round"/>${index === 4 ? `<ellipse cx="11" cy="26" rx="3" ry="1.5" fill="#E9C1AB"/><ellipse cx="37" cy="26" rx="3" ry="1.5" fill="#E9C1AB"/>` : ''}</svg>`;
}

const welcome = '안녕하세요, 서연님. 마음결이에요. 🌿\n여기는 정답을 찾거나, 잘 말하려고 애쓰지 않아도 되는 공간이에요.\n\n오늘 하루, 마음에 남은 일이 있었나요? 편한 이야기부터 시작해 주세요.';
const seedHistory = [
  { title: '잘하고 싶은 마음이 가끔은 무거워서', subtitle: '일과 나의 속도에 대해 나눈 이야기', offset: -1, theme: '직장 스트레스', text: '요즘 일을 잘하고 싶은 마음이 큰데, 자꾸 다른 사람과 비교하게 돼요. 퇴근하고 나서도 할 일을 생각하느라 쉬는 기분이 들지 않아요.' },
  { title: '조금은 나에게 다정해지기로 했어요', subtitle: '작은 쉼과 나를 돌보는 방법', offset: -3, theme: '자기 돌봄', text: '오늘은 점심시간에 잠깐 산책했어요. 별것 아닌데 기분이 좀 나아지더라고요. 이런 시간을 더 만들어보고 싶어요.' },
];
const state = {
  role: 'client', page: 'home', mobileMenu: false, notificationsRead: false,
  mood: null, moodValues: [2, 3, 2, 4, 3, 4, null],
  messages: [{ role: 'assistant', text: welcome, time: '지금' }], isTyping: false,
  chatDraft: '', journalDraft: '', reportNote: '', counselorNotes: {}, shared: false,
  appointment: null, query: '', selectedClient: 'seoyeon', replyTimer: null,
  journals: [
    { id: 1, offset: -1, mood: 2, title: '나의 속도로 걸어도 괜찮아', text: '오늘도 바쁜 하루였지만, 집에 오는 길에 좋아하는 음악을 들었어요. 잠깐이나마 마음이 편안해졌어요. 내일은 나를 위한 시간을 조금 더 만들어보려고요.', sample: true },
    { id: 2, offset: -3, mood: 3, title: '점심시간의 작은 산책', text: '일을 잠시 내려놓고 동네를 걸었어요. 바람이 시원해서 생각이 조금 가벼워졌어요. 나를 돌보는 일이 대단한 일일 필요는 없겠다고 느꼈어요.', sample: true },
  ],
};
const clients = [
  { id: 'seoyeon', name: '이서연', initials: '서연', age: '20대', topics: '직장 스트레스, 자기 돌봄', count: 8, offset: -1, note: '최근 업무 부담과 타인과의 비교를 이야기했습니다. 점심시간의 산책처럼 짧은 휴식을 시도한 경험도 있습니다.', quote: seedHistory[0].text },
  { id: 'jiwoo', name: '김지우', initials: '지우', age: '30대', topics: '대인 관계, 감정 표현', count: 6, offset: -1, note: '가까운 사람에게 자신의 의견을 말하는 데 어려움이 있다고 표현했습니다. 관계 안에서 원하는 거리와 소통 방식을 살펴볼 수 있습니다.', quote: '상대방이 불편해할까 봐 하고 싶은 말을 삼키게 돼요. 제 마음도 솔직하게 말해보고 싶어요.' },
  { id: 'dohyun', name: '박도현', initials: '도현', age: '20대', topics: '진로 고민, 일상 루틴', count: 5, offset: -2, note: '앞으로의 진로를 선택하는 과정에서 느끼는 불확실성을 이야기했습니다. 본인이 중요하게 생각하는 가치와 일상 패턴을 함께 살펴볼 수 있습니다.', quote: '하고 싶은 게 뭔지 잘 모르겠어요. 다른 사람들은 방향을 정한 것 같은데 저만 제자리인 기분이에요.' },
  { id: 'haeun', name: '정하은', initials: '하은', age: '30대', topics: '일상 스트레스, 휴식', count: 4, offset: -2, note: '여러 역할을 함께 맡으며 쉬는 시간을 충분히 갖기 어렵다고 이야기했습니다. 일상에서 편안함을 느끼는 순간을 탐색할 수 있습니다.', quote: '해야 할 일이 많아서 쉬고 있어도 마음이 바빠요. 아무 생각 없이 푹 쉬는 시간을 갖고 싶어요.' },
];
const clientNav = [{ id: 'home', icon: 'home', text: '마음 홈' }, { id: 'chat', icon: 'chat', text: '마음 대화' }, { id: 'journal', icon: 'book', text: '감정 기록' }, { id: 'report', icon: 'report', text: '나의 마음 리포트' }];
const counselorNav = [{ id: 'overview', icon: 'home', text: '대시보드' }, { id: 'clients', icon: 'users', text: '내담자 관리' }, { id: 'reports', icon: 'report', text: '대화 분석 리포트' }, { id: 'schedule', icon: 'calendar', text: '상담 일정' }];
const pageNames = { home: '마음 홈', chat: '마음 대화', journal: '감정 기록', report: '나의 마음 리포트', overview: '대시보드', clients: '내담자 관리', reports: '대화 분석 리포트', schedule: '상담 일정', detail: '내담자 리포트' };

function render(options = {}) {
  const nav = state.role === 'client' ? clientNav : counselorNav;
  $('#app').innerHTML = `<div class="app-shell">
    <button class="mobile-backdrop ${state.mobileMenu ? 'open' : ''}" data-action="menu-close" aria-label="메뉴 닫기" tabindex="-1"></button>
    <aside class="sidebar ${state.mobileMenu ? 'open' : ''}" id="sidebar" aria-label="주 메뉴">
      <a href="#${state.role === 'client' ? 'home' : 'overview'}" class="brand" aria-label="마음결 홈"><span class="brand-symbol">${brandSymbol}</span><div><div class="brand-name">마음결</div><div class="brand-en">MAEUMGYEOL</div></div></a>
      <div class="space-label">${state.role === 'client' ? 'MY LITTLE SANCTUARY' : 'COUNSELOR WORKSPACE'}</div>
      <nav class="nav-list">${nav.map(item => `<button class="nav-item ${(state.page === item.id || (item.id === 'reports' && state.page === 'detail')) ? 'active' : ''}" data-page="${item.id}" ${state.page === item.id ? 'aria-current="page"' : ''}>${icon(item.icon)}<span>${item.text}</span>${state.page === item.id ? '<span class="nav-dot"></span>' : ''}</button>`).join('')}</nav>
      <div class="sidebar-note">${icon('leaf')}<strong>${state.role === 'client' ? '조금 느려도 괜찮아요' : '이해에서 시작하는 상담'}</strong><p>${state.role === 'client' ? '나만의 속도로 마음을 살피는 곳.<br>마음결이 함께할게요.' : '대화의 맥락을 먼저 살피고,<br>더 깊은 이야기를 나눠보세요.'}</p></div>
      <div class="sidebar-bottom"><button data-action="privacy">${icon('settings')}개인정보와 공유 설정</button><button data-action="help">${icon('help')}이용 안내</button><div class="version">MAEUMGYEOL · UI PROTOTYPE</div></div>
    </aside>
    <div class="workspace">
      <header class="topbar">
        <button class="icon-button mobile-toggle" data-action="menu" aria-label="주 메뉴 열기" aria-controls="sidebar" aria-expanded="${state.mobileMenu}">${icon('menu')}</button>
        <div class="breadcrumb">${state.role === 'client' ? '나를 위한 작은 공간' : '마음결 상담사 워크스페이스'}${icon('chevron')}<strong>${pageNames[state.page]}</strong></div>
        <div class="topbar-actions"><div class="role-switch" role="group" aria-label="체험 화면 선택"><button data-role="client" class="${state.role === 'client' ? 'selected' : ''}" aria-pressed="${state.role === 'client'}">내담자 공간</button><button data-role="counselor" class="${state.role === 'counselor' ? 'selected' : ''}" aria-pressed="${state.role === 'counselor'}">상담사 공간</button></div><button class="icon-button" data-action="notifications" aria-label="${state.notificationsRead ? '알림' : '새 알림 확인'}">${icon('bell')}${state.notificationsRead ? '' : '<span class="notification-dot"></span>'}</button><button class="profile-mini" data-action="profile" aria-label="체험 프로필 확인"><span class="avatar ${state.role === 'counselor' ? 'sage' : ''}">${state.role === 'client' ? '서연' : '지은'}</span><span>${state.role === 'client' ? '서연님' : '김지은 상담사'}</span>${icon('down')}</button></div>
      </header>
      <main class="main-content" id="main-content" tabindex="-1">${renderPage()}</main>
    </div></div>`;
  document.title = `${pageNames[state.page]} · 마음결`;
  updateMobileAccessibility();
  if (state.page === 'chat') { const list = $('#chat-messages'); list.scrollTop = list.scrollHeight; }
  if (options.focus) requestAnimationFrame(() => $('#main-content')?.focus({ preventScroll: true }));
}

function heading(eyebrow, title, subtitle, extra = '') {
  return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div>${extra || `<div class="date-label">${icon('calendar')}${dateText()}</div>`}</div>`;
}
function footer() { return `<footer class="page-footer"><span>© ${today.getFullYear()} 마음결. 당신의 모든 마음을 응원해요.</span><span><i class="demo-dot"></i>샘플 데이터로 만나는 UI 데모</span></footer>`; }
function renderPage() {
  if (state.role === 'client') return ({ home: homePage, chat: chatPage, journal: journalPage, report: () => reportPage(false) }[state.page] || homePage)() + footer();
  return ({ overview: counselorPage, clients: clientsPage, reports: reportsPage, schedule: schedulePage, detail: () => reportPage(true) }[state.page] || counselorPage)() + footer();
}
function moodPicker() {
  return `<section class="card mood-card" aria-labelledby="mood-heading"><div class="card-head"><h2 class="card-title" id="mood-heading">지금, 마음의 날씨는 어떤가요?</h2><span class="small-tag">${state.mood === null ? '하루 한 번 체크인' : '오늘 기록 완료'}</span></div><p class="card-subtitle">어떤 마음이든 괜찮아요. 있는 그대로 남겨보세요.</p><div class="mood-options" role="group" aria-label="오늘의 기분">${moods.map((mood, index) => `<button class="mood-option ${state.mood === index ? 'selected' : ''}" data-mood="${index}" aria-pressed="${state.mood === index}">${moodFace(index)}<span>${mood.label}</span></button>`).join('')}</div></section>`;
}
function trendChart(full = false) {
  const values = state.moodValues;
  const points = values.map((value, index) => value === null ? null : [30 + index * 39, 93 - (value - 1) * 17]);
  const actual = points.filter(Boolean);
  const line = actual.map((point, index) => `${index === 0 ? 'M' : 'L'}${point[0]},${point[1]}`).join(' ');
  const fill = `${line} L${actual[actual.length - 1][0]},100 L${actual[0][0]},100 Z`;
  const id = `chart-gradient-${full ? 'report' : state.page}`;
  const label = values.map((value, index) => `${shortDate(dateAt(index - 6))} ${value === null ? '미기록' : value + '점'}`).join(', ');
  return `<svg class="chart" viewBox="0 0 280 128" role="img" aria-label="${escapeHTML(`지난 일주일 자기보고 감정 기록, 1~5점. ${label}`)}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#baa8dc" stop-opacity=".24"/><stop offset="1" stop-color="#baa8dc" stop-opacity="0"/></linearGradient></defs>${[25, 58, 93].map((y, i) => `<path class="chart-grid" d="M25 ${y}H268"/><text x="6" y="${y + 3}">${5 - i * 2}</text>`).join('')}<path d="${fill}" fill="url(#${id})"/><path d="${line}" fill="none" stroke="#b7a1d3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${points.map((point, index) => point ? `<circle cx="${point[0]}" cy="${point[1]}" r="${index === 6 ? 4 : 3}" fill="${index === 6 ? '#a389c3' : 'white'}" stroke="#b7a1d3" stroke-width="1.6"/>` : '').join('')}${values.map((_, index) => `<text x="${30 + index * 39}" y="119" text-anchor="middle">${index === 6 ? '오늘' : dateAt(index - 6).getDate()}</text>`).join('')}</svg>`;
}
function homePage() {
  const logged = state.moodValues.filter(value => value !== null);
  const average = (logged.reduce((sum, n) => sum + n, 0) / logged.length).toFixed(1);
  return `${heading('A LITTLE MOMENT FOR YOURSELF', '서연님, <span>오늘 마음은 어떤가요?</span>', '말하기 어려운 마음도, 여기서는 천천히 꺼내도 괜찮아요.')}
    <div class="dashboard-grid"><div class="main-column">
      <section class="hero"><div class="hero-copy"><div class="hero-label">${icon('sparkle')}나를 알아가는 작은 대화</div><h2>복잡한 마음에,<br>작은 쉼표 하나.</h2><p>누군가의 시선도, 정해진 답도 없이.<br>마음결과 편안하게 이야기 나눠보세요.</p><button class="primary-button" data-page="chat">마음 대화 시작하기${icon('arrow')}</button></div><img class="hero-art" src="assets/mind-garden.svg" alt="보랏빛 언덕과 따뜻한 햇살이 보이는 아치형 창문 옆의 작은 식물" width="440" height="300" /></section>
      ${moodPicker()}
      <div class="two-cards"><section class="card trend-card"><div class="card-head"><h2 class="card-title">이번 주 나의 마음</h2><button class="text-link" data-page="journal">자세히${icon('chevron')}</button></div><p class="card-subtitle">작은 기록이 모여 나를 이해하는 힌트로</p><div class="trend-summary"><strong>${average}<span style="font-size:10px;font-weight:400"> / 5</span></strong><span class="trend-indicator">${logged.length}일의 마음 기록</span></div>${trendChart()}</section>
      <section class="card topics-card"><div class="card-head"><h2 class="card-title">요즘 나의 이야기</h2>${icon('leaf')}</div><p class="card-subtitle">최근 샘플 대화에서 자주 나눈 주제</p><div class="topic-tags"><span class="topic-tag"># 직장 스트레스</span><span class="topic-tag green"># 자기 돌봄</span><span class="topic-tag peach"># 대인 관계</span></div><p class="topic-description">잘하고 싶은 마음과 쉬고 싶은 마음.<br>그 사이에서 나를 살피고 있어요.</p><div class="insight-line">${icon('sparkle')}내 마음을 알아가는 중이에요</div></section></div>
      <section class="card history-card"><div class="card-head"><h2 class="card-title">지난 마음 대화</h2><button class="text-link" data-action="history-all">모두 보기${icon('chevron')}</button></div>${seedHistory.map((item, index) => `<button class="history-row" data-history="${index}"><span class="history-icon ${index ? 'green' : ''}">${icon(index ? 'leaf' : 'chat')}</span><span class="history-copy"><strong>${item.title}</strong><span>${item.subtitle}</span></span><span class="history-date">${shortDate(dateAt(item.offset))}</span>${icon('chevron')}</button>`).join('')}</section>
    </div><aside class="aside-column dashboard-aside" aria-label="마음 돌봄 안내">
      <section class="card quote-card"><div class="quote-label">${icon('sun')}오늘, 마음에 담아둘 말</div><div class="quote-mark">“</div><blockquote>매일 괜찮지 않아도,<br>당신은 충분히 괜찮은 사람.</blockquote><div class="quote-footer">마음결이 서연님에게</div><span class="quote-leaf">${icon('leaf')}</span></section>
      ${connectionCard()}
      <section class="card journey-card"><h2 class="card-title">마음이 이어지는 여정</h2><p>작은 대화에서, 더 깊은 이해로.</p><div class="journey-list"><div class="journey-step current"><span class="step-number">1</span><div><strong>편안하게 이야기하기</strong><p>AI와 부담 없이 마음 나누기</p></div></div><div class="journey-step"><span class="step-number">2</span><div><strong>나의 마음 이해하기</strong><p>대화 속 마음의 흐름 살펴보기</p></div></div><div class="journey-step"><span class="step-number">3</span><div><strong>전문가와 이어지기</strong><p>동의한 이야기로 상담 시작하기</p></div></div></div></section>
      <div class="privacy-footnote">${icon('lock')}내 이야기는 소중하니까.<br>직접 동의한 리포트만 공유할 수 있어요.</div>
    </aside></div>`;
}
function connectionCard() {
  return `<section class="card connection-card"><div class="connection-heading">${icon('link')}<h2 class="card-title">더 깊은 대화를 위한 연결</h2></div><div class="counselor-profile"><span class="counselor-avatar">${icon('user')}</span><div><strong>김지은<span>심리상담사</span></strong><p>마음숲 심리상담센터 · 예시</p></div></div><p class="connection-description">말로 다 설명하기 어려웠던 내 마음,<br>리포트로 차분하게 전해보세요.</p><span class="status-pill ${state.shared ? '' : 'pending'}">${state.shared ? '이 탭에서 공유 동의됨' : '내가 동의하면 연결돼요'}</span><button class="secondary-button" data-page="report">나의 마음 리포트 살펴보기${icon('chevron')}</button></section>`;
}
function messageHTML(message) {
  const user = message.role === 'user';
  return `<div class="message-row ${user ? 'user' : ''}">${user ? '' : `<span class="ai-avatar">${icon('leaf')}</span>`}<div class="message-content">${user ? '' : '<div class="message-name">마음결</div>'}<div class="message-bubble">${escapeHTML(message.text)}</div><div class="message-time">${escapeHTML(message.time)}</div></div></div>`;
}
function chatPage() {
  return `${heading('YOUR SAFE LITTLE SPACE', '마음이 머무는 대화', '잘 정리된 말이 아니어도 괜찮아요. 지금 떠오르는 이야기부터 시작해요.')}
    <div class="chat-layout"><section class="card chat-panel" aria-label="마음결과 대화"><header class="chat-header"><span class="ai-avatar">${icon('leaf')}</span><div><h2>마음결</h2><p>당신의 이야기를 듣는 작은 공간 · 응답 예시</p></div><button class="icon-button" data-action="new-chat" aria-label="새 대화 시작">${icon('plus')}</button></header>
    <div class="chat-messages" id="chat-messages" role="log" aria-label="대화 내용" aria-live="polite"><div class="chat-date">${dateText()} · 지금, 이 순간</div>${state.messages.map(messageHTML).join('')}${state.isTyping ? `<div class="message-row"><span class="ai-avatar">${icon('leaf')}</span><div class="message-content"><div class="message-bubble">이야기를 읽고 있어요…</div></div></div>` : ''}</div>
    ${state.messages.length < 3 ? `<div class="chat-chips" aria-label="대화 시작 문장">${['요즘 조금 지친 것 같아요', '생각이 많아서 잠이 안 와요', '그냥 누군가와 이야기하고 싶어요'].map(text => `<button data-prompt="${escapeHTML(text)}">${text}</button>`).join('')}</div>` : ''}
    <form class="chat-composer" id="chat-form"><label class="sr-only" for="chat-input">마음결에게 메시지 보내기</label><div class="composer-field"><textarea id="chat-input" name="message" rows="1" placeholder="지금 떠오르는 마음을 적어주세요…" maxlength="2000" ${state.isTyping ? 'aria-describedby="reply-status"' : ''}>${escapeHTML(state.chatDraft)}</textarea><button class="send-button" type="submit" aria-label="메시지 보내기" ${state.isTyping || !state.chatDraft.trim() ? 'disabled' : ''}>${icon('send')}</button></div><p class="composer-note" id="reply-status">실제 AI가 연결되지 않은 대화 예시예요. 입력은 이 탭에서만 유지돼요.<br>Enter로 전송 · Shift + Enter로 줄바꿈</p></form></section>
    <aside class="aside-column"><section class="card chat-aside-card">${icon('heart')}<h3>여기서는, 나답게</h3><p>어떤 마음도 틀리지 않아요.<br>지금의 나를 있는 그대로 이야기해 주세요.</p><ul class="chat-tip"><li>정답을 찾으려 애쓰지 않기</li><li>말하고 싶은 만큼만 나누기</li><li>쉬고 싶을 땐 잠시 멈추기</li></ul><div class="session-info"><span>이번 대화</span><strong>${state.messages.filter(m => m.role === 'user').length}개의 마음</strong></div></section>${connectionCard()}<div class="privacy-footnote">${icon('shield')}마음결은 감정 정리를 돕는 공간이며,<br>전문가의 진단과 상담을 대신하지 않아요.</div></aside></div>`;
}
function journalPage() {
  return `${heading('GET TO KNOW YOURSELF', '차곡차곡, 나의 마음 기록', '아주 작은 감정도 남겨두면, 나를 이해하는 실마리가 돼요.')}
  <div class="wide-grid"><div class="main-column">${moodPicker()}<section class="card journal-editor"><form id="journal-form"><label for="journal-input">오늘의 나에게 남기는 한마디</label><textarea id="journal-input" placeholder="오늘 어떤 순간에 마음이 움직였나요? 작은 일부터 편하게 적어주세요." maxlength="1500" required>${escapeHTML(state.journalDraft)}</textarea><div class="editor-bottom"><span>내용은 이 탭에서만 보관돼요 · <span id="journal-count">${state.journalDraft.length}</span>/1500</span><button class="primary-button" type="submit">${icon('edit')}마음 기록 남기기</button></div></form></section><div class="card-head"><h2 class="card-title">나의 마음 조각들</h2><span class="small-tag">${state.journals.length}개의 기록</span></div>${state.journals.map(entry => `<article class="card journal-entry"><div class="entry-meta">${moodFace(entry.mood)}<span>${dateText(dateAt(entry.offset))} · ${moods[entry.mood].short}</span>${entry.sample ? '<span class="small-tag">샘플</span>' : ''}</div><h3>${escapeHTML(entry.title)}</h3><p>${escapeHTML(entry.text)}</p>${!entry.sample ? `<div class="entry-footer"><span class="small-tag">나만 보는 기록</span><button class="text-link" data-delete-entry="${entry.id}">기록 삭제</button></div>` : ''}</article>`).join('')}</div>
  <aside class="aside-column"><section class="card trend-card"><h2 class="card-title">마음의 흐름</h2><p class="card-subtitle">지난 7일 · 내가 남긴 기분 1~5점</p>${trendChart()}<p class="topic-description">점수는 좋고 나쁨을 평가하지 않아요.<br>매일 달라지는 마음을 살펴보는 기록이에요.</p></section><section class="card chat-aside-card">${icon('sun')}<h3>오늘은 이런 질문 어때요?</h3><p>“오늘 나를 조금 편안하게 해준 것은 무엇이었나요?”</p><button class="text-link" data-action="journal-prompt">이 질문으로 기록하기${icon('arrow')}</button></section><div class="privacy-footnote">${icon('lock')}감정 기록 원문은 공유 리포트에 포함되지 않아요.</div></aside></div>`;
}
function reportPage(professional) {
  const person = professional ? clients.find(c => c.id === state.selectedClient) || clients[0] : clients[0];
  const isSeoyeon = person.id === 'seoyeon';
  const reportValues = isSeoyeon ? '' : '<p class="topic-description">아래 추이는 제품 화면 설명을 위한 공통 샘플입니다.</p>';
  return `${professional ? '<button class="back-button" data-page="reports">' + icon('back') + '리포트 목록으로</button>' : ''}${heading(professional ? 'UNDERSTANDING BEFORE COUNSELING' : 'A BRIDGE TO UNDERSTANDING', professional ? `${person.name}님의 대화 분석 리포트` : '이야기 속에 담긴, 나의 마음', professional ? '내담자가 동의한 대화를 바탕으로 상담을 준비하는 참고 자료예요.' : '말로 꺼내기 어려웠던 마음을, 차분하게 살펴보세요.')}
  <div class="report-banner">${icon('shield')}<p><strong>${professional ? '상담 준비를 돕는 샘플 리포트' : '공유하기 전, 먼저 살펴보세요.'}</strong><br>${professional ? '임상 진단이나 위험도 평가가 아닙니다. 요약과 해석은 내담자와 함께 확인해 주세요.' : '공유 항목을 확인하고 직접 동의한 뒤에만 상담사 공간에 표시돼요.'}</p>${!professional ? `<button class="secondary-button" data-action="share">${state.shared ? '공유 설정 관리' : '공유 항목 확인'}</button>` : '<span class="small-tag">가상 내담자</span>'}</div>
  <div class="wide-grid"><article class="card report-paper" aria-label="마음 리포트"><div class="report-title-row"><div><div class="eyebrow">MAEUMGYEOL · PERSONAL INSIGHT</div><h2>${person.name}님의 마음 리포트</h2><p>${shortDate(dateAt(-6))} – ${shortDate(today)} · 가상 대화 ${person.count}회 기준</p></div><span class="status-pill ${isSeoyeon && !state.shared ? 'pending' : ''}">${isSeoyeon ? state.shared ? '공유 동의됨 · 데모' : '나만 보는 리포트' : '샘플 공유 동의됨'}</span></div>
  <section class="report-section"><h3><span class="section-number">01</span>최근 이야기 한눈에 보기</h3><p>${person.note}</p><div class="report-facts"><div class="fact"><span>샘플 대화</span><strong>${person.count}<small>회</small></strong></div><div class="fact"><span>다룬 주제</span><strong>${person.topics.split(', ').length}<small>가지</small></strong></div><div class="fact"><span>살펴본 기간</span><strong>7<small>일</small></strong></div></div></section>
  <section class="report-section"><h3><span class="section-number">02</span>감정 기록의 흐름</h3><p>스스로 남긴 기분을 1~5점으로 나타냈어요. 의학적 척도나 우울·불안의 진단 점수가 아닙니다.</p>${reportValues}${trendChart(true)}<p style="font-size:10px">${isSeoyeon ? '이전 6일은 샘플 기록이며, 오늘의 체크인은 직접 선택한 값이 반영돼요.' : '실제 검사 결과가 없는 가상 데이터예요. 임상적 판단에 사용할 수 없습니다.'}</p></section>
  <section class="report-section"><h3><span class="section-number">03</span>대화에서 살펴볼 주제</h3><div class="topic-tags" style="margin-top:0">${person.topics.split(', ').map((topic, index) => `<span class="topic-tag ${index ? 'green' : ''}"># ${topic}</span>`).join('')}</div><div class="evidence"><p>“${escapeHTML(person.quote)}”</p><span>${shortDate(dateAt(person.offset))} · 가상 내담자의 대화 발췌</span></div></section>
  <section class="report-section"><h3><span class="section-number">04</span>함께 이야기해 볼 질문</h3><p>아래는 상담을 시작하기 위한 예시 질문입니다. 내담자의 경험과 맥락에 맞게 조정해 주세요.</p><ul>${(isSeoyeon ? ['일을 잘하고 싶다는 마음은 어떤 순간에 가장 크게 느껴지나요?', '잠깐 쉬었을 때 마음이 달라진 경험이 있었나요?', '상담에서 가장 먼저 함께 다뤄보고 싶은 이야기는 무엇인가요?'] : [`${person.topics.split(', ')[0]}에 대해 조금 더 이야기해 주실 수 있나요?`, '그런 마음이 들 때 도움이 되었던 경험이 있나요?', '이번 상담에서 기대하는 변화를 함께 이야기해 볼까요?']).map(question => `<li>${question}</li>`).join('')}</ul></section>
  ${!professional && state.reportNote ? `<section class="report-section"><h3><span class="section-number">05</span>상담사에게 전하고 싶은 말</h3><p style="white-space:pre-wrap">${escapeHTML(state.reportNote)}</p></section>` : ''}
  ${professional && isSeoyeon && state.reportNote ? `<section class="report-section"><h3><span class="section-number">05</span>내담자가 덧붙인 이야기</h3><p style="white-space:pre-wrap">${escapeHTML(state.reportNote)}</p></section>` : ''}
  </article><aside class="aside-column"><section class="card report-sidebar"><h3>${professional ? '상담 준비 정보' : '내 마음, 내가 정하는 공유'}</h3><p>${professional ? '가상 프로필과 대화로 구성된 예시입니다.' : '전체 대화 원문 대신, 지금 살펴본 요약 리포트와 대화 발췌가 공유돼요.'}</p><div class="detail-pair"><span>${professional ? '내담자' : '공유받을 상담사'}</span><strong>${professional ? person.name : '김지은 상담사 · 예시'}</strong></div><div class="detail-pair"><span>공유 상태</span><strong>${isSeoyeon && !state.shared ? '미공유' : '동의됨 · 데모'}</strong></div><div class="detail-pair"><span>데이터</span><strong>샘플 + 현재 탭 입력</strong></div>${professional ? `<button class="primary-button" data-action="appointment">${icon('calendar')}상담 일정 선택</button>` : `<button class="primary-button" data-action="share">${icon('link')}${state.shared ? '공유 동의 관리' : '상담사에게 리포트 공유'}</button>`}<button class="secondary-button" data-action="print">${icon('download')}리포트 인쇄 / PDF 저장</button></section>
  <section class="card report-sidebar"><h3>${professional ? '나의 상담 준비 메모' : '함께 전하고 싶은 말'}</h3><p>${professional ? '이 탭에서만 유지되는 상담사 개인 메모예요.' : '리포트에 덧붙일 이야기를 적어주세요. 저장 후 공유 항목에 포함돼요.'}</p><label class="sr-only" for="report-note">${professional ? '상담 준비 메모' : '리포트에 덧붙일 말'}</label><textarea class="note-field" id="report-note" maxlength="1000" placeholder="${professional ? '다음 상담에서 살펴볼 내용을 적어주세요.' : '처음 상담이라 조금 긴장되지만, 제 이야기를 편하게 나눠보고 싶어요.'}">${escapeHTML(professional ? state.counselorNotes[person.id] || '' : state.reportNote)}</textarea><button class="secondary-button" data-action="save-note">메모 저장</button></section><div class="privacy-footnote">${icon('lock')}${professional ? '내담자의 감정 일기와 전체 대화는 포함되지 않습니다.' : '공유 동의는 언제든 철회할 수 있어요. 이 데모는 실제로 데이터를 전송하지 않습니다.'}</div></aside></div>`;
}

function canView(person) { return person.id !== 'seoyeon' || state.shared; }
function clientTable(onlyReports = false) {
  const filtered = clients.filter(person => (!onlyReports || canView(person)) && `${person.name} ${person.topics}`.includes(state.query.trim()));
  return `<div class="table-wrapper"><table class="client-table"><caption class="sr-only">가상 내담자의 공유 리포트 현황</caption><thead><tr><th scope="col">내담자</th><th scope="col">최근 대화 주제</th><th scope="col">대화</th><th scope="col">최근 기록</th><th scope="col">공유 동의</th><th scope="col">리포트</th></tr></thead><tbody>${filtered.length ? filtered.map(person => `<tr><td><span class="client-name"><span class="avatar ${person.id === 'dohyun' ? 'sage' : ''}">${person.initials}</span>${person.name}<span class="muted" style="font-weight:400;font-size:9px">${person.age}</span></span></td><td>${person.topics}</td><td>${person.count}회</td><td>${shortDate(dateAt(person.offset))}</td><td><span class="status-pill ${canView(person) ? '' : 'pending'}">${canView(person) ? '동의 완료' : '동의 대기'}</span></td><td><button class="table-button" data-client="${person.id}" ${canView(person) ? '' : 'disabled title="내담자 공간에서 공유에 동의하면 열람할 수 있어요."'}>리포트 보기</button></td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:35px">검색 결과가 없어요. 이름이나 주제를 다시 입력해 주세요.</td></tr>'}</tbody></table></div>`;
}
function searchToolbar(title) { return `<div class="table-toolbar"><h2>${title}</h2><label class="search-field">${icon('search')}<span class="sr-only">내담자 이름 또는 주제 검색</span><input id="client-search" type="search" placeholder="이름이나 대화 주제로 검색" value="${escapeHTML(state.query)}" /></label></div>`; }
function scheduleList() {
  const items = [{ time: '14:00', name: '김지우', type: '개인 상담 · 50분', id: 'jiwoo' }, { time: '16:00', name: '박도현', type: '초기 상담 · 50분', id: 'dohyun' }];
  if (state.appointment) items.push({ time: state.appointment.time, name: clients.find(c => c.id === state.appointment.clientId).name, type: '새로 선택한 일정 · 이 탭에서만 유지', id: state.appointment.clientId });
  items.sort((a, b) => a.time.localeCompare(b.time));
  return items.map(item => `<div class="schedule-item"><span class="schedule-time">${item.time}</span><div class="schedule-info"><strong>${item.name} 님</strong><p>${item.type}</p></div><button class="text-link" data-client="${item.id}">리포트${icon('chevron')}</button></div>`).join('');
}
function counselorPage() {
  const sharedCount = clients.filter(canView).length;
  return `${heading('A BETTER START TO EVERY SESSION', '지은님, <span>깊은 이해를 준비하는 하루.</span>', '내담자의 이야기를 미리 살피고, 더 가까운 대화를 시작해 보세요.')}
  <div class="stats-row">${[
    { label: '함께하는 내담자', value: 4, unit: '명', foot: '모두 가상 내담자입니다', icon: 'users' },
    { label: '공유된 마음 리포트', value: sharedCount, unit: '건', foot: '내담자가 공유에 동의한 리포트', icon: 'report' },
    { label: '오늘의 상담', value: 2 + Number(Boolean(state.appointment)), unit: '건', foot: '제품 체험을 위한 예시 일정', icon: 'calendar' },
    { label: '공유 동의 대기', value: 4 - sharedCount, unit: '명', foot: '동의 전에는 리포트가 잠겨 있어요', icon: 'shield' },
  ].map(item => `<section class="card stat-card"><div class="stat-label">${item.label}${icon(item.icon)}</div><div class="stat-value">${item.value}<span>${item.unit}</span></div><div class="stat-foot">${item.foot}</div></section>`).join('')}</div>
  <section class="card table-card">${searchToolbar('내담자의 최근 이야기')}<div id="client-table-slot">${clientTable()}</div></section>
  <div class="counselor-lower"><section class="card schedule-card"><div class="card-head"><h2 class="card-title">오늘의 상담 일정</h2><button class="text-link" data-page="schedule">전체 일정${icon('chevron')}</button></div>${scheduleList()}</section><section class="card insight-card"><div class="card-head"><h2 class="card-title">대화를 더 깊게 만드는 준비</h2>${icon('leaf')}</div><p>리포트 속 요약은 대화의 시작점이에요.<br>내담자의 말로 다시 확인하며, 각자의 맥락을 함께 이해해 주세요.</p><div class="insight-line">${icon('shield')}샘플 분석은 임상 진단이나 위험도 평가가 아닙니다.</div><button class="text-link" data-page="reports" style="margin-top:17px">공유된 리포트 살펴보기${icon('arrow')}</button></section></div>`;
}
function clientsPage() { return `${heading('PEOPLE AND THEIR STORIES', '함께하는 내담자', '각자의 속도로 시작한 이야기들을 한곳에서 살펴보세요.')}<div class="report-banner">${icon('lock')}<p>가상 내담자 목록입니다. <strong>공유에 동의한 리포트만 열람할 수 있어요.</strong><br>서연님의 리포트는 내담자 공간에서 공유 동의를 체험한 뒤 열립니다.</p></div><section class="card table-card">${searchToolbar('전체 내담자 · 4명')}<div id="client-table-slot">${clientTable()}</div></section>`; }
function reportsPage() { return `${heading('CONVERSATIONS INTO UNDERSTANDING', '대화 분석 리포트', '흩어져 있던 이야기를 이어, 상담의 시작을 조금 더 편안하게.')}<div class="report-banner">${icon('report')}<p><strong>대화에서 발견한 주제와 맥락을 살펴보세요.</strong><br>전체 대화 대신 동의한 요약과 발췌가 표시됩니다. 모든 분석은 예시 데이터입니다.</p></div><section class="card table-card">${searchToolbar(`공유 동의된 리포트 · ${clients.filter(canView).length}건`)}<div id="client-table-slot">${clientTable(true)}</div></section>`; }
function schedulePage() { return `${heading('MAKE ROOM FOR CONVERSATION', '마음을 만나는 시간', '상담 전 리포트를 살펴보고, 한 사람의 이야기를 맞이할 준비를 해요.')}<div class="wide-grid"><section class="card schedule-card"><div class="card-head"><h2 class="card-title">${dateText()} · 상담 일정</h2><span class="small-tag">가상 일정</span></div>${scheduleList()}</section><aside class="aside-column"><section class="card report-sidebar"><h3>새 상담 일정 선택</h3><p>리포트에서 내담자를 선택한 뒤, 상담 시간을 지정할 수 있어요. 실제 예약은 진행되지 않습니다.</p><button class="primary-button" data-page="reports">${icon('report')}리포트에서 상담 준비하기</button>${state.appointment ? '<button class="secondary-button" data-action="cancel-appointment">체험으로 추가한 일정 취소</button>' : ''}</section></aside></div>`; }

function navigate(page, { focus = true } = {}) {
  const oldRole = state.role;
  if (clientNav.some(item => item.id === page)) state.role = 'client';
  else if (counselorNav.some(item => item.id === page) || page === 'detail') state.role = 'counselor';
  else page = state.role === 'client' ? 'home' : 'overview';
  if (page === 'detail' && !canView(clients.find(c => c.id === state.selectedClient) || clients[0])) page = 'reports';
  state.page = page;
  state.mobileMenu = false;
  if (oldRole !== state.role) state.query = '';
  if (location.hash !== `#${page}`) history.replaceState(null, '', `#${page}`);
  render({ focus });
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function updateMobileAccessibility() {
  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const sidebar = $('#sidebar');
  sidebar.inert = isMobile && !state.mobileMenu;
  if (isMobile && state.mobileMenu) {
    $('.workspace').inert = true;
    document.body.style.overflow = 'hidden';
  } else {
    $('.workspace').inert = false;
    document.body.style.overflow = '';
  }
}

let toastTimer;
function toast(text) {
  clearTimeout(toastTimer);
  const element = $('#toast');
  element.textContent = text;
  element.classList.add('visible');
  toastTimer = setTimeout(() => element.classList.remove('visible'), 3500);
}
let modalReturnFocus = null;
function openModal(title, content, actions = '') {
  modalReturnFocus = document.activeElement;
  $('#modal-root').innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="modal-header"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="modal-close" aria-label="대화상자 닫기">${icon('x')}</button></div>${content}${actions ? `<div class="modal-actions">${actions}</div>` : ''}</section></div>`;
  $('#app').inert = true;
  document.body.style.overflow = 'hidden';
  $('.modal').focus();
}
function closeModal() {
  $('#modal-root').innerHTML = '';
  $('#app').inert = false;
  document.body.style.overflow = '';
  if (modalReturnFocus?.isConnected) modalReturnFocus.focus({ preventScroll: true });
  else $('#main-content')?.focus({ preventScroll: true });
  updateMobileAccessibility();
}
function shareDialog() {
  if (state.shared) {
    openModal('내 이야기를 공유하는 방법', '<p>현재 이 탭의 상담사 공간에 서연님의 샘플 리포트가 표시되고 있어요. 언제든 공유 동의를 철회할 수 있습니다.</p><div class="modal-info"><strong>공유 중인 항목</strong><ul><li>대화 주제와 요약, 샘플 대화 발췌</li><li>일주일의 감정 기록 추이</li><li>직접 저장한 “함께 전하고 싶은 말”</li></ul></div><p style="margin-top:16px">실제 전송이나 외부 저장은 이루어지지 않습니다.</p>', '<button class="secondary-button" data-action="share-revoke">공유 동의 철회</button><button class="primary-button" data-action="modal-close">확인</button>');
    return;
  }
  openModal('내가 선택하는 마음의 연결', `<p>김지은 상담사(가상 프로필)에게 보여줄 항목을 확인해 주세요. 동의하면 이 탭의 상담사 공간에서 리포트를 확인할 수 있어요.</p><div class="modal-info"><strong>리포트에 포함되는 내용</strong><ul><li>대화 주제와 요약, 샘플 대화 발췌</li><li>일주일의 감정 기록 추이</li><li>직접 저장한 “함께 전하고 싶은 말”</li></ul></div><p style="margin-top:15px;font-size:11px">감정 일기 원문과 현재 입력한 전체 대화는 포함되지 않아요. 실제 정보 전송이 없는 UI 체험이며, 동의는 언제든 철회할 수 있습니다.</p><label class="consent-label"><input id="share-consent" type="checkbox" /><span>위 항목을 확인했으며, 이 탭의 상담사 화면에 리포트를 표시하는 데 동의합니다.</span></label>`, '<button class="secondary-button" data-action="modal-close">다음에 할게요</button><button class="primary-button" id="share-confirm" data-action="share-confirm" disabled>동의하고 공유 체험</button>');
}
function appointmentDialog() {
  const person = clients.find(c => c.id === state.selectedClient);
  openModal('다음 대화를 준비해요', `<p>${person.name} 님과의 ${dateText()} 상담 시간을 선택해 주세요. 실제 예약이나 알림은 전송되지 않아요.</p><div class="appointment-options" role="group" aria-label="상담 시간 선택">${['10:00', '11:00', '17:00'].map(time => `<button class="appointment-option" data-time="${time}" aria-pressed="false">${time}</button>`).join('')}</div><p style="margin-top:18px;font-size:10px">기존 체험 일정이 있으면 새로 선택한 시간으로 변경돼요.</p>`, '<button class="secondary-button" data-action="modal-close">취소</button><button class="primary-button" id="appointment-confirm" data-action="appointment-confirm" disabled>이 시간으로 선택</button>');
}
function historyDialog(index) {
  const item = seedHistory[index];
  openModal('지난 마음 대화', `<div class="eyebrow">${shortDate(dateAt(item.offset))} · SAMPLE CONVERSATION</div><p style="font-size:14px;color:#89709b;margin-bottom:17px">${item.title}</p><div class="dialog-list"><div class="dialog-list-item"><strong>서연님</strong><p>${item.text}</p></div><div class="dialog-list-item"><strong>마음결 · 응답 예시</strong><p>이야기를 나눠주셔서 고마워요. 그 순간에 어떤 마음이 들었는지 조금 더 들려주실 수 있나요?</p></div></div><div class="topic-tags"><span class="topic-tag"># ${item.theme}</span></div>`, '<button class="secondary-button" data-action="modal-close">닫기</button><button class="primary-button" data-action="go-chat">지금의 마음 이야기하기</button>');
}

function sampleReply(text, count) {
  if (/잠|수면|밤/.test(text)) return '생각이 많아 쉬기 어려운 밤을 보내고 계시는군요. 몸은 쉬고 싶은데 마음은 계속 바쁜 느낌일 수도 있겠어요.\n\n잠들기 전에 특히 자주 떠오르는 생각이 있나요? 지금 가장 마음에 남는 한 가지만 이야기해 주셔도 괜찮아요.';
  if (/일|직장|회사|업무|퇴근/.test(text)) return '일에 대한 마음을 나눠주셔서 고마워요. 잘하고 싶은 마음과 쉬고 싶은 마음이 함께 있을 수도 있겠어요.\n\n최근에 특히 마음을 무겁게 했던 순간이 있었나요? 편한 만큼만 들려주세요.';
  if (/친구|사람|관계|가족/.test(text)) return '사람과의 관계에서 느끼는 마음은 한마디로 설명하기 어려울 때가 있죠. 여기서는 천천히 풀어내셔도 괜찮아요.\n\n그 관계에서 서연님이 가장 바라고 있었던 것은 무엇이었을까요?';
  if (/좋|행복|편안|고마|산책/.test(text)) return '조금 편안해진 순간이 있었다니, 그 마음을 함께 나눠주셔서 고마워요. 작은 순간도 나에게 의미 있게 남을 수 있겠어요.\n\n그때 무엇이 마음을 편하게 해주었는지 조금 더 들려주실래요?';
  if (/지친|지쳐|힘들|스트레스|부담/.test(text)) return '지금 조금 지치고 무거운 마음이 드는군요. 그 마음을 꺼내놓는 데에도 에너지가 필요했을 거예요.\n\n언제부터 이런 마음이 들었는지, 오늘 특별히 기억에 남는 순간이 있었는지 이야기해 볼까요?';
  const replies = ['이야기해 주셔서 고마워요. 마음을 꼭 정리해서 말하지 않아도 괜찮아요.\n\n그 순간에 어떤 감정이 가장 크게 느껴졌나요? 떠오르는 단어 하나부터 시작해도 좋아요.', '지금의 마음을 계속 나누고 계시네요. 서연님의 속도로 천천히 이야기해 주세요.\n\n이 이야기를 하면서 새롭게 떠오른 생각이나 마음이 있나요?', '말씀해 주신 경험을 조금 더 이해하고 싶어요.\n\n지금 서연님에게 가장 필요하다고 느껴지는 것은 무엇인가요? 잠깐의 쉼이어도, 더 이야기하는 시간이어도 괜찮아요.'];
  return replies[(count - 1) % replies.length];
}
function sendMessage(text, fromKeyboard = false) {
  text = text.trim();
  if (!text || state.isTyping) return;
  if (text.length > 2000) { toast('메시지는 2,000자 이내로 적어주세요.'); return; }
  state.messages.push({ role: 'user', text, time: timeText() });
  state.chatDraft = '';
  state.isTyping = true;
  render();
  if (fromKeyboard) $('#chat-input')?.focus({ preventScroll: true });
  const count = state.messages.filter(message => message.role === 'user').length;
  state.replyTimer = setTimeout(() => {
    state.messages.push({ role: 'assistant', text: sampleReply(text, count), time: timeText() });
    state.isTyping = false;
    if (state.page === 'chat' && state.role === 'client') {
      const inputFocused = document.activeElement?.id === 'chat-input';
      const selectionStart = $('#chat-input')?.selectionStart;
      render();
      if (inputFocused) { $('#chat-input').focus({ preventScroll: true }); $('#chat-input').setSelectionRange(selectionStart, selectionStart); }
    }
  }, 650);
}

const actions = {
  'menu': () => { state.mobileMenu = true; render(); $('#sidebar .nav-item')?.focus(); },
  'menu-close': () => { state.mobileMenu = false; render(); $('.mobile-toggle')?.focus(); },
  'modal-close': closeModal,
  'share': shareDialog,
  'share-confirm': () => { if (!$('#share-consent')?.checked) return; state.shared = true; closeModal(); render({ focus: true }); toast('공유에 동의했어요. 상담사 공간에서 리포트를 확인해 보세요.'); },
  'share-revoke': () => { state.shared = false; closeModal(); if (state.role === 'counselor' && state.page === 'detail' && state.selectedClient === 'seoyeon') navigate('reports'); else render({ focus: true }); toast('공유 동의를 철회했어요. 상담사 공간에서 리포트가 잠겼어요.'); },
  'print': () => window.print(),
  'save-note': () => {
    const value = $('#report-note').value.trim();
    if (state.role === 'counselor') state.counselorNotes[state.selectedClient] = value;
    else state.reportNote = value;
    render({ focus: true }); toast('메모를 이 탭에 저장했어요.');
  },
  'appointment': appointmentDialog,
  'appointment-confirm': () => { const selected = $('.appointment-option.selected'); if (!selected) return; state.appointment = { time: selected.dataset.time, clientId: state.selectedClient }; closeModal(); navigate('schedule'); toast('이 탭의 예시 일정에 추가했어요. 실제 예약은 진행되지 않았어요.'); },
  'cancel-appointment': () => { openModal('체험 일정을 취소할까요?', '<p>직접 추가한 일정만 삭제됩니다. 기존 샘플 일정은 유지돼요.</p>', '<button class="secondary-button" data-action="modal-close">돌아가기</button><button class="primary-button" data-action="confirm-cancel-appointment">일정 취소</button>'); },
  'confirm-cancel-appointment': () => { state.appointment = null; closeModal(); render({ focus: true }); toast('체험으로 추가한 일정을 취소했어요.'); },
  'go-chat': () => { closeModal(); navigate('chat'); },
  'new-chat': () => { openModal('새로운 마음 대화를 시작할까요?', '<p>현재 탭에 입력한 대화는 지워져요. 지난 샘플 대화와 감정 기록은 유지됩니다.</p>', '<button class="secondary-button" data-action="modal-close">이어서 이야기하기</button><button class="primary-button" data-action="confirm-new-chat">새 대화 시작</button>'); },
  'confirm-new-chat': () => { clearTimeout(state.replyTimer); state.isTyping = false; state.chatDraft = ''; state.messages = [{ role: 'assistant', text: welcome, time: '지금' }]; closeModal(); render(); $('#chat-input')?.focus(); toast('새로운 마음 대화를 시작해요.'); },
  'journal-prompt': () => { state.journalDraft = '오늘 나를 조금 편안하게 해준 것은…\n'; render(); $('#journal-input').focus(); $('#journal-input').setSelectionRange(state.journalDraft.length, state.journalDraft.length); },
  'history-all': () => { openModal('지난 마음 대화 모아보기', `<div class="dialog-list">${seedHistory.map((item, index) => `<button class="history-row" data-history="${index}"><span class="history-icon">${icon('chat')}</span><span class="history-copy"><strong>${item.title}</strong><span>${shortDate(dateAt(item.offset))} · 샘플 대화</span></span>${icon('chevron')}</button>`).join('')}</div>`); },
  'notifications': () => { state.notificationsRead = true; $('.notification-dot')?.remove(); openModal('마음결의 작은 소식', '<div class="dialog-list"><div class="dialog-list-item"><strong>서두르지 않아도 괜찮아요 🌿</strong><p>오늘의 마음을 체크하고, 편한 이야기부터 시작해 보세요. 대화와 감정 기록을 둘러볼 수 있어요.</p></div><div class="dialog-list-item"><strong>내담자와 상담사, 두 공간을 체험해 보세요</strong><p>상단의 공간 전환으로 상담사 화면을 열 수 있어요. 서연님의 리포트는 공유 동의 후에 표시됩니다.</p></div></div>'); },
  'profile': () => openModal('지금 체험 중인 프로필', `<p>${state.role === 'client' ? '이서연 · 내담자' : '김지은 · 마음숲 심리상담센터 상담사'}</p><div class="modal-info"><strong>제품을 둘러보기 위한 가상 계정이에요.</strong><ul><li>회원가입이나 실제 로그인이 필요하지 않아요.</li><li>상단 버튼으로 두 역할을 바꿔볼 수 있어요.</li><li>새로고침하면 입력과 선택이 초기화돼요.</li></ul></div>`),
  'privacy': () => openModal('내 마음의 주인은 나니까', `<p>이 프로토타입에서 입력한 대화, 일기, 메모는 현재 탭의 메모리에만 유지됩니다. 새로고침하거나 탭을 닫으면 사라져요.</p><div class="modal-info"><strong>공유와 보관 안내</strong><ul><li>외부 AI, 서버, 분석 도구로 입력을 전송하지 않아요.</li><li>대화와 일기 원문은 상담사 화면에 표시되지 않아요.</li><li>공유 동의 시 요약 리포트와 저장한 메모만 표시해요.</li><li>서체를 불러올 때 Google Fonts에 접속할 수 있어요.</li></ul></div><p style="margin-top:17px">현재 리포트 공유: <strong>${state.shared ? '동의됨 · 이 탭에서만 표시' : '미동의'}</strong></p>`, `${state.shared ? '<button class="secondary-button" data-action="share-revoke">공유 동의 철회</button>' : ''}<button class="primary-button" data-action="modal-close">확인했어요</button>`),
  'help': () => openModal('마음결, 이렇게 만나보세요', '<div class="dialog-list"><div class="dialog-list-item"><strong>01 · 내 마음과 마주하기</strong><p>홈에서 기분을 선택하고, 마음 대화에서 이야기를 나눠보세요. 대화 응답은 정해진 문구를 사용하는 예시입니다.</p></div><div class="dialog-list-item"><strong>02 · 나를 이해하는 기록</strong><p>감정 기록에서 하루를 남기고, 나의 마음 리포트에서 샘플 분석과 함께 전할 메모를 확인하세요.</p></div><div class="dialog-list-item"><strong>03 · 상담사에게 이어지기</strong><p>리포트 공유에 동의한 뒤 상단에서 상담사 공간으로 전환하세요. 리포트 열람, 상담 준비 메모, 예시 일정 선택을 체험할 수 있습니다.</p></div></div><p style="margin-top:18px;font-size:10px">이 서비스는 감정 정리와 상담 준비를 돕는 UI 프로토타입으로, 전문가의 진단과 상담을 대신하지 않습니다.</p>'),
};

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.action) actions[button.dataset.action]?.();
  else if (button.dataset.page) navigate(button.dataset.page);
  else if (button.dataset.role) { state.query = ''; state.role = button.dataset.role; navigate(state.role === 'client' ? 'home' : 'overview'); }
  else if (button.dataset.mood !== undefined) {
    const value = Number(button.dataset.mood);
    state.mood = value; state.moodValues[6] = value + 1;
    render(); $(`[data-mood="${value}"]`)?.focus({ preventScroll: true });
    toast(`오늘의 마음, “${moods[value].label}”로 남겼어요.`);
  }
  else if (button.dataset.prompt) sendMessage(button.dataset.prompt, event.detail === 0);
  else if (button.dataset.history !== undefined) historyDialog(Number(button.dataset.history));
  else if (button.dataset.client) {
    const person = clients.find(client => client.id === button.dataset.client);
    if (!person || !canView(person)) { toast('내담자의 공유 동의가 필요해요.'); return; }
    state.selectedClient = person.id; navigate('detail');
  }
  else if (button.dataset.time) {
    $$('.appointment-option').forEach(option => { option.classList.remove('selected'); option.setAttribute('aria-pressed', 'false'); });
    button.classList.add('selected'); button.setAttribute('aria-pressed', 'true');
    $('#appointment-confirm').disabled = false;
  }
  else if (button.dataset.deleteEntry) {
    const id = Number(button.dataset.deleteEntry);
    openModal('이 마음 기록을 삭제할까요?', '<p>직접 남긴 기록이 이 탭에서 삭제돼요. 삭제한 기록은 되돌릴 수 없습니다.</p>', `<button class="secondary-button" data-action="modal-close">돌아가기</button><button class="primary-button" id="delete-entry-confirm">기록 삭제</button>`);
    $('#delete-entry-confirm').addEventListener('click', () => { state.journals = state.journals.filter(entry => entry.id !== id); closeModal(); render({ focus: true }); toast('마음 기록을 삭제했어요.'); }, { once: true });
  }
});
function $$(selector, root = document) { return [...root.querySelectorAll(selector)]; }
document.addEventListener('input', event => {
  if (event.target.id === 'chat-input') {
    state.chatDraft = event.target.value;
    $('.send-button').disabled = state.isTyping || !state.chatDraft.trim();
    event.target.style.height = 'auto'; event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`;
  }
  if (event.target.id === 'journal-input') { state.journalDraft = event.target.value; $('#journal-count').textContent = state.journalDraft.length; }
  if (event.target.id === 'client-search') { state.query = event.target.value; $('#client-table-slot').innerHTML = clientTable(state.page === 'reports'); }
});
document.addEventListener('change', event => {
  if (event.target.id === 'share-consent') $('#share-confirm').disabled = !event.target.checked;
});
document.addEventListener('submit', event => {
  if (event.target.id === 'chat-form') { event.preventDefault(); sendMessage($('#chat-input').value, true); }
  if (event.target.id === 'journal-form') {
    event.preventDefault();
    const text = $('#journal-input').value.trim();
    if (!text) return;
    if (state.mood === null) { toast('기록하기 전에 오늘의 마음을 먼저 선택해 주세요.'); $('[data-mood="2"]').focus({ preventScroll: false }); return; }
    state.journals.unshift({ id: Date.now(), offset: 0, mood: state.mood, title: text.split('\n')[0].slice(0, 36), text, sample: false });
    state.journalDraft = ''; render({ focus: true }); toast('오늘의 마음 한 조각을 남겼어요.');
  }
});
document.addEventListener('keydown', event => {
  document.body.dataset.input = 'keyboard';
  if (event.target.id === 'chat-input' && event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); sendMessage(event.target.value, true); }
  const modal = $('.modal');
  const mobileMenu = state.mobileMenu && window.matchMedia('(max-width: 760px)').matches;
  if (event.key === 'Escape') {
    if (modal) { event.preventDefault(); closeModal(); }
    else if (mobileMenu) { event.preventDefault(); actions['menu-close'](); }
  }
  if (event.key === 'Tab' && (modal || mobileMenu)) {
    const container = modal || $('#sidebar');
    const focusable = $$('button:not(:disabled), a[href], input, textarea, select', container).filter(element => element.getClientRects().length);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === container)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === container)) { event.preventDefault(); first?.focus(); }
  }
});
document.addEventListener('click', event => { if (event.target.classList.contains('modal-backdrop')) closeModal(); });
window.addEventListener('hashchange', () => navigate(location.hash.slice(1)));
window.addEventListener('resize', () => { if (!$('.modal')) updateMobileAccessibility(); });
navigate(location.hash.slice(1) || 'home', { focus: false });
