
export type ShiftType = 'Largo' | 'Noche';

export interface GSWState {
  o: number;
  v: number;
  m: number;
}

export interface CpotState {
  facial: number;
  movimiento: number;
  tono: number;
  ventilacion: number;
  vocalizacion: number;
}

export interface BpsState {
  facial: number;
  mmss: number;
  ventilacion: number;
}

export interface HemoDetail {
  frecuencia: 'Bradicardico' | 'Normocardico' | 'Taquicardico' | '';
  ritmo: 'RS' | 'FA' | 'Flutter' | '';
  presionTipo: 'Normotenso' | 'Hipotenso' | 'Hipertenso' | '';
  presionSubTipo: 'Sistólico' | 'Diastólico' | 'Global' | '';
  pam: string;
  tempStatus: 'Febril' | 'Afebril' | 'Subfebril' | '';
  satStatus: 'dentro de rangos' | 'dentro de metas' | '';
  satMetaVal: string;
  oxigenoterapia: 'Sin' | 'Con' | '';
  satMethod: 'NRC' | 'MMV' | 'CNAF' | 'VMNI' | 'VMI' | '';
  fio2: string;
  flujo: string;
  tempCnaf: string;
  paramsLibre: string;
  dolorStatus: 'No refiere' | 'Refiere' | 'Dolor no evaluable' | '';
  dolorEscala: 'EVA' | 'CPOT' | 'BPS';
  evaVal: string;
  cpot: CpotState;
  bps: BpsState;
  dolorAccion: string[]; 
  dolorVia: string[];   
}

export interface TqtDetail {
  numero: string;
  cuff: string;
}

export interface TotDetail {
  numero: string;
  cms: string;
  cuff: string;
  sitio: 'de la arcada dental' | 'de la comisura labial' | '';
}

export interface ElimDetail {
  diuresisCaract: string;
  diuresisVol: string;
  diuresisHrs: string;
  diuresisPeso: string;
  depoTipo: string;
  depoNegDias: string;
  vomitoVol: string;
  dialisisUF: string;
}

export interface DeviceEntry {
  id: string;
  type: string;
  detail: string;
}

// Estructura para capturar datos específicos de nutrición por vía
export interface NutritionDetails {
  voTipos: string[];
  enteralSngTipo: string;
  enteralSngVel: string;
  enteralSnyVel: string;
  parenteralTipo: 'Estándar' | 'Smofkabiven' | 'Magistral';
  parenteralDetalle: string;
  parenteralVel: string;
  nutriOtro: string;
  voOtro: string;
}

export interface TegumentosSelection {
  id: string;
  label: string;
  side?: 'Derecho' | 'Izquierdo' | '';
  value?: string;
  category?: string;
}

export interface TegumentosState {
  selections: TegumentosSelection[];
}

export interface TicksState {
  estadoGral: 'BCG' | 'RCG' | 'MCG' | '';
  neuro: string[];
  rassVal: string;
  sasVal: string;
  gsw: GSWState;
  pupilas: string[];
  hemo: HemoDetail;
  vent: string[];
  tqt: TqtDetail;
  tot: TotDetail;
  uma: 'Con UMA' | 'Sin UMA' | '';
  hidratacion: string[];
  hidraVol: string;
  hidraVolem: { que: string; velocidad: string };
  nutricion: string[]; // Vías seleccionadas: VO, Enteral (SNG), etc.
  nutriDetail: NutritionDetails;
  eliminacion: string[];
  elimDetail: ElimDetail;
  infeccioso: string[];
  infecDet: string;
  aislamientos: string[];
  aislamientoRazon: string;
  contencionRazones: string[];
  contencionTipos: string[];
  tegumentos: TegumentosState;
  invasivos: DeviceEntry[];
}

export interface PatientData {
  shift: ShiftType;
  date: string;
  exams: string;
  pendings: string;
}

export type TabType = 'datos' | 'ticks' | 'resultado';
