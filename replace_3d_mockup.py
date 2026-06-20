import os

filepath = 'LP/diario-emocional/index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

mockup_html = """<div class="relative w-64 md:w-80 mx-auto" style="perspective: 1000px;">
                <div class="relative w-full h-auto aspect-[2/3] transition-transform duration-500 ease-in-out transform shadow-2xl rounded-r-lg group hover:rotate-y-0" style="transform-style: preserve-3d; transform: rotateY(-25deg);">

                    <div class="absolute inset-0 w-full h-full rounded-r-lg overflow-hidden border-l border-white/20 z-10">
                        <img src="../assets/img/capa-diario.png" alt="O Diário Emocional" class="w-full h-full object-cover">

                        <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
                    </div>

                    <div class="absolute top-0 left-0 h-full w-8 bg-[#0a1a2f] origin-left" style="transform: rotateY(90deg); transform-origin: left;">
                        <div class="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
                    </div>

                    <div class="absolute -bottom-4 left-4 right-0 h-4 bg-black/40 blur-md rounded-[100%] z-0" style="transform: rotateX(80deg);"></div>
                </div>
            </div>"""

# Replace the specific group div
start_marker = '<div class="relative group">'
end_marker = '</img>\n            </div>' # Need to be careful here, the cat output showed </img> or <img ...>
# Let's use a more robust search

import re
pattern = re.compile(r'<div class="relative group">.*?</div>\s*</div>\s*</section>', re.DOTALL)
# Actually, the div structure might be different. Let's look at the cat output again.
# <div class="relative group">
#     <div class="absolute -inset-4 bg-primary/10 rounded-[40px] rotate-3 transition-transform group-hover:rotate-0 duration-700"></div>
#     <img src="..." ...>
# </div>

pattern = re.compile(r'<div class="relative group">.*?</div>\s*</div>', re.DOTALL)
content = pattern.sub(mockup_html + '\n            </div>', content, count=1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
