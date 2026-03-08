/**
 * ExamePad - Runner Core Offline (v4.14)
 * Vanilla JS (Legacy Support - No Modules)
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
    student: {
        name: "MICHEL FELIX DA SILVA",
        id: "EP-2024-9981",
        class: "3º ANO - ENSINO MÉDIO (A)"
    }
};

let renderer, scene, camera, model, ambientLight, dirLight;
let timerInterval;

// Mock Data
function mockData() {
    return [
        {
            id: 1,
            type: 'objective',
            text: "Observe o modelo 3D da célula humana abaixo. Qual organela está representada em destaque e qual sua principal função?",
            options: [
                "Mitocôndria: Produção de ATP (Energia)", 
                "Ribossomos: Síntese de Proteínas", 
                "Núcleo: Armazenamento de Material Genético",
                "Complexo de Golgi: Secreção Celular"
            ],
            model: "celula_humana.glb",
            libras: "video_cell.mp4"
        },
        {
            id: 2,
            type: 'objective',
            text: "No modelo 3D do Sistema Solar abaixo, identifique o planeta que possui o maior sistema de anéis visíveis.",
            options: ["Júpiter", "Saturno", "Urano", "Netuno"],
            model: "sistema_solare.glb",
            libras: "video_solar.mp4"
        },
        {
            id: 3,
            type: 'discursive',
            text: "Descreva a importância da fotossíntese para o equilíbrio da biosfera terrestre.",
            model: null,
            libras: "video_photo.mp4"
        }
    ];
}

function init() {
    window.RUNNER_READY = true;
    try {
        state.questions = mockData();
        
        // Populate Header
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

function renderQuestion() {
    const q = state.questions[state.currentQuestion];
    const card = document.getElementById('question-card');
    card.style.opacity = 0;
    
    setTimeout(() => {
        document.getElementById('q-index').innerText = state.currentQuestion + 1;
        document.getElementById('question-text').innerHTML = q.text; // Use innerHTML for highlighter support
        document.getElementById('pagination').innerText = `Questão ${state.currentQuestion + 1} de ${state.questions.length}`;

        // Reset Question States
        state.isExploded = false;

        // Discursive vs Objective
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

        // 3D Media
        if (q.model && typeof THREE !== 'undefined' && !!THREE.GLTFLoader) {
            document.getElementById('question-media').classList.remove('hidden');
            loadModel(q.model);
        } else {
            document.getElementById('question-media').classList.add('hidden');
        }

        // Navigation
        document.getElementById('btn-prev').disabled = state.currentQuestion === 0;
        if (state.currentQuestion === state.questions.length - 1) {
            document.getElementById('btn-next').classList.add('hidden');
            document.getElementById('btn-finish').classList.remove('hidden');
        } else {
            document.getElementById('btn-next').classList.remove('hidden');
            document.getElementById('btn-finish').classList.add('hidden');
        }

        // Libras Player
        if (state.librasMode) playLibras(q.libras);

        updateProgress();
        card.style.opacity = 1;
    }, 50);
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

    // Navigation
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

    // Tools
    document.getElementById('btn-highlight').onclick = () => {
        state.activeTool = (state.activeTool === 'highlight') ? null : 'highlight';
        document.getElementById('btn-highlight').classList.toggle('active', state.activeTool === 'highlight');
        document.getElementById('btn-erase').classList.remove('active');
        document.getElementById('question-text').style.cursor = state.activeTool === 'highlight' ? 'crosshair' : 'default';
    };

    document.getElementById('btn-erase').onclick = () => {
        state.activeTool = (state.activeTool === 'erase') ? null : 'erase';
        document.getElementById('btn-erase').classList.toggle('active', state.activeTool === 'erase');
        document.getElementById('btn-highlight').classList.remove('active');
    };

    document.getElementById('question-text').onmouseup = () => {
        if (state.activeTool !== 'highlight') return;
        const sel = window.getSelection();
        if (!sel.rangeCount || sel.isCollapsed) return;
        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        span.className = 'text-highlighted';
        range.surroundContents(span);
        sel.removeAllRanges();
    };

    // Discursive Scratchpad
    document.getElementById('btn-apply-scratch').onclick = () => {
        const text = document.getElementById('scratch-box').value;
        const qId = state.questions[state.currentQuestion].id;
        document.getElementById('final-answer').value = text;
        state.answers[qId] = state.answers[qId] || {};
        state.answers[qId].final = text;
        state.answers[qId].scratch = text;
    };

    document.getElementById('final-answer').oninput = (e) => {
        const qId = state.questions[state.currentQuestion].id;
        state.answers[qId] = state.answers[qId] || {};
        state.answers[qId].final = e.target.value;
    };

    // Accessibility
    document.getElementById('btn-read').onclick = () => {
        const text = state.questions[state.currentQuestion].text;
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = 'pt-BR';
            utter.rate = 1.0;
            window.speechSynthesis.speak(utter);
        }
    };

    document.getElementById('btn-focus').onclick = () => {
        state.focusMode = !state.focusMode;
        document.body.classList.toggle('focus-mode', state.focusMode);
        document.getElementById('btn-focus').style.background = state.focusMode ? 'var(--primary)' : '';
    };

    // Hub
    const hub = document.getElementById('access-hub');
    document.getElementById('btn-access').onclick = () => hub.classList.toggle('open');
    document.getElementById('close-hub').onclick = () => hub.classList.remove('open');
    document.getElementById('btn-libras').onclick = () => {
        state.librasMode = !state.librasMode;
        document.getElementById('videolibras-container').style.display = state.librasMode ? 'block' : 'none';
        if (state.librasMode) playLibras(state.questions[state.currentQuestion].libras);
    };

    // 3D Controls
    document.getElementById('c3d-explode').onclick = () => {
        state.isExploded = !state.isExploded;
        explodeModel(state.isExploded ? 2.5 : 0);
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

    // Modal
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

    ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    camera.position.set(0, 0, 8);
    
    // Improved Mouse/Touch Rotation
    let isDragging = false, prevX = 0, prevY = 0;
    canvas.onmousedown = (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; };
    canvas.onmouseup = () => { isDragging = false; };
    canvas.onmousemove = (e) => {
        if (!isDragging || !model) return;
        const deltaX = e.clientX - prevX;
        const deltaY = e.clientY - prevY;
        model.rotation.y += deltaX * 0.01;
        model.rotation.x += deltaY * 0.01;
        prevX = e.clientX; prevY = e.clientY;
    };
    // Touch support (important for tablets)
    canvas.ontouchstart = (e) => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; };
    canvas.ontouchend = () => { isDragging = false; };
    canvas.ontouchmove = (e) => {
        if (!isDragging || !model) return;
        const deltaX = e.touches[0].clientX - prevX;
        const deltaY = e.touches[0].clientY - prevY;
        model.rotation.y += deltaX * 0.01;
        model.rotation.x += deltaY * 0.01;
        prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
        e.preventDefault();
    };

    function animate() {
        requestAnimationFrame(animate);
        if (model && !isDragging) model.rotation.y += 0.002;
        renderer.render(scene, camera);
    }
    animate();
}

function loadModel(path) {
    document.getElementById('loading-3d').classList.remove('hidden');
    const loader = new THREE.GLTFLoader();
    const fullPath = `./assets/models/${path}`;
    
    loader.load(fullPath, (gltf) => {
        if (model) scene.remove(model);
        model = gltf.scene;
        scene.add(model);
        
        // Auto-Center and Fit
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 4.5 / maxDim; // Adjust scale factor
        model.scale.set(scale, scale, scale);
        model.position.sub(center.multiplyScalar(scale));
        
        document.getElementById('loading-3d').classList.add('hidden');
    }, undefined, (err) => {
        console.error("Model Load Error:", err);
        document.getElementById('loading-3d').innerText = "VÍNCULO 3D FALHOU";
    });
}

function explodeModel(factor) {
    if (!model) return;
    model.traverse((child) => {
        if (child.isMesh && child.userData.originalPos === undefined) {
            child.userData.originalPos = child.position.clone();
        }
        if (child.isMesh) {
            const dir = child.position.clone().normalize();
            child.position.copy(child.userData.originalPos).add(dir.multiplyScalar(factor));
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
    player.play().catch(() => {
        console.warn("Auto-play blocked or video missing.");
        empty.innerText = "MP4 NÃO ENCONTRADO";
        empty.classList.remove('hidden');
    });
}

function startTimer() { /* Standard Timer Logic */ }
function updateProgress() { /* Standard Progress Logic */ }

init();
