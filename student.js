(function() {
    // 🔑 1. 填入你的两把钥匙
    const CONF = {
        URL: 'https://allzowywhsrgstpxdhae.supabase.co',
        KEY: 'sb_publishable_Su4CKVNIae5_rVeGAoHgtw_uE3zQj3V'
    };

    if (!window.supabase) return alert("网络连接失败，请开启全局代理！");
    const client = window.supabase.createClient(CONF.URL, CONF.KEY);

    // ✨ 2. 注入顶级视觉样式：双层磨砂玻璃质感
    const style = document.createElement('style');
    style.innerHTML = `
        /* 费曼模块小框 */
        .feynman-box {
            background: rgba(255, 255, 255, 0.95); 
            border: 1px solid rgba(255, 255, 255, 1);
            border-radius: 14px; 
            padding: 20px;
            margin-bottom: 16px; 
            font-size: 15px;
            line-height: 1.8; 
            text-align: left;
            color: #334155; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .feynman-box strong { font-size: 16px; color: #1e293b; margin-bottom: 8px; display: inline-block; }
        .feynman-point { border-left: 5px solid #f43f5e; }
        .feynman-example { border-left: 5px solid #eab308; }
        .feynman-step { border-left: 5px solid #a855f7; }

        /* 翡翠渐变答案框 */
        .premium-ans-box {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 14px;
            padding: 20px;
            margin-bottom: 20px;
            text-align: left;
            color: white;
            box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4);
            position: relative;
            overflow: hidden;
        }
        .premium-ans-box::after {
            content: '✅';
            position: absolute; right: -10px; bottom: -20px;
            font-size: 90px; opacity: 0.15; transform: rotate(-10deg); pointer-events: none;
        }

        /* 卡片背面高级磨砂大底板 */
        .flashcard-back { 
            background: rgba(255, 255, 255, 0.45) !important; 
            backdrop-filter: blur(12px) !important;           
            border: 1px solid rgba(255, 255, 255, 0.6) !important; 
            border-radius: 12px !important;                   
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;  
            display: block !important;                        
            overflow-y: auto !important; 
            padding: 25px !important;                         
        }
        .flashcard-back::-webkit-scrollbar, .glass-panel::-webkit-scrollbar { width: 5px; }
        .flashcard-back::-webkit-scrollbar-thumb, .glass-panel::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 5px; }
        
        /* 正面高级卡片样式 */
        .premium-front {
            background: rgba(255, 255, 255, 0.85);
            border-radius: 12px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            border: 1px solid rgba(255, 255, 255, 0.9);
            width: 100%; height: 100%; display: flex; flex-direction: column;
            padding: 25px; box-sizing: border-box;
        }
    `;
    document.head.appendChild(style);

    const dom = {
        login: document.getElementById('login-screen'), app: document.getElementById('app-content'), codeInp: document.getElementById('student-code-input'),
        enterBtn: document.getElementById('enter-btn'), deckSel: document.getElementById('deck-selector'), tagSel: document.getElementById('sub-deck-selector'),
        title: document.getElementById('current-deck-title'), quizBtn: document.getElementById('quiz-btn'), quizBox: document.getElementById('quiz-container'),
        cardView: document.getElementById('flashcard-view'), cardBox: document.getElementById('flashcards-container'), prev: document.getElementById('prev-card-btn'),
        next: document.getElementById('next-card-btn'), prog: document.getElementById('flashcard-progress'), welcome: document.getElementById('student-welcome-text')
    };

    let allDecks = [], curDeckIdx = -1, curCards = [], curCardIdx = 0, studentCode = '';
    
    // ✨ 增加了 userAnswers 数组，用来记录学生这套卷子的所有答题情况
    let score = 0, quizIdx = 0, startTime = 0, userAnswers = [], isLogged = false;

    dom.enterBtn.onclick = async () => {
        const code = dom.codeInp.value.trim();
        if (!code) return alert("请输入暗号！");
        dom.enterBtn.textContent = '📡 同步云端中...';
        try {
            const { data, error } = await client.from('decks').select('*').eq('secret_code', code);
            if (error || !data.length) throw new Error("暗号无效或网络不通");
            allDecks = data; studentCode = code;
            dom.login.style.display = 'none'; dom.app.style.display = 'block';
            dom.welcome.textContent = `👋 欢迎，${code} 号学员`;
            initUI();
        } catch (e) { alert(e.message); dom.enterBtn.textContent = '进入学习舱'; }
    };

    function initUI() {
        dom.deckSel.innerHTML = allDecks.map((d, i) => `<option value="${i}">${d.title}</option>`).join('');
        curDeckIdx = 0; updateTags();
    }

    function updateTags() {
        const deck = allDecks[curDeckIdx];
        const tags = [...new Set(deck.cards.map(c => c.tag).filter(Boolean))];
        dom.tagSel.innerHTML = '<option value="ALL">-- 全部综合 --</option>' + tags.map(t => `<option value="${t}">${t}</option>`).join('');
        renderStudyMode();
    }

    function renderStudyMode() {
        const tag = dom.tagSel.value;
        const deck = allDecks[curDeckIdx];
        curCards = tag === "ALL" ? deck.cards : deck.cards.filter(c => c.tag === tag);
        dom.title.textContent = `📖 ${deck.title}`;
        dom.quizBox.style.display = 'none'; dom.cardView.style.display = 'flex';
        curCardIdx = 0; showCard();
    }

    function showCard() {
        dom.cardBox.innerHTML = ''; if (!curCards.length) return;
        dom.prog.textContent = `${curCardIdx + 1} / ${curCards.length}`;
        const c = curCards[curCardIdx];
        const cleanQuestion = c.q.replace(/^Question:\s*/i, '');
        
        const div = document.createElement('div'); div.className = 'flashcard';
        div.innerHTML = `
            <div class="flashcard-inner">
                <div class="flashcard-front" style="background:transparent; border:none; box-shadow:none; padding:0;">
                    <div class="premium-front">
                        <div style="background: #e0e7ff; color: #4f46e5; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-bottom: 20px; align-self: flex-start;">
                            ❓ 核心考点提问
                        </div>
                        <div style="font-size: 20px; font-weight: 600; line-height: 1.6; color: #1e293b; text-align: left; flex-grow: 1; overflow-y: auto;">
                            ${cleanQuestion}
                        </div>
                        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed #cbd5e1; text-align: center; color: #64748b; font-size: 14px; font-weight: 500;">
                            👆 点击卡片，查看核心解析
                        </div>
                    </div>
                </div>
                
                <div class="flashcard-back">
                    <div class="premium-ans-box">
                        <div style="font-size: 13px; color: rgba(255,255,255,0.8); margin-bottom: 6px; letter-spacing: 1px;">🎯 CORRECT ANSWER</div>
                        <div style="font-size: 18px; font-weight: 600; line-height: 1.4; position: relative; z-index: 1;">${c.a}</div>
                    </div>
                    ${c.exp||'<div class="feynman-box" style="text-align:center; color:#94a3b8;">暂无详细解析</div>'}
                    <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
                        <span style="background: rgba(0,0,0,0.15); color: #475569; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: bold;">
                            🔄 点击任意处翻回正面
                        </span>
                    </div>
                </div>
            </div>`;
        div.onclick = () => div.classList.toggle('flipped');
        dom.cardBox.appendChild(div);
    }

    // ✨ 测试模式入口：重置所有状态
    dom.quizBtn.onclick = () => {
        if (!curCards.length) return alert("当前没有题目可以测试哦！");
        dom.cardView.style.display = 'none'; dom.quizBox.style.display = 'block';
        score = 0; quizIdx = 0; startTime = Date.now(); userAnswers = []; isLogged = false;
        let testPool = [...curCards]; 
        if (dom.tagSel.value === "ALL") {
            testPool = testPool.sort(() => Math.random() - 0.5);
            if (testPool.length > 20) testPool = testPool.slice(0, 20);
        } else { testPool.sort(() => Math.random() - 0.5); }
        showQuestion(testPool);
    };

    // ✨ 测试完成后的成绩面板
    function renderCompletionScreen(total, time) {
        dom.quizBox.innerHTML = `
            <div class="glass-panel" style="text-align:center;padding:40px;">
                <h2 style="font-size:32px;">🎊 测试完成！</h2>
                <div style="font-size:20px;margin:20px 0;"><p>得分：<span style="color:#10b981;font-weight:800;">${score}</span> / ${total}</p><p>总用时：<span style="color:#6366f1;font-weight:800;">${time}</span> 秒</p></div>
                
                <button id="review-btn" class="glass-btn" style="width:100%;margin-bottom:15px;background:#10b981;color:white;font-size:16px;font-weight:bold;box-shadow:0 4px 15px rgba(16,185,129,0.4);">
                    📚 查看错题与全卷解析
                </button>
                <button id="back-home-btn" class="glass-btn" style="width:100%;background:#475569;color:white;font-size:16px;font-weight:bold;">
                    返回学习主页
                </button>
            </div>`;
        document.getElementById('back-home-btn').onclick = () => renderStudyMode();
        document.getElementById('review-btn').onclick = () => showReviewScreen(total, time);
    }

    // ✨ 新增功能：全卷解析看板 (沉浸式复盘)
    function showReviewScreen(total, time) {
        let html = `<div class="glass-panel" style="padding:20px; max-height:85vh; overflow-y:auto; text-align:left;">`;
        html += `<h2 style="text-align:center; margin-bottom:25px; font-size:22px; color:#1e293b;">📚 全卷复盘解析</h2>`;
        
        userAnswers.forEach((ans, i) => {
            const statusIcon = ans.isCorrect ? '✅ 答对了' : '❌ 答错了';
            const statusColor = ans.isCorrect ? '#10b981' : '#f43f5e';
            
            html += `
                <div style="margin-bottom:35px; padding-bottom:25px; border-bottom:2px dashed rgba(255,255,255,0.4);">
                    <h4 style="font-size:17px; line-height:1.6; margin-bottom:15px; color:#1e293b;">${i+1}. ${ans.q}</h4>
                    
                    <div style="margin-bottom:15px; background:rgba(255,255,255,0.6); padding:12px 15px; border-radius:10px; border-left:4px solid ${statusColor};">
                        <div style="font-size:15px; color:#475569;">
                            你的答案：<span style="color:${statusColor}; font-weight:bold; margin-left:5px;">${statusIcon}</span>
                        </div>
                        <div style="font-size:15px; font-weight:600; color:#1e293b; margin-top:5px;">${ans.userAns}</div>
                    </div>

                    <div class="premium-ans-box" style="padding:15px; margin-bottom:15px;">
                        <div style="font-size: 12px; color: rgba(255,255,255,0.8); margin-bottom: 4px;">🎯 正确答案</div>
                        <div style="font-size: 16px; font-weight: 600;">${ans.correctAns}</div>
                    </div>
                    
                    <strong style="color:#64748b; font-size:14px; display:block; margin-bottom:10px;">📝 详细解析：</strong>
                    ${ans.exp || '<div class="feynman-box" style="padding:15px; text-align:center; color:#94a3b8;">暂无详细解析</div>'}
                </div>`;
        });
        
        html += `<button id="back-score-btn" class="glass-btn" style="width:100%;background:#3b82f6;color:white;font-size:16px;font-weight:bold;margin-top:10px;">⬅️ 返回成绩单</button></div>`;
        dom.quizBox.innerHTML = html;
        document.getElementById('back-score-btn').onclick = () => renderCompletionScreen(total, time);
    }

    async function showQuestion(list) {
        if (quizIdx >= list.length) {
            const time = Math.floor((Date.now() - startTime) / 1000);
            // 确保测试记录只上报一次
            if (!isLogged) {
                const currentTag = dom.tagSel.value === "ALL" ? "全部综合" : dom.tagSel.value;
                const fullTitle = `${allDecks[curDeckIdx].title} - [${currentTag}]`;
                await client.from('study_logs').insert([{ secret_code: studentCode, deck_title: fullTitle, score: score, total_questions: list.length, time_spent: time }]);
                isLogged = true;
            }
            renderCompletionScreen(list.length, time);
            return;
        }

        const c = list[quizIdx];
        let opts = [c.a, c.w1, c.w2, c.w3].filter(Boolean);
        while(opts.length < 4) {
            const randomAns = curCards[Math.floor(Math.random() * curCards.length)].a;
            if(!opts.includes(randomAns)) opts.push(randomAns);
        }
        opts.sort(() => Math.random() - 0.5);
        const letters = ['A', 'B', 'C', 'D'];
        const cleanQuizQuestion = c.q.replace(/^Question:\s*/i, '');
        
        dom.quizBox.innerHTML = `
            <div class="glass-panel" style="padding:30px; max-height:85vh; overflow-y:auto;">
                <div style="margin-bottom:10px;opacity:0.6; font-weight:bold; color:#4f46e5;">题目 ${quizIdx + 1} / ${list.length}</div>
                <h3 style="font-size:20px;margin-bottom:25px;line-height:1.5;">${cleanQuizQuestion}</h3>
                <div id="opt-list" style="display:grid;gap:12px;"></div>
                <div id="quiz-res"></div>
            </div>`;
        
        const listDiv = document.getElementById('opt-list');
        opts.forEach((o, i) => {
            const btn = document.createElement('button'); btn.className = 'quiz-option';
            btn.innerHTML = `<span style="font-weight:800;margin-right:10px;">${letters[i]}.</span> ${o}`;
            btn.onclick = () => {
                const buttons = listDiv.querySelectorAll('button'); buttons.forEach(b => b.disabled = true);
                
                let isCorrect = (o === c.a);
                if (isCorrect) { btn.classList.add('correct-answer'); score++; }
                else { btn.classList.add('wrong-answer'); buttons[opts.indexOf(c.a)].classList.add('show-correct'); }
                
                // 📝 收集这道题的答题数据，用于结尾复盘
                userAnswers.push({
                    q: cleanQuizQuestion,
                    userAns: o,
                    correctAns: c.a,
                    isCorrect: isCorrect,
                    exp: c.exp
                });
                
                // 🚀 核心改动：不再直接展示解析，仅显示“下一题”按钮！
                document.getElementById('quiz-res').innerHTML = `
                    <button id="next-q" class="glass-btn" style="width:100%;margin-top:25px;background:#3b82f6;color:white;font-size:16px;font-weight:bold; box-shadow: 0 4px 15px rgba(59,130,246,0.4);">
                        进入下一题 ➡️
                    </button>`;
                document.getElementById('next-q').onclick = () => { quizIdx++; showQuestion(list); };
            };
            listDiv.appendChild(btn);
        });
    }

    dom.next.onclick = () => { if (curCardIdx < curCards.length - 1) { curCardIdx++; showCard(); } };
    dom.prev.onclick = () => { if (curCardIdx > 0) { curCardIdx--; showCard(); } };
    dom.deckSel.onchange = (e) => { curDeckIdx = e.target.value; updateTags(); };
    dom.tagSel.onchange = () => renderStudyMode();
})();