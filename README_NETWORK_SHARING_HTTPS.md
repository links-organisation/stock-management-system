# Mise en place du partage réseau + HTTPS local

Ce document décrit les changements à appliquer à l'application **Spring Boot + Angular/PWA** afin de permettre :

1. de rendre l'application accessible depuis les appareils du réseau local ;
2. d'ajouter dans le client Angular un vrai bouton **Activer le partage**, avec affichage de l'URL et génération d'un QR Code ;
3. d'ajouter HTTPS local avec génération et gestion d'un certificat.

---

# 1. Objectif et architecture

L'application est distribuée sous forme de JAR sur Windows.

L'objectif final est d'obtenir deux modes d'accès :

```text
PC local
    |
    +--> http://localhost:8080
    |
    +--> HTTPS réseau local
             |
             +--> https://192.168.x.x:8443
             |
             +--> autres appareils du même réseau
```

Architecture cible :

```text
┌──────────────────────────────────────────────────────────────┐
│                         PC Windows                           │
│                                                              │
│  Spring Boot                                                 │
│      │                                                       │
│      ├── HTTP / localhost                                    │
│      │      └── :8080                                        │
│      │                                                       │
│      ├── HTTPS / réseau local                                │
│      │      └── :8443                                        │
│      │                                                       │
│      ├── NetworkController                                   │
│      │                                                       │
│      └── NetworkSharingService                               │
│              ├── détection IP LAN                            │
│              ├── statut du partage                           │
│              ├── certificat                                  │
│              └── URLs réseau                                 │
│                                                              │
│  Windows Firewall                                            │
│      └── autoriser TCP 8443                                  │
└─────────────────────────────┬────────────────────────────────┘
                              │
                        Wi-Fi / Ethernet
                              │
              ┌───────────────┴───────────────┐
              │                               │
           Smartphone                       PC client
              │                               │
              └──── https://IP:8443 ──────────┘
```

---

# 2. Point important : ne pas considérer le bouton Angular comme un changement de bind

Spring Boot ne doit pas démarrer uniquement sur `127.0.0.1` puis essayer de modifier dynamiquement `server.address` lorsque l'utilisateur clique sur le bouton.

Le serveur doit être capable d'écouter sur le réseau dès son démarrage.

Le bouton **Activer le partage** doit plutôt :

- demander au backend les informations réseau ;
- vérifier que le serveur HTTPS est disponible ;
- afficher les adresses LAN ;
- afficher le QR Code ;
- éventuellement déclencher/configurer la règle firewall si cette fonctionnalité est implémentée ;
- afficher clairement l'état du partage.

---

# 3. Configuration Spring Boot

## 3.1. Adresse d'écoute

Le serveur doit écouter sur toutes les interfaces :

```yaml
server:
  address: 0.0.0.0
```

Pour HTTPS :

```yaml
server:
  address: 0.0.0.0
  port: 8443

  ssl:
    enabled: true
    key-store: ${SSL_KEYSTORE_PATH}
    key-store-type: PKCS12
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
    key-alias: springboot
```

La configuration exacte du keystore sera détaillée dans la partie HTTPS.

---

# 5. DTO `NetworkAddress`

Créer :

```java

public record NetworkAddress(
        String interfaceName,
        String ip,
        String url
) {
}
```

Exemple :

```json
{
  "interfaceName": "Wi-Fi",
  "ip": "192.168.1.15",
  "url": "https://192.168.1.15:8443"
}
```

---

# 6. DTO `NetworkInfo`

Créer :

```java
public record NetworkInfo(
        boolean enabled,
        boolean https,
        int port,
        List<NetworkAddress> addresses
) {
}
```

Exemple de réponse :

```json
{
  "enabled": true,
  "https": true,
  "port": 8443,
  "addresses": [
    {
      "interfaceName": "Wi-Fi",
      "ip": "192.168.1.15",
      "url": "https://192.168.1.15:8443"
    }
  ]
}
```

---

# 7. Créer `NetworkSharingService`

Le service doit :

