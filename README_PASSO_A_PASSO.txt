PASSO A PASSO - LINK CORP COM SUPABASE REAL

1) CRIAR PROJETO NO SUPABASE
- Entre no Supabase
- Crie um projeto novo
- Espere terminar de criar

2) CRIAR AS TABELAS
- No Supabase, abra SQL Editor
- Abra a pasta sql deste ZIP
- Copie tudo do arquivo supabase_schema.sql
- IMPORTANTE: troque SEUEMAIL@gmail.com pelo email que você vai usar como admin
- Clique em Run

3) CRIAR BUCKET DE IMAGENS
- Vá em Storage
- Create bucket
- Nome: product-images
- Marque como Public
- Crie o bucket

4) PEGAR AS CHAVES
- Vá em Project Settings > API
- Copie Project URL
- Copie anon public key

5) CONFIGURAR O SITE
- Abra o arquivo config.js
- Cole sua SUPABASE_URL
- Cole sua SUPABASE_ANON_KEY
- Coloque sua chave Pix
- Coloque seu WhatsApp com DDD e país. Exemplo: 5577999999999
- Em ADMIN_EMAILS coloque o mesmo email admin

6) CRIAR CONTA ADMIN
- Abra login.html pelo site já hospedado ou no Live Server
- Digite o email admin e uma senha
- Clique em Criar conta
- Se o Supabase pedir confirmação, confirme no email

7) CADASTRAR PRODUTOS
- Abra admin.html
- Faça login com o email admin
- Escolha categoria: android, ios ou pc
- Coloque nome, descrição, preço antigo, preço atual
- Envie imagem ou cole URL da imagem
- Em planos, use JSON assim:
[
  {"name":"15 Dias","days":"15 dias","old_price":49.99,"price":35,"discount":"-30%"},
  {"name":"Mensal","days":"30 dias","old_price":99.99,"price":65,"discount":"-35%"},
  {"name":"Permanente","days":"Vitalício","old_price":179.99,"price":120,"discount":"-33%"}
]
- Clique em Salvar produto

8) SUBIR NO NETLIFY
- Arraste a pasta inteira linkcorp_supabase_real para o Netlify
- Ou compacte e envie o ZIP
- Abra o link do Netlify
- Os produtos cadastrados no Supabase vão aparecer para todo mundo

9) COMO FUNCIONA A COMPRA
- Cliente escolhe produto e coloca no carrinho
- Finaliza com nome e WhatsApp
- O pedido salva no Supabase em orders
- O site mostra sua chave Pix
- Cliente envia comprovante no WhatsApp
- Você confere e entrega manualmente

OBSERVAÇÃO IMPORTANTE
Se você abrir o arquivo direto pelo computador, pode funcionar estranho em alguns navegadores. O ideal é usar Live Server no VS Code ou subir direto no Netlify.
