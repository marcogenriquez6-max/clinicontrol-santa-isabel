export interface Medicamento {
  id?: number;
  nombre: string;
  presentacion?: string;
  concentracion?: string;
}

export interface Receta {
  id?: number;
  consultaId: number;
  consulta?: import('./consulta.types').Consulta;
  instrucciones?: string;
  estado?: string;
  createdAt?: string;
  items?: RecetaMedicamento[];
}

export interface RecetaMedicamento {
  id?: number;
  recetaId: number;
  medicamentoId: number;
  medicamento?: Medicamento;
  dosis: string;
  frecuencia: string;
  duracion?: string;
  observaciones?: string;
  cantidad?: number;
  cantidadDispensada?: number;
}
