
import { GoogleGenAI } from "@google/genai";
import { PatientData, TicksState, TegumentosSelection } from "../types";
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
    if (n === 'Con requerimientos de contención') {
      const razones = ticks.contencionRazones.join(', ');
      const tipos = ticks.contencionTipos.join(', ');
      return `Con requerimientos de contención (${razones}, ${tipos})`;
    }
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
  
  let dolorStr = h.dolorStatus === 'No refiere' ? "Paciente no refiere dolor ni molestias" : (h.dolorStatus === 'Dolor no evaluable' ? "Dolor no evaluable" : `Refiere dolor (${h.dolorEscala})`);
  if (h.dolorStatus === 'Refiere' || h.dolorStatus === 'Dolor no evaluable') {
    if (h.dolorStatus === 'Refiere') {
      const val = h.dolorEscala === 'EVA' ? h.evaVal : (h.dolorEscala === 'CPOT' ? (h.cpot.facial + h.cpot.movimiento + h.cpot.tono + h.cpot.ventilacion + h.cpot.vocalizacion) : (h.bps.facial + h.bps.mmss + h.bps.ventilacion));
      dolorStr += ` puntuación ${val}.`;
    }
    if (h.dolorAccion.length > 0 || h.dolorVia.length > 0) {
      dolorStr += ` ${formatWithAnd([...h.dolorAccion])} ${formatWithAnd([...h.dolorVia])}`;
    }
  }

  // 5. Ventilatorio
  const isEspontaneo = h.oxigenoterapia === 'Sin' || ['NRC', 'MMV', 'CNAF'].includes(h.satMethod);
  const ventHeader = isEspontaneo 
    ? `Espontaneo, ${h.oxigenoterapia === 'Sin' ? 'sin apoyo de 02 suplementario' : `con apoyo de 02 por ${h.satMethod}`}`
    : `Con apoyo de ${h.satMethod}`;
  
  const totStr = ticks.vent.includes('Con TOT') ? `Con TOT #${ticks.tot.numero}, fijado a ${ticks.tot.cms}cms ${ticks.tot.sitio}, con Cuff a ${ticks.tot.cuff}mmHg` : '';
  const tqtStr = ticks.vent.includes('Con TQT') ? `Con TQT #${ticks.tqt.numero}, con Cuff a ${ticks.tqt.cuff}mmHg` : '';
  const ventDetails = [totStr, tqtStr].filter(Boolean).join('. ');

  // 6. Hidratación
  const hidraItems = ticks.hidratacion.map(it => {
    if (it === 'Restricción Hídrica') return `Restricción Hídrica ${ticks.hidraVol}ml cada 24hrs`;
    if (it === 'SNG') return `SNG asegurar ${ticks.hidraVol}ml cada 24hrs`;
    if (it === 'VO') {
      if (ticks.hidratacion.includes('Agua libre')) return 'VO';
      return `VO asegurar ${ticks.hidraVol}ml cada 24hrs`;
    }
    if (it === 'Volemización') return `Volemización con ${ticks.hidraVolem.que} a ${ticks.hidraVolem.velocidad}ml/hr`;
    return it;
  });

  // 7. Nutrición
  const nutriItems = ticks.nutricion.map(it => {
    if (it === 'VO') {
      const voList = ticks.nutriDetail.voTipos.map(v => v === 'otro' ? ticks.nutriDetail.voOtro : v);
      return `VO (${voList.join(', ')})`;
    }
    if (it === 'Enteral (SNG)') return `Enteral (SNG) ${ticks.nutriDetail.enteralSngTipo} a ${ticks.nutriDetail.enteralSngVel} ml/hr`;
    if (it === 'Enteral (SNY)') return `Enteral (SNY) Reconvan a ${ticks.nutriDetail.enteralSnyVel} ml/hr`;
    if (it === 'Parenteral') return `Parenteral ${ticks.nutriDetail.parenteralTipo} ${ticks.nutriDetail.parenteralDetalle} a ${ticks.nutriDetail.parenteralVel} ml/hr`;
    if (it === 'Otro') return ticks.nutriDetail.nutriOtro || 'Otro';
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
  if (ticks.eliminacion.includes('Vómito')) elimParts.push(`Vómito de ${ticks.elimDetail.vomitoVol}ml`);
  if (ticks.eliminacion.includes('Dialisis')) elimParts.push(`Dialisis con UF de ${ticks.elimDetail.dialisisUF}ml`);

  // 11. Invasivos
  const invStr = ticks.invasivos.map(d => `${d.type === 'Otros' ? '' : `${d.type} `}${d.detail}`).join('. ');

  // 10. Tegumentos logic
  const tegGeneralSelections = ticks.tegumentos.selections.filter(s => 
    s.category && s.category.match(/^[0-6]\./)
  );

  const formatTegSelection = (s: TegumentosSelection) => {
    let text = s.label;
    if (s.side) text += ` ${s.side}`;
    if (s.value) text += ` ${s.value}`;
    return text;
  };

  const tegGeneralList = tegGeneralSelections.map(formatTegSelection);
  const tegGeneral = tegGeneralList.length > 0 
    ? tegGeneralList.map((item, index) => {
        const val = item.toLowerCase();
        if (index === 0) return val.charAt(0).toUpperCase() + val.slice(1);
        return val;
      }).join(', ')
    : 'No evaluado';

  const tegApoyoSelection = ticks.tegumentos.selections.find(s => s.category === 'Estado de zonas de apoyo');
  const tegApoyo = tegApoyoSelection ? (tegApoyoSelection.label === 'LPP' ? `LPP ${tegApoyoSelection.value}` : tegApoyoSelection.label) : 'No evaluado';

  const tegDevices = ticks.invasivos.length > 0 
    ? ticks.invasivos.map(d => `${d.type} ${d.detail} sin signos de LPP`).join('. ')
    : 'Sin dispositivos en contacto con piel';

  const tegAlarmaSelections = ticks.tegumentos.selections.filter(s => s.category === 'Signos de alarma');
  const tegAlarma = tegAlarmaSelections.length > 0 
    ? tegAlarmaSelections.map(s => s.label).map((item, index) => {
        const val = item.toLowerCase();
        if (index === 0) return val.charAt(0).toUpperCase() + val.slice(1);
        return val;
      }).join(', ')
    : 'No evaluado';

  const prompt = `
    Actúa como un Sistema de Registro Clínico Determinista. Tu función es transformar datos estructurados en una nota de enfermería siguiendo un formato rígido e inamovible.
    REGLAS DE ORO:
    - PROHIBIDO LA CREATIVIDAD: No añadas palabras, adjetivos o conectores que no estén en el input.
    - FORMATO ESTRICTO: Debes mantener los títulos de los 12 puntos tal cual se solicitan.
    - TRATAMIENTO DE DATOS: Mantén exactamente los términos técnicos proporcionados.
    - IMPORTANTE: No uses negritas (**), no uses asteriscos (*). Usa solo texto plano.
    - Separar cada punto por un espacio (intro).

    ${header}

    1. Estado General: ${ticks.estadoGral || 'No evaluado'}

    2. Condición Neurológica: ${neuroItems.length > 0 ? neuroItems.join(', ') : 'No evaluado'}.

    3. Hemodinamia: ${h.frecuencia || 'No evaluado'} ${ritmoStr}, ${presionStr}, ${h.tempStatus || 'No evaluado'}, ${satBase} ${o2Str}. ${dolorStr}.

    4. Exámenes: Procesa el texto de laboratorio: "${data.exams}".
       REGLAS ESTRICTAS PARA PUNTO 4:
       - Solo incluye los exámenes de esta lista en el orden dado, ignora el resto:
         Hematocrito (Hcto), Hemoglobina (Hb), Recuento de leucocitos (RL), Recuento de plaquetas (RP), Nitrogeno ureico (BUN), Creatintina (Crea), Na (Na), K (K), Cl (Cl), Magnesio (Mg), Calcio (Ca), Fosforo (P), Lactato (Lactato), Proteina C Reactiva (PCR), Calcio Ionico (CaI), Gases arteriales (GSA), Gases Venosos (GSV), LDH (LDH), Bilirrubina Total (BT), Bilirrubina Directa (BD), Fosfatasa Alcalina (FA), GOT (GOT), GPT (GOT), GGT (GGT), Craetinaquinasa Total (CKT), Craetinaquinasa MB (CKMB), Albumina (Alb), Tiempo de tromboplastina (TP), Tiempo de tromboplastina parcial activado (TTPK), Troponina (Tropo), INR (INR), Colesterol Total (CT), HDL (HDL), Trigliceridos (TG), LDL (LDL).
       - USA LAS ABREVIACIONES ENTRE PARÉNTESIS.
       - GASES: Formato pH/pCO2/pO2/HCO3/CO2T/B.E (ej: GSA 7.4/40/90/24/25/+1).
       - ELIMINA UNIDADES (mg/dL, mmol/L, etc.). Solo deja el número.
       - Presentar como lista limpia separada por comas. Si no hay datos, poner "No evaluado".

    5. Ventilatorio: ${ventHeader}. ${ticks.uma || ''}. ${ventDetails}

    6. Hidratación: ${hidraItems.length > 0 ? hidraItems.join(', ') : 'No evaluado'}.

    7. Nutrición: ${nutriItems.length > 0 ? nutriItems.join(', ') : 'No evaluado'}.

    8. Eliminación: ${elimParts.length > 0 ? elimParts.join(', ') : 'No evaluado'}.

    9. Infeccioso: ${ticks.infeccioso.includes('Sin foco') ? 'Sin conflicto actualmente' : (ticks.infeccioso.includes('Con ATB') ? `Con ATB ${ticks.infecDet}` : 'No evaluado')}. Aislamientos: ${ticks.aislamientos.length > 0 ? ticks.aislamientos.join(', ') : 'No evaluado'}${ticks.aislamientoRazon ? `. Razón: ${ticks.aislamientoRazon}` : ''}.

    10. Tegumentos: 

    Estado general de la piel 
    • ${tegGeneral}

    Estado de zonas de apoyo 
    • ${tegApoyo}

    Condición de piel en contacto con dispositivos
    • ${tegDevices}

    Signos de alarma 
    • ${tegAlarma}

    11. Dispositivos Invasivos: 
    ${invStr || 'Sin dispositivos invasivos'}${invStr ? '.' : ''}

    12. Pendientes: 
    ${data.pendings || 'Sin pendientes.'}

    REGLA FINAL: El esquema de evolución es inamovible. No omitas los títulos de los puntos ni los subtítulos del punto 10. Letra sobria.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { temperature: 0, topP: 0.1 }
    });
    return (response.text ?? "").replace(/\*/g, '').trim();
  } catch (e) {
    return "Error generando evolución clínica.";
  }
};
