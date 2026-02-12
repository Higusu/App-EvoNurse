
import React, { useState } from 'react';
import { PatientData, TicksState, TabType, DeviceEntry } from './types';
import { 
  GSW_OPTS, RASS_OPTS, SAS_OPTS, CPOT_OPTS, BPS_OPTS, 
  NUTRI_VO_LIST, NUTRI_ENTERAL_LIST, INVASIVOS_TIPOS, ICONS, NEURO_LIST_ORDER 
} from './constants';
import { generateEvolution } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('datos');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState('');
  
  const [patientData, setPatientData] = useState<PatientData>({
    shift: 'Largo', date: new Date().toISOString().split('T')[0], exams: '', pendings: ''
  });

  const [ticks, setTicks] = useState<TicksState>({
    estadoGral: '', neuro: [], rassVal: '0', sasVal: '4', 
    gsw: { o: 4, v: 5, m: 6 }, pupilas: [],
    hemo: { 
      frecuencia: '', ritmo: '', presionTipo: '', presionSubTipo: '', pam: '', tempStatus: '',
      satStatus: '', satMetaVal: '', oxigenoterapia: '', satMethod: '', fio2: '', flujo: '', tempCnaf: '', paramsLibre: '',
      dolorStatus: 'No refiere', dolorEscala: 'EVA', evaVal: '', 
      cpot: { facial: 0, movimiento: 0, tono: 0, ventilacion: 0, vocalizacion: 0 },
      bps: { facial: 1, mmss: 1, ventilacion: 1 },
      dolorAccion: [], dolorVia: []
    },
    vent: [], tqt: { numero: '', cuff: '30', fijado: '', sitio: '' },
    uma: '',
    hidratacion: [], hidraVol: '', hidraVolem: { que: '', velocidad: '' },
    nutricion: [],
    nutriDetail: {
      voTipos: [], enteralSngTipo: '', enteralSngVel: '', enteralSnyVel: '', 
      parenteralTipo: 'Estándar', parenteralDetalle: '', parenteralVel: ''
    },
    eliminacion: [], elimDetail: { diuresisCaract: 'clara', diuresisVol: '', diuresisHrs: '', diuresisPeso: '', depoTipo: 'normales', depoNegDias: '' },
    infeccioso: [], infecDet: '', aislamientos: [],
    invasivos: []
  });

  const toggleList = (key: keyof TicksState | string, val: string, parent?: string) => {
    setTicks(prev => {
      let target: any = parent ? (prev as any)[parent][key] : (prev as any)[key];
      const newList = target.includes(val) ? target.filter((v: string) => v !== val) : [...target, val];
      if (parent) return { ...prev, [parent]: { ...(prev as any)[parent], [key]: newList } };
      return { ...prev, [key]: newList };
    });
  };

  const toggleVoNutri = (val: string) => {
    setTicks(p => {
      const newList = p.nutriDetail.voTipos.includes(val) 
        ? p.nutriDetail.voTipos.filter(v => v !== val) 
        : [...p.nutriDetail.voTipos, val];
      return { ...p, nutriDetail: { ...p.nutriDetail, voTipos: newList } };
    });
  };

  const addInv = (type: string) => {
    const d: DeviceEntry = { id: Math.random().toString(36).substr(2, 9), type, detail: '' };
    setTicks(p => ({ ...p, invasivos: [...p.invasivos, d] }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setActiveTab('resultado');
    const res = await generateEvolution(patientData, ticks);
    setResult(res);
    setIsGenerating(false);
  };

  const calcMlKgHr = () => {
    const { diuresisVol, diuresisHrs, diuresisPeso } = ticks.elimDetail;
    const v = parseFloat(diuresisVol), h = parseFloat(diuresisHrs), p = parseFloat(diuresisPeso);
    return (v > 0 && h > 0 && p > 0) ? ((v / p) / h).toFixed(2) : null;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 pb-20">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-cyan-400">
            <ICONS.Activity />
            <h1 className="text-xl font-black tracking-tight uppercase">EVONURSE <span className="text-cyan-400">PRO</span></h1>
          </div>
          <button onClick={() => window.location.reload()} className="p-2 hover:bg-red-600 rounded-lg transition-colors"><ICONS.Trash /></button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 flex-1 w-full space-y-4">
        <nav className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
          {['datos', 'ticks', 'resultado'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as TabType)} className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${activeTab === t ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400'}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </nav>

        {activeTab === 'datos' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4 bg-white p-5 rounded-xl shadow-sm border">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Turno</label>
                <div className="flex gap-1">
                  {['Largo', 'Noche'].map(s => <button key={s} onClick={() => setPatientData(p => ({...p, shift: s as any}))} className={`flex-1 py-2 text-xs font-bold rounded border ${patientData.shift === s ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'bg-white border-slate-200 text-slate-400'}`}>{s}</button>)}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha</label>
                <input type="date" value={patientData.date} onChange={e => setPatientData(p => ({...p, date: e.target.value}))} className="w-full py-2 px-2 border border-slate-300 rounded text-xs outline-none bg-white font-medium" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-2">Punto 4: Laboratorio y Exámenes</label>
              <textarea placeholder="Pegue los resultados aquí (pH Na K Hcto RL...)" rows={8} value={patientData.exams} onChange={e => setPatientData(p => ({...p, exams: e.target.value}))} className="w-full bg-white border border-slate-300 rounded-xl p-4 text-xs font-mono shadow-sm focus:ring-2 focus:ring-cyan-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-2">Punto 12: Pendientes</label>
              <textarea placeholder="Pendientes para el próximo turno..." rows={4} value={patientData.pendings} onChange={e => setPatientData(p => ({...p, pendings: e.target.value}))} className="w-full bg-white border border-slate-300 rounded-xl p-4 text-xs shadow-sm focus:ring-2 focus:ring-cyan-500 outline-none" />
            </div>
          </div>
        )}

        {activeTab === 'ticks' && (
          <div className="space-y-4 animate-fade-in">
            {/* 1. Estado Gral */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-xs font-black text-slate-800 uppercase mb-3">1. Estado General</h3>
              <div className="flex gap-1">
                {['BCG', 'RCG', 'MCG'].map(o => <button key={o} onClick={() => setTicks(p => ({...p, estadoGral: o as any}))} className={`px-4 py-2 rounded-full text-[10px] font-bold border ${ticks.estadoGral === o ? 'bg-cyan-600 text-white shadow-md' : 'bg-white text-slate-400 border-slate-300'}`}>{o}</button>)}
              </div>
            </div>

            {/* 2. Neuro */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase">2. Condición Neurológica</h3>
              <div className="flex flex-wrap gap-1">
                {NEURO_LIST_ORDER.map(o => (
                  <button key={o} onClick={() => toggleList('neuro', o)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${ticks.neuro.includes(o) ? 'bg-cyan-600 text-white' : 'bg-white text-slate-400 border-slate-300'}`}>{o}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 border-t pt-3">
                {['RASS', 'SAS', 'GSW'].map(o => <button key={o} onClick={() => toggleList('neuro', o)} className={`px-3 py-1.5 rounded-full text-[10px] font-black border ${ticks.neuro.includes(o) ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-400 border-indigo-200'}`}>{o}</button>)}
                {['Pupilas isocóricas', 'Pupilas no reactivas'].map(o => <button key={o} onClick={() => toggleList('neuro', o)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${ticks.neuro.includes(o) ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-emerald-600 border-slate-300'}`}>{o}</button>)}
              </div>
              {ticks.neuro.includes('RASS') && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 animate-fade-in">
                  <select value={ticks.rassVal} onChange={e => setTicks(p => ({...p, rassVal: e.target.value}))} className="w-full p-2 text-xs rounded border border-slate-300 bg-white font-medium">
                    {RASS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              )}
              {ticks.neuro.includes('SAS') && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 animate-fade-in">
                  <select value={ticks.sasVal} onChange={e => setTicks(p => ({...p, sasVal: e.target.value}))} className="w-full p-2 text-xs rounded border border-slate-300 bg-white font-medium">
                    {SAS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              )}
              {ticks.neuro.includes('GSW') && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 animate-fade-in">
                  <div className="grid grid-cols-1 gap-1">
                    <select value={ticks.gsw.o} onChange={e => setTicks(p => ({...p, gsw: {...p.gsw, o: parseInt(e.target.value)}}))} className="text-xs p-2 border border-slate-300 rounded bg-white font-medium">
                      {GSW_OPTS.o.map(o => <option key={o.v} value={o.v}>Ocular: {o.l}</option>)}
                    </select>
                    <select value={ticks.gsw.v} onChange={e => setTicks(p => ({...p, gsw: {...p.gsw, v: parseInt(e.target.value)}}))} className="text-xs p-2 border border-slate-300 rounded bg-white font-medium">
                      {GSW_OPTS.v.map(o => <option key={o.v} value={o.v}>Verbal: {o.l}</option>)}
                    </select>
                    <select value={ticks.gsw.m} onChange={e => setTicks(p => ({...p, gsw: {...p.gsw, m: parseInt(e.target.value)}}))} className="text-xs p-2 border border-slate-300 rounded bg-white font-medium">
                      {GSW_OPTS.m.map(o => <option key={o.v} value={o.v}>Motora: {o.l}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Hemodinamia */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">3. Hemodinamia</h3>
              <div className="space-y-3">
                <div className="flex gap-1">
                  {['Bradicardico', 'Normocardico', 'Taquicardico'].map(o => <button key={o} onClick={() => setTicks(p => ({...p, hemo: {...p.hemo, frecuencia: o as any}}))} className={`flex-1 py-1.5 text-[10px] font-bold rounded border ${ticks.hemo.frecuencia === o ? 'bg-cyan-600 text-white border-cyan-700' : 'bg-white text-slate-400 border-slate-300'}`}>{o}</button>)}
                </div>
                {ticks.hemo.frecuencia && (
                  <div className="flex gap-1 animate-fade-in">
                    {['RS', 'FA', 'Flutter'].map(r => <button key={r} onClick={() => setTicks(p => ({...p, hemo: {...p.hemo, ritmo: r as any}}))} className={`flex-1 py-1.5 text-[10px] font-bold rounded border ${ticks.hemo.ritmo === r ? 'bg-cyan-700 text-white border-cyan-800' : 'bg-white text-slate-400 border-slate-300'}`}>{r}</button>)}
                  </div>
                )}
                <div className="flex gap-1">
                  {['Normotenso', 'Hipotenso', 'Hipertenso'].map(o => <button key={o} onClick={() => setTicks(p => ({...p, hemo: {...p.hemo, presionTipo: o as any, presionSubTipo: ''}}))} className={`flex-1 py-1.5 text-[10px] font-bold rounded border ${ticks.hemo.presionTipo === o ? 'bg-cyan-600 text-white border-cyan-700' : 'bg-white text-slate-400 border-slate-300'}`}>{o}</button>)}
                </div>
                {(ticks.hemo.presionTipo === 'Hipotenso' || ticks.hemo.presionTipo === 'Hipertenso') && (
                  <div className="grid grid-cols-4 gap-1 animate-fade-in">
                    {['Sistólico', 'Diastólico', 'Global'].map(st => <button key={st} onClick={() => setTicks(p => ({...p, hemo: {...p.hemo, presionSubTipo: st as any}}))} className={`py-1 text-[9px] font-bold rounded border ${ticks.hemo.presionSubTipo === st ? 'bg-slate-800 text-white border-black' : 'bg-white text-slate-400 border-slate-300'}`}>{st}</button>)}
                    <input placeholder="PAM" value={ticks.hemo.pam} onChange={e => setTicks(p => ({...p, hemo: {...p.hemo, pam: e.target.value}}))} className="px-2 py-1 text-xs border border-slate-300 rounded bg-white font-medium" />
                  </div>
                )}
                <div className="flex gap-1">
                  {['Afebril', 'Subfebril', 'Febril'].map(o => <button key={o} onClick={() => setTicks(p => ({...p, hemo: {...p.hemo, tempStatus: o as any}}))} className={`flex-1 py-1.5 text-[10px] font-bold rounded border ${ticks.hemo.tempStatus === o ? 'bg-cyan-600 text-white border-cyan-700' : 'bg-white text-slate-400 border-slate-300'}`}>{o}</button>)}
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-3">
                  <h4 className="text-[10px] font-black text-emerald-800 uppercase">Saturación y O2</h4>
                  <div className="flex gap-2">
                    {['dentro de rangos', 'dentro de metas'].map(s => <button key={s} onClick={() => setTicks(p => ({...p, hemo: {...p.hemo, satStatus: s as any}}))} className={`flex-1 py-1.5 text-[10px] font-black rounded border ${ticks.hemo.satStatus === s ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-emerald-600 border-emerald-200'}`}>{s.toUpperCase()}</button>)}
                  </div>
                  {ticks.hemo.satStatus === 'dentro de metas' && <input placeholder="Intervalo meta (ej: 88-90%)" value={ticks.hemo.satMetaVal} onChange={e => setTicks(p => ({...p, hemo: {...p.hemo, satMetaVal: e.target.value}}))} className="w-full p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />}
                  <div className="flex gap-2">
                    {['Sin', 'Con'].map(o => <button key={o} onClick={() => setTicks(p => ({...p, hemo: {...p.hemo, oxigenoterapia: o as any}}))} className={`flex-1 py-1.5 text-[10px] font-bold rounded border ${ticks.hemo.oxigenoterapia === o ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-white text-emerald-700 border-emerald-200'}`}>{o === 'Con' ? 'Con Oxigenoterapia' : 'Sin Oxigenoterapia'}</button>)}
                  </div>
                  {ticks.hemo.oxigenoterapia === 'Con' && (
                    <div className="space-y-2 pt-2 border-t border-emerald-100 animate-fade-in">
                      <div className="flex flex-wrap gap-1">
                        {['NRC', 'MMV', 'CNAF', 'VMNI', 'VMI'].map(m => <button key={m} onClick={() => setTicks(p => ({...p, hemo: {...p.hemo, satMethod: m as any}}))} className={`px-2 py-1 text-[9px] font-bold rounded border ${ticks.hemo.satMethod === m ? 'bg-emerald-800 text-white border-black' : 'bg-white text-emerald-800 border-emerald-200'}`}>{m}</button>)}
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {ticks.hemo.satMethod === 'NRC' && <input placeholder="Flujo lts" value={ticks.hemo.flujo} onChange={e => setTicks(p => ({...p, hemo: {...p.hemo, flujo: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white font-medium" />}
                        {ticks.hemo.satMethod === 'MMV' && <div className="grid grid-cols-2 gap-2"><input placeholder="FiO2 %" value={ticks.hemo.fio2} onChange={e => setTicks(p => ({...p, hemo: {...p.hemo, fio2: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white font-medium" /><input placeholder="Flujo" value={ticks.hemo.flujo} onChange={e => setTicks(p => ({...p, hemo: {...p.hemo, flujo: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white font-medium" /></div>}
                        {ticks.hemo.satMethod === 'CNAF' && <div className="grid grid-cols-3 gap-1"><input placeholder="T°" value={ticks.hemo.tempCnaf} onChange={e => setTicks(p => ({...p, hemo: {...p.hemo, tempCnaf: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white font-medium" /><input placeholder="Flujo" value={ticks.hemo.flujo} onChange={e => setTicks(p => ({...p, hemo: {...p.hemo, flujo: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white font-medium" /><input placeholder="FiO2 %" value={ticks.hemo.fio2} onChange={e => setTicks(p => ({...p, hemo: {...p.hemo, fio2: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white font-medium" /></div>}
                        {(ticks.hemo.satMethod === 'VMNI' || ticks.hemo.satMethod === 'VMI') && <textarea placeholder="Parámetros ventilatorios..." value={ticks.hemo.paramsLibre} onChange={e => setTicks(p => ({...p, hemo: {...p.hemo, paramsLibre: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded h-16 bg-white shadow-sm font-medium" />}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dolor UCI */}
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 space-y-3">
                  <h4 className="text-[10px] font-black text-rose-800 uppercase">Dolor y Analgesia</h4>
                  <div className="flex gap-2">
                    {['No refiere', 'Refiere'].map(ds => <button key={ds} onClick={() => setTicks(p => ({...p, hemo: {...p.hemo, dolorStatus: ds as any}}))} className={`flex-1 py-1.5 text-[10px] font-black rounded border ${ticks.hemo.dolorStatus === ds ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-rose-600 border-rose-200'}`}>{ds.toUpperCase()}</button>)}
                  </div>
                  {ticks.hemo.dolorStatus === 'Refiere' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex gap-1">
                        {['EVA', 'CPOT', 'BPS'].map(esc => <button key={esc} onClick={() => setTicks(p => ({...p, hemo: {...p.hemo, dolorEscala: esc as any}}))} className={`flex-1 py-1 text-[9px] font-bold rounded border ${ticks.hemo.dolorEscala === esc ? 'bg-rose-700 text-white border-rose-800' : 'bg-white text-rose-700 border-rose-200'}`}>{esc}</button>)}
                      </div>
                      {ticks.hemo.dolorEscala === 'EVA' && <input placeholder="EVA 0-10" value={ticks.hemo.evaVal} onChange={e => setTicks(p => ({...p, hemo: {...p.hemo, evaVal: e.target.value}}))} className="w-full p-2 text-xs border border-slate-300 rounded bg-white font-medium" />}
                      {ticks.hemo.dolorEscala === 'CPOT' && (
                        <div className="grid gap-1">
                          {Object.entries(CPOT_OPTS).map(([k, opts]) => (
                            <select key={k} value={(ticks.hemo.cpot as any)[k]} onChange={e => setTicks(p => ({...p, hemo: {...p.hemo, cpot: {...p.hemo.cpot, [k]: parseInt(e.target.value)}}}) )} className="text-[10px] p-1 border border-slate-300 rounded bg-white shadow-sm font-medium">
                               {opts.map(o => <option key={o.v} value={o.v}>{k.toUpperCase()}: {o.l}</option>)}
                            </select>
                          ))}
                        </div>
                      )}
                      {ticks.hemo.dolorEscala === 'BPS' && (
                        <div className="grid gap-1">
                          {Object.entries(BPS_OPTS).map(([k, opts]) => (
                            <select key={k} value={(ticks.hemo.bps as any)[k]} onChange={e => setTicks(p => ({...p, hemo: {...p.hemo, bps: {...p.hemo.bps, [k]: parseInt(e.target.value)}}}) )} className="text-[10px] p-1 border border-slate-300 rounded bg-white shadow-sm font-medium">
                               {opts.map(o => <option key={o.v} value={o.v}>{k.toUpperCase()}: {o.l}</option>)}
                          </select>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {['Mantiene', 'Se agrega', 'Se administra'].map(acc => <button key={acc} onClick={() => toggleList('dolorAccion', acc, 'hemo')} className={`px-2 py-1 text-[9px] font-bold rounded border ${ticks.hemo.dolorAccion.includes(acc) ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-rose-600 border-rose-200'}`}>{acc}</button>)}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {['Analgesia SOS', 'Analgesia por horario', 'Analgesia en BIC'].map(via => <button key={via} onClick={() => toggleList('dolorVia', via, 'hemo')} className={`px-2 py-1 text-[9px] font-bold rounded border ${ticks.hemo.dolorVia.includes(via) ? 'bg-slate-700 text-white border-black' : 'bg-white text-slate-700 border-slate-200'}`}>{via}</button>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Ventilatorio */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase">5. Ventilatorio</h3>
              <div className="flex flex-wrap gap-1">
                {['Con UMA', 'Sin UMA', 'Con TQT'].map(o => <button key={o} onClick={() => toggleList('vent', o)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${ticks.vent.includes(o) ? 'bg-cyan-600 text-white border-cyan-700' : 'bg-white text-slate-400 border-slate-300'}`}>{o}</button>)}
              </div>
              {ticks.vent.includes('Con TQT') && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 animate-fade-in">
                  <input placeholder="TQT # (ej: 8)" value={ticks.tqt.numero} onChange={e => setTicks(p => ({...p, tqt: {...p.tqt, numero: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />
                  <input placeholder="Cuff (mmHg)" value={ticks.tqt.cuff} onChange={e => setTicks(p => ({...p, tqt: {...p.tqt, cuff: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />
                  <input placeholder="Fijado a... cms" value={ticks.tqt.fijado} onChange={e => setTicks(p => ({...p, tqt: {...p.tqt, fijado: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />
                  <select value={ticks.tqt.sitio} onChange={e => setTicks(p => ({...p, tqt: {...p.tqt, sitio: e.target.value as any}}))} className="p-2 text-xs border border-slate-300 rounded bg-white col-span-2 shadow-sm font-medium">
                    <option value="">Posición...</option>
                    <option>de la arcada dental</option>
                    <option>de la comisura labial</option>
                  </select>
                </div>
              )}
            </div>

            {/* 6. Hidratación */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase">6. Hidratación</h3>
              <div className="flex flex-wrap gap-1">
                {['VO', 'SNG', 'Régimen 0', 'Volemización', 'Tipo Néctar', 'Agua con espesante', 'Restricción Hídrica', 'Agua libre'].map(o => <button key={o} onClick={() => toggleList('hidratacion', o)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${ticks.hidratacion.includes(o) ? 'bg-cyan-600 text-white border-cyan-700' : 'bg-white text-slate-400 border-slate-300'}`}>{o}</button>)}
              </div>
              {(ticks.hidratacion.includes('SNG') || ticks.hidratacion.includes('Restricción Hídrica') || ticks.hidratacion.includes('VO')) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2 animate-fade-in">
                   <input placeholder="Volumen (ml)" value={ticks.hidraVol} onChange={e => setTicks(p => ({...p, hidraVol: e.target.value}))} className="flex-1 p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />
                   <span className="text-[10px] font-bold text-blue-800 uppercase">ml cada 24hrs</span>
                </div>
              )}
              {ticks.hidratacion.includes('Volemización') && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 grid grid-cols-2 gap-2 animate-fade-in">
                   <input placeholder="Volemiza con..." value={ticks.hidraVolem.que} onChange={e => setTicks(p => ({...p, hidraVolem: {...p.hidraVolem, que: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />
                   <input placeholder="Velocidad (ml/hr)" value={ticks.hidraVolem.velocidad} onChange={e => setTicks(p => ({...p, hidraVolem: {...p.hidraVolem, velocidad: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />
                </div>
              )}
            </div>

            {/* 7. Nutrición - Multimodal mejorado */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase">7. Nutrición</h3>
              <div className="flex flex-wrap gap-1">
                {['VO', 'Enteral (SNG)', 'Enteral (SNY)', 'Parenteral', 'Régimen 0'].map(o => (
                  <button key={o} onClick={() => toggleList('nutricion', o)} className={`px-4 py-2 rounded-full text-[10px] font-bold border ${ticks.nutricion.includes(o) ? 'bg-cyan-600 text-white' : 'bg-white text-slate-400 border-slate-300'}`}>{o}</button>
                ))}
              </div>

              {ticks.nutricion.includes('VO') && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 animate-fade-in">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Consistencia VO</label>
                  <div className="flex flex-wrap gap-1">
                    {NUTRI_VO_LIST.map(o => (
                      <button key={o} onClick={() => toggleVoNutri(o)} className={`px-2 py-1 text-[9px] font-bold rounded border ${ticks.nutriDetail.voTipos.includes(o) ? 'bg-cyan-700 text-white' : 'bg-white border-slate-300'}`}>{o}</button>
                    ))}
                  </div>
                </div>
              )}

              {ticks.nutricion.includes('Enteral (SNG)') && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 animate-fade-in">
                  <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase">Enteral (SNG)</div>
                  <select value={ticks.nutriDetail.enteralSngTipo} onChange={e => setTicks(p => ({...p, nutriDetail: {...p.nutriDetail, enteralSngTipo: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium">
                    <option value="">Fórmula...</option>
                    {NUTRI_ENTERAL_LIST.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <input placeholder="ml/hr" value={ticks.nutriDetail.enteralSngVel} onChange={e => setTicks(p => ({...p, nutriDetail: {...p.nutriDetail, enteralSngVel: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />
                </div>
              )}

              {ticks.nutricion.includes('Enteral (SNY)') && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 animate-fade-in">
                  <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase">Enteral (SNY)</div>
                  <div className="p-2 text-xs bg-slate-100 border border-slate-300 rounded font-bold text-center">Reconvan</div>
                  <input placeholder="ml/hr" value={ticks.nutriDetail.enteralSnyVel} onChange={e => setTicks(p => ({...p, nutriDetail: {...p.nutriDetail, enteralSnyVel: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />
                </div>
              )}

              {ticks.nutricion.includes('Parenteral') && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 animate-fade-in">
                  <div className="text-[10px] font-black text-slate-400 uppercase">Nutrición Parenteral</div>
                  <div className="flex gap-1">
                    {['Estándar', 'Smofkabiven', 'Magistral'].map(o => (
                      <button key={o} onClick={() => setTicks(p => ({...p, nutriDetail: {...p.nutriDetail, parenteralTipo: o as any}}))} className={`flex-1 py-1.5 text-[10px] font-bold rounded border ${ticks.nutriDetail.parenteralTipo === o ? 'bg-indigo-600 text-white' : 'bg-white border-slate-300'}`}>{o}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder={ticks.nutriDetail.parenteralTipo === 'Estándar' ? 'Tipo (num)' : 'Detalle...'} value={ticks.nutriDetail.parenteralDetalle} onChange={e => setTicks(p => ({...p, nutriDetail: {...p.nutriDetail, parenteralDetalle: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />
                    <input placeholder="ml/hr" value={ticks.nutriDetail.parenteralVel} onChange={e => setTicks(p => ({...p, nutriDetail: {...p.nutriDetail, parenteralVel: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />
                  </div>
                </div>
              )}
            </div>

            {/* 8. Eliminación */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase">8. Eliminación</h3>
              <div className="flex flex-wrap gap-1">
                {['Diuresis Espontánea', 'S. Foley', 'Anuria', 'Deposiciones (+)', 'Deposiciones (-)'].map(o => <button key={o} onClick={() => toggleList('eliminacion', o)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${ticks.eliminacion.includes(o) ? 'bg-cyan-600 text-white border-cyan-700' : 'bg-white text-slate-400 border-slate-300'}`}>{o}</button>)}
              </div>
              {(ticks.eliminacion.includes('Diuresis Espontánea') || ticks.eliminacion.includes('S. Foley')) && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3 animate-fade-in">
                  <select value={ticks.elimDetail.diuresisCaract} onChange={e => setTicks(p => ({...p, elimDetail: {...p.elimDetail, diuresisCaract: e.target.value}}))} className="w-full p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium">
                    {['clara', 'tinte hemática', 'hematuria franca', 'colúricas'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="Vol ml" value={ticks.elimDetail.diuresisVol} onChange={e => setTicks(p => ({...p, elimDetail: {...p.elimDetail, diuresisVol: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />
                    <input placeholder="Hrs" value={ticks.elimDetail.diuresisHrs} onChange={e => setTicks(p => ({...p, elimDetail: {...p.elimDetail, diuresisHrs: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />
                    <input placeholder="Peso kg" value={ticks.elimDetail.diuresisPeso} onChange={e => setTicks(p => ({...p, elimDetail: {...p.elimDetail, diuresisPeso: e.target.value}}))} className="p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />
                  </div>
                  {calcMlKgHr() && <div className="text-center font-black text-blue-700 text-[10px] py-1 bg-white rounded-lg border border-blue-200 shadow-sm">{calcMlKgHr()} ml/kg/hr</div>}
                </div>
              )}
              {ticks.eliminacion.includes('Deposiciones (+)') && (
                <select value={ticks.elimDetail.depoTipo} onChange={e => setTicks(p => ({...p, elimDetail: {...p.elimDetail, depoTipo: e.target.value}}))} className="w-full p-2 text-xs border border-slate-300 rounded bg-white shadow-sm animate-fade-in font-medium">
                  {['líquidas', 'pastosas', 'normales', 'melénicas', 'rectorragia'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                </select>
              )}
              {ticks.eliminacion.includes('Deposiciones (-)') && (
                <div className="flex gap-2 items-center animate-fade-in">
                  <input placeholder="Días..." value={ticks.elimDetail.depoNegDias} onChange={e => setTicks(p => ({...p, elimDetail: {...p.elimDetail, depoNegDias: e.target.value}}))} className="flex-1 p-2 text-xs border border-slate-300 rounded bg-white shadow-sm font-medium" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">días</span>
                </div>
              )}
            </div>

            {/* 9. Infeccioso */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase">9. Infeccioso</h3>
              <div className="flex gap-1">
                {['Sin foco', 'Con ATB'].map(o => <button key={o} onClick={() => toggleList('infeccioso', o)} className={`flex-1 py-2 rounded-full text-[10px] font-bold border ${ticks.infeccioso.includes(o) ? 'bg-cyan-600 text-white border-cyan-700' : 'bg-white text-slate-400 border-slate-300'}`}>{o}</button>)}
              </div>
              {ticks.infeccioso.includes('Con ATB') && (
                <textarea placeholder="Antibiótico y motivo..." value={ticks.infecDet} onChange={e => setTicks(p => ({...p, infecDet: e.target.value}))} className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-white h-20 shadow-sm outline-none focus:ring-2 focus:ring-cyan-500 font-medium" />
              )}
              <div className="pt-2">
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Aislamientos</label>
                <div className="flex flex-wrap gap-1">
                  {['Sin aislamiento', 'Gotitas', 'Contacto', 'Aéreo'].map(a => <button key={a} onClick={() => toggleList('aislamientos', a)} className={`px-2 py-1 text-[9px] font-bold rounded border ${ticks.aislamientos.includes(a) ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-400 border-slate-300'}`}>{a}</button>)}
                </div>
              </div>
            </div>

            {/* 11. Invasivos */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-xs font-black text-slate-800 uppercase mb-4 tracking-widest">11. Dispositivos Invasivos</h3>
              <div className="flex flex-wrap gap-1 mb-3">
                {INVASIVOS_TIPOS.map(t => <button key={t} onClick={() => addInv(t)} className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-[10px] font-bold border border-cyan-100 flex items-center gap-1 hover:bg-cyan-100 shadow-sm transition-colors"><ICONS.Plus /> {t}</button>)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ticks.invasivos.map(d => (
                  <div key={d.id} className="bg-white p-2 rounded-lg border border-cyan-200 relative animate-fade-in shadow-sm">
                    <button onClick={() => setTicks(p => ({...p, invasivos: p.invasivos.filter(x => x.id !== d.id)}))} className="absolute -top-1.5 -right-1.5 bg-red-100 text-red-600 p-1 rounded-full border border-red-200 shadow-sm hover:bg-red-200"><ICONS.X /></button>
                    <span className="text-[9px] font-black text-cyan-600 uppercase">{d.type === 'Otros' ? 'Libre' : d.type}</span>
                    <input placeholder="Lugar, #, características..." value={d.detail} onChange={e => setTicks(p => ({...p, invasivos: p.invasivos.map(x => x.id === d.id ? {...x, detail: e.target.value} : x)}))} className="w-full text-xs p-1 mt-1 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-cyan-300 font-medium" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resultado' && (
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Evolución Clínica UCI</span>
              {result && <button onClick={() => { navigator.clipboard.writeText(result); alert('Copiado al portapapeles exitosamente.'); }} className="bg-cyan-600 text-white px-5 py-2 rounded-lg text-xs font-black hover:bg-cyan-700 shadow-lg active:scale-95 transition-all">COPIAR RESULTADO</button>}
            </div>
            <div className="p-8">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <div className="w-14 h-14 border-4 border-cyan-100 border-t-cyan-600 rounded-full animate-spin"></div>
                  <p className="mt-6 font-black text-sm uppercase tracking-widest text-slate-500 animate-pulse">Sintetizando parámetros clínicos...</p>
                </div>
              ) : (
                result ? (
                  <div 
                    style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', color: 'black' }} 
                    className="whitespace-pre-wrap leading-relaxed"
                  >
                    {result}
                  </div>
                ) : (
                  <p className="text-center text-slate-300 italic py-24 uppercase font-black text-[10px] tracking-widest">Complete los datos y presione sintetizar.</p>
                )
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40 shadow-[0_-10px_15px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating} 
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95 text-sm tracking-widest uppercase"
          >
            {isGenerating ? 'GENERANDO EVOLUCIÓN...' : <><ICONS.Refresh /><span>SINTETIZAR EVOLUCIÓN</span></>}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
