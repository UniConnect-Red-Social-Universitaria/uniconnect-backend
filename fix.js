const fs = require('fs');
const file = '../Frontend-UnConnect/web/src/pages/DetalleGrupoScreen.tsx';
let txt = fs.readFileSync(file, 'utf-8');

txt = txt.replace(/Archivos del grupo/g, `Biblioteca de Recursos</h3></div><div style={{marginTop: 32}}><RecursosTab grupoId={grupoId!} /></div><div style={{marginTop: 32}}><h3 style={{ margin: '0 0 16px', color: '#00284d', fontSize: 18 }}>Archivos del grupo`);

fs.writeFileSync(file, txt);
console.log('Fixed regex');
