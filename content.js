const CONFIG = {
    red: "244, 91, 91",
    green: "149, 193, 31",
    gray: "242, 242, 242",
    selectors: {
        grid: 'div[style*="repeat(16, 1fr)"]',
        cell: '.ant-flex',
        name: ".ant-typography.hover-brand-effect"
    }
};

const STYLES = `
    .aa-panel { position: fixed; top: 20px; right: 20px; bottom: 20px; width: 300px; background: #fff; box-shadow: -5px 0 20px rgba(0,0,0,0.1); border-radius: 12px; transform: translateX(120%); transition: transform 0.3s; z-index: 9999; display: flex; flex-direction: column; font-family: sans-serif; border: 1px solid #eee; }
    .aa-panel.visible { transform: translateX(0); }
    .aa-header { padding: 15px; border-bottom: 1px solid #eee; background: #fafafa; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
    .aa-list { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 10px; }
    .aa-card { background: #fff; border: 1px solid #eee; border-left: 4px solid #ff4d4f; padding: 10px; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: 0.2s; }
    .aa-card:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
    .aa-name { font-weight: 600; margin-bottom: 8px; color: #333; }
    .aa-btn-group { display: flex; gap: 5px; }
    .aa-btn { border: none; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; }
    .aa-btn-view { background: #f0f0f0; color: #555; width: 30px; }
    .aa-btn-done { background: #52c41a; color: white; flex: 1; }
    .aa-btn-reset { background: transparent; color: #888; border: 1px solid #ddd; padding: 2px 8px; font-size: 10px; }
    .aa-highlight { border: 2px solid #ff4d4f !important; border-radius: 4px; }
    .aa-highlight-ignored { border: 1px dashed #ccc !important; opacity: 0.6; }
`;

const App = {
    panel: null,
    list: null,
    timeout: null,
    ignored: JSON.parse(localStorage.getItem('ignoredStudents_v2') || '[]'),

    init() {
        const style = document.createElement("style");
        style.innerText = STYLES;
        document.head.appendChild(style);

        this.createPanel();

        const observer = new MutationObserver(() => {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => this.scan(), 800); 
        });
        observer.observe(document.body, { childList: true, subtree: true });
        
        console.log("Attendance Checker Ready");
    },

    createPanel() {
        this.panel = document.createElement("div");
        this.panel.className = "aa-panel";
        this.panel.innerHTML = `
            <div class="aa-header">
                <span id="aa-title">Боржники: 0</span>
                <button class="aa-btn aa-btn-reset" id="aa-reset">↺ Скинути</button>
            </div>
            <div class="aa-list" id="aa-list"></div>
        `;
        document.body.appendChild(this.panel);
        
        this.list = this.panel.querySelector("#aa-list");
        this.panel.querySelector("#aa-reset").onclick = () => {
            if(confirm("Показати всіх прихованих?")) {
                localStorage.removeItem('ignoredStudents_v2');
                location.reload();
            }
        };
    },

    getColor(el) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg.includes(CONFIG.red)) return 'red';
        if (bg.includes(CONFIG.green)) return 'green';
        if (bg.includes(CONFIG.gray)) return 'gray';
        return 'other';
    },

    checkDebt(history) {
        while (history.length > 0 && history[history.length - 1] === 'gray') {
            history.pop();
        }
        
        if (history.length < 2) return false;
        const last = history[history.length - 1];
        const prev = history[history.length - 2];
        const prevPrev = history[history.length - 3];

        if (last === 'red' && prev === 'red') return true;
        if (last === 'green' && prev === 'red' && prevPrev === 'red') return true;
        
        return false;
    },

    getName(grid) {
        let el = grid.parentElement;
        for (let i = 0; i < 8; i++) {
            if (!el) break;
            const nameEl = el.querySelector(CONFIG.selectors.name);
            if (nameEl) return nameEl.innerText.trim();
            el = el.parentElement;
        }
        return "Невідомий";
    },

    scan() {
        const grids = document.querySelectorAll(CONFIG.selectors.grid);
        this.list.innerHTML = "";
        let count = 0;

        grids.forEach(grid => {
            const cells = Array.from(grid.querySelectorAll(CONFIG.selectors.cell));
            const history = cells.map(c => this.getColor(c));

            if (!this.checkDebt(history)) {
                grid.classList.remove('aa-highlight', 'aa-highlight-ignored');
                grid.style.border = ""; 
                return;
            }

            const name = this.getName(grid);

            if (this.ignored.includes(name)) {
                grid.classList.remove('aa-highlight');
                grid.classList.add('aa-highlight-ignored');
                return;
            }

            count++;
            grid.classList.add('aa-highlight');
            grid.classList.remove('aa-highlight-ignored');
            this.renderCard(name, grid);
        });

        this.panel.querySelector("#aa-title").innerText = `Боржники: ${count}`;
        this.panel.classList.toggle('visible', count > 0);
    },

    renderCard(name, grid) {
        const card = document.createElement("div");
        card.className = "aa-card";
        card.innerHTML = `
            <div class="aa-name">${name}</div>
            <div class="aa-btn-group">
                <button class="aa-btn aa-btn-view" title="Показати">👁</button>
                <button class="aa-btn aa-btn-done">✅ Виконано</button>
            </div>
        `;

        card.querySelector('.aa-btn-view').onclick = () => {
            grid.scrollIntoView({ behavior: "smooth", block: "center" });
            grid.style.boxShadow = "0 0 0 6px rgba(24, 144, 255, 0.5)";
            setTimeout(() => grid.style.boxShadow = "", 1000);
        };

        card.querySelector('.aa-btn-done').onclick = () => {
            this.ignored.push(name);
            localStorage.setItem('ignoredStudents_v2', JSON.stringify(this.ignored));
            
            card.remove();
            grid.classList.replace('aa-highlight', 'aa-highlight-ignored');
            
            const left = this.list.children.length;
            this.panel.querySelector("#aa-title").innerText = `Боржники: ${left}`;
            if (left === 0) this.panel.classList.remove('visible');
        };

        this.list.appendChild(card);
    }
};

// Запуск
App.init();
