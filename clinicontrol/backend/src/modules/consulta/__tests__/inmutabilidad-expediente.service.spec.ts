import { InmutabilidadExpedienteService } from '../domain/services/inmutabilidad-expediente.service';
import {
  ExpedienteInmutableException,
  EnmiendaNoAutorizadaException,
} from '../domain/exceptions/expediente-inmutable.exception';

/**
 * Invariante del agregado ConsultaMedica.
 * Sustento: Ley N 3131 y R.M. 0090 (Norma Nacional para el Manejo del
 * Expediente Clinico). El registro asistencial admite correccion directa solo
 * dentro de la ventana de enmienda y unicamente por su autor.
 */
describe('InmutabilidadExpedienteService', () => {
  let politica: InmutabilidadExpedienteService;
  const AUTOR = 7;
  const OTRO_MEDICO = 9;

  const haceHoras = (h: number) => new Date(Date.now() - h * 3_600_000);

  beforeEach(() => {
    politica = new InmutabilidadExpedienteService();
  });

  describe('deteccion de contenido asistencial', () => {
    it('reconoce un cambio en un campo SOAP protegido', () => {
      expect(
        politica.afectaContenidoAsistencial({ evaluacion: 'Faringitis aguda' }),
      ).toBe(true);
    });

    it('ignora cambios que no tocan el registro asistencial', () => {
      expect(politica.afectaContenidoAsistencial({ temperatura: 37.4 })).toBe(
        false,
      );
    });
  });

  describe('ventana de enmienda', () => {
    it('admite la correccion del autor dentro de las 24 horas', () => {
      expect(() =>
        politica.verificarEnmienda({
          consultaId: 1,
          registradaEn: haceHoras(2),
          autorMedicoId: AUTOR,
          solicitanteMedicoId: AUTOR,
          cambios: { evaluacion: 'Faringitis estreptococica' },
        }),
      ).not.toThrow();
    });

    it('rechaza la correccion pasada la ventana', () => {
      expect(() =>
        politica.verificarEnmienda({
          consultaId: 2,
          registradaEn: haceHoras(30),
          autorMedicoId: AUTOR,
          solicitanteMedicoId: AUTOR,
          cambios: { evaluacion: 'Diagnostico reescrito' },
        }),
      ).toThrow(ExpedienteInmutableException);
    });

    it('el limite exacto de 24 horas ya es inmutable', () => {
      expect(() =>
        politica.verificarEnmienda({
          consultaId: 3,
          registradaEn: haceHoras(24),
          autorMedicoId: AUTOR,
          solicitanteMedicoId: AUTOR,
          cambios: { planTratamiento: 'Cambio tardio' },
        }),
      ).toThrow(ExpedienteInmutableException);
    });

    it('un cambio no asistencial sigue permitido pasada la ventana', () => {
      expect(() =>
        politica.verificarEnmienda({
          consultaId: 4,
          registradaEn: haceHoras(72),
          autorMedicoId: AUTOR,
          solicitanteMedicoId: AUTOR,
          cambios: { temperatura: 36.9 },
        }),
      ).not.toThrow();
    });
  });

  describe('autoria de la enmienda', () => {
    it('rechaza a un medico distinto del autor', () => {
      expect(() =>
        politica.verificarEnmienda({
          consultaId: 5,
          registradaEn: haceHoras(1),
          autorMedicoId: AUTOR,
          solicitanteMedicoId: OTRO_MEDICO,
          cambios: { evaluacion: 'Correccion de un tercero' },
        }),
      ).toThrow(EnmiendaNoAutorizadaException);
    });
  });

  describe('trazabilidad de la enmienda', () => {
    it('reporta el valor anterior y el nuevo de cada campo corregido', () => {
      const { antes, despues } = politica.diferencias(
        { evaluacion: 'Faringitis viral', planTratamiento: 'Reposo' },
        { evaluacion: 'Faringitis bacteriana' },
      );
      expect(antes).toEqual({ evaluacion: 'Faringitis viral' });
      expect(despues).toEqual({ evaluacion: 'Faringitis bacteriana' });
    });

    it('no reporta campos cuyo texto no cambio', () => {
      const { despues } = politica.diferencias(
        { evaluacion: 'Faringitis viral' },
        { evaluacion: 'Faringitis viral' },
      );
      expect(Object.keys(despues)).toHaveLength(0);
    });
  });
});
