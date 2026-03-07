/**
 * ExamePad - Runner Core Offline (v4.6)
 * Vanilla JS + Three.js Modules
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';

const state = {
    currentQuestion: 0,
    answers: {},
    questions: [],
    startTime: Date.now(),
    durationMinutes: 90,
    examTitle: "AVALIAÇÃO NACIONAL - CIÊNCIAS DA NATUREZA",
    examMeta: "PROVA DIGITAL | 10 Questões",
    focusMode: false,
    dyslexicMode: false,
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

// Mock Data com Novos Modelos Glb
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
            model: "sistema_solar.glb"
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
        console.log("Runner Core: Iniciando...");
        state.questions = mockData();
        
        // Header Info
        document.getElementById('exam-title').innerText = state.examTitle;
        document.getElementById('exam-meta').innerText = state.examMeta;
        document.getElementById('std-name').innerText = `ALUNO: ${state.student.name}`;
        document.getElementById('std-id').innerText = `MATRÍCULA: ${state.student.id}`;
        document.getElementById('std-class').innerText = `TURMA: ${state.student.class}`;
        
        startTimer();
        renderQuestion();
        setupListeners();
        
        try {
            initThreeJS();
        } catch (threeErr) {
            console.error("Erro ThreeJS:", threeErr);
        }

        console.log("Runner Core: Inicialização concluída.");
    } catch (e) {
        console.error("Erro fatal no init:", e);
        alert("Erro ao iniciar prova: " + e.message);
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

        if (q.model) {
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
        if (window.Capacitor && window.Capacitor.Plugins.NativeOperations) {
            window.Capacitor.Plugins.NativeOperations.speakText({ text });
        }
    };

    document.getElementById('btn-focus').onclick = () => {
        state.focusMode = !state.focusMode;
        document.body.classList.toggle('focus-mode', state.focusMode);
    };

    // Accessibility Hub
    const hub = document.getElementById('access-hub');
    document.getElementById('btn-access').onclick = () => hub.classList.toggle('open');
    document.getElementById('close-hub').onclick = () => hub.classList.remove('open');

    // Zoom & Space Controls
    document.getElementById('zoom-slider').oninput = (e) => {
        state.fontSize = e.target.value;
        document.documentElement.style.setProperty('--font-scale', state.fontSize);
    };

    document.getElementById('line-slider').oninput = (e) => {
        state.lineHeight = e.target.value;
        document.documentElement.style.setProperty('--line-height', state.lineHeight);
    };

    // Theme switching
    document.querySelectorAll('.theme-btn[data-theme]').forEach(btn => {
        btn.onclick = () => {
            const theme = btn.getAttribute('data-theme');
            document.body.className = `theme-${theme}`;
            if (state.dyslexicMode) document.body.classList.add('font-dyslexic');
        };
    });

    document.getElementById('btn-dyslexic').onclick = () => {
        state.dyslexicMode = !state.dyslexicMode;
        document.body.classList.toggle('font-dyslexic', state.dyslexicMode);
        document.getElementById('btn-dyslexic').innerText = state.dyslexicMode ? 'Desativar Dyslexic' : 'Ativar OpenDyslexic';
    };

    // Finish
    document.getElementById('btn-finish').onclick = () => {
        const responded = Object.keys(state.answers).length;
        if(confirm(`Você respondeu ${responded} questões. Finalizar agora?`)) {
            if (window.Capacitor && window.Capacitor.Plugins.NativeOperations) {
                window.Capacitor.Plugins.NativeOperations.finishExam({ answers: state.answers });
            }
            alert("Prova finalizada com sucesso!");
        }
    };
}

function startTimer() {
    const totalSeconds = state.durationMinutes * 60;
    const timerElement = document.getElementById('timer');
    const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        let remaining = totalSeconds - elapsed;
        if (remaining <= 0) {
            remaining = 0;
            clearInterval(interval);
            timerElement.style.color = "#ef4444";
            alert("Tempo esgotado!");
        }
        const hrs = String(Math.floor(remaining / 3600)).padStart(2, '0');
        const mins = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
        const secs = String(remaining % 60).padStart(2, '0');
        timerElement.innerText = `${hrs}:${mins}:${secs}`;
    }, 1000);
}

function updateProgress() {
    const progress = ((state.currentQuestion + 1) / state.questions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
}

function initThreeJS() {
    const canvas = document.getElementById('canvas-3d');
    if (!canvas) return;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
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
    const loader = new GLTFLoader();
    const fullPath = `./assets/models/${path}`;
    loader.load(fullPath, (gltf) => {
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
    }, undefined, (error) => {
        console.error("Erro ao carregar modelo:", error);
        document.getElementById('loading-3d').innerText = "3D INDISPONÍVEL";
    });
}

console.log("Runner Core: Script Carregado");
init();
