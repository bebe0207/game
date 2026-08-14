/**
 * quiz-shared.js
 * 共用邏輯：BUILTIN_PACKS、題庫編輯器（renderEditor / addQCard）、工具函式
 * 由 quiz.html 與 quiz-lobby.html 共同引用
 */

// ── 工具函式 ───────────────────────────────────────────
function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── localStorage 自訂題庫 ──────────────────────────────
function loadCustomPack() {
  try { return JSON.parse(localStorage.getItem('quiz_custom') || 'null'); } catch { return null; }
}
function saveCustomPack(pack) {
  localStorage.setItem('quiz_custom', JSON.stringify(pack));
}

// ── 內建題庫 ───────────────────────────────────────────
const BUILTIN_PACKS = [
  {
    id:'general', name:'生活常識', icon:'🌍',
    questions:[
      {q:'地球是太陽系第幾顆行星？',opts:['第一顆','第二顆','第三顆','第四顆'],ans:'C'},
      {q:'水的化學式是？',opts:['CO₂','H₂O','O₂','NaCl'],ans:'B'},
      {q:'光速約為每秒多少公里？',opts:['3萬公里','30萬公里','300萬公里','3000萬公里'],ans:'B'},
      {q:'哪個國家的面積最大？',opts:['中國','美國','加拿大','俄羅斯'],ans:'D'},
      {q:'人體最大的器官是？',opts:['肝臟','心臟','皮膚','大腦'],ans:'C'},
      {q:'1 公斤等於幾公克？',opts:['10','100','1000','10000'],ans:'C'},
      {q:'彩虹有幾種顏色？',opts:['5','6','7','8'],ans:'C'},
      {q:'直角是幾度？',opts:['45°','60°','90°','180°'],ans:'C'},
      {q:'陸地上跑最快的動物是？',opts:['獅子','獵豹','馬','羚羊'],ans:'B'},
      {q:'月球是地球的什麼？',opts:['行星','衛星','小行星','矮行星'],ans:'B'},
      {q:'1年有幾天（平年）？',opts:['355','365','375','366'],ans:'B'},
      {q:'DNA 雙螺旋結構由誰發現？',opts:['愛因斯坦','達爾文','Watson & Crick','牛頓'],ans:'C'},
    ]
  },
  {
    id:'tech', name:'科技資訊', icon:'💻',
    questions:[
      {q:'HTML 的全名是？',opts:['HyperText Markup Language','High Tech Modern Language','HyperText Modern Layout','High Text Markup Logic'],ans:'A'},
      {q:'哪個公司開發了 iPhone？',opts:['Google','Samsung','Apple','Microsoft'],ans:'C'},
      {q:'1 GB 等於多少 MB？',opts:['256','512','1024','2048'],ans:'C'},
      {q:'JavaScript 最初由誰創建？',opts:['Linus Torvalds','Brendan Eich','Tim Berners-Lee','Mark Zuckerberg'],ans:'B'},
      {q:'WWW 由誰發明？',opts:['Bill Gates','Steve Jobs','Tim Berners-Lee','Elon Musk'],ans:'C'},
      {q:'Python 是哪種語言？',opts:['編譯型','解釋型','機器語言','組合語言'],ans:'B'},
      {q:'CPU 中文全名是？',opts:['中央處理器','圖形處理器','記憶體','硬碟'],ans:'A'},
      {q:'最廣泛使用的版本控制系統是？',opts:['SVN','Mercurial','Git','CVS'],ans:'C'},
      {q:'HTTP 預設端口是？',opts:['21','443','80','8080'],ans:'C'},
      {q:'WiFi 標準是？',opts:['IEEE 802.3','IEEE 802.11','IEEE 802.5','IEEE 802.15'],ans:'B'},
    ]
  },
  {
    id:'history', name:'世界歷史', icon:'🏛️',
    questions:[
      {q:'第一次世界大戰在哪一年結束？',opts:['1914','1916','1918','1920'],ans:'C'},
      {q:'哥倫布到達美洲是哪一年？',opts:['1392','1492','1592','1692'],ans:'B'},
      {q:'萬里長城主要建於哪個朝代？',opts:['漢朝','唐朝','明朝','清朝'],ans:'C'},
      {q:'埃及金字塔最初作為什麼用途？',opts:['神廟','宮殿','陵墓','倉庫'],ans:'C'},
      {q:'世界上第一個使用印刷術的國家？',opts:['埃及','希臘','中國','羅馬'],ans:'C'},
      {q:'拿破崙是哪國人？',opts:['法國','義大利','西班牙','英國'],ans:'A'},
      {q:'第二次世界大戰在哪一年結束？',opts:['1943','1944','1945','1946'],ans:'C'},
      {q:'莎士比亞是哪國作家？',opts:['美國','法國','德國','英國'],ans:'D'},
    ]
  },
  {
    id:'sports', name:'運動體育', icon:'⚽',
    questions:[
      {q:'足球世界盃多少年舉辦一次？',opts:['2年','3年','4年','5年'],ans:'C'},
      {q:'奧運五環代表幾大洲？',opts:['4','5','6','7'],ans:'B'},
      {q:'網球大滿貫有幾個賽事？',opts:['2','3','4','5'],ans:'C'},
      {q:'NBA 是哪個運動的聯盟？',opts:['棒球','美式足球','籃球','冰球'],ans:'C'},
      {q:'馬拉松全程約多少公里？',opts:['35','40','42','45'],ans:'C'},
      {q:'桌球球拍兩面除紅色外另一面是？',opts:['藍色','黑色','綠色','白色'],ans:'B'},
      {q:'足球場上每隊幾名球員？',opts:['9','10','11','12'],ans:'C'},
    ]
  },
  {
    id:'taiwan', name:'台灣知識', icon:'🇹🇼',
    questions:[
      {q:'台灣最高的山是？',opts:['雪山','合歡山','玉山','奇萊山'],ans:'C'},
      {q:'台灣面積約多少平方公里？',opts:['16000','36000','56000','76000'],ans:'B'},
      {q:'台灣有幾個直轄市？',opts:['4','5','6','7'],ans:'C'},
      {q:'台灣日治時期始於哪一年？',opts:['1885','1895','1905','1915'],ans:'B'},
      {q:'台灣最長的河流是？',opts:['淡水河','大甲溪','秀姑巒溪','濁水溪'],ans:'D'},
      {q:'台灣東邊是哪個海？',opts:['台灣海峽','南海','菲律賓海','東海'],ans:'C'},
      {q:'台北101 高度約多少公尺？',opts:['401','501','508','600'],ans:'C'},
    ]
  },
];

