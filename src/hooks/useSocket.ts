import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Conectar al servidor Socket.IO con header para ngrok
    const socketInstance = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      transportOptions: {
        polling: {
          extraHeaders: {
            'ngrok-skip-browser-warning': 'true'  // 🔥 Necesario para ngrok
          }
        }
      }
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Conectado al WebSocket');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Desconectado del WebSocket');
      setIsConnected(false);
    });

    socketInstance.on('conexion_exitosa', (data) => {
      console.log('✅', data.message);
    });

    setSocket(socketInstance);

    // Limpiar al desmontar
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Función para unirse a una sala específica por empresa
  const joinEmpresa = (empresaId: number) => {
    if (socket && isConnected) {
      socket.emit('join_empresa', empresaId);
      console.log(`📌 Unido a sala empresa_${empresaId}`);
    }
  };

  // ==============================================
  // EVENTOS PARA VENTAS (producto único)
  // ==============================================
  const onNuevaVenta = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('nueva_venta', callback);
      return () => {
        socket.off('nueva_venta', callback);
      };
    }
    return () => {};
  };

  // ==============================================
  // EVENTOS PARA PEDIDOS (pedido múltiple)
  // ==============================================
  const onNuevoPedido = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('nuevo_pedido', callback);
      return () => {
        socket.off('nuevo_pedido', callback);
      };
    }
    return () => {};
  };

  const onPedidoActualizado = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('pedido_actualizado', callback);
      return () => {
        socket.off('pedido_actualizado', callback);
      };
    }
    return () => {};
  };

  return {
    socket,
    isConnected,
    joinEmpresa,
    onNuevaVenta,
    onNuevoPedido,        // 🔥 NUEVO
    onPedidoActualizado,  // 🔥 NUEVO
  };
};