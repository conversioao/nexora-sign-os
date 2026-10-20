# ⚡ NEXORA OS — FRONTEND (Deploy na Vercel)

Esta pasta contém o frontend autónomo do **NEXORA OS (React + Vite + Tailwind CSS)**, preparado para deploy de alto desempenho na **Vercel**.

---

## 🚀 Passo a Passo para Deploy na Vercel

### 1. Criar Repositório Git
Crie um repositório no seu GitHub ou GitLab e faça o push de todo o conteúdo desta pasta:
```bash
git init
git add .
git commit -m "feat: initial commit frontend nexora os"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/nexora-frontend.git
git push -u origin main
```

### 2. Importar o Projecto na Vercel
1. Aceda a [https://vercel.com](https://vercel.com) e clique em **Add New...** -> **Project**.
2. Conecte e selecione o repositório `nexora-frontend`.
3. Em **Framework Preset**, a Vercel detectará automaticamente **Vite**.
4. Em **Root Directory**, mantenha `./`.

### 3. Configurar Variáveis de Ambiente (CRÍTICO)
No separador **Environment Variables**, adicione as variáveis que apontam para o seu backend no EasyPanel:

| Variável | Valor de Exemplo | Descrição |
|---|---|---|
| `VITE_BACKEND_URL` | `https://nexora-backend.yccdt2.easypanel.host` | URL permanente do backend no EasyPanel (HTTPS, sem barra final) |
| `VITE_SOCKET_URL` | `https://nexora-backend.yccdt2.easypanel.host` | URL do servidor WebSocket (mesmo endereço do backend) |

> 💡 **Nota Importante:** Nunca coloque barra no final da URL (`/`).
> O ficheiro `src/config/api.ts` e `src/main.tsx` já tratam automaticamente de encaminhar todas as chamadas de `/api` e `/uploads` para o servidor backend no EasyPanel.

### 4. Concluir o Deploy
Clique no botão **Deploy**.
A Vercel irá compilar e fornecer um domínio global HTTPS de alta velocidade (ex: `https://nexora-os.vercel.app`), com proteção de segurança e rewrite de rotas SPA configurados em `vercel.json`.

---

## 🛠️ Comandos Locais
- `npm install` : Instala dependências.
- `npm run dev` : Inicia servidor local Vite na porta 4000.
- `npm run build` : Gera a build optimizada para produção.
- `npm run preview` : Pré-visualiza a build de produção localmente.