// ── 題庫編輯器：新增題目卡片 ──────────────────────────
// qTextClass：題目 input 的 class 名稱（quiz.html 用 q-text，quiz-lobby.html 用 q-text-inp）
function addQCard(list, q, qTextClass) {
  const card = document.createElement('div');
  card.className = 'q-card';
  card.innerHTML = `
    <button class="del-btn" title="刪除">✕</button>
    <input type="text" class="${qTextClass}" placeholder="輸入題目內容" value="${esc(q?.q||'')}"/>
    <div class="options-grid">
      ${['A','B','C','D'].map((l,i) => `
        <div class="opt-row">
          <span class="opt-badge ${l}">${l}</span>
          <input type="text" class="opt-inp" data-opt="${l}" placeholder="選項 ${l}" value="${esc(q?.opts?.[i]||'')}"/>
        </div>`).join('')}
    </div>
    <div class="correct-select">
      正確答案：
      <select class="ans-sel">
        ${['A','B','C','D'].map(l => `<option value="${l}" ${q?.ans===l?'selected':''}>${l}</option>`).join('')}
      </select>
    </div>`;
  card.querySelector('.del-btn').addEventListener('click', () => card.remove());
  list.appendChild(card);
}

// ── 題庫編輯器：渲染整個列表 ──────────────────────────
function renderEditor(qTextClass) {
  const list = document.getElementById('questionList');
  const custom = loadCustomPack() || { name:'我的題庫', questions:[] };
  list.innerHTML = '';
  if (custom.questions.length === 0) addQCard(list, null, qTextClass);
  else custom.questions.forEach(q => addQCard(list, q, qTextClass));
}
