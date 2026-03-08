/**
 * ExamePad - Runner Core Offline (v4.17)
 * Vanilla JS (Legacy Support - No Modules)
 * Focus: Galaxy Tab S6 Lite Compatibility (Kiosk bypass, Fallback fixes)
 */

const state = {
    currentQuestion: 0,
    answers: {},
    questions: [],
    startTime: null,
    durationMinutes: 90,
    examTitle: "AVALIAÇÃO NACIONAL - CIÊNCIAS DA NATUREZA",
    examMeta: "PROVA DIGITAL | 10 Questões",
    focusMode: false,
    dyslexicMode: false,
    librasMode: false,
    fontSize: 1.0,
    lineHeight: 1.6,
    activeTool: null, // 'highlight', 'erase'
    isExploded: false,
    displayMode: '3D', // '3D' or '2D'
    student: {
        name: "MICHEL FELIX DA SILVA",
        id: "EP-2024-9981",
        class: "3º ANO - ENSINO MÉDIO (A)"
    }
};

let renderer, scene, camera, model, ambientLight, hemiLight, dirLight;
let timerInterval;

// Mock Data
function mockData() {
    return [
        {
            id: 1,
            type: 'objective',
            text: "Observe o modelo abaixo da célula humana. Qual organela está representada em destaque e qual sua principal função?",
            options: [
                "Mitocôndria: Produção de ATP (Energia)", 
                "Ribossomos: Síntese de Proteínas", 
                "Núcleo: Armazenamento de Material Genético",
                "Complexo de Golgi: Secreção Celular"
            ],
            model: "celula_humana.glb",
            image: "mapa.png", // Usando imagem já existente caso 3D falhe
            libras: "video_cell.mp4"
        },
        {
            id: 2,
            type: 'objective',
            text: "No modelo abaixo do Sistema Solar, identifique o planeta que possui o maior sistema de anéis visíveis.",
            options: ["Júpiter", "Saturno", "Urano", "Netuno"],
            model: "sistema_solare.glb",
            image: "mapa.png", // Substituir por imagem real do sistema solar depois
            libras: "video_solar.mp4"
        },
        {
            id: 3,
            type: 'discursive',
            text: "Descreva a importância da fotossíntese para o equilíbrio da biosfera terrestre.",
            model: null,
            image: null,
            libras: "video_photo.mp4"
        }
    ];
}

function init() {
    window.RUNNER_READY = true;
    try {
        state.questions = mockData();
        
        document.getElementById('exam-title').innerText = state.examTitle;
        document.getElementById('exam-meta').innerText = state.examMeta;
        document.getElementById('std-name').innerText = `ALUNO: ${state.student.name}`;
        document.getElementById('std-id').innerText = `MATRÍCULA: ${state.student.id}`;
        document.getElementById('std-class').innerText = `TURMA: ${state.student.class}`;
        
        setupListeners();
        
        document.getElementById('app-container').style.opacity = "0.3";
        document.getElementById('app-container').style.pointerEvents = "none";
        
        console.log("Runner v4.17: Ready.");
    } catch (e) {
        console.error("Init Error:", e);
    }
}

function startExam() {
    window.EXAM_STARTED = true;
    state.startTime = Date.now();
    
    document.getElementById('exam-cover').style.display = "none";
    document.getElementById('app-container').style.opacity = "1";
    document.getElementById('app-container').style.pointerEvents = "all";
    
    startTimer();
    renderQuestion();
    
    if (typeof THREE !== 'undefined') {
        try {
            initThreeJS();
        } catch(e) { console.error("ThreeJS init failed:", e); }
    }
}

function startTimer() {
    const totalSeconds = state.durationMinutes * 60;
    const timerElement = document.getElementById('timer');
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        let remaining = totalSeconds - elapsed;
        
        if (remaining <= 0) {
            remaining = 0;
            clearInterval(timerInterval);
            timerElement.style.color = "#ef4444";
        }
        
        const hrs = String(Math.floor(remaining / 3600)).padStart(2, '0');
        const mins = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
        const secs = String(remaining % 60).padStart(2, '0');
        timerElement.innerText = `${hrs}:${mins}:${secs}`;
    }, 1000);
}

