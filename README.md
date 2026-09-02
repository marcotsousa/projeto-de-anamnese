# Projeto de Anamnese — Gestão clínica

Aplicação responsiva para prontuários psicológicos, anamnese, evolução de sessões e rastreios clínicos. O acesso é protegido pela autenticação da plataforma e todas as consultas devem usar o identificador do profissional autenticado como filtro de propriedade.

Na versão local, acolhidos, sessões e avaliações são preservados no armazenamento privado do navegador. A interface também permite exportar e importar um backup JSON. Esses dados pertencem somente ao perfil de navegador e ao computador em uso.

## Recursos

- Dashboard clínico, busca e cadastro de acolhidos.
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

No Windows, também é possível iniciar com dois cliques em `iniciar-local.bat`. Mantenha a janela aberta enquanto estiver usando o sistema.

### Backup local

Use o botão com seta para baixo no cabeçalho para baixar o backup. O botão com seta para cima restaura um arquivo anteriormente exportado. Faça backups periódicos e mantenha-os em local protegido.

## Estrutura principal

```text
app/
  page.tsx              rota protegida
  clinic-app.tsx        interface e fluxos clínicos
  chatgpt-auth.ts       identidade e sessão
  globals.css           tema responsivo
db/
  schema.ts             profissionais, acolhidos, anamneses, sessões e avaliações
  index.ts              conexão D1/SQLite
lib/
  scoring.ts            regras de pontuação e classificação
drizzle/                migrações SQL geradas
```

## Segurança e produção

Nunca aceite `professional_id` enviado pelo navegador: derive-o da sessão no servidor e inclua-o em toda leitura/escrita. Use HTTPS, política de backup, auditoria, expiração de sessão e processo compatível com LGPD. Não registre conteúdo clínico em logs. A hospedagem usa SQLite distribuído (Cloudflare D1), compatível com o esquema Drizzle.
