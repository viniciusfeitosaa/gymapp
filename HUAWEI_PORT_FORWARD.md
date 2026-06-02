# 🔧 Port Forwarding — Roteador Huawei

Seu Mac Mini: **192.168.18.142**  
Gateway (roteador): **192.168.18.1**  
IP público: **201.148.122.166**

---

## Passo 1 — Acessar o roteador

1. Conecte na Wi‑Fi de casa
2. Abra o browser: **http://192.168.18.1**
3. Login/senha — geralmente está na **etiqueta** do roteador (Vivo/Claro/TIM/Oi costumam mudar)

> Se não abrir, tente: `http://192.168.1.1` ou veja o gateway em **Ajustes → Wi‑Fi → Detalhes → Roteador**

---

## Passo 2 — Encontrar Port Forwarding

O nome varia por modelo. Procure em:

| Onde procurar | Nomes comuns |
|---------------|--------------|
| Menu principal | **NAT**, **Encaminhamento de porta**, **Mapeamento de porta** |
| Avançado | **Virtual Server**, **Port Mapping**, **Port Forwarding** |
| Segurança | **NAT → DMZ / Port Mapping** |

### Modelos Huawei comuns no Brasil

**HG8245 / HG8546 (fibra da operadora):**
```
Avançado → NAT → Mapeamento de porta (Port Mapping)
```

**Huawei WiFi AX3 / AX2:**
```
Mais funções → Configurações de segurança → NAT → Encaminhamento de porta
```

**Huawei HG532e / HG531 (ADSL):**
```
Avançado → NAT → Servidor virtual
```

---

## Passo 3 — Criar 3 regras

Crie **uma regra para cada porta**:

### Regra 1 — HTTP
| Campo | Valor |
|-------|-------|
| Nome | `gymapp-http` |
| Protocolo | **TCP** |
| Porta externa (WAN) | **80** |
| Porta interna (LAN) | **80** |
| IP interno / Host | **192.168.18.142** |
| Status | Ativado ✅ |

### Regra 2 — HTTPS
| Campo | Valor |
|-------|-------|
| Nome | `gymapp-https` |
| Protocolo | **TCP** |
| Porta externa | **443** |
| Porta interna | **443** |
| IP interno | **192.168.18.142** |
| Status | Ativado ✅ |

### Regra 3 — HTTP/3 (opcional)
| Campo | Valor |
|-------|-------|
| Nome | `gymapp-quic` |
| Protocolo | **UDP** |
| Porta externa | **443** |
| Porta interna | **443** |
| IP interno | **192.168.18.142** |
| Status | Ativado ✅ |

**Salve** e reinicie o roteador se pedir.

---

## Passo 4 — IP fixo do Mac Mini (importante)

Se o Mac mudar de IP (ex: 192.168.18.143), o forwarding para de funcionar.

**No roteador (DHCP estático / Reserva de IP):**
- MAC do Mac Mini → sempre **192.168.18.142**

**No Mac:**
- Ajustes → Wi‑Fi → Detalhes → TCP/IP → **Usar endereço IP DHCP manual**
- IP: `192.168.18.142`
- Máscara: `255.255.255.0`
- Roteador: `192.168.18.1`

---

## Passo 5 — Firewall do Mac

Ajustes do Sistema → **Rede** → **Firewall**:

- Se estiver **ativado**, clique em **Opções** e permita conexões para **Docker** / **com.docker**
- Ou desative **temporariamente** só para testar

---

## Passo 6 — Testar

### No Mac (app local):
```bash
cd ~/gymapp
make health-lan
```

### Da internet (celular no 4G, Wi‑Fi desligado):
```
http://mygymcode.com
```

### Script de teste externo:
```bash
~/gymapp/scripts/test-external-access.sh
```

Ou use: https://www.yougetsignal.com/tools/open-ports/
- IP: `201.148.122.166`
- Porta: `80` e `443`

---

## Passo 7 — HTTPS automático

Quando a porta **80** abrir na internet, o Caddy obtém certificado Let's Encrypt sozinho.

```bash
cd ~/gymapp
docker compose -f docker-compose.prod.yml restart caddy
docker compose -f docker-compose.prod.yml logs caddy -f
```

Aguarde 2–5 min → https://mygymcode.com

---

## Problemas comuns (Huawei + operadora)

### Porta 80 bloqueada pela operadora
Algumas ISPs brasileiras bloqueiam porta 80 residencial. Teste com yougetsignal.
- **Solução:** usar porta alternativa (8080) ou Cloudflare Tunnel depois

### Modo Bridge / ONT duplo
Se tiver **dois roteadores** (ONT da operadora + Huawei Wi‑Fi), o forwarding precisa estar no que recebe o IP público, ou configure **bridge** no ONT.

### CGNAT (IP compartilhado)
Se `ifconfig.me` mostrar IP diferente do DNS, ou yougetsignal nunca abrir:
- IP no painel da operadora ≠ IP real na internet
- **Solução:** pedir IP fixo à operadora ou usar Tunnel

### DMZ (último recurso — menos seguro)
Encaminhar **todo** tráfego para `192.168.18.142`:
```
NAT → DMZ → 192.168.18.142
```
Use só para testar se o forwarding específico não funciona.

---

## Checklist

- [ ] 3 regras criadas (80 TCP, 443 TCP, 443 UDP)
- [ ] IP interno = 192.168.18.142
- [ ] Mac com IP fixo .142
- [ ] Firewall Mac ok
- [ ] Teste 4G: http://mygymcode.com abre
- [ ] Caddy logs sem "Timeout during connect"

---

## Rollback

Apague as regras no roteador. O app continua em http://192.168.18.142 na rede local.
