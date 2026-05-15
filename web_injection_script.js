const fs = require('fs');

const file = '../Frontend-UnConnect/web/src/pages/DetalleGrupoScreen.tsx';
let content = fs.readFileSync(file, 'utf-8');

// Add import if not present
if (!content.includes('RecursosTab')) {
    content = content.replace("import type { Grupo, Usuario } from '../types/api.types';", "import type { Grupo, Usuario } from '../types/api.types';\nimport RecursosTab from '../components/RecursosTab';");
}

// Add state for tabs since there wasn't one, or just add it below Archivos
// Let's just add it at the very bottom of the page container, inside the return.
if (!content.includes('<RecursosTab')) {
    const hook = " {/* Archivos Recientes */}";
    const insertion = `
                    {/* Biblioteca de Recursos */}
                    <div style={{ marginTop: '40px' }} className="mt-8 pt-8 border-t border-gray-200">
                        <RecursosTab grupoId={grupoId!} />
                    </div>
                    
                    {/* Archivos Recientes */}`;
    content = content.replace(hook, insertion);
    fs.writeFileSync(file, content);
}
console.log('Done');
