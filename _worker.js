import { connect } from 'cloudflare:sockets';
const _vNVENXGuuTfUQZJH = '/t-vip-9026/auth-888999';
const _BSMGWpdBObmHKMDd = '56892533-7dad-324a-b0e8-51040d0d04ad';
const _kIZRXyCEhVHLKYIZ = 'ProxyIP.FR.CMLiussss.net';
const _pRCwIykoLDExgXKc = 443;
export default {
  async fetch(_CTPXYHHxGiXbzCNI) {
    const _HWiBPfpiAMDWbIyk = new URL(_CTPXYHHxGiXbzCNI.url);
    if (_HWiBPfpiAMDWbIyk.pathname !== _vNVENXGuuTfUQZJH) {
      return new Response('Not Found', {
        status: 404
      });
    }
    if (_CTPXYHHxGiXbzCNI.headers.get('Upgrade') !== 'websocket') {
      return new Response(JSON.stringify({
        status: "UP",
        version: "2.4.2"
      }), {
        status: 200
      });
    }
    const [_uyETLJqHZKgNCEED, _OVeKLDyJwILFEUKY] = Object.values(new WebSocketPair());
    _OVeKLDyJwILFEUKY.accept();
    _pGhghPeFHbtjeGiX(_OVeKLDyJwILFEUKY).catch(_DljkXtELLwdwZijo => console.error("VLESS Fatal:", _DljkXtELLwdwZijo.message));
    return new Response(null, {
      status: 101,
      webSocket: _uyETLJqHZKgNCEED
    });
  }
};
async function _pGhghPeFHbtjeGiX(_JGJwZQOYNcAOAMqN) {
  let _aqqyTxGYbvwJStlw = null;
  let _UvUpcyytIYeVWCeI = null;
  const _ugyoKXOpzLoeipXE = new ReadableStream({
    start(_kSvbixJuTPvqeYwO) {
      _JGJwZQOYNcAOAMqN.addEventListener('message', _JtTnhRNZfgItgRPX => {
        _kSvbixJuTPvqeYwO.enqueue(_JtTnhRNZfgItgRPX.data);
      });
      _JGJwZQOYNcAOAMqN.addEventListener('close', () => _kSvbixJuTPvqeYwO.close());
      _JGJwZQOYNcAOAMqN.addEventListener('error', () => _kSvbixJuTPvqeYwO.error(new Error('WS Error')));
    }
  });
  const _syHJDSpFvuKmCEGD = _ugyoKXOpzLoeipXE.getReader();
  try {
    const {
      value: _VkkoXxXYaSQgRYbr,
      done: _tSYNKwhawUhYBTet
    } = await _syHJDSpFvuKmCEGD.read();
    if (_tSYNKwhawUhYBTet) return;
    const _yfAqgZBOoiNHBUFN = _DRhvkYwYdDxfOzcT(_VkkoXxXYaSQgRYbr);
    if (_yfAqgZBOoiNHBUFN.hasError) throw new Error(_yfAqgZBOoiNHBUFN.message);
    _UvUpcyytIYeVWCeI = new Uint8Array([_yfAqgZBOoiNHBUFN.vlessVersion[0], 0]);
    const _VgtPxdcLevUrATSe = _VkkoXxXYaSQgRYbr.slice(_yfAqgZBOoiNHBUFN.rawDataIndex);
    try {
      _aqqyTxGYbvwJStlw = await connect({
        hostname: _yfAqgZBOoiNHBUFN.addressRemote,
        port: _yfAqgZBOoiNHBUFN.portRemote
      });
    } catch (_SGMNtVjAAtimuiWZ) {
      console.log(`Direct connect failed, trying proxy: ${_kIZRXyCEhVHLKYIZ}`);
      _aqqyTxGYbvwJStlw = await connect({
        hostname: _kIZRXyCEhVHLKYIZ,
        port: _pRCwIykoLDExgXKc
      });
    }
    const _jraBqxvxAPROSVJu = _aqqyTxGYbvwJStlw.writable.getWriter();
    await _jraBqxvxAPROSVJu.write(_VgtPxdcLevUrATSe);
    _jraBqxvxAPROSVJu.releaseLock();
    const _iyfkkYOqmUNFOYEt = async () => {
      const _VKtzszDujemwATZk = _aqqyTxGYbvwJStlw.readable.getReader();
      let _kiJLwiLONyYXkhMo = true;
      try {
        while (true) {
          const {
            value: _rZirhejdKREEFGwb,
            done: _tSYNKwhawUhYBTet
          } = await _VKtzszDujemwATZk.read();
          if (_tSYNKwhawUhYBTet) break;
          if (_kiJLwiLONyYXkhMo) {
            const _YcrQmRRmZXjIafuT = new Uint8Array(_UvUpcyytIYeVWCeI.length + _rZirhejdKREEFGwb.byteLength);
            _YcrQmRRmZXjIafuT.set(_UvUpcyytIYeVWCeI, 0);
            _YcrQmRRmZXjIafuT.set(new Uint8Array(_rZirhejdKREEFGwb), _UvUpcyytIYeVWCeI.length);
            _JGJwZQOYNcAOAMqN.send(_YcrQmRRmZXjIafuT);
            _kiJLwiLONyYXkhMo = false;
          } else {
            _JGJwZQOYNcAOAMqN.send(_rZirhejdKREEFGwb);
          }
        }
      } finally {
        _VKtzszDujemwATZk.releaseLock();
        _JGJwZQOYNcAOAMqN.close();
      }
    };
    const _kHvjRBAHFDqDyDAC = async () => {
      try {
        while (true) {
          const {
            value: _rZirhejdKREEFGwb,
            done: _tSYNKwhawUhYBTet
          } = await _syHJDSpFvuKmCEGD.read();
          if (_tSYNKwhawUhYBTet) break;
          const _jraBqxvxAPROSVJu = _aqqyTxGYbvwJStlw.writable.getWriter();
          await _jraBqxvxAPROSVJu.write(_rZirhejdKREEFGwb);
          _jraBqxvxAPROSVJu.releaseLock();
        }
      } finally {
        if (_aqqyTxGYbvwJStlw) _aqqyTxGYbvwJStlw.close();
      }
    };
    await Promise.all([_iyfkkYOqmUNFOYEt(), _kHvjRBAHFDqDyDAC()]);
  } catch (_DljkXtELLwdwZijo) {
    console.error("Handler Error:", _DljkXtELLwdwZijo.message);
    _JGJwZQOYNcAOAMqN.close();
  } finally {
    if (_aqqyTxGYbvwJStlw) _aqqyTxGYbvwJStlw.close();
  }
}
function _DRhvkYwYdDxfOzcT(_cYYEQhAvvZUfjrhX) {
  const _tvPKNlKvzgrfibCE = new DataView(_cYYEQhAvvZUfjrhX instanceof ArrayBuffer ? _cYYEQhAvvZUfjrhX : _cYYEQhAvvZUfjrhX.buffer);
  if (_cYYEQhAvvZUfjrhX.byteLength < 24) return {
    hasError: true,
    message: 'Header too short'
  };
  const _QAsIbqTxbBFXrKDm = new Uint8Array(_cYYEQhAvvZUfjrhX.slice(0, 1));
  const _qrfkEbcgirVPDsju = new Uint8Array(_cYYEQhAvvZUfjrhX.slice(1, 17));
  const _pRydRXorHlzLuYuo = Array.from(_qrfkEbcgirVPDsju).map(_jFNNNMlYBnBlDSeq => _jFNNNMlYBnBlDSeq.toString(16).padStart(2, '0')).join('');
  if (_pRydRXorHlzLuYuo !== _BSMGWpdBObmHKMDd.replace(/-/g, '')) {
    return {
      hasError: true,
      message: 'Unauthorized UUID'
    };
  }
  const _apkkRrDFSBzotciM = _tvPKNlKvzgrfibCE.getUint8(17);
  let _EwTIbRqXXhNsITtm = 18 + _apkkRrDFSBzotciM;
  const _uDKCAeiWQFtguhDE = _tvPKNlKvzgrfibCE.getUint8(_EwTIbRqXXhNsITtm);
  _EwTIbRqXXhNsITtm++;
  const _FBYfkDDICNgLHjal = _tvPKNlKvzgrfibCE.getUint16(_EwTIbRqXXhNsITtm);
  _EwTIbRqXXhNsITtm += 2;
  const _HuCcWMODnefqXcSQ = _tvPKNlKvzgrfibCE.getUint8(_EwTIbRqXXhNsITtm);
  _EwTIbRqXXhNsITtm++;
  let _osjDmIPRdaBEGfJN = '';
  if (_HuCcWMODnefqXcSQ === 1) {
    _osjDmIPRdaBEGfJN = Array.from(new Uint8Array(_cYYEQhAvvZUfjrhX.slice(_EwTIbRqXXhNsITtm, _EwTIbRqXXhNsITtm + 4))).join('.');
    _EwTIbRqXXhNsITtm += 4;
  } else if (_HuCcWMODnefqXcSQ === 2) {
    const _JWxlCbbrPGcIPDyz = _tvPKNlKvzgrfibCE.getUint8(_EwTIbRqXXhNsITtm);
    _EwTIbRqXXhNsITtm++;
    _osjDmIPRdaBEGfJN = new TextDecoder().decode(_cYYEQhAvvZUfjrhX.slice(_EwTIbRqXXhNsITtm, _EwTIbRqXXhNsITtm + _JWxlCbbrPGcIPDyz));
    _EwTIbRqXXhNsITtm += _JWxlCbbrPGcIPDyz;
  } else if (_HuCcWMODnefqXcSQ === 3) {
    const _TJtfhurpIlbOdTRQ = [];
    for (let _ldTOLfCBynhbSmtP = 0; _ldTOLfCBynhbSmtP < 8; _ldTOLfCBynhbSmtP++) {
      _TJtfhurpIlbOdTRQ.push(_tvPKNlKvzgrfibCE.getUint16(_EwTIbRqXXhNsITtm).toString(16));
      _EwTIbRqXXhNsITtm += 2;
    }
    _osjDmIPRdaBEGfJN = _TJtfhurpIlbOdTRQ.join(':');
  }
  return {
    hasError: false,
    addressRemote: _osjDmIPRdaBEGfJN,
    portRemote: _FBYfkDDICNgLHjal,
    vlessVersion: _QAsIbqTxbBFXrKDm,
    rawDataIndex: _EwTIbRqXXhNsITtm
  };
}
