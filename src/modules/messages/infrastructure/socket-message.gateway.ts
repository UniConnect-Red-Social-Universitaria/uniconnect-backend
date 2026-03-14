import {
  GroupMessageRecord,
  MessageGateway,
  MessageRecord,
} from '../../../domain/contracts';
import { emitirMensajeGrupoTiempoReal, emitirMensajeTiempoReal } from '../../../lib/socket';

export class SocketMessageGateway implements MessageGateway {
  emitNewMessage(payload: MessageRecord) {
    emitirMensajeTiempoReal(payload);
  }

  emitNewGroupMessage(payload: GroupMessageRecord) {
    emitirMensajeGrupoTiempoReal(payload);
  }
}