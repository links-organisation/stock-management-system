export interface NetworkAddress {
    interfaceName: string;
    ip: string;
    url: string;
}

export interface NetworkInfo {
    enabled: boolean;
    https: boolean;
    certificateValid: boolean;
    port: number;
    addresses: NetworkAddress[];
}
