/**
 * ExamePad - Runner Core Offline (v4.16)
 * Vanilla JS (Legacy Support - No Modules)
 * Focus: Stability fixes (Pointer Events, 3D Fallback, Silent TTS)
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

// Mock Data with Image fallbacks
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
            image: "celula_humana.png", // Fallback image
            libras: "video_cell.mp4"
        },
        {
            id: 2,
            type: 'objective',
            text: "No modelo abaixo do Sistema Solar, identifique o planeta que possui o maior sistema de anéis visíveis.",
            options: ["Júpiter", "Saturno", "Urano", "Netuno"],
            model: "sistema_solare.glb",
            image: "sistema_solar.png", // Fallback image
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
                div.onclick = () => handleOptionClick(q.id, idx);
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
            btnMode.innerText = "Ver 2D (Imagem)";
            loadModel(q.model);
        } else if (q.image) {
            canvas.classList.add('hidden');
            fallback.classList.remove('hidden');
            fallback.src = `./assets/images/${q.image}`;
            btnMode.innerText = "Ver 3D (Modelo)";
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

function setupListeners() {
    document.getElementById('start-exam').onclick = startExam;

    document.getElementById('btn-next').onclick = () => {
        if (state.currentQuestion < state.questions.length - 1) {
            state.currentQuestion++;
            renderQuestion();
        }
    };
    document.getElementById('btn-prev').onclick = () => {
        if (state.currentQuestion > 0) {
            state.currentQuestion--;
            renderQuestion();
        }
    };

    // Tools using Pointer Events for Tablet
    document.getElementById('btn-highlight').onpointerdown = (e) => {
        state.activeTool = (state.activeTool === 'highlight') ? null : 'highlight';
        document.getElementById('btn-highlight').classList.toggle('active', state.activeTool === 'highlight');
        document.getElementById('btn-erase').classList.remove('active');
        document.getElementById('question-text').style.cursor = state.activeTool === 'highlight' ? 'crosshair' : 'default';
        e.stopPropagation();
    };

    document.getElementById('btn-erase').onpointerdown = (e) => {
        state.activeTool = (state.activeTool === 'erase') ? null : 'erase';
        document.getElementById('btn-erase').classList.toggle('active', state.activeTool === 'erase');
        document.getElementById('btn-highlight').classList.remove('active');
        e.stopPropagation();
    };

    document.addEventListener('pointerup', () => {
        if (state.activeTool !== 'highlight') return;
        const sel = window.getSelection();
        if (!sel.rangeCount || sel.isCollapsed) return;
        const range = sel.getRangeAt(0);
        
        // Safety check to ensure selection is within question-text
        const qText = document.getElementById('question-text');
        if (!qText.contains(range.commonAncestorContainer)) return;

        const span = document.createElement('span');
        span.className = 'text-highlighted';
        try {
            range.surroundContents(span);
        } catch(e) { console.warn("Highlight fail."); }
        sel.removeAllRanges();
    });

    document.getElementById('btn-apply-scratch').onclick = () => {
        const text = document.getElementById('scratch-box').value;
        const qId = state.questions[state.currentQuestion].id;
        document.getElementById('final-answer').value = text;
        state.answers[qId] = state.answers[qId] || {};
        state.answers[qId].final = text;
        state.answers[qId].scratch = text;
    };

    document.getElementById('btn-read').onclick = () => {
        const text = state.questions[state.currentQuestion].text;
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = 'pt-BR';
            window.speechSynthesis.speak(utter);
        }
        // Silent fail if not supported - no alert as per user request
    };

    document.getElementById('btn-focus').onclick = () => {
        state.focusMode = !state.focusMode;
        document.body.classList.toggle('focus-mode', state.focusMode);
        document.getElementById('btn-focus').style.background = state.focusMode ? 'var(--primary)' : '';
    };

    // 3D/2D Toggle
    document.getElementById('c3d-mode').onclick = () => {
        state.displayMode = (state.displayMode === '3D') ? '2D' : '3D';
        updateMediaDisplay();
    };

    document.getElementById('c3d-explode').onclick = () => {
        if (!model) return;
        state.isExploded = !state.isExploded;
        explodeModel(state.isExploded ? 2.0 : 0);
        document.getElementById('c3d-explode').innerText = state.isExploded ? "Resetar Posição" : "Inspecionar (Explodir)";
    };

    document.getElementById('c3d-reset').onclick = () => {
        if (model) {
            model.rotation.set(0,0,0);
            explodeModel(0);
            state.isExploded = false;
            document.getElementById('c3d-explode').innerText = "Inspecionar (Explodir)";
        }
    };

    document.getElementById('btn-libras').onclick = () => {
        state.librasMode = !state.librasMode;
        document.getElementById('videolibras-container').style.display = state.librasMode ? 'block' : 'none';
        if (state.librasMode) playLibras(state.questions[state.currentQuestion].libras);
    };

    document.getElementById('btn-finish').onclick = () => { document.getElementById('custom-modal').style.display = 'flex'; };
    document.getElementById('modal-cancel').onclick = () => { document.getElementById('custom-modal').style.display = 'none'; };
    document.getElementById('modal-confirm').onclick = () => { window.location.reload(); };
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
    canvas.addEventListener('pointerdown', (e) => onDown(e.clientX, e.clientY));
    window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('pointerup', () => { isDragging = false; });

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
        loadingEl.innerText = "FALHA 3D - USE MODO 2D";
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
