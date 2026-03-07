/**
 * Bluetooth Mesh Service (Driver Abstraction)
 * 
 * Este serviço abstrai a comunicação P2P via Bluetooth Low Energy (BLE).
 * Na Fase 6, fornece a interface para descoberta de pares próximos e troca de pacotes
 * de telemetria/resgate de provas sem necessidade de Wi-Fi.
 */

export interface MeshPeer {
    id: string;
    name: string;
    rssi: number; // Signal strength
    lastSeen: number;
    role: 'PROFESSOR' | 'STUDENT' | 'COORDINATOR';
}

export interface MeshPacket {
    from: string;
    to?: string; // Broadcast se fôr null
    type: 'TELEMETRY' | 'PROCTOR_SIGNAL' | 'RESUBMIT_REQUEST' | 'HANDSHAKE';
    payload: any;
    timestamp: number;
}

class BluetoothMeshService {
    private isScanning = false;
    private peers: Map<string, MeshPeer> = new Map();
    private listeners: ((packet: MeshPacket) => void)[] = [];

    /**
     * Inicia a descoberta de dispositivos próximos
     */
    async startScanning() {
        if (this.isScanning) return;
        this.isScanning = true;
        
        console.log('📡 [Mesh] Iniciando varredura Bluetooth LE...');
        
        // Simulação de descoberta
        this.simulatePeerDiscovery();
    }

    private simulatePeerDiscovery() {
        if (!this.isScanning) return;

        // Adiciona peers fictícios para fins de demonstração da UI
        const mockPeers: MeshPeer[] = [
            { id: 'peer-1', name: 'Tablet Lab 01', rssi: -65, lastSeen: Date.now(), role: 'STUDENT' },
            { id: 'peer-2', name: 'Prof. Ricardo', rssi: -40, lastSeen: Date.now(), role: 'PROFESSOR' }
        ];

        mockPeers.forEach(p => this.peers.set(p.id, p));
        
        // Loop de simulação
        setTimeout(() => this.simulatePeerDiscovery(), 10000);
    }

    async stopScanning() {
        this.isScanning = false;
        console.log('⏹️ [Mesh] Varredura Bluetooth finalizada.');
    }

    /**
     * Envia um pacote para a malha
     */
    async broadcast(packet: Omit<MeshPacket, 'from' | 'timestamp'>) {
        const fullPacket: MeshPacket = {
            ...packet,
            from: 'LOCAL_DEVICE',
            timestamp: Date.now()
        };

        console.log(`📤 [Mesh] Broadcast: ${fullPacket.type}`, fullPacket.payload);
        
        // Em produção, aqui chamaríamos o driver do Capacitor para BLE Advertising
        // @capacitor-community/bluetooth-le :: requestDevice / connect / write
    }

    /**
     * Envia para um destinatário específico
     */
    async sendTo(peerId: string, packet: Omit<MeshPacket, 'from' | 'timestamp' | 'to'>) {
        const fullPacket: MeshPacket = {
            ...packet,
            to: peerId,
            from: 'LOCAL_DEVICE',
            timestamp: Date.now()
        };

        console.log(`📨 [Mesh] Direto para ${peerId}: ${fullPacket.type}`);
    }

    onPacket(callback: (packet: MeshPacket) => void) {
        this.listeners.push(callback);
    }

    getVisiblePeers(): MeshPeer[] {
        return Array.from(this.peers.values());
    }
}

export const meshService = new BluetoothMeshService();
