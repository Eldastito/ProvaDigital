
export const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Gera um Token Visual (Cor + Código Curto) baseado no Aluno + Evento
// Isso garante que o Professor saiba visualmente se o aluno está logado na conta correta
export const generateVisualToken = (studentId: string, examId: string) => {
  const input = studentId + examId;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Paleta de cores de alto contraste e fácil distinção visual
  const colors = [
    'bg-red-500',    // Vermelho
    'bg-blue-500',   // Azul
    'bg-emerald-500', // Verde
    'bg-amber-500',  // Amarelo/Laranja
    'bg-purple-500', // Roxo
    'bg-pink-500',   // Rosa
    'bg-cyan-500',   // Ciano
    'bg-indigo-800'  // Azul Escuro
  ];

  const colorIndex = Math.abs(hash) % colors.length;
  // Código Hex de 3 dígitos gerado do hash (ex: #A7F)
  const code = '#' + Math.abs(hash).toString(16).substring(0, 3).toUpperCase();

  return {
    colorClass: colors[colorIndex],
    code: code
  };
};

export const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD') // Decompose accents
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim();
};

export const getQrUrl = (data: string) => `https://api.qrserver.com/v1/create-qr-code/?size=400x400&color=000000&bgcolor=ffffff&data=${encodeURIComponent(data)}`;

export const sanitizeDescription = (text: string): string => {
  if (!text) return '';
  if (text.startsWith('[SECURE_PAYLOAD]')) {
    return 'Conteúdo protegido (Legado). Por favor, edite a prova para atualizar as instruções.';
  }
  return text;
};