function renderQuestion() {
    const q = state.questions[state.currentQuestion];
    const card = document.getElementById('question-card');
    card.style.opacity = 0;
    
    setTimeout(() => {
        document.getElementById('q-index').innerText = state.currentQuestion + 1;
        document.getElementById('question-text').innerHTML = q.text;
        document.getElementById('pagination').innerText = `Questão ${state.currentQuestion + 1} de ${state.questions.length}`;

        state.isExploded = false;
        document.getElementById('c3d-explode').innerText = "Inspecionar (Explodir)";

        const optionsList = document.getElementById('options-list');
        const discursiveArea = document.getElementById('discursive-area');
        
        if (q.type === 'discursive') {
            optionsList.classList.add('hidden');
            discursiveArea.classList.remove('hidden');
            document.getElementById('scratch-box').value = state.answers[q.id]?.scratch || "";
            document.getElementById('final-answer').value = state.answers[q.id]?.final || "";
        } else {
            optionsList.classList.remove('hidden');
            discursiveArea.classList.add('hidden');
            optionsList.innerHTML = '';
            q.options.forEach((opt, idx) => {
                const div = document.createElement('div');
                div.className = `option ${state.answers[q.id] === idx ? 'selected' : ''}`;
                if (state.answers[`${q.id}_eliminated_${idx}`]) div.classList.add('eliminated');
                div.innerText = opt;
                // Kiosk Bypass: Support both touch and click
                div.addEventListener('click', () => handleOptionClick(q.id, idx));
                div.addEventListener('touchstart', (e) => {
                    e.preventDefault(); // Prevent double trigger
                    handleOptionClick(q.id, idx);
                }, {passive: false});
                optionsList.appendChild(div);
            });
        }

        updateMediaDisplay();

        document.getElementById('btn-prev').disabled = state.currentQuestion === 0;
        if (state.currentQuestion === state.questions.length - 1) {
            document.getElementById('btn-next').classList.add('hidden');
            document.getElementById('btn-finish').classList.remove('hidden');
        } else {
            document.getElementById('btn-next').classList.remove('hidden');
            document.getElementById('btn-finish').classList.add('hidden');
        }

        if (state.librasMode) playLibras(q.libras);

        updateProgress();
        restoreDrawing();
        card.style.opacity = 1;
    }, 50);
}

function updateMediaDisplay() {
    const q = state.questions[state.currentQuestion];
    const container = document.getElementById('question-media');
    const canvas = document.getElementById('canvas-3d');
    const fallback = document.getElementById('img-fallback');
    const btnMode = document.getElementById('c3d-mode');
    
    if (q.model || q.image) {
        container.classList.remove('hidden');
        
        if (state.displayMode === '3D' && q.model && typeof THREE !== 'undefined' && !!THREE.GLTFLoader) {
            canvas.classList.remove('hidden');
            fallback.classList.add('hidden');
            btnMode.innerText = "Ver 2D (Imagem Opcional)";
            loadModel(q.model);
        } else if (q.image) {
            canvas.classList.add('hidden');
            fallback.classList.remove('hidden');
            // Fix path to point to root level if not in assets/images
            fallback.src = `./${q.image}`; 
            btnMode.innerText = "Tentar 3D Novamente";
            if (!q.model) btnMode.classList.add('hidden');
        } else {
            container.classList.add('hidden');
        }
    } else {
        container.classList.add('hidden');
    }
}

function handleOptionClick(qId, idx) {
    if (state.activeTool === 'erase') {
        state.answers[`${qId}_eliminated_${idx}`] = !state.answers[`${qId}_eliminated_${idx}`];
        renderQuestion();
    } else {
        state.answers[qId] = idx;
        renderQuestion();
    }
}

// Binds both click and touchstart to bypass kiosk restrictions
function bindUniversalTap(elementId, callback) {
    const el = document.getElementById(elementId);
    if(!el) return;
    el.addEventListener('click', callback);
    el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        callback(e);
    }, {passive: false});
}

// --- GLOBAL DRAWING STATE ---
let canvas, ctx;
let isDrawing = false;
let penColor = "rgba(255, 255, 0, 0.4)";
let penSize = 10;

function initCanvasGlobal() {
    canvas = document.getElementById('drawing-layer');
    if (!canvas) return;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
}

function resizeCanvas() {
    if(!canvas) return;
    const card = document.querySelector('.runner-main');
    canvas.width = card.clientWidth;
    canvas.height = card.scrollHeight; // Utilize scrollHeight to allow drawing all the way down
    restoreDrawing();
}

function saveDrawing() {
    if(!canvas) return;
    const qId = state.questions[state.currentQuestion].id;
    state.answers[qId] = state.answers[qId] || {};
    state.answers[qId].drawing = canvas.toDataURL();
}

