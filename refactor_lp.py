import os
import re

NEW_HEAD_BLOCK = """    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;900&family=Open+Sans:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Open Sans', sans-serif; color: #1a1a1a; }
        h1, h2, h3, .font-montserrat { font-family: 'Montserrat', sans-serif; }

        /* Novas Cores da Marca */
        .bg-primary { background-color: #00cfb4; }
        .text-primary { color: #00cfb4; }
        .border-primary { border-color: #00cfb4; }

        .bg-dark-blue { background-color: #164478; }
        .text-dark-blue { color: #164478; }
        .border-dark-blue { border-color: #164478; }

        .bg-soft { background-color: #f9fafb; }

        /* Ajuste automático de contrastes nos botões hover */
        .hover\:bg-\[\#00b070\]:hover { background-color: #00a892 !important; }
        .hover\:bg-\[\#005a73\]:hover { background-color: #0f2d52 !important; }
    </style>
"""

files_to_process = []
for root, dirs, files in os.walk('LP'):
    for file in files:
        if file == 'index.html':
            files_to_process.append(os.path.join(root, file))

for filepath in files_to_process:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Re-apply Head properly
    # Match everything from the first link tag to the end of the style tag
    head_pattern = re.compile(r'<link.*?/style>', re.DOTALL)
    content = head_pattern.sub(NEW_HEAD_BLOCK, content, count=1)

    # Re-apply Body replacements
    content = content.replace('bg-gray-900', 'bg-dark-blue')
    content = content.replace('#00d082', '#00cfb4')
    # Diagnosis specific old blues
    content = content.replace('#006e8c', '#164478')
    content = content.replace('#005a73', '#0f2d52')

    content = content.replace('hover:bg-black', 'hover:bg-[#0f2d52]')

    # Text contrast: titles in light sections to text-dark-blue
    content = re.sub(r'(<(h1|h2|h3|p)[^>]*?class="[^"]*?)text-gray-900', r'\1text-dark-blue', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
