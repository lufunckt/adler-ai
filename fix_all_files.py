import os
import re

mapping = {
    "frontend/src/components/layout/GlobalSidebar.tsx": ["clinician", "navItems", "approach"],
    "frontend/src/components/layout/GlobalHeader.tsx": ["avatarClass"],
    "frontend/src/pages/HomePage.tsx": ["clinician", "approach", "avatarClass"],
    "frontend/src/pages/PatientsPage.tsx": ["exportPatients", "avatarClass"],
    "frontend/src/pages/SchedulePage.tsx": ["avatarClass"],
    "frontend/src/pages/SettingsPage.tsx": ["approach"],
    "frontend/src/pages/SubscriptionPage.tsx": ["clinician"],
    "frontend/src/pages/DSMPage.tsx": ["dsmConditions"],
    "frontend/src/pages/DocumentsPage.tsx": ["documentTemplates"]
}

for path, names in mapping.items():
    if not os.path.exists(path): continue
    with open(path, 'r') as f:
        content = f.read()

    # Remover imports duplicados de constants.ts
    content = re.sub(r'import { .*? } from ".*?constants";\n', '', content)

    # Adicionar import correto
    depth = path.count('/') - 2
    prefix = "../" * depth
    import_line = f'import {{ {", ".join(names)} }} from "{prefix}constants";\n'

    # Inserir apos o bloco de imports de tipos
    content = content.replace('from "' + prefix + 'types";', f'from "{prefix}types";\n{import_line}')

    with open(path, 'w') as f:
        f.write(content)
