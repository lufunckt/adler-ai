import os
import re

files_to_process = []
for root, dirs, files in os.walk('LP'):
    for file in files:
        if file == 'index.html':
            files_to_process.append(os.path.join(root, file))

for filepath in files_to_process:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find sections/footers/divs with bg-dark-blue
    # This regex tries to find the block starting with bg-dark-blue and ending at the next closing tag of that section
    # Simplified: look for bg-dark-blue and then any text-dark-blue until the next </section> or </footer>

    # We'll use a state machine or split by tags to be safer
    parts = re.split(r'(<(section|footer|div)[^>]*?bg-dark-blue.*?>)', content)

    new_content = ""
    in_dark_section = False
    depth = 0

    # This is complex for regex. Let's try a simpler approach:
    # Most pages have sections like: <section class="... bg-dark-blue ..."> ... </section>

    def fix_section(match):
        section_content = match.group(0)
        # Replace text-dark-blue with text-white only inside this match
        return section_content.replace('text-dark-blue', 'text-white')

    # Pattern for section/footer with bg-dark-blue
    content = re.sub(r'<(section|footer)[^>]*?bg-dark-blue.*?>.*?</\1>', fix_section, content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
