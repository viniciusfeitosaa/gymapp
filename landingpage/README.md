# Landing Page - Gym Code

Página de apresentação do **Gym Code** para novos usuários conhecerem o sistema.

## Estrutura

- **index.html** – Página única com: hero, como funciona, recursos, para quem é e CTA
- **styles.css** – Estilos (identidade visual do app: laranja, escuro, Poppins/Inter)
- **script.js** – Menu mobile e comportamento básico

## Como usar

### Ver localmente

Abra o `index.html` no navegador (duplo clique ou arrastar para o Chrome/Edge).  
Ou use um servidor estático, por exemplo:

```bash
# Na pasta landingpage
npx serve .
# ou
python -m http.server 8080
```

Depois acesse `http://localhost:8080` (ou a porta que o serve indicar).

### Links para o app

Os botões "Entrar" e "Criar conta" apontam para `/login` e `/register`.  
Em produção, ajuste para a URL real do app, por exemplo:

- `https://seu-dominio.com/login`
- `https://seu-dominio.com/register`

Basta editar os `href` no `index.html` na seção **CTA** e no **footer**.

### Deploy

A pasta é estática (HTML + CSS + JS). Pode ser publicada em:

- **Netlify** – arrastar a pasta ou conectar o repo
- **Vercel** – configurar a raiz como `landingpage`
- **GitHub Pages** – apontar o build/public para a pasta `landingpage`
- Qualquer hospedagem de arquivos estáticos

Não depende do frontend React nem do backend do Gym Code.
