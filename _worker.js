const FIXED_UUID = '64c6e2fe-e7a8-4118-b3bc-a1ecd5b9553a'; 
const SECRET_PATH = '/your-secret-path'; 


const API_ERROR_RESPONSE = (url, status = 404) => {
    const errorBody = {
        timestamp: new Date().toISOString(),
        status: status,
        error: status === 404 ? "Not Found" : "Unauthorized",
        message: `No static resource or API endpoint found for: ${url.pathname}`,
        path: url.pathname,
        requestId: Math.random().toString(36).substring(2, 15).toUpperCase(),
        service: "api-gateway-v2"
    };

    return new Response(JSON.stringify(errorBody), {
        status: status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
            'X-Frame-Options': 'DENY',
            'Server': 'nginx' 
        }
    });
};


let 反代IP = '', 启用ssty反代 = null, 启用ssty全局反代 = false, 我的ssty账号 = '', parsedSocks5Address = {};

export default {
    async fetch(request) {
        try {
            const url = new URL(request.url);

            
            if (url.pathname !== SECRET_PATH) {
                return API_ERROR_RESPONSE(url, 404);
            }

            
            const upgradeHeader = request.headers.get('Upgrade');
            if (upgradeHeader !== 'websocket') {
                return new Response(JSON.stringify({ 
                    status: "UP", 
                    version: "2.4.1-RELEASE",
                    uptime: Math.floor(Math.random() * 100000) + "s"
                }), {
                    status: 200,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Server': 'nginx'
                    }
                });
            }

            
            反代IP = 反代IP ? 反代IP : request.cf.colo + '.proxyIP.cmliuSSSS.NET';
            await 反代参数获取(request);
            const [反代IP地址, 反代IP端口] = await 解析地址端口(反代IP);

            return await handleSPESSWebSocket(request, {
                parsedSocks5Address,
                enableSocks: 启用ssty反代,
                enableGlobalSocks: 启用ssty全局反代,
                ProxyIP: 反代IP地址,
                ProxyPort: 反代IP端口
            });

        } catch (err) {
            
            return new Response(JSON.stringify({
                code: 500,
                error: "Internal Server Error",
                message: err.message || String(err)
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    },
};

/**
 * 后续所有 handleSPESSWebSocket, parseVLESSHeader, ppou5Connect 等函数保持不变
 * 直接粘贴你原始代码中这些函数的内容即可
 */

async function handleSPESSWebSocket(request, config) {
    const {
        parsedSocks5Address,
        enableSocks,
        enableGlobalSocks,
        ProxyIP,
        ProxyPort
    } = config;
    const ws配对 = new WebSocketPair();
    const [clientWS, serverWS] = Object.values(ws配对);

    serverWS.accept();

    
    let heartbeatInterval = setInterval(() => {
        if (serverWS.readyState === WS_READY_STATE_OPEN) {
            try {
                serverWS.send(new Uint8Array(0));
            } catch (e) { }
        }
    }, 30000);
    
    function clearHeartbeat() {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
    }
    serverWS.addEventListener('close', clearHeartbeat);
    serverWS.addEventListener('error', clearHeartbeat);

    const earlyDataHeader = request.headers.get('sec-websocket-protocol') || '';
    const wsReadable = createWebSocketReadableStream(serverWS, earlyDataHeader);
    let remoteSocket = null;
    let udpStreamWrite = null;
    let isDns = false;

    wsReadable.pipeTo(new WritableStream({
        async write(chunk) {
            if (isDns && udpStreamWrite) {
                return udpStreamWrite(chunk);
            }
            if (remoteSocket) {
                try {
                    const writer = remoteSocket.writable.getWriter();
                    await writer.write(chunk);
                    writer.releaseLock();
                } catch (err) {
                    closeSocket(remoteSocket);
                    throw err;
                }
                return;
            }
            
            const result = parseVLESSHeader(chunk);
            if (result.hasError) throw new Error(result.message);
            if (result.addressRemote.includes(atob('c3BlZWQuY2xvdWRmbGFyZS5jb20='))) throw new Error('Access');
            
            const vlessRespHeader = new Uint8Array([result.vlessVersion[0], 0]);
            const rawClientData = chunk.slice(result.rawDataIndex);
            
            if (result.isUDP) {
                if (result.portRemote === 53) {
                    isDns = true;
                    const { write } = await handleUDPOutBound(serverWS, vlessRespHeader);
                    udpStreamWrite = write;
                    udpStreamWrite(rawClientData);
                    return;
                } else {
                    throw new Error('UDP676仅支持DNS(端口53)');
                }
            }

            async function retry() {
                try {
                    let tcpSocket;
                    if (enableSocks === 'ppou5') {
                        tcpSocket = await ppou5Connect(result.addressType, result.addressRemote, result.portRemote, parsedSocks5Address);
                    } else if (enableSocks === 'http') {
                        tcpSocket = await httpConnect(result.addressType, result.addressRemote, result.portRemote, parsedSocks5Address);
                    } else {
                        tcpSocket = await connect({ hostname: ProxyIP, port: ProxyPort }, { allowHalfOpen: true });
                    }
                    remoteSocket = tcpSocket;
                    const writer = tcpSocket.writable.getWriter();
                    await writer.write(rawClientData);
                    writer.releaseLock();
                    tcpSocket.closed.catch(() => { }).finally(() => {
                        if (serverWS.readyState === WS_READY_STATE_OPEN) {
                            serverWS.close(1000, '连接已关闭');
                        }
                    });
                    pipeRemoteToWebSocket(tcpSocket, serverWS, vlessRespHeader, null);
                } catch (err) {
                    closeSocket(remoteSocket);
                    serverWS.close(1011, '676连接失败: ' + (err && err.message ? err.message : err));
                }
            }

            try {
                let tcpSocket;
                if (enableGlobalSocks) {
                    tcpSocket = await (enableSocks === 'ppou5' 
                        ? ppou5Connect(result.addressType, result.addressRemote, result.portRemote, parsedSocks5Address)
                        : httpConnect(result.addressType, result.addressRemote, result.portRemote, parsedSocks5Address));
                } else {
                    tcpSocket = await connect({ hostname: result.addressRemote, port: result.portRemote }, { allowHalfOpen: true });
                }
                remoteSocket = tcpSocket;
                const writer = tcpSocket.writable.getWriter();
                await writer.write(rawClientData);
                writer.releaseLock();
                pipeRemoteToWebSocket(tcpSocket, serverWS, vlessRespHeader, retry);
            } catch (err) {
                closeSocket(remoteSocket);
                serverWS.close(1011, '连接失败: ' + (err && err.message ? err.message : err));
            }
        },
        close() {
            if (remoteSocket) closeSocket(remoteSocket);
        }
    })).catch(err => {
        closeSocket(remoteSocket);
        serverWS.close(1011, '内部错误: ' + (err && err.message ? err.message : err));
    });

    return new Response(null, {
        status: 101,
        webSocket: clientWS,
    });
}

function createWebSocketReadableStream(ws, earlyDataHeader) {
    return new ReadableStream({
        start(controller) {
            ws.addEventListener('message', event => {
                controller.enqueue(event.data);
            });

            ws.addEventListener('close', () => {
                controller.close();
            });

            ws.addEventListener('error', err => {
                controller.error(err);
            });

            if (earlyDataHeader) {
                try {
                    const decoded = atob(earlyDataHeader.replace(/-/g, '+').replace(/_/g, '/'));
                    const data = Uint8Array.from(decoded, c => c.charCodeAt(0));
                    controller.enqueue(data.buffer);
                } catch (e) {
                }
            }
        }
    });
}


function parseVLESSHeader(buffer) {
    if (buffer.byteLength < 24) {
        return { hasError: true, message: '无效的头部长度' };
    }
    const view = new DataView(buffer);
    const version = new Uint8Array(buffer.slice(0, 1));
    const uuid = formatUUID(new Uint8Array(buffer.slice(1, 17)));
    if (FIXED_UUID && uuid !== FIXED_UUID) {
        return { hasError: true, message: '无效的用户' };
    }
    const optionsLength = view.getUint8(17);
    const command = view.getUint8(18 + optionsLength);
    let isUDP = false;
    if (command === 1) {
    } else if (command === 2) {
        isUDP = true;
    } else {
        return { hasError: true, message: '不支持的命令，仅支持TCP(01)和UDP(02)' };
    }
    let offset = 19 + optionsLength;
    const port = view.getUint16(offset);
    offset += 2;
    const addressType = view.getUint8(offset++);
    let address = '';
    switch (addressType) {
        case 1:
            address = Array.from(new Uint8Array(buffer.slice(offset, offset + 4))).join('.');
            offset += 4;
            break;
        case 2:
            const domainLength = view.getUint8(offset++);
            address = new TextDecoder().decode(buffer.slice(offset, offset + domainLength));
            offset += domainLength;
            break;
        case 3:
            const ipv6 = [];
            for (let i = 0; i < 8; i++) {
                ipv6.push(view.getUint16(offset).toString(16).padStart(4, '0'));
                offset += 2;
            }
            address = ipv6.join(':').replace(/(^|:)0+(\w)/g, '$1$2');
            break;
        default:
            return { hasError: true, message: '不支持的地址类型' };
    }
    return {
        hasError: false,
        addressRemote: address,
        portRemote: port,
        rawDataIndex: offset,
        vlessVersion: version,
        isUDP,
        addressType
    };
}

async function pipeRemoteToWebSocket(remoteSocket, ws, vlessHeader, retry = null, retryCount = 0) {
    const MAX_RETRIES = 8;                      
    const MAX_CHUNK_SIZE = 128 * 1024;              
    const MAX_BUFFER_SIZE = 2 * 1024 * 1024;           
    const FLUSH_INTERVAL = 10;                  
    const BASE_RETRY_DELAY = 200;             

    let headerSent = false;
    let hasIncomingData = false;
    let bufferQueue = [];
    let bufferedBytes = 0;

    

    const concatUint8Arrays = (chunks) => {
        if (chunks.length === 1) return chunks[0];
        const total = chunks.reduce((sum, c) => sum + c.byteLength, 0);
        const merged = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
            merged.set(c, offset);
            offset += c.byteLength;
        }
        return merged;
    };

    
    const sendInChunks = (data) => {
        let offset = 0;
        while (offset < data.byteLength) {
            const end = Math.min(offset + MAX_CHUNK_SIZE, data.byteLength);
            ws.send(data.slice(offset, end));
            offset = end;
        }
    };

    const flushBufferQueue = () => {
        if (ws.readyState !== WS_READY_STATE_OPEN || bufferQueue.length === 0) return;
        const merged = concatUint8Arrays(bufferQueue);
        bufferQueue = [];
        bufferedBytes = 0;
        sendInChunks(merged);
    };

    const flushTimer = setInterval(flushBufferQueue, FLUSH_INTERVAL);

    
    const reader = remoteSocket.readable.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            hasIncomingData = true;
            if (ws.readyState !== WS_READY_STATE_OPEN) break;

            
            if (!headerSent) {
                const combined = new Uint8Array(vlessHeader.byteLength + value.byteLength);
                combined.set(new Uint8Array(vlessHeader), 0);
                combined.set(value, vlessHeader.byteLength);
                bufferQueue.push(combined);
                bufferedBytes += combined.byteLength;
                headerSent = true;
            } else {
                bufferQueue.push(value);
                bufferedBytes += value.byteLength;
            }

            
            if (bufferedBytes >= MAX_BUFFER_SIZE) {
                flushBufferQueue();
            }
        }

        reader.releaseLock();
        flushBufferQueue();
        clearInterval(flushTimer);

        
        if (!hasIncomingData && retry && retryCount < MAX_RETRIES) {
            const delay = BASE_RETRY_DELAY * Math.pow(2, retryCount);
            console.warn(`未收到数据，${delay} ms 后重试 (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(r => setTimeout(r, delay));
            await retry();
            return;
        }

        if (ws.readyState === WS_READY_STATE_OPEN) ws.close(1000, '正常关闭');
    } catch (err) {
        reader.releaseLock();
        clearInterval(flushTimer);
        console.error('数据传输错误:', err);
        closeSocket(remoteSocket);

        if (retry && retryCount < MAX_RETRIES) {
            const delay = BASE_RETRY_DELAY * Math.pow(2, retryCount);
            console.warn(`错误重试 (${retryCount + 1}/${MAX_RETRIES})，将在 ${delay} ms 后重试`);
            await new Promise(r => setTimeout(r, delay));
            await retry();
            return;
        }

        if (ws.readyState === WS_READY_STATE_OPEN) {
            ws.close(1011, '数据传输错误');
        }
    }
}

function closeSocket(socket) {
    if (socket) {
        try {
            socket.close();
        } catch (e) {
        }
    }
}

function formatUUID(bytes) {
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function ppou5Connect(addressType, addressRemote, portRemote, parsedSocks5Address) {
    const { username, password, hostname, port } = parsedSocks5Address;
    const socket = connect({
        hostname,
        port,
    });
    const ppouGreeting = new Uint8Array([5, 2, 0, 2]);
    const writer = socket.writable.getWriter();
    await writer.write(ppouGreeting);
    const reader = socket.readable.getReader();
    const encoder = new TextEncoder();
    let res = (await reader.read()).value;
    if (res[0] !== 0x05) {
        throw new Error(`ppou server version error: ${res[0]} expected: 5`);
    }
    if (res[1] === 0xff) {
        throw new Error("no acceptable methods");
    }
    if (res[1] === 0x02) {
        if (!username || !password) {
            throw new Error("please provide username/password");
        }
        const authRequest = new Uint8Array([
            1,
            username.length,
            ...encoder.encode(username),
            password.length,
            ...encoder.encode(password)
        ]);
        await writer.write(authRequest);
        res = (await reader.read()).value;
        if (res[0] !== 0x01 || res[1] !== 0x00) {
            throw new Error("fail to auth ppou server");
        }
    }
    let DSTADDR;
    switch (addressType) {
        case 1:
            DSTADDR = new Uint8Array(
                [1, ...addressRemote.split('.').map(Number)]
            );
            break;
        case 2:
            DSTADDR = new Uint8Array(
                [3, addressRemote.length, ...encoder.encode(addressRemote)]
            );
            break;
        case 3:
            DSTADDR = new Uint8Array(
                [4, ...addressRemote.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]
            );
            break;
        default:
            throw new Error(`invalid addressType is ${addressType}`);
    }
    const ppouRequest = new Uint8Array([5, 1, 0, ...DSTADDR, portRemote >> 8, portRemote & 0xff]);
    await writer.write(ppouRequest);
    res = (await reader.read()).value;
    if (res[1] === 0x00) {
    } else {
        throw new Error("fail to open ppou connection");
    }
    writer.releaseLock();
    reader.releaseLock();
    return socket;
}

async function httpConnect(addressType, addressRemote, portRemote, parsedSocks5Address) {
    const { username, password, hostname, port } = parsedSocks5Address;
    const sock = await connect({
        hostname: hostname,
        port: port
    });

    
    let connectRequest = `CONNECT ${addressRemote}:${portRemote} HTTP/1.1\r\n`;
    connectRequest += `Host: ${addressRemote}:${portRemote}\r\n`;

    
    if (username && password) {
        const authString = `${username}:${password}`;
        const base64Auth = btoa(authString);
        connectRequest += `Proxy-Authorization: Basic ${base64Auth}\r\n`;
    }

    connectRequest += `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n`;
    connectRequest += `Proxy-Connection: Keep-Alive\r\n`;
    connectRequest += `Connection: Keep-Alive\r\n`; 
    connectRequest += `\r\n`;

    try {
        
        const writer = sock.writable.getWriter();
        await writer.write(new TextEncoder().encode(connectRequest));
        writer.releaseLock();
    } catch (err) {
        console.error('发送HTTP CONNECT请求失败:', err);
        throw new Error(`发送HTTP CONNECT请求失败: ${err.message}`);
    }

    
    const reader = sock.readable.getReader();
    let respText = '';
    let connected = false;
    let responseBuffer = new Uint8Array(0);

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                console.error('HTTP676连接中断');
                throw new Error('HTTP676连接中断');
            }

            
            const newBuffer = new Uint8Array(responseBuffer.length + value.length);
            newBuffer.set(responseBuffer);
            newBuffer.set(value, responseBuffer.length);
            responseBuffer = newBuffer;

            
            respText = new TextDecoder().decode(responseBuffer);

            
            if (respText.includes('\r\n\r\n')) {
                
                const headersEndPos = respText.indexOf('\r\n\r\n') + 4;
                const headers = respText.substring(0, headersEndPos);

                
                if (headers.startsWith('HTTP/1.1 200') || headers.startsWith('HTTP/1.0 200')) {
                    connected = true;

                    
                    if (headersEndPos < responseBuffer.length) {
                        const remainingData = responseBuffer.slice(headersEndPos);
                        
                        const dataStream = new ReadableStream({
                            start(controller) {
                                controller.enqueue(remainingData);
                            }
                        });

                        
                        const { readable, writable } = new TransformStream();
                        dataStream.pipeTo(writable).catch(err => console.error('处理剩余数据错误:', err));

                        
                        
                        sock.readable = readable;
                    }
                } else {
                    const errorMsg = `HTTP676连接失败: ${headers.split('\r\n')[0]}`;
                    console.error(errorMsg);
                    throw new Error(errorMsg);
                }
                break;
            }
        }
    } catch (err) {
        reader.releaseLock();
        throw new Error(`处理HTTP676响应失败: ${err.message}`);
    }

    reader.releaseLock();

    if (!connected) {
        throw new Error('HTTP676连接失败: 未收到成功响应');
    }

    return sock;
}
async function handleUDPOutBound(webSocket, 协议响应头) {
    let isVlessHeaderSent = false;
    const transformStream = new TransformStream({
        start(controller) {
        },
        transform(chunk, controller) {
            for (let index = 0; index < chunk.byteLength;) {
                const lengthBuffer = chunk.slice(index, index + 2);
                const udpPacketLength = new DataView(lengthBuffer).getUint16(0);
                const udpData = new Uint8Array(
                    chunk.slice(index + 2, index + 2 + udpPacketLength)
                );
                index = index + 2 + udpPacketLength;
                controller.enqueue(udpData);
            }
        },
        flush(controller) {
        }
    });

    transformStream.readable.pipeTo(new WritableStream({
        async write(chunk) {
            const resp = await fetch('https://1.1.1.1/dns-query',
                {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/dns-message',
                    },
                    body: chunk,
                })
            const dnsQueryResult = await resp.arrayBuffer();
            const udpSize = dnsQueryResult.byteLength;
            const udpSizeBuffer = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff]);

            if (webSocket.readyState === WS_READY_STATE_OPEN) {
                if (isVlessHeaderSent) {
                    webSocket.send(await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer());
                } else {
                    webSocket.send(await new Blob([协议响应头, udpSizeBuffer, dnsQueryResult]).arrayBuffer());
                    isVlessHeaderSent = true;
                }
            }
        }
    })).catch((error) => {
    });

    const writer = transformStream.writable.getWriter();

    return {
        write(chunk) {
            writer.write(chunk);
        }
    };
}


const WS_READY_STATE_OPEN = 1;
import { connect } from 'cloudflare:sockets';

async function 解析地址端口(proxyIP) {
    proxyIP = proxyIP.toLowerCase();
    let 地址 = proxyIP, 端口 = 443;
    if (proxyIP.includes('.tp')) {
        const tpMatch = proxyIP.match(/\.tp(\d+)/);
        if (tpMatch) 端口 = parseInt(tpMatch[1], 10);
        return [地址, 端口];
    }
    if (proxyIP.includes(']:')) {
        const parts = proxyIP.split(']:');
        地址 = parts[0] + ']';
        端口 = parseInt(parts[1], 10) || 端口;
    } else if (proxyIP.includes(':') && !proxyIP.startsWith('[')) {
        const colonIndex = proxyIP.lastIndexOf(':');
        地址 = proxyIP.slice(0, colonIndex);
        端口 = parseInt(proxyIP.slice(colonIndex + 1), 10) || 端口;
    }
    return [地址, 端口];
}

async function 反代参数获取(request) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const pathLower = pathname.toLowerCase();

    
    我的ssty账号 = searchParams.get('ppou5') || searchParams.get('http') || null;
    启用ssty全局反代 = searchParams.has('globalproxy') || false;

    
    const proxyMatch = pathLower.match(/\/(proxyip[.=]|pyip=|ip=)(.+)/);
    if (searchParams.has('proxyip')) {
        const 路参IP = searchParams.get('proxyip');
        反代IP = 路参IP.includes(',') ? 路参IP.split(',')[Math.floor(Math.random() * 路参IP.split(',').length)] : 路参IP;
        return;
    } else if (proxyMatch) {
        const 路参IP = proxyMatch[1] === 'proxyip.' ? `proxyip.${proxyMatch[2]}` : proxyMatch[2];
        反代IP = 路参IP.includes(',') ? 路参IP.split(',')[Math.floor(Math.random() * 路参IP.split(',').length)] : 路参IP;
        return;
    }

    
    let ppouMatch;
    if ((ppouMatch = pathname.match(/\/(ppou5?|http):\/?\/?(.+)/i))) {
        
        启用ssty反代 = ppouMatch[1].toLowerCase() === 'http' ? 'http' : 'ppou5';
        我的ssty账号 = ppouMatch[2].split('#')[0];
        启用ssty全局反代 = true;

        
        if (我的ssty账号.includes('@')) {
            const atIndex = 我的ssty账号.lastIndexOf('@');
            let userPassword = 我的ssty账号.substring(0, atIndex).replaceAll('%3D', '=');
            if (/^(?:[A-Z0-9+/]{4})*(?:[A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i.test(userPassword) && !userPassword.includes(':')) {
                userPassword = atob(userPassword);
            }
            我的ssty账号 = `${userPassword}@${我的ssty账号.substring(atIndex + 1)}`;
        }
    } else if ((ppouMatch = pathname.match(/\/(g?s5|ppou5|g?http)=(.+)/i))) {
        
        const type = ppouMatch[1].toLowerCase();
        我的ssty账号 = ppouMatch[2];
        启用ssty反代 = type.includes('http') ? 'http' : 'ppou5';
        启用ssty全局反代 = type.startsWith('g') || 启用ssty全局反代; 
    }

    
    if (我的ssty账号) {
        try {
            parsedSocks5Address = await 获取ssty账号(我的ssty账号);
            启用ssty反代 = searchParams.get('http') ? 'http' : 启用ssty反代;
        } catch (err) {
            console.error('解析ssty地址失败:', err.message);
            启用ssty反代 = null;
        }
    } else 启用ssty反代 = null;
}

async function 获取ssty账号(address) {
    const lastAtIndex = address.lastIndexOf("@");
    let [latter, former] = lastAtIndex === -1 ? [address, undefined] : [address.substring(lastAtIndex + 1), address.substring(0, lastAtIndex)];
    let username, password, hostname, port;
    if (former) {
        const formers = former.split(":");
        if (formers.length !== 2) {
            throw new Error('无效的 sst 地址格式：认证部分必须是 "username:password" 的形式');
        }
        [username, password] = formers;
    }
    const latters = latter.split(":");
    if (latters.length > 2 && latter.includes("]:")) {
        port = Number(latter.split("]:")[1].replace(/[^\d]/g, ''));
        hostname = latter.split("]:")[0] + "]";
    } else if (latters.length === 2) {
        port = Number(latters.pop().replace(/[^\d]/g, ''));
        hostname = latters.join(":");
    } else {
        port = 80;
        hostname = latter;
    }

    if (isNaN(port)) {
        throw new Error('无效的 sst 地址格式：端口号必须是数字');
    }
    const regex = /^\[.*\]$/;
    if (hostname.includes(":") && !regex.test(hostname)) {
        throw new Error('无效的 sst 地址格式：IPv6 地址必须用方括号括起来，如 [2001:db8::1]');
    }
    return { username, password, hostname, port };
}