- parcourir les interfaces réseau ;
- ignorer les interfaces loopback ;
- ignorer les interfaces virtuelles ;
- récupérer les adresses IPv4 ;
- construire les URLs HTTPS ;
- retourner toutes les adresses pertinentes.

Exemple de base :

```java
@Service
@RequiredArgsConstructor
public class NetworkSharingService {

    @Value("${server.port:8443}")
    private int serverPort;

    public NetworkInfo getNetworkInfo() {

        List<NetworkAddress> addresses = new ArrayList<>();

        try {
            Enumeration<NetworkInterface> interfaces =
                    NetworkInterface.getNetworkInterfaces();

            while (interfaces.hasMoreElements()) {

                NetworkInterface networkInterface =
                        interfaces.nextElement();

                if (!isValidInterface(networkInterface)) {
                    continue;
                }

                Enumeration<InetAddress> inetAddresses =
                        networkInterface.getInetAddresses();

                while (inetAddresses.hasMoreElements()) {

                    InetAddress address =
                            inetAddresses.nextElement();

                    if (!(address instanceof Inet4Address)) {
                        continue;
                    }

                    if (address.isLoopbackAddress()) {
                        continue;
                    }

                    String ip = address.getHostAddress();

                    String url =
                            "https://" + ip + ":" + serverPort;

                    addresses.add(
                            new NetworkAddress(
                                    networkInterface.getDisplayName(),
                                    ip,
                                    url
                            )
                    );
                }
            }

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Impossible de récupérer les interfaces réseau",
                    e
            );
        }

        return new NetworkInfo(
                !addresses.isEmpty(),
                true,
                serverPort,
                addresses
        );
    }

    private boolean isValidInterface(
            NetworkInterface networkInterface) {

        try {
            return networkInterface.isUp()
                    && !networkInterface.isLoopback()
                    && !networkInterface.isVirtual();

        } catch (Exception e) {
            return false;
        }
    }
}
```

## Amélioration recommandée

Dans la version finale, il faudra éventuellement filtrer :

- VPN ;
- Docker ;
- VirtualBox ;
- Hyper-V ;
- interfaces sans route LAN.

Le service ne doit pas afficher aveuglément toutes les interfaces présentes sur Windows.

---

# 8. Créer `NetworkController`

```java
@RestController
@RequestMapping("/api/v1/network")
@RequiredArgsConstructor
public class NetworkController {

    private final NetworkSharingService networkSharingService;

    @GetMapping("/info")
    public NetworkInfo getNetworkInfo() {
        return networkSharingService.getNetworkInfo();
    }
}
```

Endpoint :

```text
GET /api/v1/network/info
```

---

# 9. Prévoir un endpoint de statut

Ajouter :

```text
GET /api/v1/network/status
```

Il pourra retourner par exemple :

```json
{
  "serverRunning": true,
  "networkAvailable": true,
  "httpsEnabled": true,
  "certificateValid": true,
  "firewallConfigured": true
}
```

Cela permettra au client Angular de distinguer :

```text
Serveur démarré
        ↓
HTTPS disponible
        ↓
Interface réseau disponible
        ↓
Firewall autorisé
        ↓
Partage réellement utilisable
```

---

# 10. HTTPS local

## 10.1. Ne pas mettre le certificat directement dans Git

Ne pas faire :

```text
src/main/resources/
└── keystore.p12
```

avec un certificat privé permanent.

Le certificat et la clé privée sont des données sensibles.

Pour l'application distribuée sous forme de JAR, utiliser plutôt un répertoire de données utilisateur :

```text
%LOCALAPPDATA%\SchoolManagement\
```

Exemple :

```text
%LOCALAPPDATA%\SchoolManagement\
├── certificates\
│   ├── rootCA.pem
│   ├── server-cert.pem
│   ├── server-key.pem
│   └── keystore.p12
│
└── config\
    └── network.properties
```

---

# 11. Génération automatique des certificats

Au premier démarrage :

```text
JAR
 |
 |-- certificats présents ?
 |        |
 |        +-- OUI --> vérifier leur validité
 |        |
 |        +-- NON --> générer
 |
 +--> démarrer HTTPS
```

