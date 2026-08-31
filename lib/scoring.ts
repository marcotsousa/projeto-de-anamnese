export type Risk = { score: number; classification: string; recommendation: string };

export function scorePhq9(answers: number[]): Risk {
  const score = answers.reduce((sum, value) => sum + value, 0);
  if (score <= 4) return { score, classification: 'Mínima', recommendation: 'Acompanhar clinicamente' };
  if (score <= 9) return { score, classification: 'Leve', recommendation: 'Considerar acompanhamento e reavaliação' };
  if (score <= 14) return { score, classification: 'Moderada', recommendation: 'Plano terapêutico e monitoramento' };
  if (score <= 19) return { score, classification: 'Moderadamente grave', recommendation: 'Avaliação clínica aprofundada' };
  return { score, classification: 'Grave', recommendation: 'Avaliação imediata e plano de segurança quando indicado' };
}

export function scoreAssist(substance: 'alcool'|'outra', answers: number[]): Risk {
  const score = answers.reduce((sum, value) => sum + value, 0);
  const moderateMax = substance === 'alcool' ? 26 : 26;
  const lowMax = substance === 'alcool' ? 10 : 3;
  if (score <= lowMax) return { score, classification: 'Baixo', recommendation: 'Educação em saúde' };
  if (score <= moderateMax) return { score, classification: 'Moderado', recommendation: 'Intervenção breve' };
  return { score, classification: 'Alto', recommendation: 'Intervenção intensiva e encaminhamento' };
}

export function scoreAsrs(partA: number[]): Risk {
  const score = partA.filter((v, i) => v >= ([2,2,2,3,3,3][i] ?? 3)).length;
  return score >= 4
    ? { score, classification: 'Rastreio positivo', recommendation: 'Realizar avaliação diagnóstica abrangente' }
    : { score, classification: 'Rastreio negativo', recommendation: 'Interpretar junto à entrevista clínica' };
}

export function scoreMchat(failedItems: number): Risk {
  if (failedItems <= 2) return { score: failedItems, classification: 'Baixo risco', recommendation: 'Acompanhar desenvolvimento' };
  if (failedItems <= 7) return { score: failedItems, classification: 'Risco moderado', recommendation: 'Aplicar entrevista de seguimento M-CHAT-R/F' };
  return { score: failedItems, classification: 'Alto risco', recommendation: 'Encaminhar para avaliação diagnóstica e intervenção precoce' };
}
