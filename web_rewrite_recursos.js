const fs = require('fs');

const tabContent = `import React, { useState, useEffect } from 'react';
import { recursosService, type Recurso } from '../services/recursos.service';

export default function RecursosTab({ grupoId }: { grupoId: string }) {
    const [recursos, setRecursos] = useState<Recurso[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
    const [busqueda, setBusqueda] = useState('');
    
    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [newRecurso, setNewRecurso] = useState({ url: '', tipo: 'LINK', descripcion: '', etiquetas: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        cargarRecursos();
    }, [grupoId]);

    const cargarRecursos = async () => {
        try {
            setLoading(true);
            const data = await recursosService.getRecursos(grupoId);
            setRecursos(data);
        } catch (error) {
            console.error('Error cargando recursos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await recursosService.crearRecurso({
                titulo: 'Procesando enlace...',
                contenido: newRecurso.url,
                tipo: newRecurso.tipo,
                grupoId,
                metadata: {
                    etiquetas: newRecurso.etiquetas.split(',').map(e => e.trim()).filter(e => e),
                }
            });
            setModalOpen(false);
            setNewRecurso({ url: '', tipo: 'LINK', descripcion: '', etiquetas: '' });
            cargarRecursos();
        } catch (error) {
            console.error(error);
            alert('Falló la creación del recurso.');
        } finally {
            setSaving(false);
        }
    };

    const recursosFiltrados = recursos.filter(
        (r) => (filtroTipo === 'TODOS' || r.tipo === filtroTipo) && 
               (r.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                (r.metadata?.openGraph?.title || '').toLowerCase().includes(busqueda.toLowerCase()))
    );

    return (
        <div className="rt-container">
            <style>{\`
                .rt-container { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; }
                .rt-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
                .rt-title-area { display: flex; align-items: center; gap: 16px; }
                .rt-title { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; }
                .rt-btn-primary { background: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; font-size: 14px; box-shadow: 0 4px 6px -1px rgb(59 130 246 / 0.3); }
                .rt-btn-primary:hover { background: #2563eb; transform: translateY(-1px); }
                .rt-filters { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
                .rt-input, .rt-select { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #fff; color: #334155; transition: 0.2s; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
                .rt-input:focus, .rt-select:focus { border-color: #3b82f6; ring: 2px solid #bfdbfe; }
                .rt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
                
                .rt-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; position: relative; }
                .rt-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); border-color: #cbd5e1; }
                .rt-card-img-container { height: 160px; background: #f8fafc; overflow: hidden; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #e2e8f0; }
                .rt-card-img { width: 100%; height: 100%; object-fit: cover; }
                .rt-card-body { padding: 20px; flex: 1; display: flex; flex-direction: column; }
                .rt-badge { display: inline-flex; align-items: center; background: #f1f5f9; color: #475569; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 8px; border-radius: 4px; margin-bottom: 12px; align-self: flex-start; }
                .rt-card-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .rt-card-desc { font-size: 14px; color: #64748b; margin: 0 0 16px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .rt-author { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 20px; }
                .rt-author-avatar { width: 24px; height: 24px; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; }
                
                .rt-card-footer { margin-top: auto; border-top: 1px solid #f1f5f9; padding-top: 16px; display: flex; flex-direction: column; gap: 12px; }
                .rt-tags { display: flex; flex-wrap: wrap; gap: 6px; }
                .rt-tag { background: #e0f2fe; color: #1e3a8a; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 500; }
                .rt-stats { display: flex; gap: 12px; font-size: 12px; color: #64748b; font-weight: 500; }
                .rt-stat { display: flex; align-items: center; gap: 4px; }
                
                .rt-actions { display: flex; gap: 8px; margin-top: 16px; }
                .rt-btn-outline { flex: 1; padding: 8px; border: 1px solid #cbd5e1; background: transparent; border-radius: 6px; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; transition: 0.2s; text-align: center; text-decoration: none; }
                .rt-btn-outline:hover { background: #f8fafc; color: #0f172a; }
                
                .rt-empty { text-align: center; padding: 60px 20px; background: #f8fafc; border-radius: 12px; border: 2px dashed #cbd5e1; color: #64748b; }
                
                .rt-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .rt-modal { background: white; padding: 28px; border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
                .rt-modal h3 { margin: 0 0 20px; font-size: 20px; color: #0f172a; }
                .rt-form-group { margin-bottom: 16px; }
                .rt-form-label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
                .rt-form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 28px; }
            \`}</style>

            <div className="rt-header">
                <div className="rt-title-area">
                    <h3 className="rt-title">📚 Biblioteca</h3>
                </div>
                <div className="rt-filters">
                    <input 
                        type="text" 
                        placeholder="Buscar recursos..." 
                        value={busqueda} 
                        onChange={(e) => setBusqueda(e.target.value)} 
                        className="rt-input"
                    />
                    <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="rt-select">
                        <option value="TODOS">Categoría: Todos</option>
                        <option value="TEXTO">Textos & PDF</option>
                        <option value="LINK">Enlaces URL</option>
                        <option value="ARCHIVO">Archivos</option>
                    </select>
                    <button className="rt-btn-primary" onClick={() => setModalOpen(true)}>
                        + Agregar Recurso
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="rt-empty">Cargando biblioteca...</div>
            ) : recursosFiltrados.length === 0 ? (
                <div className="rt-empty">
                    <h4 style={{ margin: '0 0 8px', fontSize: 18, color: '#0f172a' }}>No hay recursos aquí</h4>
                    <p style={{ margin: 0 }}>Sé el primero en compartir un recurso con el grupo.</p>
                </div>
            ) : (
                <div className="rt-grid">
                    {recursosFiltrados.map((recurso) => {
                        const og = recurso.metadata?.openGraph;
                        const etiquetas = recurso.metadata?.etiquetas || [];
                        const valoracion = recurso.metadata?.valoracion;
                        const comentarios = recurso.metadata?.comentarios || [];
                        const fecha = new Date(recurso.createdAt).toLocaleDateString();
                        
                        return (
                            <div key={recurso.id} className="rt-card">
                                <div className="rt-card-img-container">
                                    {og?.image ? (
                                        <img src={og.image} alt="Preview" className="rt-card-img" />
                                    ) : (
                                        <span style={{ fontSize: 40 }}>📄</span>
                                    )}
                                </div>
                                <div className="rt-card-body">
                                    <span className="rt-badge">{recurso.tipo}</span>
                                    <h4 className="rt-card-title" title={og?.title || recurso.titulo}>
                                        {og?.title || recurso.titulo}
                                    </h4>
                                    <p className="rt-card-desc">
                                        {og?.description || recurso.contenido}
                                    </p>
                                    
                                    <div className="rt-author">
                                        <div className="rt-author-avatar">
                                            {recurso.creador?.nombre ? recurso.creador.nombre[0].toUpperCase() : 'U'}
                                        </div>
                                        <span>{recurso.creador?.nombre || 'Usuario'} • {fecha}</span>
                                    </div>
                                    
                                    <div className="rt-card-footer">
                                        {etiquetas.length > 0 && (
                                            <div className="rt-tags">
                                                {etiquetas.map((t: string, i: number) => (
                                                    <span key={i} className="rt-tag">#{t}</span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="rt-stats">
                                            {valoracion && (
                                                <div className="rt-stat">⭐ {valoracion.promedio} ({valoracion.totalVotos})</div>
                                            )}
                                            <div className="rt-stat">💬 {comentarios.length} comentarios</div>
                                        </div>
                                        <div className="rt-actions">
                                            <a href={recurso.tipo === 'LINK' || recurso.tipo === 'URL' ? recurso.contenido : '#'} target="_blank" rel="noreferrer" className="rt-btn-outline">Ver Recurso</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {modalOpen && (
                <div className="rt-modal-overlay">
                    <div className="rt-modal">
                        <h3>Agregar Nuevo Recurso</h3>
                        <form onSubmit={handleCrear}>
                            <div className="rt-form-group">
                                <label className="rt-form-label">Tipo de Contenido</label>
                                <select 
                                    className="rt-select" 
                                    style={{ width: '100%' }}
                                    value={newRecurso.tipo}
                                    onChange={e => setNewRecurso({...newRecurso, tipo: e.target.value})}
                                >
                                    <option value="LINK">Enlace URL / Repositorio / Video</option>
                                    <option value="ARCHIVO">PDF / Documento</option>
                                </select>
                            </div>
                            <div className="rt-form-group">
                                <label className="rt-form-label">URL del Recurso</label>
                                <input 
                                    required 
                                    type="url" 
                                    className="rt-input" 
                                    style={{ width: '100%' }} 
                                    placeholder="https://..."
                                    value={newRecurso.url}
                                    onChange={e => setNewRecurso({...newRecurso, url: e.target.value})}
                                />
                            </div>
                            <div className="rt-form-group">
                                <label className="rt-form-label">Etiquetas (separadas por coma)</label>
                                <input 
                                    type="text" 
                                    className="rt-input" 
                                    style={{ width: '100%' }} 
                                    placeholder="ej: react, tutorial, pdf"
                                    value={newRecurso.etiquetas}
                                    onChange={e => setNewRecurso({...newRecurso, etiquetas: e.target.value})}
                                />
                            </div>
                            <div className="rt-form-actions">
                                <button type="button" className="rt-btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="rt-btn-primary" disabled={saving}>
                                    {saving ? 'Publicando...' : 'Publicar Recurso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
`
fs.writeFileSync('../Frontend-UnConnect/web/src/components/RecursosTab.tsx', tabContent);
