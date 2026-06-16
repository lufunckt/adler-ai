# Instruções de Implantação no cPanel

Para que as Landing Pages funcionem no seu site (ex: julianagrimaldioficial.com.br/LP/protagonismo-profissional), siga estes passos:

1. Acesse o seu **cPanel**.
2. Abra o **Gerenciador de Arquivos** (File Manager).
3. Navegue até a pasta **public_html** (ou a pasta raiz do seu domínio).
4. Faça o upload da pasta **LP** inteira para dentro de **public_html**.
5. Verifique os links:
   - https://julianagrimaldioficial.com.br/LP/protagonismo-profissional
   - https://julianagrimaldioficial.com.br/LP/desbloqueio-emocional

**Dica:** Se você quiser que o link seja apenas `/protagonismo-profissional` (sem o /LP/), basta mover as pastas de dentro de `LP` diretamente para a raiz `public_html`.

As páginas utilizam o **Tailwind CSS via CDN**, então não precisam de instalação de dependências ou compilação. Basta subir e usar!
