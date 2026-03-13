import { MessageGateway, MessageRecord } from '../../../domain/contracts';
import { emitirMensajeTiempoReal } from '../../../lib/socket';

export class SocketMessageGateway implements MessageGateway {
  emitNewMessage(payload: MessageRecord) {
    emitirMensajeTiempoReal(payload);
  }
}