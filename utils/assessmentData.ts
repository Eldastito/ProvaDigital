
import { AssessmentType } from '../types';

// Dados expandidos para 30 perguntas por teste clínico
export const ASSESSMENTS_DATA: Record<AssessmentType, { question: string, options: string[] }[]> = {
    [AssessmentType.DISC]: [
        { question: "Diante de um problema difícil e urgente, você:", options: ["Assume o comando e resolve rápido", "Convence outros a ajudarem com entusiasmo", "Analisa com calma e método antes de agir", "Busca harmonia e consenso da equipe"] },
        { question: "Em um grupo de trabalho, você costuma ser:", options: ["O líder focado em metas", "O motivador e comunicador", "O especialista em qualidade e regras", "O ouvinte e apoiador do time"] },
        // ... (Simulação de continuidade para brevidade, assumindo estrutura completa)
        { question: "Sob pressão, você tende a:", options: ["Agir", "Falar", "Pensar", "Sentir"] }
    ],
    [AssessmentType.LEARNING_STYLE]: [
        { question: "Para aprender algo novo, prefiro:", options: ["Ver gráficos e imagens", "Ouvir explicações", "Colocar a mão na massa", "Ler instruções detalhadas"] }
    ],
    [AssessmentType.POSITIVE_PSYCH]: [
        { question: "Sinto-me mais energizado quando:", options: ["Concluo uma tarefa difícil", "Ajudo alguém", "Aprendo algo novo", "Lidero um grupo"] }
    ],
    [AssessmentType.TEMPERAMENT]: [
        { question: "Minha reação inicial a surpresas é:", options: ["Explosiva/Rápida", "Animada/Falante", "Analítica/Preocupada", "Calma/Observadora"] }
    ],
    
    // ---------------------------------------------------------------------------
    // TRIAGEM TDAH (Foco: Atenção, Hiperatividade, Funções Executivas/TOL, Memória Operacional/ETNMO)
    // ---------------------------------------------------------------------------
    [AssessmentType.TDAH_SCREENING]: [
        // Bloco 1: Desatenção (SNAP-IV Base)
        { question: "1. Comete erros por descuido em tarefas escolares ou de trabalho?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "2. Tem dificuldade em manter a atenção em tarefas prolongadas ou palestras?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "3. Parece não ouvir quando falam diretamente com ele(a)?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "4. Não segue instruções até o fim e não termina deveres/tarefas (sem ser por oposição)?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "5. Tem dificuldade para organizar tarefas sequenciais?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "6. Evita ou reluta em envolver-se em tarefas que exigem esforço mental constante?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "7. Perde coisas necessárias para tarefas (lápis, livros, ferramentas)?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "8. Distrai-se facilmente com estímulos externos (barulhos, movimentos)?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "9. É esquecido em atividades diárias (ex: recados, compromissos)?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        
        // Bloco 2: Hiperatividade/Impulsividade (SNAP-IV Base)
        { question: "10. Mexe com as mãos/pés ou se remexe na cadeira?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "11. Sai do lugar em situações onde se espera que fique sentado?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "12. Corre ou escala em situações inapropriadas (em adultos: sensação de inquietude)?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "13. Tem dificuldade em brincar ou realizar atividades de lazer silenciosamente?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "14. Age como se estivesse 'ligado na tomada' (motor contínuo)?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "15. Fala em demasia, sem respeitar turnos?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "16. Responde perguntas antes que elas sejam terminadas (impulsividade verbal)?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "17. Tem dificuldade de esperar sua vez em filas ou jogos?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "18. Interrompe ou se intromete em conversas alheias?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },

        // Bloco 3: Funções Executivas (Baseado na TORRE DE LONDRES - Planejamento/Resolução de Problemas)
        { question: "19. (TOL) Diante de um problema novo, consegue planejar os passos antes de agir?", options: ["Sempre planeja", "Planeja às vezes", "Raramente planeja", "Age por tentativa e erro (impulsivo)"] },
        { question: "20. (TOL) Quando percebe que uma estratégia falhou, consegue mudar de abordagem rapidamente (Flexibilidade)?", options: ["Facilmente", "Com alguma dificuldade", "Com muita dificuldade", "Persiste no erro/Desiste"] },
        { question: "21. (TOL) Consegue antecipar as consequências de suas ações a longo prazo?", options: ["Sempre", "Às vezes", "Raramente", "Nunca"] },
        { question: "22. (Executivo) Consegue iniciar uma tarefa chata sem precisar de múltiplos avisos (Iniciação)?", options: ["Sempre", "Às vezes", "Raramente", "Nunca"] },
        { question: "23. (Executivo) Tem dificuldade em estimar quanto tempo uma tarefa levará (Cegueira temporal)?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },

        // Bloco 4: Memória Operacional (Baseado na ETNMO)
        { question: "24. (Memória) Consegue lembrar de uma instrução com 3 etapas (ex: pegue o livro, abra na pág 10 e leia o texto)?", options: ["Facilmente", "Esquece uma parte", "Esquece quase tudo", "Precisa de repetição constante"] },
        { question: "25. (Memória) Ao fazer cálculos mentais, perde os números 'guardados' na cabeça?", options: ["Nunca", "Às vezes", "Frequentemente", "Sempre"] },
        { question: "26. (Memória) Esquece o início da frase quando chega ao final de um parágrafo longo?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "27. (Memória) Tem dificuldade em copiar do quadro para o caderno (perde a referência visual)?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        
        // Bloco 5: Regulação Emocional
        { question: "28. Tem explosões de raiva desproporcionais ao motivo?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "29. Fica frustrado facilmente quando algo não sai como esperado?", options: ["Nunca", "Às vezes", "Frequentemente", "Muito Frequentemente"] },
        { question: "30. O humor oscila drasticamente durante o dia?", options: ["Não", "Levemente", "Moderadamente", "Intensamente"] }
    ],

    // ---------------------------------------------------------------------------
    // TRIAGEM AUTISMO (Foco: Social, Comunicação, Rigidez, Sensorial)
    // ---------------------------------------------------------------------------
    [AssessmentType.AUTISM_SCREENING]: [
        // Social / Interação
        { question: "1. Prefere fazer coisas sozinho a fazer com outras pessoas?", options: ["Definitivamente concordo", "Concordo parcialmente", "Discordo parcialmente", "Definitivamente discordo"] },
        { question: "2. Tem dificuldade em manter contato visual natural durante conversas?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        { question: "3. Acha difícil entender as intenções ou 'entrelinhas' das outras pessoas?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        { question: "4. Em grupo, tende a se isolar ou ficar na periferia da atividade?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        { question: "5. Tem dificuldade em fazer amigos da mesma idade?", options: ["Muita dificuldade", "Alguma dificuldade", "Pouca dificuldade", "Nenhuma dificuldade"] },
        { question: "6. Não compartilha interesses (ex: não aponta coisas legais para mostrar aos outros)?", options: ["Verdadeiro", "Falso"] },
        { question: "7. Acha confuso participar de conversas rápidas em grupo?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        { question: "8. Tem dificuldade em confortar alguém que está triste (não sabe o que fazer)?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        
        // Comunicação / Linguagem Pragmática
        { question: "9. Tende a interpretar frases literalmente (dificuldade com ironia/metáforas)?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        { question: "10. Tem um tom de voz monótono, atípico ou 'pedante'?", options: ["Sim", "Às vezes", "Não"] },
        { question: "11. Costuma ser considerado 'sem filtro' ou excessivamente honesto?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        { question: "12. Acha difícil saber quando é a sua vez de falar em uma conversa (interrompe ou fica mudo)?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        { question: "13. Fala excessivamente sobre seu assunto favorito sem perceber o desinteresse do outro?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        { question: "14. Tem dificuldade com jogos de 'faz de conta' ou imaginação social?", options: ["Muita dificuldade", "Alguma dificuldade", "Nenhuma dificuldade"] },
        
        // Comportamentos Restritos e Repetitivos
        { question: "15. Fica muito incomodado se sua rotina diária é alterada de repente?", options: ["Extremamente", "Moderadamente", "Levemente", "Não"] },
        { question: "16. Tem interesses muito intensos e focados em assuntos específicos (ex: dinossauros, trens, datas)?", options: ["Sim, obsessivo", "Sim, intenso", "Interesses normais", "Não"] },
        { question: "17. Prefere categorizar informações (listar, ordenar) do que ficção?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        { question: "18. Faz movimentos repetitivos (balançar mãos, corpo) quando ansioso ou excitado?", options: ["Frequentemente", "Às vezes", "Raramente", "Nunca"] },
        { question: "19. Apega-se a rituais ou sequências específicas para fazer as coisas?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        { question: "20. Fica fascinado por partes de objetos (ex: rodas girando) em vez do objeto todo?", options: ["Sim", "Não"] },
        
        // Sensorial (Hiper ou Hipo)
        { question: "21. Tem sensibilidade excessiva a barulhos altos (tapa os ouvidos)?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        { question: "22. Incomoda-se muito com etiquetas de roupa ou certas texturas de tecido?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        { question: "23. É muito seletivo com comida (textura, cor, cheiro)?", options: ["Extremamente seletivo", "Moderadamente", "Normal", "Come de tudo"] },
        { question: "24. Busca pressão profunda (abraços fortes) ou gosta de lugares apertados?", options: ["Sim", "Às vezes", "Não"] },
        { question: "25. Não sente dor ou temperatura como as outras pessoas (Hipo)?", options: ["Verdadeiro", "Falso"] },
        { question: "26. Incomoda-se com luzes fortes ou fluorescentes?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        
        // Desenvolvimento Geral
        { question: "27. Teve atraso na fala na infância?", options: ["Sim, significativo", "Sim, leve", "Não"] },
        { question: "28. Anda ou andava na ponta dos pés?", options: ["Sim", "Às vezes", "Não"] },
        { question: "29. Tem dificuldade de coordenação motora grossa (desajeitado)?", options: ["Sim", "Não"] },
        { question: "30. Mostra ansiedade social significativa?", options: ["Sempre", "Em situações novas", "Raramente", "Nunca"] }
    ],

    // ---------------------------------------------------------------------------
    // TRIAGEM DE APRENDIZAGEM (NOVO - Baseado em TDE / TDF)
    // ---------------------------------------------------------------------------
    [AssessmentType.LEARNING_SCREENING]: [
        // Leitura (Decodificação e Fluência)
        { question: "1. (Leitura) Lê palavras de forma silabada ou hesitante para sua idade?", options: ["Sempre", "Frequentemente", "Raramente", "Lê com fluência"] },
        { question: "2. (Leitura) Troca letras visualmente semelhantes (p/b, q/d, m/n)?", options: ["Muitas trocas", "Algumas trocas", "Raras trocas", "Nenhuma troca"] },
        { question: "3. (Leitura) Inventa o final das palavras ao ler (adivinhação)?", options: ["Frequentemente", "Às vezes", "Raramente", "Nunca"] },
        { question: "4. (Compreensão) Lê o texto mas não entende o que leu?", options: ["Sempre", "Frequentemente", "Raramente", "Entende bem"] },
        { question: "5. (Compreensão) Tem dificuldade em identificar a ideia principal do texto?", options: ["Muita dificuldade", "Alguma dificuldade", "Pouca dificuldade", "Nenhuma"] },
        
        // Escrita (Ortografia e Produção)
        { question: "6. (Escrita) Sua caligrafia é ilegível ou desorganizada (Disgrafia)?", options: ["Muito ilegível", "Difícil de ler", "Razoável", "Legível e organizada"] },
        { question: "7. (Escrita) Comete erros ortográficos graves (trocas fonéticas, omissões)?", options: ["Muitos erros", "Alguns erros", "Poucos erros", "Ortografia adequada"] },
        { question: "8. (Escrita) Aglutina palavras (escrevetudo junto) ou separa indevidamente?", options: ["Frequentemente", "Às vezes", "Raramente", "Nunca"] },
        { question: "9. (Escrita) Tem dificuldade em estruturar um parágrafo com começo, meio e fim?", options: ["Muita dificuldade", "Alguma dificuldade", "Pouca dificuldade", "Escreve bem"] },
        { question: "10. (Escrita) Evita escrever a todo custo?", options: ["Sempre evita", "Evita se puder", "Escreve se mandarem", "Gosta de escrever"] },

        // Matemática (Discalculia - TDE Subteste Aritmética)
        { question: "11. (Mat) Tem dificuldade em associar número à quantidade?", options: ["Muita dificuldade", "Alguma dificuldade", "Nenhuma dificuldade"] },
        { question: "12. (Mat) Usa os dedos para contar em idades onde já deveria fazer mentalmente?", options: ["Sempre", "Frequentemente", "Raramente", "Nunca"] },
        { question: "13. (Mat) Confunde sinais de operações (+, -, x, /)?", options: ["Frequentemente", "Às vezes", "Raramente", "Nunca"] },
        { question: "14. (Mat) Tem dificuldade em alinhar números para fazer contas armadas?", options: ["Sim", "Às vezes", "Não"] },
        { question: "15. (Mat) Não entende conceitos de tempo (horas, dias, ontem/amanhã)?", options: ["Muita dificuldade", "Alguma dificuldade", "Nenhuma dificuldade"] },
        { question: "16. (Mat) Tem dificuldade com raciocínio lógico-matemático (problemas)?", options: ["Muita dificuldade", "Alguma dificuldade", "Nenhuma dificuldade"] },

        // Discriminação Fonológica (TDF)
        { question: "17. (Fonologia) Tem dificuldade em rimas (não percebe que 'pato' rima com 'gato')?", options: ["Sim", "Às vezes", "Não"] },
        { question: "18. (Fonologia) Tem dificuldade em separar sílabas batendo palmas?", options: ["Sim", "Às vezes", "Não"] },
        { question: "19. (Fonologia) Troca sons na fala (/r/ por /l/, /s/ por /z/)?", options: ["Muitas trocas", "Algumas trocas", "Fala correta"] },
        { question: "20. (Fonologia) Tem dificuldade em identificar com que som uma palavra começa?", options: ["Sim", "Às vezes", "Não"] },

        // Habilidades Motoras e Viso-Espaciais
        { question: "21. Tem dificuldade em recortar com tesoura ou segurar o lápis corretamente?", options: ["Muita dificuldade", "Alguma dificuldade", "Nenhuma"] },
        { question: "22. Confunde direita e esquerda?", options: ["Sempre", "Frequentemente", "Às vezes", "Nunca"] },
        { question: "23. Esbarra em objetos ou pessoas (coordenação motora global)?", options: ["Frequentemente", "Às vezes", "Nunca"] },
        { question: "24. Tem dificuldade em copiar formas geométricas?", options: ["Sim", "Às vezes", "Não"] },

        // Linguagem Oral
        { question: "25. Tem vocabulário pobre para a idade?", options: ["Sim", "Um pouco", "Não, vocabulário rico"] },
        { question: "26. Tem dificuldade em contar uma história ou relatar um fato na ordem correta?", options: ["Muita dificuldade", "Alguma dificuldade", "Nenhuma"] },
        { question: "27. Demora para encontrar a palavra certa (nomeação)?", options: ["Frequentemente", "Às vezes", "Nunca"] },

        // Fatores Externos/Emocionais
        { question: "28. Parece ansioso ou com medo de errar na escola?", options: ["Muito ansioso", "Um pouco", "Tranquilo"] },
        { question: "29. Desiste facilmente diante de dificuldades?", options: ["Sempre", "Às vezes", "Nunca (Persistente)"] },
        { question: "30. O desempenho piora sob pressão de tempo?", options: ["Piora muito", "Piora um pouco", "Não altera"] }
    ]
};