function restoreDrawing() {
    if(!ctx) return;
    const qId = state.questions[state.currentQuestion].id;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state.answers[qId] && state.answers[qId].drawing) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = state.answers[qId].drawing;
    }
}

function setupListeners() {
    initCanvasGlobal();
    bindUniversalTap('start-exam', startExam);
    
    bindUniversalTap('btn-next', () => {
        if (state.currentQuestion < state.questions.length - 1) {
            state.currentQuestion++;
            renderQuestion();
        }
    });
    
    bindUniversalTap('btn-prev', () => {
        if (state.currentQuestion > 0) {
            state.currentQuestion--;
            renderQuestion();
        }
    });

    // --- FREEHAND DRAWING LOGIC (Canvas) ---
    // Variables and global functions are now declared outside setupListeners
    isDrawing = false;
    penColor = "rgba(255, 255, 0, 0.4)"; // Default HIGHLIGHTER (yellow semi-transparent)
    penSize = 10;
    
    // Resize canvas to cover the whole main area
    function resizeCanvas() {
        const card = document.getElementById('question-card');
        canvas.width = card.clientWidth;
        canvas.height = card.clientHeight;
        restoreDrawing();
    }
    // Tools Toggle logic bindings are kept here, but global drawing setup is moved out.

    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 500);    // Drawing Events
    function getEventPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function startPosition(e) {
        if (!state.activeTool) return;
        isDrawing = true;
        draw(e);
        e.preventDefault();
    }
    
    function endPosition() {
        if (!isDrawing) return;
        isDrawing = false;
        ctx.beginPath();
        saveDrawing();
    }

    function draw(e) {
        if (!isDrawing || !state.activeTool) return;
        
        const pos = getEventPos(e);
        ctx.lineWidth = state.activeTool === 'erase' ? penSize * 3 : penSize;
        ctx.lineCap = "round";
        
        if (state.activeTool === 'erase') {
            ctx.globalCompositeOperation = "destination-out";
            ctx.strokeStyle = "rgba(0,0,0,1)";
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = penColor;
        }

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        e.preventDefault();
    }

    // Bind Canvas events
    canvas.addEventListener('mousedown', startPosition);
    canvas.addEventListener('mouseup', endPosition);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseleave', endPosition);

    canvas.addEventListener('touchstart', startPosition, { passive: false });
    canvas.addEventListener('touchend', endPosition);
    canvas.addEventListener('touchmove', draw, { passive: false });

    // Tools Toggle logic
    bindUniversalTap('btn-highlight', () => {
        if (state.activeTool === 'highlight') {
            state.activeTool = null;
        } else {
            state.activeTool = 'highlight';
        }
        document.getElementById('btn-highlight').classList.toggle('active', state.activeTool === 'highlight');
        document.getElementById('btn-erase').classList.remove('active');
        document.body.classList.toggle('drawing-active', state.activeTool !== null);
        document.getElementById('tool-settings').classList.toggle('hidden', state.activeTool !== 'highlight');
        document.getElementById('pen-settings').classList.remove('hidden');
        document.getElementById('eraser-settings').classList.add('hidden');
        penColor = "rgba(255, 255, 0, 0.4)"; // Default marker
    });

    bindUniversalTap('btn-erase', () => {
        if (state.activeTool === 'erase') {
            state.activeTool = null;
        } else {
            state.activeTool = 'erase';
        }
        document.getElementById('btn-erase').classList.toggle('active', state.activeTool === 'erase');
        document.getElementById('btn-highlight').classList.remove('active');
        document.body.classList.toggle('drawing-active', state.activeTool !== null);
        document.getElementById('tool-settings').classList.toggle('hidden', state.activeTool !== 'erase');
        document.getElementById('eraser-settings').classList.remove('hidden');
        document.getElementById('pen-settings').classList.add('hidden');
    });

    bindUniversalTap('close-tools', () => {
        state.activeTool = null;
        document.getElementById('btn-highlight').classList.remove('active');
        document.getElementById('btn-erase').classList.remove('active');
        document.body.classList.remove('drawing-active');
        document.getElementById('tool-settings').classList.add('hidden');
    });

    // Helper to compute CSS variables to Hex/RGBA for Canvas
    function getCssColor(colorValue) {
        if (colorValue.includes('var(')) {
            const varName = colorValue.replace(/var\((.*?)\)/, '$1').trim();
            return getComputedStyle(document.body).getPropertyValue(varName).trim();
        }
        return colorValue;
    }

    // Sub-menu selectors
    document.querySelectorAll('.color-btn').forEach(btn => {
        bindUniversalTap(btn.id, () => {
            let rawColor = btn.getAttribute('data-color');
            penColor = getCssColor(rawColor);
            // If it's the yellow one, make it slightly transparent for highlighting
            if(rawColor === '#eab308') penColor = "rgba(234, 179, 8, 0.4)"; 
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        // We can't use ID directly because there are no IDs in HTML for these, need to add event listeners manually below
        btn.addEventListener('click', (e) => {
             let rawColor = e.target.getAttribute('data-color');
             penColor = getCssColor(rawColor);
             if(rawColor === '#eab308') penColor = "rgba(234, 179, 8, 0.4)"; 
             document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
             e.target.classList.add('active');
        });
    });

    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
             penSize = parseInt(e.target.getAttribute('data-size'));
             document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
             e.target.classList.add('active');
        });
    });

    bindUniversalTap('btn-apply-scratch', () => {
        const text = document.getElementById('scratch-box').value;
        const qId = state.questions[state.currentQuestion].id;
        document.getElementById('final-answer').value = text;
        state.answers[qId] = state.answers[qId] || {};
        state.answers[qId].final = text;
        state.answers[qId].scratch = text;
    });

    bindUniversalTap('btn-read', () => {
        const text = state.questions[state.currentQuestion].text;
        
        // Visual feedback
        const btn = document.getElementById('btn-read');
        const originalTitle = btn.title;
        
        if (!window.speechSynthesis || window.speechSynthesis.getVoices().length === 0) {
            btn.title = "Vozes indisponíveis no Tablet";
            btn.style.background = "#ef4444"; // Red for error
            setTimeout(() => {
                btn.title = originalTitle;
                btn.style.background = "";
            }, 3000);
            return; // Abort TTS if no voice is available on device
        }

        btn.title = "Lendo...";
        btn.style.background = "rgba(255,255,255,0.4)";
        setTimeout(() => {
            btn.title = originalTitle;
            btn.style.background = "";
        }, 3000);

        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'pt-BR';
        window.speechSynthesis.speak(utter);
    });

    bindUniversalTap('btn-focus', () => {
        state.focusMode = !state.focusMode;
        document.body.classList.toggle('focus-mode', state.focusMode);
        document.getElementById('btn-focus').style.background = state.focusMode ? 'var(--primary)' : '';
    });

    // 3D/2D Toggle
    bindUniversalTap('c3d-mode', () => {
        state.displayMode = (state.displayMode === '3D') ? '2D' : '3D';
        updateMediaDisplay();
    });

    bindUniversalTap('c3d-explode', () => {
        if (!model) return;
        state.isExploded = !state.isExploded;
        explodeModel(state.isExploded ? 2.0 : 0);
        document.getElementById('c3d-explode').innerText = state.isExploded ? "Resetar Posição" : "Inspecionar";
    });

    bindUniversalTap('c3d-reset', () => {
        if (model) {
            model.rotation.set(0,0,0);
            explodeModel(0);
            state.isExploded = false;
            document.getElementById('c3d-explode').innerText = "Inspecionar";
        }
    });

    // Access Hub Settings & Dismissal
    const hub = document.getElementById('access-hub');
    bindUniversalTap('btn-access', (e) => {
        hub.classList.toggle('open');
        e.stopPropagation(); // Prevents immediate closure
    });
    bindUniversalTap('close-hub', () => hub.classList.remove('open'));
    
    // Close hub when clicking outside
    document.addEventListener('click', (e) => {
        if (hub.classList.contains('open') && !hub.contains(e.target) && e.target.id !== 'btn-access') {
            hub.classList.remove('open');
        }
    });
    document.addEventListener('touchstart', (e) => {
        if (hub.classList.contains('open') && !hub.contains(e.target) && e.target.id !== 'btn-access') {
            hub.classList.remove('open');
        }
    });

    // Zoom
    const zoomSlider = document.getElementById('zoom-slider');
    zoomSlider.addEventListener('input', (e) => {
        state.fontSize = e.target.value;
        document.documentElement.style.setProperty('--font-base', `${state.fontSize}rem`);
    });

    // Spacing
    const lineSlider = document.getElementById('line-slider');
    lineSlider.addEventListener('input', (e) => {
        state.lineHeight = e.target.value;
        document.documentElement.style.setProperty('--line-spacing', state.lineHeight);
    });

    // Themes
    document.querySelectorAll('.theme-btn[data-theme]').forEach(btn => {
        bindUniversalTap(btn.className, (e) => {
            const theme = btn.getAttribute('data-theme');
            document.body.className = theme; // Replace all theme classes
            if (state.focusMode) document.body.classList.add('focus-mode');
            if (state.dyslexicMode) document.body.classList.add('dyslexic-mode');
        });
        // Add specific click to the button elements directly just in case className bind fails due to node selection
        btn.addEventListener('click', () => {
             const theme = btn.getAttribute('data-theme');
             document.body.className = theme;
             if (state.focusMode) document.body.classList.add('focus-mode');
             if (state.dyslexicMode) document.body.classList.add('dyslexic-mode');
        });
    });

    // OpenDyslexic
    bindUniversalTap('btn-dyslexic', () => {
        state.dyslexicMode = !state.dyslexicMode;
        document.body.classList.toggle('dyslexic-mode', state.dyslexicMode);
        document.getElementById('btn-dyslexic').style.background = state.dyslexicMode ? 'var(--primary)' : '';
    });
    
    bindUniversalTap('btn-libras', () => {
        state.librasMode = !state.librasMode;
        document.getElementById('videolibras-container').style.display = state.librasMode ? 'block' : 'none';
        if (state.librasMode) playLibras(state.questions[state.currentQuestion].libras);
    });

    bindUniversalTap('btn-finish', () => { document.getElementById('custom-modal').style.display = 'flex'; });
    bindUniversalTap('modal-cancel', () => { document.getElementById('custom-modal').style.display = 'none'; });
    bindUniversalTap('modal-confirm', () => { window.location.reload(); });
}

