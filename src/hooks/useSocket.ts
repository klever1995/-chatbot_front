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

  // Función para suscribirse al evento nueva_venta
  const onNuevaVenta = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('nueva_venta', callback);
      return () => {
        socket.off('nueva_venta', callback);
      };
    }
    return () => {};
  };

  return {
    socket,
    isConnected,
    joinEmpresa,
    onNuevaVenta,
  };
};