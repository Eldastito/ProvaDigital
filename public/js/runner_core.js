/**
 * ExamePad - Runner Core Offline (v4.11)
 * Vanilla JS (Legacy Support - No Modules)
 */

const state = {
    currentQuestion: 0,
    answers: {},
    questions: [],
    startTime: null, // Definido ao clicar em Iniciar
    durationMinutes: 90,
    examTitle: "AVALIAÇÃO NACIONAL - CIÊNCIAS DA NATUREZA",
    examMeta: "PROVA DIGITAL | 10 Questões",
    focusMode: false,
    dyslexicMode: false,
    librasMode: false,
    fontSize: 1.0,
    lineHeight: 1.6,
    theme: 'dark',
    student: {
        name: "MICHEL FELIX DA SILVA",
        id: "EP-2024-9981",
        class: "3º ANO - ENSINO MÉDIO (A)"
    }
};

let renderer, scene, camera, model;
let timerInterval;

// Mock Data
function mockData() {
    return [
        {
            id: 1,
            text: "Observe o modelo 3D da célula humana abaixo. Qual organela está representada em destaque e qual sua principal função?",
            options: [
                "Mitocôndria: Produção de ATP (Energia)", 
                "Ribossomos: Síntese de Proteínas", 
                "Núcleo: Armazenamento de Material Genético",
                "Complexo de Golgi: Secreção Celular"
            ],
            model: "celula_humana.glb"
        },
        {
            id: 2,
            text: "No modelo 3D do Sistema Solar abaixo, identifique o planeta que possui o maior sistema de anéis visíveis.",
            options: ["Júpiter", "Saturno", "Urano", "Netuno"],
            model: "sistema_solare.glb"
        },
        {
            id: 3,
            text: "Qual a distância aproximada da Terra ao Sol?",
            options: ["150 milhões de km", "50 milhões de km", "300 milhões de km"],
            model: null
        }
    ];
}

function init() {
    window.RUNNER_READY = true;
    try {
        console.log("Runner Core: Preparando Prova...");
        state.questions = mockData();
        
        // Header Info (Pre-populado)
        document.getElementById('exam-title').innerText = state.examTitle;
        document.getElementById('exam-meta').innerText = state.examMeta;
        document.getElementById('std-name').innerText = `ALUNO: ${state.student.name}`;
        document.getElementById('std-id').innerText = `MATRÍCULA: ${state.student.id}`;
        document.getElementById('std-class').innerText = `TURMA: ${state.student.class}`;
        
        setupListeners();
        
        // Ocultar app até clicar em iniciar
        document.getElementById('app-container').style.opacity = "0.3";
        document.getElementById('app-container').style.pointerEvents = "none";

        console.log("Runner Core: Aguardando clique em 'Iniciar Prova'");
    } catch (e) {
        console.error("Erro fatal no init:", e);
    }
}

function startExam() {
    window.EXAM_STARTED = true;
    state.startTime = Date.now();
    
    // UI Transition
    document.getElementById('exam-cover').style.display = "none";
    document.getElementById('app-container').style.opacity = "1";
    document.getElementById('app-container').style.pointerEvents = "all";
    
    startTimer();
    renderQuestion();
    
    if (typeof THREE !== 'undefined') {
        try {
            initThreeJS();
        } catch(e) { console.warn("ThreeJS falhou:", e); }
    }
}

function renderQuestion() {
    const q = state.questions[state.currentQuestion];
    const card = document.getElementById('question-card');
    card.style.opacity = 0;
    
    setTimeout(() => {
        document.getElementById('q-index').innerText = state.currentQuestion + 1;
        document.getElementById('question-text').innerText = q.text;
        document.getElementById('pagination').innerText = `Questão ${state.currentQuestion + 1} de ${state.questions.length}`;

        const optionsContainer = document.getElementById('options-list');
        optionsContainer.innerHTML = '';
        q.options.forEach((opt, idx) => {
            const div = document.createElement('div');
            div.className = `option ${state.answers[q.id] === idx ? 'selected' : ''}`;
            div.innerText = opt;
            div.onclick = () => selectOption(q.id, idx);
            optionsContainer.appendChild(div);
        });

        if (q.model && typeof THREE !== 'undefined' && !!THREE.GLTFLoader) {
            document.getElementById('question-media').classList.remove('hidden');
            loadModel(q.model);
        } else {
            document.getElementById('question-media').classList.add('hidden');
        }

        document.getElementById('btn-prev').disabled = state.currentQuestion === 0;
        if (state.currentQuestion === state.questions.length - 1) {
            document.getElementById('btn-next').classList.add('hidden');
            document.getElementById('btn-finish').classList.remove('hidden');
        } else {
            document.getElementById('btn-next').classList.remove('hidden');
            document.getElementById('btn-finish').classList.add('hidden');
        }

        updateProgress();
        card.style.opacity = 1;
    }, 50);
}

function selectOption(qId, idx) {
    state.answers[qId] = idx;
    renderQuestion();
}

