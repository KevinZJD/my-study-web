(function() {
    // 🔑 1. 填入你的两把钥匙
    const CONF = {
        URL: 'https://allzowywhsrgstpxdhae.supabase.co',
        KEY: 'sb_publishable_Su4CKVNIae5_rVeGAoHgtw_uE3zQj3V'
    };

    if (!window.supabase) return alert("网络连接失败，请开启全局代理！");
    const client = window.supabase.createClient(CONF.URL, CONF.KEY);

    // ✨ 2. 样式保留你最满意的终极双层磨砂版
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .feynman-box { background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(255, 255, 255, 1); border-radius: 14px; padding: 20px; margin-bottom: 16px; font-size: 15px; line-height: 1.8; text-align: left; color: #334155; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .feynman-box strong { font-size: 16px; color: #1e293b; margin-bottom: 8px; display: inline-block; }
        .feynman-point { border-left: 5px solid #f43f5e; } .feynman-example { border-left: 5px solid #eab308; } .feynman-step { border-left: 5px solid #a855f7; }
        .premium-ans-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 14px; padding: 20px; margin-bottom: 20px; text-align: left; color: white; box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4); position: relative; overflow: hidden; }
        .premium-ans-box::after { content: '✅'; position: absolute; right: -10px; bottom: -20px; font-size: 90px; opacity: 0.15; transform: rotate(-10deg); pointer-events: none; }
        .flashcard-back { background: rgba(255, 255, 255, 0.45) !important; backdrop-filter: blur(12px) !important; border: 1px solid rgba(255, 255, 255, 0.6) !important; border-radius: 12px !important; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important; display: block !important; overflow-y: auto !important; padding: 25px !important; }
        .flashcard-back::-webkit-scrollbar, .glass-panel::-webkit-scrollbar { width: 5px; } .flashcard-back::-webkit-scrollbar-thumb, .glass-panel::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 5px; }
        .premium-front { background: rgba(255, 255, 255, 0.85); border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border: 1px solid rgba(255, 255, 255, 0.9); width: 100%; height: 100%; display: flex; flex-direction: column; padding: 25px; box-sizing: border-box; }
        .type-badge { padding: 5px 12px; border-radius: 8px; font-size: 13px; font-weight: bold; }
        .type-mcq { background: #e0e7ff; color: #4f46e5; } .type-tf { background: #fef08a; color: #ca8a04; } .type-essay { background: #fce7f3; color: #db2777; }
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
    let score = 0, quizIdx = 0, startTime = 0, userAnswers = [], isLogged = false;
    let heartbeatInterval = null; // 用于记录学习时长的心跳

    // ✨ 新增功能：格式化时间为 X分X秒
    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (m > 0) return `${m}分${s}秒`;
        return `${s}秒`;
    }

    // ==========================================
    // 🛡️ 终极防挂机系统：真实活跃追踪 + 强制焦点锁
    // ==========================================
    let lastActiveTime = Date.now(); 
    let isPageFocused = true; // ✨ 新增：页面焦点状态记录

    // 1. 监听人类真实操作（鼠标、键盘、触摸）
    ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(evt => {
        document.addEventListener(evt, () => {
            lastActiveTime = Date.now(); 
        }, { passive: true });
    });

    // 2. ✨ 新增：监听窗口焦点状态（切标签页、点微信、分屏点别处，统统能抓到！）
    window.addEventListener('focus', () => { 
        isPageFocused = true; 
        lastActiveTime = Date.now(); // 切回来时重置发呆时间
    });
    window.addEventListener('blur', () => { 
        isPageFocused = false; // 只要点到了网页外面，立刻标记为失去焦点
    });
    document.addEventListener('visibilitychange', () => {
        isPageFocused = !document.hidden;
    });

    // 3. 升级版心跳包
    function startHeartbeat() {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(async () => {
            // 没登录或没选课，不记录
            if (!studentCode || curDeckIdx < 0 || !allDecks[curDeckIdx]) return;
            
            // 🚨 终极拦截 1：只要页面失去焦点（没被选中），哪怕它在屏幕上亮着，也立刻停表！
            if (!isPageFocused) {
                console.log("🤫 页面失去焦点（去干别的了），停止计时");
                return;
            }

            // 🚨 终极拦截 2：哪怕停留在当前页面，但发呆超过 3 分钟 (180000毫秒)，也停表！
            if (Date.now() - lastActiveTime > 180000) {
                console.log("😴 超过3分钟没有任何操作，判定为挂机，停止计时");
                return;
            }

            const currentCourse = allDecks[curDeckIdx].title; 

            try {
                const { data } = await client.from('student_stats')
                    .select('total_study_minutes')
                    .eq('secret_code', studentCode)
                    .eq('course_name', currentCourse)
                    .maybeSingle();
                
                let currentMins = data ? data.total_study_minutes : 0;
                
                await client.from('student_stats').upsert({
                    secret_code: studentCode,
                    course_name: currentCourse,
                    total_study_minutes: currentMins + 1,
                    last_active: new Date().toISOString()
                });
            } catch (e) { console.warn("心跳包发送失败"); }
        }, 60000); 
    }

    dom.enterBtn.onclick = async () => {
        const code = dom.codeInp.value.trim();
        if (!code) return alert("请输入暗号！");
        dom.enterBtn.textContent = '📡 同步云端中...';
        try {
            const { data, error } = await client.from('decks').select('*').eq('secret_code', code);
            if (error || !data.length) throw new Error("暗号无效或网络不通");
            allDecks = data; studentCode = code;
            dom.login.style.display = 'none'; dom.app.style.display = 'block';
            dom.welcome.textContent = `👋 欢迎，${code} 学员`;
            initUI();
            
            // 登录成功，立刻开启一次数据档案初始化和心跳
            startHeartbeat();
        } catch (e) { alert(e.message); dom.enterBtn.textContent = '进入学习舱'; }
    };

    function initUI() { dom.deckSel.innerHTML = allDecks.map((d, i) => `<option value="${i}">${d.title}</option>`).join(''); curDeckIdx = 0; updateTags(); }
    function updateTags() { const tags = [...new Set(allDecks[curDeckIdx].cards.map(c => c.tag).filter(Boolean))]; dom.tagSel.innerHTML = '<option value="ALL">-- 全部综合 --</option>' + tags.map(t => `<option value="${t}">${t}</option>`).join(''); renderStudyMode(); }
    function renderStudyMode() { const deck = allDecks[curDeckIdx]; curCards = dom.tagSel.value === "ALL" ? deck.cards : deck.cards.filter(c => c.tag === dom.tagSel.value); dom.title.textContent = `📖 ${deck.title}`; dom.quizBox.style.display = 'none'; dom.cardView.style.display = 'flex'; curCardIdx = 0; showCard(); }

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
                        <div style="background: #e0e7ff; color: #4f46e5; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-bottom: 20px; align-self: flex-start;">❓ 核心考点</div>
                        <div style="font-size: 20px; font-weight: 600; line-height: 1.6; color: #1e293b; text-align: left; flex-grow: 1; overflow-y: auto;">${cleanQuestion}</div>
                        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed #cbd5e1; text-align: center; color: #64748b; font-size: 14px;">👆 点击翻转，查看核心解析</div>
                    </div>
                </div>
                <div class="flashcard-back">
                    <div class="premium-ans-box"><div style="font-size: 12px; color: rgba(255,255,255,0.8); margin-bottom: 4px;">🎯 CORRECT ANSWER</div><div style="font-size: 18px; font-weight: 600;">${c.a}</div></div>
                    ${c.exp||'<div class="feynman-box" style="text-align:center;">暂无解析</div>'}
                    <div style="text-align: center; margin-top: 30px;"><span style="background: rgba(0,0,0,0.15); color: #475569; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: bold;">🔄 点击翻回正面</span></div>
                </div>
            </div>`;
        div.onclick = () => div.classList.toggle('flipped');
        dom.cardBox.appendChild(div);
    }

    dom.quizBtn.onclick = () => {
        if (!curCards.length) return alert("当前没有题目！");
        dom.cardView.style.display = 'none'; dom.quizBox.style.display = 'block';
        score = 0; quizIdx = 0; startTime = Date.now(); userAnswers = []; isLogged = false;
        let testPool = [...curCards].sort(() => Math.random() - 0.5);
        if (dom.tagSel.value === "ALL" && testPool.length > 20) testPool = testPool.slice(0, 20);
        showQuestion(testPool);
    };

    function renderCompletionScreen(total, timeStr, avgTimeStr) {
        dom.quizBox.innerHTML = `
            <div class="glass-panel" style="text-align:center;padding:40px;">
                <h2 style="font-size:32px;">🎊 测试完成！</h2>
                <div style="font-size:18px;margin:20px 0;line-height:1.8;background:rgba(255,255,255,0.6);border-radius:12px;padding:20px;">
                    <p>得分：<span style="color:#10b981;font-weight:800;font-size:24px;">${score}</span> / ${total}</p>
                    <p style="color:#64748b;margin-top:10px;">🕒 总用时：<span style="color:#6366f1;font-weight:bold;">${timeStr}</span></p>
                    <p style="color:#64748b;">⚡ 平均单题：<span style="color:#6366f1;font-weight:bold;">${avgTimeStr}</span></p>
                </div>
                <button id="review-btn" class="glass-btn" style="width:100%;margin-bottom:15px;background:#10b981;color:white;font-weight:bold;">📚 查看错题与全卷解析</button>
                <button id="back-home-btn" class="glass-btn" style="width:100%;background:#475569;color:white;">返回学习主页</button>
            </div>`;
        document.getElementById('back-home-btn').onclick = () => renderStudyMode();
        document.getElementById('review-btn').onclick = () => showReviewScreen(total, timeStr, avgTimeStr);
    }

    function showReviewScreen(total, timeStr, avgTimeStr) {
        let html = `<div class="glass-panel" style="padding:20px; max-height:85vh; overflow-y:auto; text-align:left;">`;
        html += `<h2 style="text-align:center; margin-bottom:25px;">📚 全卷复盘解析</h2>`;
        userAnswers.forEach((ans, i) => {
            const statusColor = ans.isCorrect ? '#10b981' : '#f43f5e';
            html += `
                <div style="margin-bottom:35px; border-bottom:2px dashed rgba(255,255,255,0.4); padding-bottom:20px;">
                    <h4 style="font-size:17px;">${i+1}. ${ans.q}</h4>
                    <div style="margin:15px 0; background:rgba(255,255,255,0.6); padding:15px; border-radius:10px; border-left:4px solid ${statusColor};">
                        <span style="color:${statusColor}; font-weight:bold;">${ans.isCorrect ? '✅ 答对了' : '❌ 答错了 / 未掌握'}</span>
                        <div style="margin-top:8px; font-weight:600; color:#334155; white-space:pre-wrap; line-height:1.5;">你的解答：${ans.userAns}</div>
                    </div>
                    <div class="premium-ans-box" style="padding:15px;">正确答案：${ans.correctAns}</div>
                    ${ans.exp || ''}
                </div>`;
        });
        html += `<button id="back-score-btn" class="glass-btn" style="width:100%;background:#3b82f6;color:white;font-weight:bold;">⬅️ 返回成绩单</button></div>`;
        dom.quizBox.innerHTML = html;
        document.getElementById('back-score-btn').onclick = () => renderCompletionScreen(total, timeStr, avgTimeStr);
    }

    async function showQuestion(list) {
        if (quizIdx >= list.length) {
            const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
            const timeStr = formatTime(timeSeconds);
            const avgTimeSec = (timeSeconds / list.length).toFixed(1);
            const avgTimeStr = `${avgTimeSec}秒`;

            if (!isLogged) {
                // 🚀 核心捕获器：提取错题题目列表
                const wrongQs = userAnswers.filter(a => !a.isCorrect).map(a => a.q);
                
                const fullTitle = `${allDecks[curDeckIdx].title} - [${dom.tagSel.value === "ALL" ? "全部综合" : dom.tagSel.value}]`;
                await client.from('study_logs').insert([{ 
                    secret_code: studentCode, 
                    deck_title: fullTitle, 
                    score: score, 
                    total_questions: list.length, 
                    time_spent: timeSeconds, // 仍保存秒数，供教师端统计
                    avg_time_sec: parseFloat(avgTimeSec), // 新增字段：单题平均时间
                    wrong_details: wrongQs // 新增字段：精准错题库
                }]);
                isLogged = true;
            }
            renderCompletionScreen(list.length, timeStr, avgTimeStr); return;
        }
        
        const c = list[quizIdx];
        const cleanQuizQuestion = c.q.replace(/^Question:\s*/i, '');
        const wrongOpts = [c.w1, c.w2, c.w3].filter(Boolean);
        
        let qType = 'MCQ'; let badgeHtml = '';
        if (wrongOpts.length === 0) { qType = 'ESSAY'; badgeHtml = '<span class="type-badge type-essay">✍️ 解答题</span>'; }
        else if (wrongOpts.length === 1) { qType = 'TF'; badgeHtml = '<span class="type-badge type-tf">⚖️ 判断题</span>'; }
        else { badgeHtml = '<span class="type-badge type-mcq">🔘 选择题</span>'; }

        dom.quizBox.innerHTML = `
            <div class="glass-panel" style="padding:30px; max-height:85vh; overflow-y:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <div style="font-weight:bold; color:#4f46e5;">题目 ${quizIdx + 1} / ${list.length}</div>
                    ${badgeHtml}
                </div>
                <h3 style="font-size:20px;margin-bottom:25px; line-height:1.6;">${cleanQuizQuestion}</h3>
                <div id="opt-list" style="display:grid;gap:12px;"></div>
                <div id="quiz-res"></div>
            </div>`;
            
        const listDiv = document.getElementById('opt-list');

        if (qType === 'MCQ' || qType === 'TF') {
            let opts = [c.a, ...wrongOpts];
            opts.sort(() => Math.random() - 0.5);
            const letters = ['A', 'B', 'C', 'D', 'E'];
            opts.forEach((o, i) => {
                const btn = document.createElement('button'); btn.className = 'quiz-option';
                btn.innerHTML = `<span style="font-weight:800;margin-right:10px;">${letters[i]}.</span> ${o}`;
                btn.onclick = () => {
                    listDiv.querySelectorAll('button').forEach(b => b.disabled = true);
                    let correct = (o === c.a);
                    if (correct) { btn.classList.add('correct-answer'); score++; } else { btn.classList.add('wrong-answer'); listDiv.querySelectorAll('button')[opts.indexOf(c.a)].classList.add('show-correct'); }
                    userAnswers.push({ q: cleanQuizQuestion, userAns: o, correctAns: c.a, isCorrect: correct, exp: c.exp });
                    document.getElementById('quiz-res').innerHTML = `<button id="next-q" class="glass-btn" style="width:100%;margin-top:25px;background:#3b82f6;color:white;font-weight:bold;">下一题 ➡️</button>`;
                    document.getElementById('next-q').onclick = () => { quizIdx++; showQuestion(list); };
                };
                listDiv.appendChild(btn);
            });
        } else {
            listDiv.innerHTML = `
                <textarea id="essay-ans" placeholder="✍️ 请在此输入你的解答思路..." style="width:100%; height:120px; padding:15px; border-radius:12px; border:2px solid rgba(255,255,255,0.6); font-size:15px; margin-bottom:10px; resize:vertical; outline:none; background:rgba(255,255,255,0.7); box-sizing:border-box;"></textarea>
                <button id="show-ans-btn" class="glass-btn" style="width:100%; background:#4f46e5; color:white; font-weight:bold;">👀 答题完毕，对照答案</button>
            `;
            
            document.getElementById('show-ans-btn').onclick = () => {
                const userAns = document.getElementById('essay-ans').value.trim() || '（未输入内容，直接看了答案）';
                document.getElementById('essay-ans').disabled = true;
                document.getElementById('essay-ans').style.background = '#e2e8f0';
                document.getElementById('show-ans-btn').style.display = 'none';
                
                document.getElementById('quiz-res').innerHTML = `
                    <div style="margin-top:15px; animation: fadeIn 0.5s;">
                        <div class="premium-ans-box" style="margin-bottom:20px; padding:15px;">
                            <div style="font-size: 13px; color: rgba(255,255,255,0.8); margin-bottom: 6px;">🎯 标准答案 / 采分点</div>
                            <div style="font-size: 16px; font-weight: 600;">${c.a}</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.8); border-radius:12px; padding:20px;">
                            <h4 style="text-align:center; margin:0 0 15px 0; color:#1e293b;">诚实打分：这道题你答对了吗？</h4>
                            <div style="display:flex; gap:12px;">
                                <button id="self-correct-btn" class="glass-btn" style="flex:1; background:#10b981; color:white; font-weight:bold; padding:12px;">✅ 答对了 (+1分)</button>
                                <button id="self-wrong-btn" class="glass-btn" style="flex:1; background:#f43f5e; color:white; font-weight:bold; padding:12px;">❌ 没答对</button>
                            </div>
                        </div>
                    </div>
                `;
                
                const handleSelfGrade = (isCorrect) => {
                    if (isCorrect) score++;
                    userAnswers.push({ q: cleanQuizQuestion, userAns: userAns, correctAns: c.a, isCorrect: isCorrect, exp: c.exp });
                    quizIdx++; showQuestion(list); 
                };
                
                document.getElementById('self-correct-btn').onclick = () => handleSelfGrade(true);
                document.getElementById('self-wrong-btn').onclick = () => handleSelfGrade(false);
            };
        }
    }

    dom.next.onclick = () => { if (curCardIdx < curCards.length - 1) { curCardIdx++; showCard(); } };
    dom.prev.onclick = () => { if (curCardIdx > 0) { curCardIdx--; showCard(); } };
    dom.deckSel.onchange = (e) => { curDeckIdx = e.target.value; updateTags(); };
    dom.tagSel.onchange = () => renderStudyMode();
})();