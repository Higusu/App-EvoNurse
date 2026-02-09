
import { GoogleGenAI } from "@google/genai";
import { PatientData, TicksState } from "../types";
import { RASS_OPTS, SAS_OPTS, NEURO_LIST_ORDER } from "../constants";

const formatWithAnd = (items: string[]) => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  const last = items.pop();
  return items.join(', ') + ' y ' + last;
};

export const generateEvolution = async (data: PatientData, ticks: TicksState): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Título Formateado
  const [year, month, day] = data.date.split('-');
  const titleDate = `${day}/${month}`;
  const header = `EVOLUCION TURNO ${data.shift.toUpperCase()} ${titleDate}`;

  // 2. Neuro
  const orderedNeuro = NEURO_LIST_ORDER.filter(opt => ticks.neuro.includes(opt));
  const neuroItems = orderedNeuro.map(n => {
    if (n === 'RASS') return `RASS ${ticks.rassVal} (${RASS_OPTS.find(o=>o.v===ticks.rassVal)?.l || ''})`;
    if (n === 'SAS') return `SAS ${ticks.sasVal} (${SAS_OPTS.find(o=>o.v===ticks.sasVal)?.l || ''})`;
    if (n === 'GSW') return `GSW ${ticks.gsw.o + ticks.gsw.v + ticks.gsw.m} (O: ${ticks.gsw.o} V: ${ticks.gsw.v} M: ${ticks.gsw.m})`;
    return n;
  });
  if (ticks.neuro.includes('Pupilas isocóricas')) neuroItems.push('Pupilas isocóricas');
  if (ticks.neuro.includes('Pupilas no reactivas')) neuroItems.push('Pupilas no reactivas');

  // 3. Hemodinamia
  const h = ticks.hemo;
  const ritmoStr = h.ritmo ? `en ${h.ritmo}` : '';
  const presionStr = `${h.presionTipo}${h.presionSubTipo ? ` ${h.presionSubTipo}` : ''} con PAM: ${h.pam}`;
  const satBase = h.satStatus === 'dentro de metas' ? `Sat dentro de metas (${h.satMetaVal})` : 'Sat dentro de rangos';
  
  let o2Str = 'con fio2 amb';
  if (h.oxigenoterapia === 'Con') {
    if (h.satMethod === 'CNAF') o2Str = `con CNAF ${h.tempCnaf}°/${h.flujo}l/m/${h.fio2}%`;
    else if (h.satMethod === 'NRC') o2Str = `con NRC ${h.flujo}lts`;
    else if (h.satMethod === 'MMV') o2Str = `con MMV Fio2 ${h.fio2}% y flujo ${h.flujo}`;
    else o2Str = `con ${h.satMethod} ${h.paramsLibre}`;
  }
  
  let dolorStr = h.dolorStatus === 'No refiere' ? "Paciente no refiere dolor ni molestias" : `Refiere dolor (${h.dolorEscala})`;
  if (h.dolorStatus === 'Refiere') {
    const val = h.dolorEscala === 'EVA' ? h.evaVal : (h.dolorEscala === 'CPOT' ? (h.cpot.facial + h.cpot.movimiento + h.cpot.tono + h.cpot.ventilacion + h.cpot.vocalizacion) : (h.bps.facial + h.bps.mmss + h.bps.ventilacion));
    dolorStr += ` puntuación ${val}. ${formatWithAnd([...h.dolorAccion])} ${formatWithAnd([...h.dolorVia])}`;
  }

  // 5. Ventilatorio
  const method = h.satMethod;
  const isEspontaneo = h.oxigenoterapia === 'Sin' || ['NRC', 'MMV', 'CNAF'].includes(method);
  const ventHeader = isEspontaneo 
    ? `Espontaneo, ${h.oxigenoterapia === 'Sin' ? 'sin apoyo de 02 suplementario' : `con apoyo de 02 por ${method}`}`
    : `Con apoyo de ${method}`;
  const tqtStr = ticks.vent.includes('Con TQT') ? `Con TQT #${ticks.tqt.numero}, con Cuff a 30mmHg, Fijado a ${ticks.tqt.fijado}cms ${ticks.tqt.sitio}` : '';

  // 6. Hidratación
  const hidraItems = ticks.hidratacion.map(it => {
    if (it === 'Restricción Hídrica') return `Restricción Hídrica ${ticks.hidraVol}ml cada 24hrs`;
    if (it === 'SNG') return `SNG asegurar ${ticks.hidraVol}ml cada 24hrs`;
    if (it === 'Volemización') return `Volemización con ${ticks.hidraVolem.que} a ${ticks.hidraVolem.velocidad}ml/hr`;
    return it;
  });

  // 8. Eliminación
  const elimParts = [];
  if (ticks.eliminacion.includes('Anuria')) elimParts.push('Anuria');
  const diuSelect = ticks.eliminacion.find(x => x.includes('Diuresis') || x.includes('Foley'));
  if (diuSelect) {
    let dText = `${diuSelect} ${ticks.elimDetail.diuresisCaract}`;
    if (ticks.elimDetail.diuresisVol && ticks.elimDetail.diuresisHrs && ticks.elimDetail.diuresisPeso) {
      const mlkg = (parseFloat(ticks.elimDetail.diuresisVol) / parseFloat(ticks.elimDetail.diuresisHrs) / parseFloat(ticks.elimDetail.diuresisPeso)).toFixed(2);
      dText += ` de ${ticks.elimDetail.diuresisVol}ml en ${ticks.elimDetail.diuresisHrs}hrs (${mlkg} ml/kg/hr)`;
    } else if (ticks.elimDetail.diuresisVol) {
      dText += ` de ${ticks.elimDetail.diuresisVol}ml`;
    }
    elimParts.push(dText);
  }
  if (ticks.eliminacion.includes('Deposiciones (+)')) elimParts.push(`Deposiciones (+) ${ticks.elimDetail.depoTipo}`);
  if (ticks.eliminacion.includes('Deposiciones (-)')) elimParts.push(`Deposiciones (-) desde hace ${ticks.elimDetail.depoNegDias} días`);

  // 11. Invasivos
  const invStr = ticks.invasivos.map(d => `${d.type === 'Otros' ? '' : `${d.type} `}${d.detail}`).join('. ');

  const prompt = `
    Ensambla la evolución clínica siguiendo este orden riguroso. NO uses negritas ni asteriscos. 
    Asegura un espacio (intro) entre cada punto numérico.

    ${header}

    1. Estado General: ${ticks.estadoGral}

    2. Condición Neurológica: ${neuroItems.join(', ')}.

    3. Hemodinamia: ${h.frecuencia} ${ritmoStr}, ${presionStr}, ${h.tempStatus}, ${satBase} ${o2Str}. ${dolorStr}.

    4. Exámenes: ${data.exams || 'Sin novedades de laboratorio.'}

    5. Ventilatorio: ${ventHeader}. ${ticks.uma || ''}. ${tqtStr}

    6. Hidratación: ${hidraItems.join(', ')}.

    7. Nutrición: ${ticks.nutricion.join(', ')}. ${ticks.nutriTipo ? `${ticks.nutriTipo} a ${ticks.nutriVel}ml/hr` : ''} ${ticks.nutriParenteralTipo === 'Estándar' ? (ticks.nutriParenteralDetalle ? `Estándar Tipo ${ticks.nutriParenteralDetalle} a ${ticks.nutriVel}ml/hr` : '') : `${ticks.nutriParenteralTipo} a ${ticks.nutriVel}ml/hr`}.

    8. Eliminación: ${elimParts.join(', ')}.

    9. Infeccioso: ${ticks.infeccioso.includes('Sin foco') ? 'Sin conflicto actualmente' : `Con ATB ${ticks.infecDet}`}. Aislamientos: ${ticks.aislamientos.join(', ')}.

    10. Tegumentos: 

    Estado general de la piel 
    • 
    Estado de zonas de apoyo 
    • 
    Condición de piel en contacto con dispositivos
    • 
    Signos de alarma 
    • 

    11. Dispositivos Invasivos: ${invStr}${invStr ? '.' : ''}

    12. Pendientes: ${data.pendings || 'Sin pendientes.'}

    REGLA: Usa solo los datos proporcionados. No asumas residuo gástrico ni planes de destete si no están marcados.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { temperature: 0 }
    });
    return (response.text ?? "").replace(/\*/g, '').trim();
  } catch (e) {
    return "Error generando evolución clínica.";
  }
};