Le système doit être capable de :

1. créer une CA locale ;
2. générer un certificat serveur ;
3. inclure les IP LAN dans les SAN ;
4. créer le keystore PKCS12 ;
5. conserver les fichiers dans `%LOCALAPPDATA%`;
6. réutiliser les certificats tant qu'ils restent valides.

---

# 12. Subject Alternative Names

Le certificat doit contenir au minimum :

```text
DNS:localhost
IP:127.0.0.1
```

et les IP LAN détectées :

```text
IP:192.168.1.15
IP:192.168.1.20
```

Exemple :

```text
Subject Alternative Name:
    DNS:localhost
    IP Address:127.0.0.1
    IP Address:192.168.1.15
```

C'est indispensable pour que le certificat corresponde à l'adresse utilisée par le navigateur.

---

# 13. Changement d'adresse IP

L'adresse IP d'un PC peut changer.

Exemple :

```text
Jour 1:
192.168.1.15

Jour 2:
192.168.1.23
```

Le service doit donc vérifier si le certificat contient toujours les IP actuelles.

Si ce n'est plus le cas :

```text
IP changée
    ↓
SAN du certificat obsolète
    ↓
régénérer le certificat serveur
    ↓
recréer le keystore
    ↓
redémarrer/reconfigurer HTTPS
```

---

# 14. CA locale

Il est préférable d'avoir :

```text
Root CA
   |
   └── Server Certificate
```

plutôt qu'un certificat serveur auto-signé indépendant.

Structure :

```text
Local Root CA
      |
      └── School Management Server
                |
                ├── localhost
                ├── 127.0.0.1
                └── 192.168.1.15
```

La CA devra être installée comme autorité de confiance sur les appareils clients si l'on veut supprimer les avertissements HTTPS.

---

# 15. Attention aux appareils clients

Créer un certificat local ne signifie pas automatiquement que les smartphones et autres PC lui feront confiance.

Il faut prévoir dans l'application :

```text
Télécharger le certificat CA
```

Endpoint possible :

```text
GET /api/v1/network/certificate
```

Le frontend pourra afficher :

```text
Pour utiliser HTTPS sans avertissement :

1. Télécharger le certificat CA
2. Installer le certificat sur l'appareil
3. Revenir dans l'application
```

L'installation dépendra du système :

- Windows ;
- Android ;
- iOS ;
- Linux.

L'application ne doit pas essayer d'installer silencieusement un certificat racine sur un appareil client.

---

# 16. Service Angular

Créer :

```text
src/app/core/services/network-sharing.service.ts
```

Interfaces :

```typescript
export interface NetworkAddress {
  interfaceName: string;
  ip: string;
  url: string;
}

export interface NetworkInfo {
  enabled: boolean;
  https: boolean;
  port: number;
  addresses: NetworkAddress[];
}
```

Service :

```typescript
@Injectable({
  providedIn: 'root'
})
export class NetworkSharingService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/v1/network';

  getNetworkInfo(): Observable<NetworkInfo> {
    return this.http.get<NetworkInfo>(
      `${this.apiUrl}/info`
    );
  }
}
```

---

# 17. Composant Angular

Créer :

```text
src/app/features/network-sharing/
├── network-sharing.component.ts
├── network-sharing.component.html
└── network-sharing.component.scss
```

Le composant doit gérer au minimum :

```typescript
networkInfo?: NetworkInfo;

sharing = false;
loading = false;
error?: string;
```

Activation :

```typescript
enableNetworkSharing(): void {

  this.loading = true;
  this.error = undefined;

  this.networkSharingService
    .getNetworkInfo()
    .subscribe({
      next: info => {
        this.networkInfo = info;
        this.sharing = info.enabled;
        this.loading = false;
      },

      error: error => {
        console.error(error);

        this.error =
          'Impossible d’activer le partage réseau.';

        this.loading = false;
      }
    });
}
```

---

# 18. Vrai bouton « Activer le partage »