function initThreeJS() {
    const canvas = document.getElementById('canvas-3d');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
    scene.add(hemiLight);
    dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    camera.position.set(0, 0, 10);
    
    let isDragging = false, prevX = 0, prevY = 0;
    const onDown = (x, y) => { isDragging = true; prevX = x; prevY = y; };
    const onMove = (x, y) => {
        if (!isDragging || !model) return;
        model.rotation.y += (x - prevX) * 0.01;
        model.rotation.x += (y - prevY) * 0.01;
        prevX = x; prevY = y;
    };
    
    canvas.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => { isDragging = false; });
    canvas.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    
    canvas.addEventListener('touchstart', (e) => onDown(e.touches[0].clientX, e.touches[0].clientY), {passive: false});
    window.addEventListener('touchend', () => { isDragging = false; });
    canvas.addEventListener('touchmove', (e) => { 
        onMove(e.touches[0].clientX, e.touches[0].clientY); 
        e.preventDefault(); 
    }, {passive: false});

    function animate() {
        requestAnimationFrame(animate);
        if (model && !isDragging) model.rotation.y += 0.003;
        renderer.render(scene, camera);
    }
    animate();
}

function loadModel(path) {
    const loadingEl = document.getElementById('loading-3d');
    loadingEl.classList.remove('hidden');
    
    const loader = new THREE.GLTFLoader();
    loader.load(`./assets/models/${path}`, (gltf) => {
        if (model) scene.remove(model);
        model = gltf.scene;
        scene.add(model);
        
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 5.5 / (maxDim || 1);
        model.scale.set(scale, scale, scale);
        model.position.sub(center.multiplyScalar(scale));
        
        loadingEl.classList.add('hidden');
    }, undefined, (err) => {
        console.error("3D Load Error:", err);
        loadingEl.innerText = "ERRO 3D - CLIQUE 'VER 2D'";
    });
}

function explodeModel(factor) {
    if (!model) return;
    model.traverse((child) => {
        if (child.isMesh) {
            if (child.userData.origPos === undefined) child.userData.origPos = child.position.clone();
            const dir = child.position.clone().normalize();
            child.position.copy(child.userData.origPos).add(dir.multiplyScalar(factor));
        }
    });
}

function playLibras(videoId) {
    const player = document.getElementById('libras-player');
    const empty = document.getElementById('libras-empty');
    if (!videoId) {
        player.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
    }
    player.src = `./assets/videos/${videoId}`;
    player.classList.remove('hidden');
    empty.classList.add('hidden');
    player.play().catch(() => { empty.classList.remove('hidden'); });
}

function updateProgress() {
    const progress = ((state.currentQuestion + 1) / state.questions.length) * 100;
    const bar = document.getElementById('progress-fill');
    if (bar) bar.style.width = `${progress}%`;
}

init();
