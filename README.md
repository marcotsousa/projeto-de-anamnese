# Projeto de Anamnese — Gestão clínica

Aplicação responsiva para prontuários psicológicos, anamnese, evolução de sessões e rastreios clínicos. O acesso é protegido pela autenticação da plataforma e todas as consultas devem usar o identificador do profissional autenticado como filtro de propriedade.

## Recursos

- Dashboard clínico, busca e cadastro de pacientes.
- Prontuário com anamnese, plano terapêutico e contatos.
- Histórico de “Atualizações” com data, horário, evolução e próximos passos.
- Histórico de ASSIST, PHQ-9, ASRS-v1.1, SNAP-IV, M-CHAT-R e AQ-10.
- Funções de classificação em `lib/scoring.ts` e esquema relacional em `db/schema.ts`.
- Isolamento por profissional através de `professional_id` e autenticação no servidor.

> Os instrumentos são auxiliares de rastreio e não substituem avaliação diagnóstica. Antes de uso clínico, valide versão, licença, normas brasileiras e pontos de corte vigentes junto ao CFP/SATEPSI e às fontes oficiais.

## Instalação local

Requer Node.js 22.13 ou superior.

```bash
npm install
npm run db:generate
npm run dev
```

Acesse `http://localhost:3000`. O ambiente local fornece um usuário de teste. Para compilar a versão de produção:

```bash
npm run build
```

## Estrutura principal

```text
app/
  page.tsx              rota protegida
  clinic-app.tsx        interface e fluxos clínicos
  chatgpt-auth.ts       identidade e sessão
  globals.css           tema responsivo
db/
  schema.ts             profissionais, pacientes, anamneses, sessões e avaliações
  index.ts              conexão D1/SQLite
lib/
  scoring.ts            regras de pontuação e classificação
drizzle/                migrações SQL geradas
```

## Segurança e produção

Nunca aceite `professional_id` enviado pelo navegador: derive-o da sessão no servidor e inclua-o em toda leitura/escrita. Use HTTPS, política de backup, auditoria, expiração de sessão e processo compatível com LGPD. Não registre conteúdo clínico em logs. A hospedagem usa SQLite distribuído (Cloudflare D1), compatível com o esquema Drizzle.