L'interface doit présenter clairement l'état.

Avant activation :

```text
┌───────────────────────────────────┐
│ 🌐 Partage réseau                 │
│                                   │
│ L'application est actuellement    │
│ accessible uniquement localement. │
│                                   │
│       [ Activer le partage ]      │
└───────────────────────────────────┘
```

Après activation :

```text
┌──────────────────────────────────────┐
│ 🟢 Partage réseau actif              │
│                                      │
│ HTTPS sécurisé                       │
│                                      │
│ Wi-Fi                                │
│ https://192.168.1.15:8443            │
│                                      │
│ [ Copier ] [ QR Code ]              │
│                                      │
│ [ Télécharger le certificat ]        │
└──────────────────────────────────────┘
```

---

# 19. QR Code

Ajouter une bibliothèque Angular de génération de QR Code.

Le contenu du QR Code doit être exactement l'URL :

```text
https://192.168.1.15:8443
```

Exemple :

```html
<qrcode
    [qrdata]="selectedUrl"
    [width]="220"
    [errorCorrectionLevel]="'M'">
</qrcode>
```

Le composant doit permettre de choisir l'URL si plusieurs interfaces sont détectées.

Exemple :

```text
Wi-Fi
https://192.168.1.15:8443

Ethernet
https://192.168.1.20:8443
```

---

# 20. Copier l'URL

Ajouter :

```typescript
copyUrl(url: string): void {
  navigator.clipboard.writeText(url);
}
```

Prévoir un feedback utilisateur :

```text
✓ URL copiée
```

---

# 21. Sélection de l'interface réseau

Si plusieurs interfaces sont disponibles :

```text
┌────────────────────────────────────────┐
│ Adresse réseau                         │
│                                        │
│ ○ Wi-Fi     192.168.1.15              │
│ ● Ethernet  192.168.1.20              │
│                                        │
│ URL :                                  │
│ https://192.168.1.20:8443              │
│                                        │
│             [ QR Code ]                │
└────────────────────────────────────────┘
```

Le QR Code doit être généré pour l'adresse sélectionnée.

---

# 22. Windows Firewall

Même si Spring Boot écoute sur :

```text
0.0.0.0:8443
```

Windows Firewall peut empêcher les connexions entrantes.

Il faut donc prévoir une règle :

```text
TCP
Port : 8443
Direction : Inbound
Action : Allow
```

Exemple PowerShell :

```powershell
New-NetFirewallRule `
    -DisplayName "School Management HTTPS" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 8443 `
    -Action Allow
```

Cette commande nécessite généralement des privilèges administrateur.

---

# 23. Ne pas demander silencieusement les privilèges administrateur

Le JAR ne doit pas lancer silencieusement PowerShell en administrateur.

Prévoir plutôt :

```text
Partage réseau
      |
      +--> serveur HTTPS OK
      |
      +--> firewall bloqué
                |
                └── afficher :
                    "Windows Firewall bloque probablement
                     les connexions réseau."

                    [ Configurer le pare-feu ]
```

L'action doit être explicite.

---

# 24. Détection de l'état du Firewall

Prévoir idéalement un statut :

```json
{
  "serverRunning": true,
  "httpsEnabled": true,
  "networkAvailable": true,
  "firewallConfigured": false
}
```

L'interface peut alors afficher :

```text
🟢 HTTPS              OK
🟢 Interface réseau   OK
🔴 Firewall           À configurer
```

---

# 25. API backend finale

Le module réseau devrait exposer :

```text
GET /api/v1/network/info
```

Retourne les IP et URLs.

```text
GET /api/v1/network/status
```

Retourne l'état du partage.

```text
GET /api/v1/network/certificate
```

Permet de télécharger la CA publique.

Éventuellement :

```text
POST /api/v1/network/enable
```

pour déclencher une procédure d'activation côté serveur si nécessaire.

Et :

```text
POST /api/v1/network/disable
```

si un véritable mode désactivation est implémenté.

---

# 26. Sécurité des endpoints

Les endpoints réseau ne doivent pas exposer :

