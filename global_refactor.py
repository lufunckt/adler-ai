import os
import re

NEW_HEAD_HTML = """    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;900&family=Open+Sans:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Open Sans', sans-serif; color: #1a1a1a; }
        h1, h2, h3, .font-montserrat { font-family: 'Montserrat', sans-serif; }

        /* Paleta Oficial do Site Original */
        .bg-primary { background-color: #00cfb4; }
        .text-primary { color: #00cfb4; }
        .border-primary { border-color: #00cfb4; }

        .bg-dark-blue { background-color: #164478; }
        .text-dark-blue { color: #164478; }
        .border-dark-blue { border-color: #164478; }

        .bg-soft { background-color: #f9fafb; }

        /* Ajuste de Hover e Contrastes */
        .hover\:bg-\[\#00b070\]:hover { background-color: #00a892 !important; }
        .hover\:bg-\[\#005a73\]:hover { background-color: #0f2d52 !important; }
    </style>"""

FILES = [
    "LP/index.html",
    "LP/autonomia-interna/index.html",
    "LP/desbloqueio-emocional/index.html",
    "LP/diagnostico-raiz/index.html",
    "LP/diario-emocional/index.html",
    "LP/protagonismo-profissional/index.html",
    "LP/visibilidade-natural/index.html"
]

def refactor_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update <head>
    # We replace from the first <link href="https://fonts... to the end of the first </style>
    head_pattern = re.compile(r'<link href="https://fonts\.googleapis\.com/css2.*?/style>', re.DOTALL)
    content = head_pattern.sub(NEW_HEAD_HTML, content, count=1)

    # 2. Tailwind Class Refactoring
    # bg-gray-900 -> bg-dark-blue
    content = content.replace('bg-gray-900', 'bg-dark-blue')

    # Titles in light sections: text-gray-900 -> text-dark-blue
    # This might have been done already as text-dark-blue, but let's ensure it.
    # We specifically look for titles in tags or classes
    content = content.replace('text-gray-900', 'text-dark-blue')

    # SVG stroke colors
    content = content.replace('stroke="#00d082"', 'stroke="#00cfb4"')

    # text-white in bg-dark-blue sections
    # This is better done by identifying sections that have bg-dark-blue and then replacing inner text-dark-blue with text-white
    sections = re.split(r'(<(section|footer|div)[^>]*?bg-dark-blue.*?>)', content)
    new_content = ""
    for i, part in enumerate(sections):
        if i % 3 == 1: # This is the opening tag
            new_content += part
        elif i % 3 == 2: # This is the tag name, skip
            pass
        elif i > 0 and (i-1) % 3 == 0: # This is the content inside the tag
            # We want to replace text-dark-blue with text-white until the closing tag of this section
            # However, split doesn't handle nesting well.
            # Simple approach: if we just applied bg-dark-blue, ensure nested text is white.
            # Usually, text-dark-blue was applied to headers.
            part = part.replace('text-dark-blue', 'text-white')
            new_content += part
        else:
            new_content += part

    if new_content:
        content = new_content

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for f in FILES:
    if os.path.exists(f):
        refactor_file(f)
        print(f"Refactored: {f}")
    else:
        print(f"Skip (not found): {f}")
