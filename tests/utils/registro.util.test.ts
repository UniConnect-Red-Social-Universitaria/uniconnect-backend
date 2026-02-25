describe('esCorreoInstitucional', () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.INSTITUTIONAL_EMAIL_DOMAINS;
  });

  it('usa el dominio por defecto cuando no hay variable de entorno', () => {
    const { esCorreoInstitucional } = require('../../src/utils/registro.util');

    expect(esCorreoInstitucional('estudiante@ucaldas.edu.co')).toBe(true);
    expect(esCorreoInstitucional('estudiante@gmail.com')).toBe(false);
  });

  it('acepta una lista de dominios desde INSTITUTIONAL_EMAIL_DOMAINS', () => {
    process.env.INSTITUTIONAL_EMAIL_DOMAINS = 'ucaldas.edu.co, otra.edu.co';
    const { esCorreoInstitucional } = require('../../src/utils/registro.util');

    expect(esCorreoInstitucional('persona@otra.edu.co')).toBe(true);
    expect(esCorreoInstitucional('persona@hotmail.com')).toBe(false);
  });
});