- la clé privée ;
- le mot de passe du keystore ;
- des informations système inutiles ;
- des chemins locaux sensibles.

Le endpoint certificat doit retourner uniquement :

```text
rootCA.pem
```

et jamais :

```text
server-key.pem
```

ou :

```text
keystore.p12
```

---

# 27. PWA : point important

`localhost` bénéficie de règles particulières dans les navigateurs.

En revanche :

```text
http://192.168.1.15:8080
```

n'est pas équivalent à :

```text
https://192.168.1.15:8443
```

Pour une utilisation PWA complète sur le réseau local, utiliser HTTPS.

Architecture recommandée :

```text
Développement/local
        ↓
http://localhost:8080

Réseau local
        ↓
https://192.168.x.x:8443
```

---

# 28. Gestion du certificat au démarrage

Le démarrage final du JAR devrait suivre cette logique :

```text
Application démarre
        │
        ▼
Détecter les interfaces réseau
        │
        ▼
Déterminer les IP LAN
        │
        ▼
Chercher CA locale
        │
        ├── absente ──────► générer CA
        │
        ▼
Chercher certificat serveur
        │
        ├── absent ───────► générer certificat
        │
        ▼
Vérifier SAN
        │
        ├── IP différente ─► régénérer
        │
        ▼
Créer/vérifier PKCS12
        │
        ▼
Démarrer HTTPS
        │
        ▼
Application disponible
```

---

# 29. Gestion du changement de réseau

Exemple :

```text
Connexion Wi-Fi
192.168.1.15
```

Puis l'utilisateur change de réseau :

```text
192.168.10.25
```

Le système doit détecter :

```text
Certificat actuel :
192.168.1.15

IP actuelle :
192.168.10.25

→ certificat à régénérer
```

L'interface doit ensuite afficher la nouvelle URL :

```text
https://192.168.10.25:8443
```

---

# 30. Tests backend à prévoir

Créer des tests unitaires pour :

```text
NetworkSharingService
```

Cas à tester :

- interface loopback ignorée ;
- interface virtuelle ignorée ;
- IPv6 ignorée si on ne la supporte pas ;
- IPv4 détectée ;
- URL HTTPS correctement construite ;
- absence d'interface ;
- plusieurs interfaces ;
- changement d'adresse IP.

Tester également :

```text
NetworkController
```

avec MockMvc.

---

# 31. Tests Angular

Tester :

- clic sur « Activer le partage » ;
- appel à `/api/v1/network/info` ;
- affichage de l'URL ;
- affichage du QR Code ;
- copie de l'URL ;
- gestion des erreurs ;
- plusieurs interfaces ;
- téléchargement du certificat.

---

# 32. Scénario utilisateur final

Le scénario cible doit être :

```text
1. L'utilisateur double-clique sur le JAR.

2. Spring Boot démarre.

3. Le navigateur ouvre :
   http://localhost:8080

4. L'utilisateur ouvre :
   Paramètres → Réseau

5. Il voit :

   🔴 Partage réseau désactivé

6. Il clique :

   [ Activer le partage ]

7. Le backend détecte :

   Wi-Fi : 192.168.1.15

8. HTTPS est disponible :

   https://192.168.1.15:8443

9. Angular affiche :

   🟢 Partage réseau actif

10. L'utilisateur peut :

    [ Copier le lien ]
    [ Afficher le QR Code ]
    [ Télécharger le certificat ]

11. Le smartphone scanne le QR Code.

12. Le smartphone ouvre :

    https://192.168.1.15:8443

13. L'application Angular/PWA est accessible.
```

---

# 33. Structure finale recommandée

Backend :

```text
src/main/java/org/school/management/

├── network/
│   ├── NetworkController.java
│   ├── NetworkSharingService.java
│   │
│   ├── dto/
│   │   ├── NetworkInfo.java
│   │   └── NetworkAddress.java
│   │
│   └── certificate/
│       ├── CertificateService.java
│       ├── CertificateGenerator.java
│       └── KeystoreService.java
│
└── ...
```