function setupListeners() {
    // Cover
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
    document.getElementById('btn-read').onclick = () => {
        const text = state.questions[state.currentQuestion].text;
        if (window.speechSynthesis) {
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = 'pt-BR';
            window.speechSynthesis.speak(utter);
        } else if (window.Capacitor && window.Capacitor.Plugins.NativeOperations) {
            window.Capacitor.Plugins.NativeOperations.speakText({ text });
        }
    };

    document.getElementById('btn-focus').onclick = () => {
        state.focusMode = !state.focusMode;
        document.body.classList.toggle('focus-mode', state.focusMode);
        document.getElementById('btn-focus').style.background = state.focusMode ? 'var(--primary)' : '';
    };

    // Accessibility Hub
    const hub = document.getElementById('access-hub');
    document.getElementById('btn-access').onclick = () => hub.classList.toggle('open');
    document.getElementById('close-hub').onclick = () => hub.classList.remove('open');

    document.getElementById('btn-libras').onclick = () => {
        state.librasMode = !state.librasMode;
        document.getElementById('videolibras-container').style.display = state.librasMode ? 'block' : 'none';
        document.getElementById('btn-libras').innerText = state.librasMode ? 'Desativar Libras' : 'Ativar Intérprete 🤟';
    };

    document.getElementById('zoom-slider').oninput = (e) => {
        state.fontSize = e.target.value;
        document.documentElement.style.setProperty('--font-scale', state.fontSize);
    };

    document.getElementById('line-slider').oninput = (e) => {
        state.lineHeight = e.target.value;
        document.documentElement.style.setProperty('--line-height', state.lineHeight);
    };

    document.querySelectorAll('.theme-btn[data-theme]').forEach(btn => {
        btn.onclick = () => {
            const theme = btn.getAttribute('data-theme');
            document.body.className = `theme-${theme}`;
            if (state.dyslexicMode) document.body.classList.add('font-dyslexic');
            if (state.focusMode) document.body.classList.add('focus-mode');
        };
    });

    document.getElementById('btn-dyslexic').onclick = () => {
        state.dyslexicMode = !state.dyslexicMode;
        document.body.classList.toggle('font-dyslexic', state.dyslexicMode);
        document.getElementById('btn-dyslexic').innerText = state.dyslexicMode ? 'Desativar Dyslexic' : 'Ativar OpenDyslexic';
    };

    // Custom Modal Call
    document.getElementById('btn-finish').onclick = () => {
        const responded = Object.keys(state.answers).length;
        document.getElementById('modal-msg').innerText = `Você respondeu ${responded} de ${state.questions.length} questões. Deseja encerrar a prova agora?`;
        document.getElementById('custom-modal').style.display = 'flex';
    };

    document.getElementById('modal-cancel').onclick = () => {
        document.getElementById('custom-modal').style.display = 'none';
    };

    document.getElementById('modal-confirm').onclick = () => {
        if (window.Capacitor && window.Capacitor.Plugins.NativeOperations) {
            window.Capacitor.Plugins.NativeOperations.finishExam({ answers: state.answers });
        }
        alert("Prova enviada com sucesso! O tablet será bloqueado até a coleta.");
        window.location.reload(); // Simula o encerramento
    };
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
            alert("Tempo esgotado! A prova será enviada automaticamente.");
            document.getElementById('modal-confirm').click();
        }
        const hrs = String(Math.floor(remaining / 3600)).padStart(2, '0');
        const mins = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
        const secs = String(remaining % 60).padStart(2, '0');
        timerElement.innerText = `${hrs}:${mins}:${secs}`;
    }, 1000);
}

function updateProgress() {
    const progress = ((state.currentQuestion + 1) / state.questions.length) * 100;
    const bar = document.getElementById('progress-fill');
    if (bar) bar.style.width = `${progress}%`;
}

function initThreeJS() {
    const canvas = document.getElementById('canvas-3d');
    if (!canvas) return;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    const light = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(light);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
    camera.position.z = 5;
    function animate() {
        requestAnimationFrame(animate);
        if (model) model.rotation.y += 0.005;
        renderer.render(scene, camera);
    }
    animate();
}

function loadModel(path) {
    document.getElementById('loading-3d').classList.remove('hidden');
    const loader = new THREE.GLTFLoader();
    const fullPath = `./assets/models/${path}`;
    
    loader.load(fullPath, function(gltf) {
        if (model) scene.remove(model);
        model = gltf.scene;
        scene.add(model);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3.5 / maxDim;
        model.scale.set(scale, scale, scale);
        model.position.sub(center.multiplyScalar(scale));
        document.getElementById('loading-3d').classList.add('hidden');
    }, undefined, function(error) {
        console.error("Erro ao carregar modelo:", error);
        document.getElementById('loading-3d').innerText = "VINCULO 3D FALHOU";
    });
}

/**
 * Nota Técnica: Vínculo do Aluno
 * No ExamePad SAA/Offline, o tablet é vinculado via Hardware ID (IMEI/Serial)
 * mapeado no servidor de sincronização local. Este mock simula o vínculo
 * direto após o handshake seguro.
 */

init();
