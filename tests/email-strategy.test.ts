import { EmailInstitucionalStrategy } from '../src/modules/notifications/infrastructure/strategies/EmailInstitucionalStrategy';
import { NotificacionDTO } from '../src/shared/notificacion';

describe('EmailInstitucionalStrategy', () => {
  let strategy: EmailInstitucionalStrategy;
  let mockTransporter: any;
  let mockUsuarioRepository: any;

  beforeEach(() => {
    // 1. Mockeamos Nodemailer (simulamos que envía bien)
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id-123' }),
    };

    // 2. Mockeamos el repositorio (simulamos que encuentra un correo)
    mockUsuarioRepository = {
      obtenerEmailPorId: jest.fn().mockResolvedValue('jackeline.rivera23296@ucaldas.edu.co'),
    };

    // 3. Instanciamos la estrategia con los mocks
    strategy = new EmailInstitucionalStrategy(mockTransporter, mockUsuarioRepository);
  });

  it('debería enviar un correo exitosamente si el usuario tiene email', async () => {
    // Arrange
    const notificacion: NotificacionDTO = {
      destinatario: 'usr_123',
      mensaje: 'Test de prueba unitaria',
      timestamp: new Date(),
    };

    // Act
    const resultado = await strategy.enviar(notificacion);

    // Assert
    expect(mockUsuarioRepository.obtenerEmailPorId).toHaveBeenCalledWith('usr_123');
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jackeline.rivera23296@ucaldas.edu.co',
        text: 'Test de prueba unitaria',
      })
    );
    expect(resultado).toEqual({ canal: 'email', exito: true });
  });

  it('debería fallar si el usuario no tiene email registrado', async () => {
    // Arrange
    mockUsuarioRepository.obtenerEmailPorId.mockResolvedValueOnce(null);
    const notificacion: NotificacionDTO = {
      destinatario: 'usr_404',
      mensaje: 'Este no debe llegar',
      timestamp: new Date(),
    };

    // Act & Assert
    await expect(strategy.enviar(notificacion)).rejects.toThrow(
      'Usuario usr_404 no tiene un email registrado'
    );
    expect(mockTransporter.sendMail).not.toHaveBeenCalled();
  });
});