Frontend :

```text
src/app/

├── core/
│   └── services/
│       └── network-sharing.service.ts
│
└── features/
    └── network-sharing/
        ├── network-sharing.component.ts
        ├── network-sharing.component.html
        └── network-sharing.component.scss
```

Données locales Windows :

```text
%LOCALAPPDATA%\SchoolManagement\

├── certificates/
│   ├── rootCA.pem
│   ├── server-cert.pem
│   ├── server-key.pem
│   └── keystore.p12
│
└── config/
    └── network.properties
```

---

# 34. Ordre d'implémentation

Ne pas implémenter tout en même temps.

## Phase 1 — réseau

1. `NetworkSharingService`
2. `NetworkController`
3. `NetworkInfo`
4. détection IPv4
5. `server.address=0.0.0.0`
6. test depuis un autre PC/téléphone

---

## Phase 2 — interface Angular

1. `NetworkSharingService`
2. `NetworkSharingComponent`
3. bouton « Activer le partage »
4. affichage des IP
5. affichage des URLs
6. copie de l'URL

---

## Phase 3 — QR Code

1. installer la librairie QR Code ;
2. afficher le QR Code ;
3. gérer plusieurs interfaces ;
4. permettre de sélectionner l'adresse.

---

## Phase 4 — HTTPS

1. créer `CertificateService` ;
2. générer la CA ;
3. générer le certificat serveur ;
4. générer le PKCS12 ;
5. configurer Spring Boot SSL ;
6. vérifier les SAN ;
7. gérer le renouvellement/régénération.

---

## Phase 5 — Windows

1. détecter l'état du firewall ;
2. proposer une action de configuration ;
3. ouvrir TCP `8443` ;
4. afficher clairement l'état.

---

## Phase 6 — PWA

1. tester le Service Worker sur HTTPS LAN ;
2. tester l'installation PWA ;
3. tester le cache ;
4. tester les API ;
5. tester le téléphone Android ;
6. tester plusieurs clients simultanés.

---

# 35. Résultat attendu

À la fin, l'application doit permettre :

```text
┌──────────────────────────────────────────────┐
│             SCHOOL MANAGEMENT                │
├──────────────────────────────────────────────┤
│                                              │
│ 🌐 Partage réseau                            │
│                                              │
│ 🟢 ACTIVÉ                                    │
│                                              │
│ HTTPS                                        │
│                                              │
│ Wi-Fi                                        │
│ https://192.168.1.15:8443                   │
│                                              │
│ [ 📋 Copier ]                                │
│ [ 📱 Afficher QR Code ]                     │
│                                              │
│ ───────────────────────────────────────────  │
│                                              │
│ 🔐 Certificat                                │
│                                              │
│ Ce réseau utilise un certificat local.      │
│                                              │
│ [ Télécharger le certificat ]                │
│                                              │
│ ───────────────────────────────────────────  │
│                                              │
│ 🟢 Serveur HTTPS       OK                    │
│ 🟢 Réseau              OK                    │
│ 🟢 Certificat          OK                    │
│ 🟢 Pare-feu            OK                    │
│                                              │
└──────────────────────────────────────────────┘
```

---

# 36. Point de vigilance final

Le point le plus délicat techniquement est le **cycle de vie du certificat HTTPS**.

Il ne faut pas simplement créer une fois :

```text
keystore.p12
```

avec une IP fixe.

Pour une application destinée à être utilisée sur différents réseaux, le système doit gérer :

```text
Wi-Fi A
192.168.1.15
       ↓
Wi-Fi B
192.168.10.25
       ↓
Ethernet
192.168.0.50
```

Le certificat doit rester cohérent avec les adresses utilisées.

La solution cible est donc :

```text
Détection réseau
       ↓
Détection IP
       ↓
Certification locale
       ↓
SAN = IP actuelles
       ↓
PKCS12
       ↓
Spring Boot HTTPS
       ↓
Angular
       ↓
URL + QR Code
```

Cette architecture doit être considérée comme la base de l'implémentation finale.
