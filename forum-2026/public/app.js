(() => {
  'use strict';
  const app = document.querySelector('#app');
  const dialog = document.querySelector('#edit-dialog');
  const toastEl = document.querySelector('#toast');
  const safelyRead = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback)); } catch { return fallback; } };
  const state = { eventId:new URLSearchParams(location.search).get('id') || '', page: new URLSearchParams(location.search).get('page') || 'home', day:'2026-12-07', data:null, loading:true, offline:false, admin:false, adminEnabled:false, adminTab:'announcements', adminData:null, expanded:new Set(), timer:null };
  // Авторські чернетки анонсів на основі тем і слотів наданої робочої програми.
  // Непідтверджені фото, ведучі, анімація та заявлені результати не публікуються як факти.
  const EDITORIAL = {
    "071": {"category": "ARRIVAL", "posterTitle": "Початок — із першої зустрічі.", "teaser": "Гори, нові знайомства й перші хвилини великого форуму. Починаємо з прибуття та поселення.", "why": "Дізнатися, де реєстрація та з чого стартує твій день.", "speakerNames": "", "tone": "boarding"},
    "072": {"category": "TOGETHER", "posterTitle": "Один стіл. Багато нових історій.", "teaser": "Перша спільна вечеря — хороший момент познайомитися з тими, з ким проведеш наступні дні.", "why": "Час для розмов і першого знайомства.", "speakerNames": "", "tone": "social"},
    "073": {"category": "THE BEGINNING", "posterTitle": "Знайомство, яке задає тон.", "teaser": "Що нас чекає у Плаї? Програма, правила, знайомство, представлення команд і завдання після форуму.", "why": "Зрозуміти логіку заходу та наступні кроки.", "speakerNames": "", "tone": "chapter"},
    "081": {"category": "MORNING", "posterTitle": "Починаємо день разом.", "teaser": "Сніданок перед відкриттям і насиченою програмою другого дня.", "why": "Спокійно підготуватися до першого навчального блоку.", "speakerNames": "", "tone": "social"},
    "082": {"category": "OPENING", "posterTitle": "Форум офіційно розпочинається.", "teaser": "Старт події, яка збирає молодь ПРМТУ навколо спільних ідей, розвитку та дії.", "why": "Відчути масштаб форуму та його головні акценти.", "speakerNames": "Олег Григорюк", "tone": "hero", "speakerPhotoUrl": "https://storage.mtwtu.org.ua/cache/image/68382f4a59b21.jpg?s=1564257817787e6bdf72cf50e1c88b4d&w=1024", "speakerPhotoCredit": "Фото: офіційний сайт ПРМТУ (погодження використання для форуму — організаторам)"},
    "083": {"category": "OPEN TALK", "posterTitle": "Які можливості відкриває профспілка?", "teaser": "Не формальна панель, а розмова про інструменти, перспективи й реальну роль молоді у профспілковому русі.", "why": "Почути різні погляди партнерів і поставити для себе важливі запитання.", "speakerNames": "Учасники дискусії — за робочою програмою", "tone": "debate"},
    "084": {"category": "RESET", "posterTitle": "15 хвилин на перезавантаження.", "teaser": "Коротка кава-пауза між змістовними блоками.", "why": "Час перепочити й поспілкуватися.", "speakerNames": "", "tone": "interlude"},
    "085": {"category": "SKILL LAB", "posterTitle": "Коли суперечка стає діалогом.", "teaser": "Медіація — про пошук рішень там, де позиції здаються несумісними. Блок запланований із практичним інтерактивом.", "why": "Побачити інший спосіб роботи з конфліктами.", "speakerNames": "Сергєєва · Пелих", "tone": "skills"},
    "086": {"category": "CAREER LAB", "posterTitle": "Твоє CV працює на тебе?", "teaser": "Як представити досвід і навички так, щоб резюме говорило за тебе. У програмі передбачено інтерактив.", "why": "Поглянути на резюме очима того, хто його читає.", "speakerNames": "Григорюк · Сергєєв", "tone": "career"},
    "087": {"category": "LUNCH", "posterTitle": "Пауза, яка потрібна.", "teaser": "Обід і час відновити енергію перед довгою післяобідньою програмою.", "why": "Набратися сил.", "speakerNames": "", "tone": "social"},
    "088": {"category": "UNIONIZE", "posterTitle": "А що, як профспілку можна прожити?", "teaser": "Unionize займає центральне місце у другому дні: спільний формат навколо восьми столів. Правила та завдання оголосять організатори.", "why": "Бути частиною спільного досвіду, не лише слухачем.", "speakerNames": "Модератори — за робочою програмою", "tone": "feature"},
    "089": {"category": "RESET", "posterTitle": "Між двома актами.", "teaser": "Коротка перерва перед продовженням Unionize.", "why": "Перезавантажитися й повернутися до спільної роботи.", "speakerNames": "", "tone": "interlude"},
    "08a": {"category": "UNIONIZE", "posterTitle": "Другий акт. Інші рішення.", "teaser": "Продовження Unionize після перерви. Деталі механіки стануть відомі після погодження організаторами.", "why": "Довести спільну роботу до результату.", "speakerNames": "Модератори — за робочою програмою", "tone": "feature"},
    "08b": {"category": "REFLECTION", "posterTitle": "Що залишилося після гри?", "teaser": "Підсумок великого командного блоку: зібрати висновки й побачити загальну картину.", "why": "Осмислити досвід і результати роботи.", "speakerNames": "", "tone": "chapter"},
    "08c": {"category": "DINNER", "posterTitle": "Вечір починається зі спільної вечері.", "teaser": "Час для перепочинку після інтенсивної програми.", "why": "Поговорити за межами залів.", "speakerNames": "", "tone": "social"},
    "08d": {"category": "BOWLING NIGHT", "posterTitle": "Сьогодні зустрічаємося на доріжках.", "teaser": "Battle of Crews — запланована спільна вечірня подія для всієї групи. Турнірний формат ще погоджується.", "why": "Побути разом у неформальній атмосфері.", "speakerNames": "", "tone": "night"},
    "091": {"category": "MORNING", "posterTitle": "Новий день. Нові теми.", "teaser": "Сніданок перед третім насиченим днем форуму.", "why": "Підготуватися до ранкових тренінгів.", "speakerNames": "", "tone": "social"},
    "092": {"category": "THEN / NOW", "posterTitle": "Звідки взялися профспілки?", "teaser": "Історія профспілкового руху: від витоків до рішень, які впливають на людей сьогодні. За програмою — квіз у навчальному блоці.", "why": "Побачити історію як ключ до розуміння теперішнього.", "speakerNames": "ГО «Трудові Ініціативи»", "tone": "history"},
    "093": {"category": "CASE FILES", "posterTitle": "За кожним документом — реальна історія.", "teaser": "Документи й кейси: погляд на практичні ситуації, рішення та їхні наслідки.", "why": "Побачити, як знання працюють у конкретних ситуаціях.", "speakerNames": "Григорюк · Сухроб", "tone": "legal"},
    "094": {"category": "RESET", "posterTitle": "Кава перед наступним блоком.", "teaser": "Невелика пауза між паралельними заняттями та спільним тренінгом.", "why": "Відновити концентрацію.", "speakerNames": "", "tone": "interlude"},
    "095": {"category": "ORGANIZING", "posterTitle": "Як перетворити ідею на спільну дію?", "teaser": "Органайзинг — про людей, довіру, залучення й силу добре організованої спільноти.", "why": "Знайти підхід до об’єднання людей навколо мети.", "speakerNames": "Храпко · Олещук · Левченко", "tone": "skills"},
    "096": {"category": "LUNCH", "posterTitle": "Час видихнути.", "teaser": "Спільний обід перед виїзною активністю.", "why": "Відпочити та підготуватися до другої половини дня.", "speakerNames": "", "tone": "social"},
    "097": {"category": "OUTSIDE", "posterTitle": "За межами конференц-залу.", "teaser": "Запланована екскурсія на екоферму «Плай». Точка збору та можливі зміни через погоду уточнюються.", "why": "Побачити іншу сторону локації форуму.", "speakerNames": "", "tone": "outdoors"},
    "098": {"category": "DINNER", "posterTitle": "Зустрінемося за вечерею.", "teaser": "Спільна вечеря після екскурсійної частини дня.", "why": "Зібратися перед фінальною вечірньою програмою.", "speakerNames": "", "tone": "social"},
    "099": {"category": "AFTERGLOW", "posterTitle": "Що ми заберемо із собою?", "teaser": "Рефлексія, нагородження та план ініціатив після форуму. Мить, коли досвід перетворюється на наступні кроки.", "why": "Зафіксувати найважливіше та побачити результат.", "speakerNames": "", "tone": "chapter"},
    "09a": {"category": "THE NIGHT", "posterTitle": "Фінал, який хочеться запам’ятати.", "teaser": "Одна спільна фінальна вечірка для всіх учасників. DJ та ведучий — у планах, деталі й час завершення уточнюються.", "why": "Закрити форумний день на спільній хвилі.", "speakerNames": "", "tone": "night"},
    "101": {"category": "MORNING", "posterTitle": "Останній ранок у Плаї.", "teaser": "Сніданок перед завершальними активностями та дорогою додому.", "why": "Почати день без поспіху.", "speakerNames": "", "tone": "social"},
    "102": {"category": "MOUNTAIN AIR", "posterTitle": "Погляд на Карпати з іншої висоти.", "teaser": "Підйомники передбачені робочою програмою. Проведення залежить від погодних умов, режиму роботи та вимог безпеки.", "why": "За погодженням — побачити гори з нового ракурсу.", "speakerNames": "", "tone": "outdoors"},
    "103": {"category": "CHECK-OUT", "posterTitle": "Збираємо речі. Зберігаємо враження.", "teaser": "Час для виселення та підготовки до трансферу. Деталі точки збору ще погоджуються.", "why": "Без поспіху підготуватися до відправлення.", "speakerNames": "", "tone": "logistics"},
    "104": {"category": "LUNCH", "posterTitle": "Останній спільний обід.", "teaser": "Завершальна зустріч за столом перед дорогою додому.", "why": "Подякувати одне одному та попрощатися.", "speakerNames": "", "tone": "social"},
    "105": {"category": "WHAT NEXT", "posterTitle": "Форум закінчується. Дія — ні.", "teaser": "Попередній час виїзду з «Плаю». Деталі трансферу уточнюються.", "why": "Повернутися додому з ідеями та наступними кроками.", "speakerNames": "", "tone": "chapter"},
  };
  const CHAPTERS = [
   {id:'2026-12-07',idx:'01',small:'ПРИБУТТЯ',name:'Знайомство',tag:'Починається нова історія',sub:'Від реєстрації до першого спільного вечора.',tone:'chapter-one'},
   {id:'2026-12-08',idx:'02',small:'ЛЮДИ ТА ІДЕЇ',name:'У русі',tag:'Досвід, який проживаємо разом',sub:'Дискусії, практичні блоки, Unionize і Bowling Night.',tone:'chapter-two'},
   {id:'2026-12-09',idx:'03',small:'СПІЛЬНА ДІЯ',name:'Більше ніж слова',tag:'Від кейсів до власних рішень',sub:'Навчання, екскурсія, підсумки та фінальний вечір.',tone:'chapter-three'},
   {id:'2026-12-10',idx:'04',small:'ПРОДОВЖЕННЯ',name:'Що далі?',tag:'Найважливіше відбувається після',sub:'Завершальний ранок і повернення додому.',tone:'chapter-four'}
  ];
  const metaFor = e => ({...EDITORIAL[e.id],...Object.fromEntries(['category','posterTitle','teaser','why','speakerNames','speakerPhotoUrl','speakerPhotoCredit'].filter(k=>e[k]).map(k=>[k,e[k]]))});
  const safeImg = url => /^https:\/\/[a-z0-9.-]+\/(?!\/)/i.test(url||'') ? url : '';
  const isFeature = e => ['082','083','085','086','088','08a','08d','092','093','095','097','099','09a','102'].includes(e.id) || e.feature === true;
  const isMajor = e => isFeature(e) || (e.category==='special');
  const chapterOf = date => CHAPTERS.find(c=>c.id===date) || CHAPTERS[0];
  const dayNames = { '2026-12-07':['07','Понеділок'], '2026-12-08':['08','Вівторок'], '2026-12-09':['09','Середа'], '2026-12-10':['10','Четвер'] };
  const icon = (name,cls='') => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const kyivDay = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const kyivClock = () => new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Kyiv',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
  const fmtDate = s => new Intl.DateTimeFormat('uk-UA',{timeZone:'Europe/Kyiv',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}).format(new Date(s));
  const formatRange = e => e.start && e.end ? `${e.start}–${e.end}${e.end<e.start?' (+1 день)':''}` : e.start ? `з ${e.start}` : e.end ? `до ${e.end}` : 'Час уточнюється';
  const sorted = list => [...list].sort((a,b)=>a.date.localeCompare(b.date)||(a.start||'00:00').localeCompare(b.start||'00:00')||a.title.localeCompare(b.title));
  const eventEnd = e => e.end ? Number(e.end.slice(0,2))*60+Number(e.end.slice(3)) : null;
  function eventActive(e){
    if(!e.start || !e.end || e.status==='canceled')return false;
    const day=kyivDay(),time=kyivClock();
    if(day===e.date)return time>=e.start&&(e.end>e.start?time<e.end:true);
    if(e.end<e.start){ const next=new Date(`${e.date}T12:00:00+02:00`);next.setUTCDate(next.getUTCDate()+1);const nextDay=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(next);return day===nextDay && time<e.end; }
    return false;
  }
  function nextEvent() {
    const events=sorted(state.data?.events||[]).filter(e=>e.start&&e.status!=='canceled');
    const now=kyivDay()+' '+kyivClock();
    return events.find(e=>`${e.date} ${e.start}`>now) || null;
  }
  const currentEvent = () => sorted(state.data?.events||[]).find(eventActive);
  function noticeCount(){
    const seen=Number(localStorage.getItem('pulse-updates-seen')||0);
    return (state.data?.announcements||[]).filter(a=>Date.parse(a.createdAt)>seen).length;
  }
  function setViewed(){localStorage.setItem('pulse-updates-seen',Date.now().toString());document.querySelector('#unread-dot').hidden=true;}
  function notify(message){toastEl.textContent=message;toastEl.classList.add('show');clearTimeout(state.timer);state.timer=setTimeout(()=>toastEl.classList.remove('show'),4300);}
  function setPage(p) {
    if(!['home','program','event','map','info','updates','admin'].includes(p))p='home';
    state.page=p;
    if(location.protocol!=='file:')history.pushState(null,'',p==='home'?'/':`/?page=${p}${p==='event'?'&id='+encodeURIComponent(state.eventId):''}`);
    render();
    scrollTo({top:0,behavior:'instant'});
    if(p==='updates')setViewed();
    if(p==='admin')loadAdmin();
  }
  async function api(url, options) {
    const response=await fetch(url,{...options,headers:{'Content-Type':'application/json',...(options?.headers||{})}});
    let data;
    try{data=await response.json();}catch{throw new Error('Сервер повернув некоректну відповідь');}
    if(!response.ok)throw new Error(data.error||`HTTP ${response.status}`);
    return data;
  }
  async function refresh(silent=false) {
    try {
      const previous=state.data?.announcements?.[0]?.id;
      const data=await api('/api/public');
      state.data=data;state.offline=false;state.loading=false;
      if(previous && data.announcements?.[0]?.id!==previous)notify('Нове повідомлення організаторів');
      if(!silent)render(); else render();
    } catch(e) {
      state.offline=true;state.loading=false;
      if(!state.data){app.innerHTML=`<div class="empty-state" style="margin-top:80px">${icon('wifi','big')}<h3>Не вдалося завантажити дані</h3><p>Підключіться до інтернету та спробуйте ще раз.</p><button class="button" data-action="refresh" style="margin-top:16px">Повторити</button></div>`;return;}
      render();
    }
  }
  function previewNotice(){return state.data?.mode==='preview'?`<div class="release-notice">${icon('info')} Робочий макет · інформація з попередньої програми уточнюється</div>`:'';}
  function dateCaption(){const day=kyivDay();if(day<'2026-12-07'){const diff=Math.ceil((Date.parse('2026-12-07T00:00:00+02:00')-Date.now())/86400000);return `ДО ФОРУМУ · ${diff} ДН.`;}if(day>'2026-12-10')return 'ПІДСУМКИ ФОРУМУ';return `ДЕНЬ ФОРУМУ · ${dayNames[day]?.[0] || '—'} ГРУДНЯ`;}
  function posterImage(e, variant='poster-art'){
    const m=metaFor(e),url=safeImg(m.speakerPhotoUrl);return `<div class="${variant} motif-${esc(m.tone||'feature')}" aria-label="Візуальний анонс події"><div class="art-orbit"></div><span class="poster-art-no">${esc(e.date.slice(8))}<small>DEC</small></span><span class="art-signal">✳</span>${url?`<img loading="lazy" alt="Фото спікера: ${esc(m.speakerNames||'спікер')}. Джерело — ${esc(m.speakerPhotoCredit||'надане організаторами')}" src="${esc(url)}">`:''}<div class="poster-art-caption">MTWTU / ${esc(m.category||'EVENT')}</div></div>`;
  }
  function keynoteCard(e, layout=''){
    const m=metaFor(e);return `<button class="keynote-card ${layout}" data-event="${esc(e.id)}" aria-label="Відкрити анонс ${esc(e.title)}">${posterImage(e)}<div class="keynote-content"><div class="keynote-top"><span>${esc(m.category||'FORUM')}</span><span>${esc(formatRange(e))} / ${esc(e.date.slice(8))}.12</span></div><h3>${esc(e.title)}</h3><p>${esc(m.teaser||e.details||'Подробиці події готуються.')}</p><div class="keynote-bottom"><span>${esc(e.venue||'Локація уточнюється')}</span><span>${e.status==='confirmed'?'Підтверджено':e.status==='canceled'?'Скасовано':'Попередньо'} ↗</span></div></div></button>`;
  }
  function speakerDirectory(events){
    const people=new Map();
    for(const event of events){
      const meta=metaFor(event);
      const names=(meta.speakerNames||'').split(' · ').filter(name=>name&&!name.includes('за робочою програмою')&&!name.startsWith('ГО «'));
      for(const name of names){
        if(!people.has(name))people.set(name,{name,events:[],photo:names.length===1?safeImg(meta.speakerPhotoUrl):'',credit:names.length===1?meta.speakerPhotoCredit:''});
        people.get(name).events.push(event);
      }
    }
    const cards=[...people.values()].map(person=>`<article class="edition-person"><div class="edition-portrait">${person.photo?`<img loading="lazy" src="${esc(person.photo)}" alt="${esc(person.name)}">`:`<span aria-hidden="true">${esc(person.name.split(/\s+/).slice(0,2).map(word=>word[0]).join(''))}</span>`}</div><div class="edition-person-copy"><h3>${esc(person.name)}</h3><p>${person.name==='Олег Григорюк'?'Голова ПРМТУ':'Посада уточнюється'}</p>${person.credit?`<small>${esc(person.credit)}</small>`:''}<div class="edition-person-events">${person.events.map(event=>`<button data-event="${esc(event.id)}">${esc(event.title)} ↗</button>`).join('')}</div></div></article>`).join('');
    return `<section class="edition-people" id="speakers"><header><h2>Спікери</h2><p>Участь за попередньою програмою.</p></header><div class="speaker-directory">${cards||'<p>Склад спікерів уточнюється.</p>'}</div></section>`;
  }
  function gallery(){
    const archive='https://raw.githubusercontent.com/Suhrobss/MY/main/images/';
    const frames=['forum.jpg','FIL_1376.jpg','img-77.jpg'];
    return `<section class="edition-gallery" aria-labelledby="gallery-title"><header><h2 id="gallery-title">Фотоархів</h2><div><button data-gallery="-1" aria-label="Попереднє фото">←</button><button data-gallery="1" aria-label="Наступне фото">→</button></div></header><div class="gallery-track">${frames.map((file,index)=>`<figure><a href="${archive+file}" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="${archive+file}" alt="Архівне фото Молодіжної ради ${index+1}"></a><figcaption>${index+1} / ${frames.length}</figcaption></figure>`).join('')}</div></section>`;
  }
  function home(){
    const events=sorted(state.data.events).filter(e=>e.status!=='canceled');
    const nowEvent=currentEvent(), next=nextEvent(), before=kyivDay()<'2026-12-07';
    const nextUp=nowEvent||next||events[0];
    const highlightIds=['082','085','086','088','08d','093','095','097','09a'];
    const featured=highlightIds.map(id=>events.find(e=>e.id===id)).filter(Boolean);
    const urgent=(state.data.announcements||[]).find(a=>['urgent','important'].includes(a.kind));
    return `<section class="edition-cover" aria-label="MTWTU Youth Forum 2026"><img src="https://raw.githubusercontent.com/Suhrobss/MY/main/images/forum.jpg" alt="Групове фото з архіву MTWTU Youth Forum" fetchpriority="high"><div class="edition-mast" aria-hidden="true">YOUTH<br>FORUM</div><div class="edition-title"><p>MTWTU YOUTH FORUM 2026</p><h1>Молодь <br>збирається.</h1></div></section><div class="edition-rail"><button class="edition-action" data-nav="program">Програма 7–10 грудня ↗</button><button class="edition-action secondary" data-play-film>Відео форуму ▶</button></div><dialog class="film-dialog" aria-label="Відео Молодіжної ради"><div class="film-toolbar"><a href="https://vimeo.com/1175179620" target="_blank" rel="noopener noreferrer">Відкрити у Vimeo ↗</a><form method="dialog"><button type="submit">Закрити ✕</button></form></div><div class="film-player"></div></dialog>
      <div class="poster-meta"><span class="eyebrow">${esc(dateCaption())}</span><span>07—10.12.2026 / ГК «ПЛАЙ»</span></div>${previewNotice()}${state.offline?offlineNotice():''}
      ${urgent?`<div class="live-banner broadcast-important"><span>${icon('alert')}<strong>${esc(urgent.title)}</strong></span><button data-nav="updates">Деталі ${icon('arrow','small')}</button></div>`:''}
      <section class="feature-now"><div class="feature-now-kicker"><span class="signal-dot"></span>${nowEvent?'ЗАРАЗ ВІДБУВАЄТЬСЯ':before?'НАБЛИЖАЄТЬСЯ ФОРУМ':'НАСТУПНА ПОДІЯ'}</div><div class="feature-now-row"><div><h2>${esc(nextUp?.title||'Програма форуму')}</h2><div class="feature-now-meta">${nextUp?esc(formatRange(nextUp)):'07–10 грудня'} · ${esc(nextUp?.venue||'Локація уточнюється')}</div></div><button data-event="${esc(nextUp?.id||'082')}">ПРО ПОДІЮ ↗</button></div></section>
      <section class="chapter-section"><div class="section-topline"><span>07—10 ГРУДНЯ</span></div><div class="chapter-intro"><h2>Чотири глави<br><em>форуму.</em></h2><p>Кожен день — інший ритм, нові люди й нові історії. Обери главу та відкрий її події.</p></div><div class="chapter-grid">${CHAPTERS.map(c=>`<button class="chapter-card ${c.tone}" data-jump-day="${c.id}"><span class="chapter-num">${c.idx} / 04</span><span class="chapter-date">${c.id.slice(8)}<small>DEC</small></span><span class="chapter-action">${esc(c.small)}</span><h3>${esc(c.name)}</h3><p>${esc(c.tag)}</p><span class="chapter-arrow">↗</span></button>`).join('')}</div></section>
      <section class="premieres-section" id="premieres"><div class="section-topline"><span>ПРОГРАМА</span></div><div class="premieres-head"><div><h2>Афіші подій.</h2><p>Досліджуй теми, формати та спікерів. Деякі деталі ще погоджуються.</p></div><button data-nav="program">УСІ ПОДІЇ ↗</button></div><div class="keynote-grid">${featured.map((e,i)=>keynoteCard(e,i===0?'keynote-featured':'')).join('')}</div></section>
      ${speakerDirectory(events)}
      <section class="forum-editorial edition-partners"><h2>Партнери</h2><p>Перелік партнерів буде опубліковано після підтвердження організаторами.</p></section>
      ${gallery()}
      <section class="broadcast-section"><div class="broadcast-illustration" aria-hidden="true"><div class="broadcast-ring one"></div><div class="broadcast-ring two"></div><div class="broadcast-center">!</div></div><div class="broadcast-content"><h2>Оголошення<br><em>організаторів.</em></h2><p>Оперативні зміни програми, повідомлення організаторів і push на телефон за твоєю згодою.</p><button class="button broadcast-button" data-nav="updates">Оголошення ${icon('arrow')}</button></div></section>
      ${footer()}`;
  }
  function newsItem(a){return `<button class="news-item ${esc(a.kind)}" data-nav="updates"><span class="news-type">${icon(a.kind==='urgent'?'alert':'bell')}</span><span class="news-content"><strong>${esc(a.title)}</strong><p>${esc(a.text.length>120?a.text.slice(0,118)+'…':a.text)}</p><small>${esc(fmtDate(a.createdAt))}</small></span>${icon('arrow','small')}</button>`;}
  const pageHead=(label,title,desc) => `<div class="edition-page-head"><div><span class="eyebrow copper">${esc(label)}</span><h1>${esc(title)}</h1><p>${esc(desc)}</p></div><span class="edition-page-date" aria-hidden="true">07—10</span></div>`;
  function scheduleCard(e){const m=metaFor(e);const hasPhoto=!!safeImg(m.speakerPhotoUrl);return `<button class="event-poster-row ${isMajor(e)?'major':''} ${e.status==='canceled'?'canceled':''}" data-event="${esc(e.id)}"><span class="event-row-pict motif-${esc(m.tone||'interlude')}"><span>✳</span>${hasPhoto?`<img loading="lazy" src="${esc(safeImg(m.speakerPhotoUrl))}" alt="">`:''}</span><span class="event-row-main"><span class="event-row-label">${esc(m.category||'EVENT')} · ${esc(e.venue||'Локація уточнюється')}</span><strong>${esc(e.title)}</strong><small>${esc(m.posterTitle||e.details||'Відкрити повний анонс')}</small><span class="event-row-status">${e.status==='confirmed'?'Підтверджено':e.status==='canceled'?'Скасовано':'Попередньо'}</span></span><span class="event-row-arrow">↗</span></button>`;}
  function program(){
    const chapter=chapterOf(state.day);
    const events=sorted(state.data.events).filter(event=>event.date===state.day);
    const slots=new Map();
    for(const event of events){
      const key=event.start||'До '+(event.end||'уточнення');
      if(!slots.has(key))slots.set(key,[]);
      slots.get(key).push(event);
    }
    const tabs=CHAPTERS.map(day=>`<button class="day-tab ${state.day===day.id?'active':''}" data-day="${day.id}" aria-pressed="${state.day===day.id}"><strong>${day.id.slice(8)}</strong><small>${esc(day.name)}</small></button>`).join('');
    const posters=[...slots].map(([time,group])=>`<section class="edition-slot"><div class="edition-slot-time"><strong>${esc(time)}</strong>${group.length>1?'<small>Паралельні сесії</small>':''}</div><div class="edition-slot-posters">${group.map(event=>keynoteCard(event)).join('')}</div></section>`).join('');
    return `${pageHead('07–10 грудня','Програма','Оберіть день і відкрийте афішу події.')}${previewNotice()}${state.offline?offlineNotice():''}
      <div class="day-tabs" aria-label="Дні форуму">${tabs}</div>
      <section class="edition-chapter ${chapter.tone}"><div><span>ГЛАВА ${chapter.idx} / ${esc(chapter.small)}</span><h2>${esc(chapter.name)}</h2><p>${esc(chapter.sub)}</p></div><strong aria-hidden="true">${state.day.slice(8)}</strong></section>
      <div class="edition-timeline">${posters||'<div class="empty-state">Подій поки немає.</div>'}</div>${footer()}`;
  }
  function eventPage(){const e=state.data.events.find(x=>x.id===state.eventId);if(!e)return `<div class="empty-state"><h3>Подію не знайдено</h3><button class="button" data-nav="program">У програму</button></div>`;const m=metaFor(e),ch=chapterOf(e.date);return `<section class="event-detail"><div class="event-detail-header"><button class="text-link" data-nav="program">← ДО ПРОГРАМИ</button><span>CHAPTER ${ch.idx} / 04 · ${esc(m.category||'EVENT')}</span></div><div class="event-cover edition-event-cover"><div class="edition-event-time" aria-hidden="true">${esc(e.start||e.end||e.date.slice(8))}</div><div class="event-cover-copy"><span>${esc(e.date.slice(8))} ГРУДНЯ · ${esc(formatRange(e))}</span><h1>${esc(e.title)}</h1><p>${esc(m.teaser||e.details||'Опис незабаром.')}</p></div></div><div class="event-detail-grid"><section class="event-story">${safeImg(m.speakerPhotoUrl)?posterImage(e):''}<span class="eyebrow copper">ПРО ЩО ЦЯ ПОДІЯ</span><h2>${esc(e.title)}</h2><p class="event-lead">${esc(m.teaser||e.details||'Деталі уточнюються організаторами.')}</p><div class="event-story-divider"></div><span class="eyebrow copper">ЧОМУ ЦЕ ЦІКАВО</span><p>${esc(m.why||'Поговоримо про цю тему в межах форумної програми.')}</p>${e.details?`<div class="event-source-note"><strong>З робочої програми:</strong> ${esc(e.details)}</div>`:''}</section><aside class="event-facts"><span class="eyebrow">КОРОТКО ПРО ГОЛОВНЕ</span><dl><dt>ДАТА</dt><dd>${esc(dayNames[e.date]?.[0]||'')} грудня 2026</dd><dt>ЧАС</dt><dd>${esc(formatRange(e))}</dd><dt>МІСЦЕ</dt><dd>${esc(e.venue||'Уточнюється')}</dd><dt>СТАТУС</dt><dd>${e.status==='confirmed'?'Підтверджено':e.status==='canceled'?'Скасовано':'Попередньо'}</dd>${m.speakerNames?`<dt>УЧАСНИКИ / СПІКЕРИ (ПОПЕРЕДНЬО)</dt><dd>${esc(m.speakerNames)}</dd>`:''}</dl>${m.speakerPhotoUrl?`<p class="photo-credit">${esc(m.speakerPhotoCredit||'Фото надано організаторами')}</p>`:'<p class="photo-credit">Портрети спікерів додадуть після погодження матеріалів.</p>'}<button class="button full" data-share="${esc(e.id)}">${icon('external')} Поділитися анонсом</button>${e.start&&e.end?`<button class="button outline full" data-ics="${esc(e.id)}">${icon('calendar')} Додати у календар</button>`:''}</aside></div></section><section class="related-posters"><div class="section-topline"><span>ТАКОЖ У ЦЕЙ ДЕНЬ</span><button data-nav="program">УСЯ ПРОГРАМА ↗</button></div><div class="related-grid">${sorted(state.data.events.filter(x=>x.date===e.date&&x.id!==e.id&&x.status!=='canceled')).slice(0,3).map(x=>keynoteCard(x)).join('')}</div></section>${footer()}`;}
  function exportFile(content,mime,filename){const blob=new Blob([content],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);}
  const escapeIcs=s=>String(s??'').replaceAll('\\','\\\\').replaceAll(';','\\;').replaceAll(',','\\,').replaceAll('\n','\\n');
  const icsDate=(date,time)=>date.replaceAll('-','')+'T'+time.replace(':','')+'00';
  function makeIcs(events){
    const valid=events.filter(e=>e.start&&e.end&&e.status!=='canceled');
    const rows=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MTWTU Youth Forum//PULSE//UK','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
    for(const e of valid){
      let endDay=e.date;if(e.end<e.start){const d=new Date(e.date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);endDay=d.toISOString().slice(0,10);}
      rows.push('BEGIN:VEVENT',`UID:${escapeIcs(e.id)}@mtwtu-youth-forum`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;TZID=Europe/Kyiv:${icsDate(e.date,e.start)}`,`DTEND;TZID=Europe/Kyiv:${icsDate(endDay,e.end)}`,`SUMMARY:${escapeIcs(e.title)}`,`LOCATION:${escapeIcs(e.venue||'Місце уточнюється')}`,`DESCRIPTION:${escapeIcs('Попередня програма MTWTU Youth Forum 2026. Час і локацію уточнюйте на сайті. '+(e.details||''))}`,'END:VEVENT');
    }
    rows.push('END:VCALENDAR');return rows.join('\r\n')+'\r\n';
  }
  function exportCalendar(events){const full=events.filter(e=>e.start&&e.end&&e.status!=='canceled');if(!full.length){notify('Немає збережених подій із точним часом');return;}exportFile(makeIcs(full),'text/calendar;charset=utf-8','MTWTU-YOUTH-FORUM-2026.ics');notify(`Завантажено подій: ${full.length}`);}
  const departureCities=['Одеса','Львів','Київ'];
  function travelRoute(city){
    const odessa=city==='Одеса';
    const url='https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(city)+ '&destination='+encodeURIComponent('Гірськолижний комплекс Плай, Плав’я');
    return `<div class="arrival-line"><span>${esc(city)}</span><span class="arrival-path" aria-hidden="true"><i></i></span><span>ГК «Плай»</span></div><p>${odessa?'Автобус з Одеси попередньо заплановано на 6 грудня о 22:30. Точка збору уточнюється.':'Орієнтир для самостійної поїздки. Організований трансфер із цього міста не підтверджено.'}</p><a class="edition-action secondary" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Відкрити маршрут на карті ↗</a>`;
  }
  function travel(){
    return `<section class="edition-travel" id="travel"><h2>Як дістатися</h2><div class="arrival-cities" aria-label="Місто виїзду">${departureCities.map((city,index)=>`<button class="edition-action secondary" data-departure="${index}" aria-pressed="${index===0}">${city}</button>`).join('')}</div><div class="arrival-result" aria-live="polite">${travelRoute(departureCities[0])}</div></section>`;
  }
  function mapPage(){return `${pageHead('ЛОГІСТИКА','Твій Плай.','Локації з програми форуму. Точні маршрути та розташування точок ще мають бути підтверджені організаторами.')}${previewNotice()}
    <section class="map-hero"><div><span class="eyebrow">OFFICIAL LOCATION</span><h2>Гірськолижний комплекс «Плай»</h2><p>На офіційному сайті комплексу є інтерактивна карта. Поки що використовуємо саме її — без вигаданих координат і маршрутів.</p><a class="button light" href="https://play-karpaty.com/" target="_blank" rel="noopener noreferrer">Перейти на сайт комплексу ${icon('external')}</a></div><div class="map-shape" aria-hidden="true">${icon('mountain')}</div></section>
    ${travel()}
    <div class="section-heading"><div><span class="eyebrow muted">ЗА ПРОГРАМОЮ</span><h2>Основні місця.</h2></div></div>
    <div class="map-places">${[['Великий зал','Відкриття, Unionize та загальні сесії.'],['Малий зал','Паралельні тренінги.'],['Ресторан','Основні прийоми їжі.'],['Боулінг','Вечірня активність 8 грудня.'],['Рецепція / готель','Прибуття та поселення.'],['Екоферма','Екскурсія 9 грудня; місце збору уточнюється.']].map(([name,desc])=>`<article class="place"><span class="place-icon">${icon('pin')}</span><div><strong>${esc(name)}</strong><p>${esc(desc)}</p></div></article>`).join('')}</div>
    <div class="notice-box" style="margin-top:19px">${icon('alert')}<p><strong>Маршрути та безпека:</strong> не використовуйте цю сторінку як схему евакуації або укриттів. Вказівки на випадок тривоги повідомлятимуть лише після підтвердження з організаторами й адміністрацією комплексу.</p></div>${footer()}`;}
  function updates(){const notes=state.data.announcements||[];return `${pageHead('ЗВ’ЯЗОК З ОРГАНІЗАТОРАМИ','Оголошення.','Зміни програми, організаційні деталі та важливі повідомлення — в одному місці.')}${state.offline?offlineNotice():''}
    ${notes.length?`<div class="updates-list">${notes.map(a=>`<article class="update-card ${esc(a.kind)}"><div class="update-header">${icon(a.kind==='urgent'?'alert':'bell')}<span class="update-label">${a.kind==='urgent'?'Терміново':a.kind==='important'?'Важливо':'Оголошення'}</span></div><h3>${esc(a.title)}</h3><small>${esc(fmtDate(a.createdAt))} · Київський час</small><p class="update-body">${esc(a.text)}</p></article>`).join('')}</div>`:`<div class="empty-state">${icon('bell','big')}<h3>Повідомлень поки немає</h3><p>Усі оголошення організаторів з'являться тут, навіть якщо сповіщення на телефоні вимкнені.</p></div>`}
    <div class="light-panel" style="margin-top:20px"><strong>Хочете отримувати push на телефон?</strong><p class="muted-copy" style="margin:7px 0 13px">Увімкніть сповіщення в розділі «Корисне». На iPhone можна читати оголошення тут без встановлення сайту.</p><button class="button outline" data-nav="info">Налаштування сповіщень ${icon('arrow')}</button></div>${footer()}`;}
  function offlineNotice(){return `<div class="live-banner"><span>${icon('wifi')} <strong>Немає з'єднання</strong> · показано останню збережену версію</span><button data-action="refresh">Оновити</button></div>`;}
  function info(){let ios=/iPad|iPhone|iPod/.test(navigator.userAgent),standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
    let support='Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    return `${pageHead('ДЛЯ УЧАСНИКІВ','Корисне.','Практична інформація, сповіщення та питання щодо участі у форумі.')}${previewNotice()}
    <div class="info-grid"><div class="stack"><article class="panel"><div class="panel-label"><span class="eyebrow muted">STAY INFORMED</span>${icon('bell')}</div><h3 style="font-size:24px">Сповіщення про важливе</h3><p class="muted-copy" style="margin:11px 0">Отримуйте повідомлення про зміни програми, точки збору та новини. Підписка добровільна, її можна вимкнути.</p>
    ${ios&&!standalone?`<div class="notice-box" style="margin:16px 0">${icon('info')}<p>На iPhone push працюють для сайту, доданого на головний екран. Встановіть ярлик і відкрийте сайт саме з нього.</p></div><div class="install-steps"><div class="install-step">У Safari натисніть «Поділитися» (Share).</div><div class="install-step">Оберіть «На початковий екран» (Add to Home Screen).</div><div class="install-step">Відкрийте доданий сайт та натисніть «Увімкнути сповіщення».</div></div>`:''}
    ${!support?`<p class="form-alert">Цей браузер не підтримує Web Push або потрібен захищений HTTPS-доступ.</p>`:!state.data.webPushAvailable?`<p class="form-alert">Відправлення push ще не налаштоване організатором.</p>`:''}
    <div class="info-actions"><button class="button" id="subscribe-button" data-action="subscribe" ${!support || !state.data.webPushAvailable || (ios&&!standalone)?'disabled':''}>${icon('bell')} Увімкнути сповіщення</button><button class="button outline" id="unsubscribe-button" data-action="unsubscribe" ${!support?'disabled':''}>Вимкнути</button></div><p class="muted-copy" id="push-status" style="margin-top:12px">Перевіряємо статус підписки…</p></article>
    <article class="panel"><div class="panel-label"><span class="eyebrow muted">BEFORE YOU GO</span>${icon('clock')}</div><h3>Трансфер та від'їзд</h3><div class="info-block" style="margin-top:16px"><strong>06 грудня · 22:30</strong><p>Попередній час виїзду автобусом з Одеси. Точка збору не підтверджена.</p></div><div class="info-block"><strong>10 грудня · 12:30</strong><p>Попередній час виїзду з комплексу «Плай».</p></div><div class="info-block"><strong>11 грудня · 05:00</strong><p>Попередній час прибуття до Одеси за робочою програмою. Може змінитися.</p></div></article></div>
    <div class="stack"><article class="panel"><div class="panel-label"><span class="eyebrow muted">NEED HELP?</span>${icon('info')}</div><h3>Потрібна допомога?</h3><p class="muted-copy" style="margin:10px 0 16px">Контакт відповідального координатора ще не підтверджений. Після погодження він з'явиться тут.</p><span class="utility-label">Контакт уточнюється</span></article>
    <article class="panel"><div class="panel-label"><span class="eyebrow muted">OUR COMMUNITY</span>${icon('users')}</div><h3>Залишаймося на зв'язку</h3><p class="muted-copy" style="margin:10px 0">Тут з'являться перевірені прямі посилання на сторінки MTWTU Youth, ПРМТУ та ГО «Трудові Ініціативи».</p><span class="utility-label">Посилання погоджуються</span></article>
    <article class="light-panel"><span class="eyebrow muted">ВАЖЛИВО</span><p class="muted-copy" style="margin-top:10px">Інформація щодо укриття, екстрених контактів і порядку дій під час тривоги буде додана тільки після офіційного підтвердження.</p></article></div></div><section class="edition-faq"><h2>Поширені питання</h2><details><summary>Де й коли проходить форум?</summary><p>7–10 грудня 2026 року, ГК «Плай».</p><button class="edition-action" data-nav="map">Локації ↗</button></details><details><summary>Де перевіряти зміни програми?</summary><p>Оперативні повідомлення публікуються в оголошеннях.</p><button class="edition-action" data-nav="updates">Оголошення ↗</button></details><details><summary>Де дізнатися про трансфер?</summary><p>Попередні години виїзду наведено в розділі «Трансфер та від’їзд». Точка збору уточнюється.</p></details></section>${footer()}`;}
  function footer(){return `<footer class="footer-line"><span>MTWTU YOUTH FORUM 2026 · DIGITAL COMPANION</span><span>Плай · 07–10.12.2026</span></footer>`;}
  function adminLogin(){return `${pageHead('ОРГАНІЗАТОРАМ','Панель організатора.','Редагування програми та повідомлення всім підписаним учасникам.')}
    <div class="panel admin-login"><div class="panel-label"><span class="eyebrow muted">ЗАХИЩЕНИЙ ДОСТУП</span>${icon('lock')}</div><h3 style="font-size:22px">Вхід організатора</h3><p class="muted-copy" style="margin:10px 0 20px">Пароль налаштовується на сервері. Учасникам він не потрібен.</p>
    <form id="login-form"><div class="field"><label for="admin-password">Пароль організатора</label><input type="password" id="admin-password" name="password" autocomplete="current-password" required></div><button type="submit" class="button full">Увійти ${icon('arrow')}</button></form>
    ${state.adminEnabled?'':'<p class="form-alert">Адмінпанель ще не активована: необхідно задати ADMIN_PASSWORD на сервері.</p>'}</div>${footer()}`;}
  function adminPanel(){const d=state.adminData;if(!d)return `${pageHead('ОРГАНІЗАТОРАМ','Панель організатора.','Завантаження даних…')}<div class="page-loading"><div class="spinner"></div></div>`;
    return `${pageHead('ОРГАНІЗАТОРАМ','Панель організатора.','Публікуйте оголошення, надсилайте push і змінюйте розклад без програмування.')}
    <div class="admin-summary"><div class="stat"><strong>${d.events.length}</strong><small>Подій у базі</small></div><div class="stat"><strong>${d.subscriberCount}</strong><small>Push-підписок</small></div><div class="stat"><strong>${d.announcements.length}</strong><small>Оголошень</small></div></div>
    <div class="admin-tabs"><button class="admin-tab ${state.adminTab==='announcements'?'active':''}" data-admin-tab="announcements">Повідомлення</button><button class="admin-tab ${state.adminTab==='events'?'active':''}" data-admin-tab="events">Програма</button><button class="admin-tab" data-action="logout" style="margin-left:auto">Вийти</button></div>
    ${state.adminTab==='announcements'?adminAnnouncements(d):adminEvents(d)}${footer()}`;
  }
  function adminAnnouncements(d){return `<div class="admin-grid"><div><article class="panel"><div class="panel-label"><span class="eyebrow muted">НОВЕ ОГОЛОШЕННЯ</span>${icon('send')}</div><h3 style="font-size:23px;margin-bottom:18px">Написати всім.</h3>
    <form id="announcement-form"><div class="field"><label for="announcement-title">Заголовок</label><input id="announcement-title" name="title" maxlength="90" placeholder="Наприклад: Зміна локації тренінгу" required></div>
    <div class="field"><label for="announcement-text">Текст повідомлення</label><textarea id="announcement-text" name="text" maxlength="650" placeholder="Що саме учасникам потрібно знати?" required></textarea><small>Повідомлення залишиться в розділі «Оголошення» для всіх відвідувачів.</small></div>
    <div class="field"><label for="announcement-kind">Важливість</label><select id="announcement-kind" name="kind"><option value="info">Звичайне</option><option value="important">Важливе</option><option value="urgent">Термінове</option></select></div>
    <label class="checkbox-row"><input id="announcement-push" type="checkbox" name="push" checked><span>Надіслати push на телефони підписаних учасників</span></label><button type="submit" class="button full">${icon('send')} Опублікувати повідомлення</button></form>
    <p class="muted-copy" style="margin-top:13px">Підтвердження прийняття push-сервером не гарантує появу сповіщення на кожному телефоні. Оголошення у сайті доступне всім.</p></article></div>
    <div><article class="panel"><div class="panel-label"><span class="eyebrow muted">ОПУБЛІКОВАНІ ОГОЛОШЕННЯ</span><button class="text-link" data-action="load-admin">${icon('rotate')} Оновити</button></div>
    ${d.announcements.length?d.announcements.slice(0,8).map(a=>`<div class="info-block"><strong>${esc(a.title)}</strong><p>${esc(a.text)}</p><small style="display:block;color:var(--muted);margin-top:5px">${esc(fmtDate(a.createdAt))}</small></div>`).join(''):'<p class="muted-copy">Поки що нічого не опубліковано.</p>'}</article></div></div>`;}
  function adminEvents(d){return `<article class="panel"><div class="panel-label"><span class="eyebrow muted">ПОДІЇ ФОРУМУ</span><button class="button" data-edit="new">${icon('plus')} Додати подію</button></div><p class="muted-copy" style="margin-bottom:13px">Редагування зберігається на сервері. Перевірка не допускає перекриття підтверджених чи попередніх подій в одній і тій самій локації.</p>
    ${sorted(d.events).map(e=>`<div class="admin-event-row"><div><strong>${esc(e.title)}</strong><small>${esc(e.date.slice(8))}.12 · ${esc(formatRange(e))} · ${esc(e.venue||'Локація не встановлена')} · ${e.published?'Видиме учасникам':'Приховане'}</small></div><button data-edit="${esc(e.id)}" aria-label="Редагувати ${esc(e.title)}">${icon('edit')}</button></div>`).join('')}</article>`;}
  function render(){
    if(state.loading){app.innerHTML='<div class="page-loading"><div class="spinner"></div><p>Завантажуємо ваш форум…</p></div>';return;}
    if(!state.data){return;}
    if(!dayNames[state.day])state.day='2026-12-07';
    app.innerHTML=({home,program,event:eventPage,map:mapPage,info,updates,admin:()=>state.admin?adminPanel():adminLogin()})[state.page]?.()||home();
    app.dataset.page=state.page;
    document.querySelectorAll('.nav-item').forEach(el=>{
      const active=el.dataset.nav===state.page;
      el.classList.toggle('active',active);
      if(active)el.setAttribute('aria-current','page');
      else el.removeAttribute('aria-current');
    });
    document.querySelector('#unread-dot').hidden=!noticeCount();
    if(state.page==='info')checkPushStatus();
  }
  async function loadAdmin(){
    try{const me=await api('/api/admin/me');state.adminEnabled=me.enabled;state.admin=me.authenticated;
      if(state.admin){state.adminData=await api('/api/admin/state');}else state.adminData=null;
      render();
    }catch(e){notify(e.message);}
  }
  function openEditor(id){
    const base=state.adminData?.events.find(e=>e.id===id)||{id:null,date:'2026-12-07',start:'',end:'',title:'',venue:'',details:'',track:'all',status:'tentative',published:false};const original={...metaFor(base),...base};
    dialog.innerHTML=`<div class="dialog-content"><div class="dialog-heading"><h2>${original.id?'Редагувати подію':'Нова подія'}</h2><button type="button" data-action="close-dialog" aria-label="Закрити">${icon('x')}</button></div>
    <form id="event-form" data-id="${esc(original.id||'new')}"><div class="field"><label>Назва заходу</label><input name="title" maxlength="130" value="${esc(original.title)}" required></div>
      <div class="inline-fields"><div class="field"><label>Дата</label><select name="date">${Object.keys(dayNames).map(day=>`<option value="${day}" ${day===original.date?'selected':''}>${dayNames[day][0]} грудня</option>`).join('')}</select></div><div class="field"><label>Статус</label><select name="status">${[['tentative','Попередньо'],['confirmed','Підтверджено'],['canceled','Скасовано']].map(([k,v])=>`<option value="${k}" ${k===original.status?'selected':''}>${v}</option>`).join('')}</select></div></div>
      <div class="inline-fields"><div class="field"><label>Початок</label><input name="start" type="time" value="${esc(original.start||'')}"></div><div class="field"><label>Кінець</label><input name="end" type="time" value="${esc(original.end||'')}"></div></div>
      <div class="field"><label>Локація</label><input name="venue" maxlength="90" value="${esc(original.venue||'')}" placeholder="Якщо підтверджена"></div>
      <div class="field"><label>Короткий опис для учасників</label><textarea name="details" maxlength="600">${esc(original.details||'')}</textarea></div>
      <div class="editorial-admin-fields"><span class="eyebrow">АФІША ТА АНОНС / ДЛЯ УЧАСНИКІВ</span><div class="field"><label>Постерний заголовок</label><input name="posterTitle" maxlength="140" value="${esc(original.posterTitle||'')}" placeholder="Короткий сильний заголовок"></div><div class="field"><label>Анонс події</label><textarea name="teaser" maxlength="650">${esc(original.teaser||'')}</textarea></div><div class="field"><label>Чому це цікаво учаснику</label><textarea name="why" maxlength="500">${esc(original.why||'')}</textarea></div><div class="field"><label>Спікери / учасники (лише погоджені)</label><input name="speakerNames" maxlength="220" value="${esc(original.speakerNames||'')}"></div><div class="field"><label>HTTPS-адреса фото спікера</label><input name="speakerPhotoUrl" maxlength="600" value="${esc(original.speakerPhotoUrl||'')}" placeholder="https://…/foto.jpg"><small>Тільки перевірене фото з дозволом на використання. Портрети не генеруються.</small></div><div class="field"><label>Джерело / автор фото</label><input name="speakerPhotoCredit" maxlength="240" value="${esc(original.speakerPhotoCredit||'')}"></div></div>
      <div class="field"><label>Тип події</label><select name="track"><option value="all" ${original.track==='all'?'selected':''}>Спільна</option><option value="parallel" ${original.track==='parallel'?'selected':''}>Паралельна сесія</option></select></div>
      <label class="checkbox-row"><input name="published" type="checkbox" ${original.published?'checked':''}>Показувати учасникам на сайті</label>
      <button class="button full" type="submit">${icon('check')} Зберегти зміни</button></form></div>`;
    dialog.showModal();
  }
  function urlBase64ToUint8Array(base64String){const padding='='.repeat((4-base64String.length%4)%4);const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');const raw=atob(base64);return Uint8Array.from(raw,c=>c.charCodeAt(0));}
  async function pushRegistration(){
    if(!('serviceWorker' in navigator))throw new Error('Цей браузер не підтримує Web Push.');
    await navigator.serviceWorker.register('/sw.js');
    let timer;
    try {
      return await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>{
        timer=setTimeout(()=>reject(new Error('Не вдалося запустити сповіщення. Оновіть сторінку й повторіть.')),8000);
      })]);
    } finally { clearTimeout(timer); }
  }
  async function subscribePush() {
    if(!state.data.webPushAvailable){notify('Відправлення push ще не налаштоване');return;}
    if(!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window)){notify('Push не підтримується в цьому браузері');return;}
    if(/iPad|iPhone|iPod/.test(navigator.userAgent)&&!matchMedia('(display-mode: standalone)').matches&&!navigator.standalone){notify('Спочатку додайте сайт на головний екран iPhone');return;}
    try {
      // Permission must be requested directly after the user's tap on iOS.
      const permission=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;
      if(permission==='denied')throw new Error('Браузер заблокував сповіщення. Дозвольте їх у налаштуваннях цього сайту й повторіть.');
      if(permission!=='granted')throw new Error('Дозвіл на сповіщення не наданий.');
      const registration=await pushRegistration();
      let sub=await registration.pushManager.getSubscription();
      if(!sub)sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(state.data.vapidPublicKey)});
      await api('/api/push/subscribe',{method:'POST',body:JSON.stringify(sub.toJSON())});
      notify('Сповіщення увімкнено!');checkPushStatus();
    }catch(e){notify(e.message);checkPushStatus();}
  }
  async function unsubscribePush(){try {const registration=await pushRegistration();const sub=await registration.pushManager.getSubscription();if(sub){await api('/api/push/unsubscribe',{method:'POST',body:JSON.stringify({endpoint:sub.endpoint})});await sub.unsubscribe();}notify('Підписку вимкнено');checkPushStatus();}catch(e){notify(e.message);}}
  async function checkPushStatus(){
    const label=document.querySelector('#push-status');
    if(!label)return;
    if(!state.data.webPushAvailable){label.textContent='Сервер поки не приймає push-підписки.';return;}
    if(!('Notification' in window)||!('PushManager' in window)){label.textContent='Оголошення доступні тут на сайті.';return;}
    if(Notification.permission==='denied'){label.textContent='Дозвіл заблоковано в налаштуваннях браузера.';return;}
    try{
      const registration=await pushRegistration();
      const sub=await registration.pushManager.getSubscription();
      label.textContent=sub?'Підписка є в браузері. Натисніть «Увімкнути сповіщення», щоб повторно синхронізувати її із сайтом.':'На цьому пристрої підписку ще не ввімкнено.';
    }catch(error){label.textContent=error.message;}
  }
  document.addEventListener('click',async ev=>{
    const evpost=ev.target.closest('[data-event]');if(evpost){state.eventId=evpost.dataset.event;state.day=state.data?.events.find(e=>e.id===state.eventId)?.date||state.day;setPage('event');return;}
    const departure=ev.target.closest('[data-departure]');
    if(departure){
      const region=departure.closest('.edition-travel');
      const city=departureCities[Number(departure.dataset.departure)];
      region.querySelector('.arrival-result').innerHTML=travelRoute(city);
      region.querySelectorAll('[data-departure]').forEach(button=>button.setAttribute('aria-pressed',String(button===departure)));
      return;
    }
    const galleryButton=ev.target.closest('[data-gallery]');
    if(galleryButton){
      const track=galleryButton.closest('.edition-gallery').querySelector('.gallery-track');
      const max=track.scrollWidth-track.clientWidth;
      const step=Number(galleryButton.dataset.gallery);
      const left=step>0&&track.scrollLeft>=max-2?0:step<0&&track.scrollLeft<=2?max:track.scrollLeft+step*track.clientWidth;
      track.scrollTo({left,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      return;
    }
    const play=ev.target.closest('[data-play-film]');
    if(play){
      const frame=document.createElement('iframe');
      frame.className='forum-film';
      frame.title='Відео Молодіжної ради ПРМТУ';
      frame.allow='autoplay; fullscreen; picture-in-picture';
      frame.allowFullscreen=true;
      frame.src='https://player.vimeo.com/video/1175179620?dnt=1&autoplay=1';
      const dialog=app.querySelector('.film-dialog');
      const player=dialog.querySelector('.film-player');
      player.replaceChildren(frame);
      dialog.addEventListener('close',()=>{player.replaceChildren();play.focus();},{once:true});
      dialog.showModal();
      return;
    }
    const scroller=ev.target.closest('[data-scroll]');if(scroller){document.getElementById(scroller.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    const share=ev.target.closest('[data-share]');if(share){const e=state.data.events.find(x=>x.id===share.dataset.share);if(e){const url=new URL(location.origin+'/?page=event&id='+encodeURIComponent(e.id));if(navigator.share){try{await navigator.share({title:e.title,text:metaFor(e).teaser||'',url:url.toString()});}catch{}}else{try{await navigator.clipboard.writeText(url.toString());notify('Посилання скопійовано');}catch{notify(url.toString());}}}return;}
    const nav=ev.target.closest('[data-nav]');if(nav){ev.preventDefault();setPage(nav.dataset.nav);return;}
    const jump=ev.target.closest('[data-jump-day]');if(jump){state.day=jump.dataset.jumpDay;setPage('program');return;}
    const day=ev.target.closest('[data-day]');if(day){state.day=day.dataset.day;render();return;}
    const ics=ev.target.closest('[data-ics]');if(ics){const found=state.data?.events.find(e=>e.id===ics.dataset.ics);if(found)exportCalendar([found]);return;}
    const tab=ev.target.closest('[data-admin-tab]');if(tab){state.adminTab=tab.dataset.adminTab;render();return;}
    const edit=ev.target.closest('[data-edit]');if(edit){openEditor(edit.dataset.edit);return;}
    const act=ev.target.closest('[data-action]');if(!act)return;
    switch(act.dataset.action){
      case 'refresh':await refresh();notify('Перевірку оновлення завершено');break;
      case 'load-admin':await loadAdmin();notify('Дані оновлено');break;
      case 'subscribe':await subscribePush();break;
      case 'unsubscribe':await unsubscribePush();break;
      case 'close-dialog':dialog.close();break;
      case 'logout':try{await api('/api/admin/logout',{method:'POST',body:'{}'});state.admin=false;state.adminData=null;render();notify('Вихід виконано');}catch(e){notify(e.message);}break;
    }
  });
  document.addEventListener('submit',async ev=>{
    const form=ev.target;
    if(!['login-form','announcement-form','event-form'].includes(form.id))return;
    ev.preventDefault();
    const submit=form.querySelector('[type=submit]');submit.disabled=true;
    try{
      if(form.id==='login-form'){
        const password=form.elements.password.value;
        await api('/api/admin/login',{method:'POST',body:JSON.stringify({password})});
        form.elements.password.value='';
        await loadAdmin();notify('Вхід виконано');
      }else if(form.id==='announcement-form'){
        const title=form.elements.title.value.trim(),text=form.elements.text.value.trim(),kind=form.elements.kind.value,sendPush=form.elements.push.checked;
        const prompt=sendPush?`Опублікувати повідомлення «${title}» та надіслати push усім активним підпискам?`:`Опублікувати повідомлення «${title}» тільки на сайті?`;
        if(!confirm(prompt))return;
        const result=await api('/api/admin/announcements',{method:'POST',body:JSON.stringify({title,text,kind,sendPush})});
        await Promise.all([loadAdmin(),refresh(true)]);
        const p=result.push;
        notify(sendPush?(p.skipped?`Опубліковано на сайті. ${p.reason}.`:`Опубліковано. Push прийнято: ${p.accepted} із ${p.subscribers}. Помилки: ${p.failed}.`):'Повідомлення опубліковано на сайті');
      }else if(form.id==='event-form'){
        const id=form.dataset.id;
        const data={date:form.elements.date.value,start:form.elements.start.value||null,end:form.elements.end.value||null,title:form.elements.title.value,venue:form.elements.venue.value,details:form.elements.details.value,track:form.elements.track.value,status:form.elements.status.value,published:form.elements.published.checked,posterTitle:form.elements.posterTitle.value,teaser:form.elements.teaser.value,why:form.elements.why.value,speakerNames:form.elements.speakerNames.value,speakerPhotoUrl:form.elements.speakerPhotoUrl.value,speakerPhotoCredit:form.elements.speakerPhotoCredit.value};
        await api(id==='new'?'/api/admin/events':`/api/admin/events/${encodeURIComponent(id)}`,{method:id==='new'?'POST':'PATCH',body:JSON.stringify(data)});
        dialog.close();await Promise.all([loadAdmin(),refresh(true)]);notify('Подію збережено');
      }
    }catch(e){notify(e.message);}finally{if(submit.isConnected)submit.disabled=false;}
  });
  window.addEventListener('popstate',()=>{const qs=new URLSearchParams(location.search);state.page=qs.get('page')||'home';state.eventId=qs.get('id')||'';render();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh(true);});
  if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(console.warn);}
  async function init(){
    const day=kyivDay();if(dayNames[day])state.day=day;
    await refresh();
    if(state.page==='updates')setViewed();
    if(state.page==='admin')await loadAdmin();
    setInterval(()=>{if(document.visibilityState==='visible')refresh(true);},30000);
  }
  init();
})();

