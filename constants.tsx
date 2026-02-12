
import React from 'react';

export const NEURO_LIST_ORDER = ['Lucido', 'Orientado', 'Desorientado', 'Vigil', 'Somnoliento', 'Sopor', 'Tranquilo', 'Agitado', 'CAM (+)', 'CAM (-)'];

export const RASS_OPTS = [
  { v: '+4', l: 'Combativo (+4)' }, { v: '+3', l: 'Muy Agitado (+3)' }, { v: '+2', l: 'Agitado (+2)' }, { v: '+1', l: 'Inquieto (+1)' },
  { v: '0', l: 'Alerta y Calmado (0)' }, { v: '-1', l: 'Somnoliento (-1)' }, { v: '-2', l: 'Sedación leve (-2)' },
  { v: '-3', l: 'Sedación moderada (-3)' }, { v: '-4', l: 'Sedación profunda (-4)' }, { v: '-5', l: 'Sin respuesta (-5)' }
];

export const SAS_OPTS = [
  { v: '7', l: 'Agitación Peligrosa (7)' }, { v: '6', l: 'Muy Agitado (6)' }, { v: '5', l: 'Agitado (5)' },
  { v: '4', l: 'Calmado (4)' }, { v: '3', l: 'Sedado (3)' }, { v: '2', l: 'Muy sedado (2)' }, { v: '1', l: 'No despierta (1)' }
];

export const GSW_OPTS = {
  o: [{ v: 4, l: 'Espontanea (4)' }, { v: 3, l: 'respuesta a ordenes (3)' }, { v: 2, l: 'respuesta al dolor (2)' }, { v: 1, l: 'no apertura (1)' }],
  v: [{ v: 5, l: 'orientada (5)' }, { v: 4, l: 'confusa (4)' }, { v: 3, l: 'inapropiada (3)' }, { v: 2, l: 'incomprensible (2)' }, { v: 1, l: 'no respuesta (1)' }],
  m: [{ v: 6, l: 'Obedece ordenes (6)' }, { v: 5, l: 'localiza estimulo doloroso (5)' }, { v: 4, l: 'retirada (al dolor) (4)' }, { v: 3, l: 'flexión (3)' }, { v: 2, l: 'extensión (2)' }, { v: 1, l: 'ninguna (1)' }]
};

export const CPOT_OPTS = {
  facial: [{v: 0, l: 'Relajada (0)'}, {v: 1, l: 'Tensa (1)'}, {v: 2, l: 'Muecas (2)'}],
  mov: [{v: 0, l: 'No movimientos (0)'}, {v: 1, l: 'Lento y cauteloso, pide atención (1)'}, {v: 2, l: 'Inquieto, tira del tubo, agrede (2)'}],
  tono: [{v: 0, l: 'Relajado (0)'}, {v: 1, l: 'Tenso, rígido (1)'}, {v: 2, l: 'Muy tenso rígido (2)'}],
  vent: [{v: 0, l: 'Adaptado (0)'}, {v: 1, l: 'Tose, pero tolera (1)'}, {v: 2, l: 'Lucha (2)'}],
  vocal: [{v: 0, l: 'Habla, tono normal (0)'}, {v: 1, l: 'Suspirando, gimiendo (1)'}, {v: 2, l: 'Gritando, llorando (2)'}]
};

export const BPS_OPTS = {
  facial: [{v: 1, l: 'Relajada (1)'}, {v: 2, l: 'Parcialmente tensa (2)'}, {v: 3, l: 'Totalmente tensa (3)'}, {v: 4, l: 'Muecas (4)'}],
  mmss: [{v: 1, l: 'No movimientos (1)'}, {v: 2, l: 'Parcialmente doblados (2)'}, {v: 3, l: 'Totalmente doblados con flexión de dedos (3)'}, {v: 4, l: 'Permanentemente retraídas (4)'}],
  vent: [{v: 1, l: 'Tolera el movimiento (1)'}, {v: 2, l: 'Tose, pero tolera la mayor parte del tiempo (2)'}, {v: 3, l: 'Lucha (3)'}, {v: 4, l: 'Imposible controlar la ventilación (4)'}]
};

export const NUTRI_VO_LIST = ['blando', 'liviano', 'picado fino', 'papilla', 'hiposódico', 'diabético', 'hipoglúcido', 'bajo en K y P'];
export const NUTRI_ENTERAL_LIST = ['Fresubin', 'Fresubin HP', 'Fresubin 2K', 'Diben', 'Diben HP', 'Reconvan'];
export const INVASIVOS_TIPOS = ['VVP', 'CVC', 'LA', 'CHD', 'S Foley', 'SNG', 'Drenaje', 'PiccLine', 'MidLine', 'TOT', 'TQT', 'Otros'];

export const ICONS = {
  Activity: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
};
