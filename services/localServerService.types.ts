export interface PeerInfo {
    id: string;
    type: 'PROFESSOR' | 'STUDENT' | 'COORDINATOR';
    name: string;
    connectedAt: number;
    lastSeen: number;
}

export interface SignedMeshToken {
    studentId: string;
    tabletId: string;
    eventId: string;
    role: 'STUDENT' | 'PROFESSOR' | 'COORDINATOR';
    jti: string; // Unique Token Identifier para anti-replay
    timestamp: number;
    signature: string;
}
