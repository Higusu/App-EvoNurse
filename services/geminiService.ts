
import { GoogleGenAI } from "@google/genai";
import { PatientData, TicksState } from "../types";
import { RASS_OPTS, SAS_OPTS, NEURO_LIST_ORDER } from "../constants";

const formatWithAnd = (items: string[]) => {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  const list = [...items];
  const last = list.pop();
  return list.join(', ') + ' y ' + last;
};

export const generateEvolution = async (data: PatientData, ticks: TicksState): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Título Formateado: EVOLUCION TURNO [SHIFT] DD/MM
  const [year, month, day] = data.date.split('-');
  const titleDate = `${day}/${month}`;
  const header = `EVOLUCION TURNO ${data.shift.toUpperCase()} ${titleDate}`;

  // 2. Neuro - Orden de aparición exacto
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
  // Lógica Normotenso -> Sin PAM
  const presionStr = h.presionTipo === 'Normotenso' ? 'Normotenso' : `${h.presionTipo}${h.presionSubTipo ? ` ${h.presionSubTipo}` : ''} con PAM: ${h.pam}`;
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
  const isEspontaneo = h.oxigenoterapia === 'Sin' || ['NRC', 'MMV', 'CNAF'].includes(h.satMethod);
  const ventHeader = isEspontaneo 
    ? `Espontaneo, ${h.oxigenoterapia === 'Sin' ? 'sin apoyo de 02 suplementario' : `con apoyo de 02 por ${h.satMethod}`}`
    : `Con apoyo de ${h.satMethod}`;
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
    Actúa como Asistente Experto en Documentación Clínica UCI.
    Genera la evolución siguiendo ESTRICTAMENTE este orden de 12 puntos.
    IMPORTANTE: No uses negritas (**), no uses asteriscos (*). Usa solo texto plano.
    Separar cada punto por un espacio (intro).

    ${header}

    1. Estado General: ${ticks.estadoGral}

    2. Condición Neurológica: ${neuroItems.join(', ')}.

    3. Hemodinamia: ${h.frecuencia} ${ritmoStr}, ${presionStr}, ${h.tempStatus}, ${satBase} ${o2Str}. ${dolorStr}.

    4. Exámenes: Procesa el texto de laboratorio: "${data.exams}".
       REGLAS ESTRICTAS PARA PUNTO 4:
       - Solo incluye los exámenes de esta lista en el orden dado, ignora el resto:
         Hematocrito (Hcto), Hemoglobina (Hb), Recuento de leucocitos (RL), Recuento de plaquetas (RP), Nitrogeno ureico (BUN), Creatintina (Crea), Na (Na), K (K), Cl (Cl), Magnesio (Mg), Calcio (Ca), Fosforo (P), Lactato (Lactato), Proteina C Reactiva (PCR), Calcio Ionico (CaI), Gases arteriales (GSA), Gases Venosos (GSV), LDH (LDH), Bilirrubina Total (BT), Bilirrubina Directa (BD), Fosfatasa Alcalina (FA), GOT (GOT), GPT (GOT), GGT (GGT), Craetinaquinasa Total (CKT), Craetinaquinasa MB (CKMB), Albumina (Alb), Tiempo de tromboplastina (TP), Tiempo de tromboplastina parcial activado (TTPK), Troponina (Tropo), INR (INR), Colesterol Total (CT), HDL (HDL), Trigliceridos (TG), LDL (LDL).
       - USA LAS ABREVIACIONES ENTRE PARÉNTESIS.
       - GASES: Formato pH/pCO2/pO2/HCO3/CO2T/B.E (ej: GSA 7.4/40/90/24/25/+1).
       - ELIMINA UNIDADES (mg/dL, mmol/L, etc.). Solo deja el número.
       - Presentar como lista limpia separada por comas.

    5. Ventilatorio: ${ventHeader}. ${ticks.uma || ''}. ${tqtStr}

    6. Hidratación: ${hidraItems.join(', ')}.

    7. Nutrición: ${ticks.nutricion.join(', ')}.
       PROCESAR DETALLES DE NUTRICIÓN:
       - Si VO: incluir tipos (${ticks.nutriDetail.voTipos.join(', ')}).
       - Si Enteral (SNG): incluir tipo (${ticks.nutriDetail.enteralSngTipo}) a ${ticks.nutriDetail.enteralSngVel} ml/hr.
       - Si Enteral (SNY): incluir Reconvan a ${ticks.nutriDetail.enteralSnyVel} ml/hr.
       - Si Parenteral: incluir tipo (${ticks.nutriDetail.parenteralTipo} ${ticks.nutriDetail.parenteralDetalle}) a ${ticks.nutriDetail.parenteralVel} ml/hr.
       - Si velocidad es mayor a 0, usar formato "a [X] ml/hr".

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

    REGLA FINAL: Si seleccionas Parenteral, no agregues "sin residuo por SNG" automáticamente. Letra sobria.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { temperature: 0.1 }
    });
    return (response.text ?? "").replace(/\*/g, '').trim();
  } catch (e) {
    return "Error generando evolución clínica.";
  }
};
