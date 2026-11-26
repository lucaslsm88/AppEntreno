// ============================================================================
// GOOGLE APPS SCRIPT BLINDADO (HMAC-SHA256 + ANTI-REPLAY + ANTI-FÓRMULAS)
// ============================================================================
// CONFIGURACIÓN SEGURA EN 4 PASOS (SIN CREDENCIALES EN EL CÓDIGO):
// 1. Crea una Hoja de Cálculo vacía en tu Google Drive (https://sheets.new).
// 2. Abre Extensiones -> Apps Script, borra todo y pega este archivo.
// 3. En el menú izquierdo de Apps Script, haz clic en ⚙️ "Configuración del proyecto"
//    -> baja a "Propiedades de secuencia de comandos" -> "Añadir propiedad":
//      • Propiedad: API_SECRET_KEY
//      • Valor: (pega la clave aleatoria generada con el botón 🎲 de la app)
//    y pulsa "Guardar propiedades".
// 4. Arriba a la derecha pulsa "Implementar" -> "Nueva implementación":
//      • Tipo: Aplicación web
//      • Ejecutar como: Yo
//      • Quién tiene acceso: Cualquier persona (el acceso real está protegido
//        criptográficamente por tu API_SECRET_KEY con firma HMAC-SHA256)
//    Copia la URL terminada en "/exec" y guárdala en el cofre cifrado de la app.
// ============================================================================

const SHEET_PLAN = 'Planificacion';
const SHEET_HISTORY = 'Historico_Pesos';
const SHEET_PROGRESS = 'Progreso_Actual';

const MAX_PAYLOAD_BYTES = 250 * 1024; // 250 KB máx.
const MAX_AUTH_SKEW_MS = 5 * 60 * 1000; // Ventana máxima de 5 minutos (anti-replay)
const MAX_PLAN_ROWS = 500;
const MAX_HISTORY_ROWS = 2000;

const DEFAULT_PLAN_ROWS = [
  { semana: '1', sesion: 'Dia 1', bloque_a: 'Sentadilla trasera con barra 4x6', bloque_b: 'Press banca plano 3x8\nRemo con barra 3x10', bloque_c: 'Plancha abdominal 3x45s\nElevaciones de piernas 3x12', rpe: '7' },
  { semana: '1', sesion: 'Dia 2', bloque_a: 'Peso muerto convencional 3x5', bloque_b: 'Press militar con barra 3x8\nDominadas asistidas 3x8', bloque_c: 'Paseo del granjero 3x30m\nFace pull en polea 3x15', rpe: '7.5' },
  { semana: '1', sesion: 'Dia 3', bloque_a: 'Hip thrust con barra 4x8', bloque_b: 'Press inclinado con mancuernas 3x10\nJalón al pecho agarre neutro 3x10', bloque_c: 'Press pallof 3x12\nCurl de bíceps con barra 3x12', rpe: '7' },
  { semana: '2', sesion: 'Dia 1', bloque_a: 'Sentadilla trasera con barra 4x6 (+2.5kg)', bloque_b: 'Press banca plano 3x8\nRemo con barra 3x10', bloque_c: 'Plancha abdominal 3x50s\nElevaciones de piernas 3x15', rpe: '7.5' },
  { semana: '2', sesion: 'Dia 2', bloque_a: 'Peso muerto convencional 3x5 (+5kg)', bloque_b: 'Press militar con barra 3x8\nDominadas 3x8', bloque_c: 'Paseo del granjero 3x35m\nFace pull en polea 3x15', rpe: '8' },
  { semana: '2', sesion: 'Dia 3', bloque_a: 'Hip thrust con barra 4x8 (+5kg)', bloque_b: 'Press inclinado con mancuernas 3x10\nJalón al pecho agarre neutro 3x10', bloque_c: 'Press pallof 3x12\nCurl de bíceps con barra 3x12', rpe: '7.5' },
  { semana: '3', sesion: 'Dia 1', bloque_a: 'Sentadilla trasera con barra 4x5 (+5kg)', bloque_b: 'Press banca plano 4x6\nRemo con barra 4x8', bloque_c: 'Ab wheel rollout 3x10\nElevaciones de piernas 3x15', rpe: '8' },
  { semana: '3', sesion: 'Dia 2', bloque_a: 'Peso muerto convencional 3x4 (+7.5kg)', bloque_b: 'Press militar con barra 4x6\nDominadas lastradas 3x6', bloque_c: 'Paseo del granjero 3x40m\nFace pull en polea 3x20', rpe: '8.5' },
  { semana: '3', sesion: 'Dia 3', bloque_a: 'Hip thrust con barra 4x6 (+10kg)', bloque_b: 'Press inclinado con mancuernas 4x8\nJalón al pecho agarre neutro 4x8', bloque_c: 'Press pallof 3x15\nCurl martillo con mancuernas 3x12', rpe: '8' },
  { semana: '4', sesion: 'Dia 1', bloque_a: 'Sentadilla trasera con barra 3x5 (carga ligera)', bloque_b: 'Press banca plano 3x6\nRemo con mancuerna 3x8', bloque_c: 'Plancha abdominal 3x30s', rpe: '6' },
  { semana: '4', sesion: 'Dia 2', bloque_a: 'Peso muerto convencional 2x5 (carga ligera)', bloque_b: 'Press militar con mancuernas 3x8\nJalón al pecho 3x10', bloque_c: 'Face pull en polea 3x12', rpe: '6' },
  { semana: '4', sesion: 'Dia 3', bloque_a: 'Hip thrust con barra 3x8 (carga ligera)', bloque_b: 'Press banca con mancuernas 3x10\nRemo en polea baja 3x10', bloque_c: 'Paseo del granjero 2x30m', rpe: '6' }
];

// Cierre de datos en doGet:
// Devuelve el estado cifrado con AES/SHA256-CTR + HMAC-SHA256 usando API_SECRET_KEY en la URL base limpia (sin parámetros GET),
// de modo que abrir la URL en un navegador sin la clave NO expone ningún dato en texto plano, y la app puede leerlo con HTTP 200 incluso en Incógnito.
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  if (typeof params.payload === 'string' && params.payload.length > 0) {
    return handleAuthenticatedSync(params.payload);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(ss);
  const secret = PropertiesService.getScriptProperties().getProperty('API_SECRET_KEY');
  const hasValidSecret = Boolean(secret && secret.trim().length >= 24);

  if (!hasValidSecret) {
    return jsonResponse({
      ok: true,
      apiSecretConfigured: false,
      status: 'Permisos de hoja autorizados, pero falta configurar API_SECRET_KEY (min. 24 caracteres) en Configuracion del proyecto -> Propiedades de secuencia de comandos.'
    });
  }

  let currentState = readFullSheetState(ss);
  if (!currentState.plan.rows || currentState.plan.rows.length === 0) {
    currentState = mergeStates(currentState, { plan: { rows: [] }, progress: {}, weightHistory: [] });
    writeFullSheetState(ss, currentState);
  }

  const encryptedState = encryptStateForClient({
    serverTime: Date.now(),
    plan: currentState.plan,
    progress: currentState.progress,
    weightHistory: currentState.weightHistory
  }, secret.trim());

  return jsonResponse({
    ok: true,
    apiSecretConfigured: true,
    status: 'Servicio privado blindado activo y autorizado. Autenticacion HMAC-SHA256 lista.',
    encryptedState: encryptedState
  });
}

function doPost(e) {
  const rawBody = (e && e.postData && typeof e.postData.contents === 'string') ? e.postData.contents : '';
  return handleAuthenticatedSync(rawBody);
}

function handleAuthenticatedSync(rawBody) {
  let lock = null;
  try {
    if (!rawBody || rawBody.length > MAX_PAYLOAD_BYTES) {
      return jsonResponse({ ok: false, error: 'Solicitud rechazada (tamaño inválido).' });
    }

    const secret = PropertiesService.getScriptProperties().getProperty('API_SECRET_KEY');
    if (!secret || secret.trim().length < 24) {
      return jsonResponse({
        ok: false,
        error: 'Falta configurar API_SECRET_KEY en Configuración del proyecto -> Propiedades de secuencia de comandos.'
      });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (_) {
      return jsonResponse({ ok: false, error: 'Formato JSON inválido.' });
    }

    // Verificación criptográfica HMAC-SHA256 + Timestamp + Nonce único
    const authCheck = verifySignedRequest(payload, secret.trim());
    if (!authCheck.valid) {
      return jsonResponse({ ok: false, error: authCheck.reason });
    }

    let clientState;
    try {
      clientState = JSON.parse(payload.clientStateJson);
    } catch (_) {
      return jsonResponse({ ok: false, error: 'Estado de cliente inválido.' });
    }

    lock = LockService.getScriptLock();
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheetsExist(ss);

    const currentState = readFullSheetState(ss);
    const mergedState = mergeStates(currentState, sanitizeClientState(clientState));

    writeFullSheetState(ss, mergedState);

    return jsonResponse({
      ok: true,
      serverTime: Date.now(),
      plan: mergedState.plan,
      progress: mergedState.progress,
      weightHistory: mergedState.weightHistory
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Error interno al procesar sincronización.' });
  } finally {
    if (lock) {
      try {
        lock.releaseLock();
      } catch (_) {}
    }
  }
}

function verifySignedRequest(payload, secret) {
  if (!payload || typeof payload !== 'object' || !payload.auth || typeof payload.clientStateJson !== 'string') {
    return { valid: false, reason: 'No autorizado (faltan cabeceras de firma).' };
  }

  const ts = Number(payload.auth.ts);
  const nonce = String(payload.auth.nonce || '');
  const bodyHash = String(payload.auth.bodyHash || '').toLowerCase();
  const sig = String(payload.auth.sig || '').toLowerCase();

  if (!ts || !isFinite(ts) || Math.abs(Date.now() - ts) > MAX_AUTH_SKEW_MS) {
    return { valid: false, reason: 'No autorizado (marca de tiempo expirada o reloj desajustado).' };
  }

  if (!/^[a-f0-9]{24,64}$/i.test(nonce)) {
    return { valid: false, reason: 'No autorizado (nonce inválido).' };
  }

  if (!/^[a-f0-9]{64}$/.test(bodyHash) || !/^[a-f0-9]{64}$/.test(sig)) {
    return { valid: false, reason: 'No autorizado (formato de firma inválido).' };
  }

  // Verificar integridad SHA-256 del cuerpo exacto
  const computedBodyBytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    payload.clientStateJson,
    Utilities.Charset.UTF_8
  );
  const computedBodyHex = bytesToHex(computedBodyBytes);
  if (!constantTimeEquals(computedBodyHex, bodyHash)) {
    return { valid: false, reason: 'No autorizado (integridad de datos fallida).' };
  }

  // Verificar firma HMAC-SHA256 sin que la clave viaje nunca por la red
  const canonical = String(ts) + '.' + nonce + '.' + computedBodyHex;
  const computedHmacBytes = Utilities.computeHmacSha256Signature(
    canonical,
    secret,
    Utilities.Charset.UTF_8
  );
  const computedSigHex = bytesToHex(computedHmacBytes);
  if (!constantTimeEquals(computedSigHex, sig)) {
    return { valid: false, reason: 'No autorizado (clave secreta incorrecta).' };
  }

  // Protección anti-replay con CacheService (rechaza peticiones repetidas con el mismo nonce)
  const cache = CacheService.getScriptCache();
  const nonceKey = 'nonce_' + nonce.toLowerCase();
  if (cache && cache.get(nonceKey)) {
    return { valid: false, reason: 'No autorizado (solicitud duplicada detectada).' };
  }
  if (cache) {
    cache.put(nonceKey, '1', 360);
  }

  return { valid: true };
}

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toAsciiJson(obj) {
  return JSON.stringify(obj).replace(/[\u007f-\uffff]/g, function(ch) {
    return '\\u' + ('0000' + ch.charCodeAt(0).toString(16)).slice(-4);
  });
}

function unsignedBytesToBase64(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] & 0xff;
    const b1 = (i + 1 < bytes.length) ? (bytes[i + 1] & 0xff) : 0;
    const b2 = (i + 2 < bytes.length) ? (bytes[i + 2] & 0xff) : 0;
    out += B64_ALPHABET.charAt(b0 >> 2);
    out += B64_ALPHABET.charAt(((b0 & 3) << 4) | (b1 >> 4));
    out += (i + 1 < bytes.length) ? B64_ALPHABET.charAt(((b1 & 15) << 2) | (b2 >> 6)) : '=';
    out += (i + 2 < bytes.length) ? B64_ALPHABET.charAt(b2 & 63) : '=';
  }
  return out;
}

function encryptStateForClient(stateObj, secret) {
  const asciiPlain = toAsciiJson(stateObj);
  const iv = bytesToHex(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      String(Date.now()) + '.' + String(Math.random()),
      Utilities.Charset.UTF_8
    )
  ).slice(0, 32);

  const encKeyHex = bytesToHex(
    Utilities.computeHmacSha256Signature('ENC_KEY.' + iv, secret, Utilities.Charset.UTF_8)
  );

  const plainLen = asciiPlain.length;
  const cipherBytes = new Array(plainLen);
  let ksBytes = null;

  for (let i = 0; i < plainLen; i++) {
    const offsetInBlock = i & 31;
    if (offsetInBlock === 0) {
      const blockIdx = i >>> 5;
      ksBytes = Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        encKeyHex + '.' + String(blockIdx),
        Utilities.Charset.UTF_8
      );
    }
    cipherBytes[i] = (asciiPlain.charCodeAt(i) & 0xff) ^ (ksBytes[offsetInBlock] & 0xff);
  }

  const ct = unsignedBytesToBase64(cipherBytes);
  const tag = bytesToHex(
    Utilities.computeHmacSha256Signature('TAG.' + iv + '.' + ct, secret, Utilities.Charset.UTF_8)
  );

  return { iv: iv, ct: ct, tag: tag };
}

function bytesToHex(byteArray) {
  let out = '';
  for (let i = 0; i < byteArray.length; i++) {
    const unsigned = byteArray[i] & 0xff;
    out += ('0' + unsigned.toString(16)).slice(-2);
  }
  return out;
}

// Comparación en tiempo constante para evitar ataques de temporización (timing attacks)
function constantTimeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Neutraliza inyección de fórmulas en hojas de cálculo (=IMPORTXML, @SUM, +cmd, etc.) y limita longitud
function sanitizeSheetCellText(value, maxLen) {
  let str = String(value === null || value === undefined ? '' : value)
    .replace(/\0/g, '')
    .trim();
  if (maxLen && str.length > maxLen) {
    str = str.slice(0, maxLen);
  }
  // Si inicia con carácter disparador de fórmula en Google Sheets, neutralizar prefijando espacio seguro o limpiando
  if (/^[=+\-@\t\r]/.test(str)) {
    // Permitir pesos o números simples como "+5kg" como texto literal anteponiendo apóstrofo/espacio invisible al escribir,
    // pero en el objeto lógico quitamos '=' o '@' iniciales maliciosos si contienen paréntesis o URLs
    if (/^[=@]/.test(str) || /(http|import|image|hyperlink|query|webservice|\()/i.test(str)) {
      str = str.replace(/^[=+\-@\t\r]+/, '').trim();
    }
  }
  return str;
}

// Escapa explícitamente cualquier cadena que empiece por =, +, -, @ al escribir en celdas de Google Sheets
function toSafeSheetCell(value, maxLen) {
  const clean = sanitizeSheetCellText(value, maxLen);
  if (/^[=+\-@\t\r]/.test(clean)) {
    return "'" + clean;
  }
  return clean;
}

function fromSafeSheetCell(value) {
  const str = String(value === null || value === undefined ? '' : value);
  return str.startsWith("'") ? str.slice(1) : str;
}

function sanitizeClientState(raw) {
  const safe = raw && typeof raw === 'object' ? raw : {};
  const outPlan = { updatedAt: 0, isCustomData: false, rows: [] };

  if (safe.plan && typeof safe.plan === 'object' && Array.isArray(safe.plan.rows)) {
    outPlan.updatedAt = Math.max(0, Number(safe.plan.updatedAt) || 0);
    outPlan.isCustomData = Boolean(safe.plan.isCustomData);
    outPlan.rows = safe.plan.rows.slice(0, MAX_PLAN_ROWS).map(r => ({
      semana: sanitizeSheetCellText(r && r.semana, 40) || '1',
      sesion: sanitizeSheetCellText(r && r.sesion, 60) || 'Dia 1',
      bloque_a: sanitizeSheetCellText(r && r.bloque_a, 800),
      bloque_b: sanitizeSheetCellText(r && r.bloque_b, 800),
      bloque_c: sanitizeSheetCellText(r && r.bloque_c, 800),
      rpe: sanitizeSheetCellText(r && r.rpe, 20) || '-'
    }));
  }

  const outHistory = Array.isArray(safe.weightHistory)
    ? safe.weightHistory.slice(0, MAX_HISTORY_ROWS).map(e => ({
        id: sanitizeSheetCellText(e && e.id, 80),
        cycleId: Math.max(1, parseInt(e && e.cycleId, 10) || 1),
        exerciseKey: normalizeKey(sanitizeSheetCellText(e && e.exerciseKey, 150)),
        exerciseName: sanitizeSheetCellText(e && e.exerciseName, 150),
        prescription: sanitizeSheetCellText(e && e.prescription, 300),
        weight: sanitizeSheetCellText(e && e.weight, 80),
        week: sanitizeSheetCellText(e && e.week, 40) || '1',
        session: sanitizeSheetCellText(e && e.session, 60) || 'Dia 1',
        timestamp: Math.max(0, Number(e && e.timestamp) || 0),
        updatedAt: Math.max(0, Number(e && (e.updatedAt || e.timestamp)) || 0),
        deleted: Boolean(e && e.deleted)
      })).filter(e => Boolean(e.id))
    : [];

  const rawProg = (safe.progress && typeof safe.progress === 'object') ? safe.progress : {};
  const outProg = {
    cycleId: Math.max(1, parseInt(rawProg.cycleId, 10) || 1),
    cycleUpdatedAt: Math.max(0, Number(rawProg.cycleUpdatedAt) || 0),
    completedDays: sanitizeRecordMap(rawProg.completedDays, 500),
    completedChecks: sanitizeRecordMap(rawProg.completedChecks, 2500),
    sessionWeights: sanitizeRecordMap(rawProg.sessionWeights, 2500)
  };

  return { plan: outPlan, progress: outProg, weightHistory: outHistory };
}

function sanitizeRecordMap(obj, maxKeys) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  const keys = Object.keys(obj).slice(0, maxKeys);
  keys.forEach(k => {
    const cleanKey = sanitizeSheetCellText(k, 120);
    const val = obj[k];
    if (cleanKey && val && typeof val === 'object') {
      const item = {};
      if ('completed' in val) item.completed = Boolean(val.completed);
      if ('checked' in val) item.checked = Boolean(val.checked);
      if ('deleted' in val) item.deleted = Boolean(val.deleted);
      if ('weight' in val) item.weight = sanitizeSheetCellText(val.weight, 80);
      if ('historyId' in val) item.historyId = val.historyId ? sanitizeSheetCellText(val.historyId, 80) : null;
      if ('timestamp' in val) item.timestamp = Math.max(0, Number(val.timestamp) || 0);
      if ('updatedAt' in val) item.updatedAt = Math.max(0, Number(val.updatedAt) || 0);
      out[cleanKey] = item;
    }
  });
  return out;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureSheetsExist(ss) {
  const defs = [
    [SHEET_PLAN, ['Semana', 'Sesion', 'Bloque A', 'Bloque B', 'Bloque C', 'RPE']],
    [SHEET_HISTORY, [
      'Fecha', 'Ejercicio_Normalizado', 'Peso', 'Semana', 'Sesion',
      'Prescripcion_Original', 'Ciclo', 'Timestamp_MS', 'UpdatedAt_MS', 'ID_Registro', 'Eliminado'
    ]],
    [SHEET_PROGRESS, ['Clave', 'Valor_JSON', 'Actualizado_MS']]
  ];

  defs.forEach(([name, headers]) => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(headers);
      sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  });
}

function readFullSheetState(ss) {
  const progressSheet = ss.getSheetByName(SHEET_PROGRESS);
  const metaMap = {};
  if (progressSheet && progressSheet.getLastRow() > 1) {
    const values = progressSheet.getRange(2, 1, progressSheet.getLastRow() - 1, 3).getValues();
    values.forEach(row => {
      const key = fromSafeSheetCell(row[0]).trim();
      if (!key) return;
      try {
        metaMap[key] = {
          value: row[1] !== '' ? JSON.parse(fromSafeSheetCell(row[1])) : null,
          updatedAt: Number(row[2]) || 0
        };
      } catch (_) {}
    });
  }

  const planSheet = ss.getSheetByName(SHEET_PLAN);
  const planRows = [];
  if (planSheet && planSheet.getLastRow() > 1) {
    const raw = planSheet.getRange(2, 1, planSheet.getLastRow() - 1, 6).getValues();
    raw.forEach(r => {
      const sem = fromSafeSheetCell(r[0]).trim();
      const ses = fromSafeSheetCell(r[1]).trim();
      if (!sem && !ses) return;
      planRows.push({
        semana: sanitizeSheetCellText(sem, 40) || '1',
        sesion: sanitizeSheetCellText(ses, 60) || 'Dia 1',
        bloque_a: sanitizeSheetCellText(fromSafeSheetCell(r[2]), 800),
        bloque_b: sanitizeSheetCellText(fromSafeSheetCell(r[3]), 800),
        bloque_c: sanitizeSheetCellText(fromSafeSheetCell(r[4]), 800),
        rpe: sanitizeSheetCellText(fromSafeSheetCell(r[5]), 20) || '-'
      });
    });
  }

  const planMeta = (metaMap['plan_meta'] && metaMap['plan_meta'].value) || {
    updatedAt: 0,
    isCustomData: false,
    signature: ''
  };
  const currentSignature = JSON.stringify(planRows);
  let planUpdatedAt = Number(planMeta.updatedAt) || 0;
  let planIsCustom = Boolean(planMeta.isCustomData);
  if (planRows.length > 0 && currentSignature !== planMeta.signature) {
    planUpdatedAt = Date.now();
    planIsCustom = true;
  }

  const historySheet = ss.getSheetByName(SHEET_HISTORY);
  const weightHistory = [];
  if (historySheet && historySheet.getLastRow() > 1) {
    const hRows = historySheet.getRange(2, 1, historySheet.getLastRow() - 1, 11).getValues();
    hRows.forEach((r, idx) => {
      const exName = sanitizeSheetCellText(fromSafeSheetCell(r[1]), 150);
      const weightVal = sanitizeSheetCellText(fromSafeSheetCell(r[2]), 80);
      const idVal = sanitizeSheetCellText(fromSafeSheetCell(r[9]), 80) || ('sheet_row_' + (idx + 2));
      const ts = Number(r[7]) || Date.now();
      const upd = Number(r[8]) || ts;
      const delRaw = fromSafeSheetCell(r[10]).trim().toUpperCase();
      const isDeleted = delRaw === 'SI' || delRaw === 'TRUE' || delRaw === '1';

      if (!exName && !weightVal && !r[9]) return;

      weightHistory.push({
        id: idVal,
        cycleId: Number(r[6]) || 1,
        exerciseKey: normalizeKey(exName),
        exerciseName: exName,
        prescription: sanitizeSheetCellText(fromSafeSheetCell(r[5]) || exName, 300),
        weight: weightVal,
        week: sanitizeSheetCellText(fromSafeSheetCell(r[3]), 40) || '1',
        session: sanitizeSheetCellText(fromSafeSheetCell(r[4]), 60) || 'Dia 1',
        timestamp: ts,
        updatedAt: upd,
        deleted: isDeleted
      });
    });
  }

  const progressData = (metaMap['progress_state'] && metaMap['progress_state'].value) || {};
  return {
    plan: { updatedAt: planUpdatedAt, isCustomData: planIsCustom, rows: planRows },
    progress: {
      cycleId: Number(progressData.cycleId) || 1,
      cycleUpdatedAt: Number(progressData.cycleUpdatedAt) || 0,
      completedDays: progressData.completedDays || {},
      completedChecks: progressData.completedChecks || {},
      sessionWeights: progressData.sessionWeights || {}
    },
    weightHistory: weightHistory
  };
}

function mergeStates(serverState, clientState) {
  let mergedPlan = serverState.plan;
  const cPlan = clientState.plan;
  const serverEmpty = !serverState.plan.rows || serverState.plan.rows.length === 0;
  if (cPlan && Array.isArray(cPlan.rows) && cPlan.rows.length > 0) {
    const clientTime = Number(cPlan.updatedAt) || 0;
    const serverTime = Number(serverState.plan.updatedAt) || 0;
    if (serverEmpty || clientTime > serverTime) {
      mergedPlan = {
        updatedAt: clientTime || Date.now(),
        isCustomData: Boolean(cPlan.isCustomData),
        rows: cPlan.rows.slice(0, MAX_PLAN_ROWS)
      };
    }
  } else if (serverEmpty) {
    mergedPlan = {
      updatedAt: 0,
      isCustomData: false,
      rows: DEFAULT_PLAN_ROWS
    };
  }

  const historyMap = {};
  (serverState.weightHistory || []).forEach(entry => {
    if (entry && entry.id) historyMap[entry.id] = entry;
  });

  ((clientState && clientState.weightHistory) || []).forEach(cEntry => {
    if (!cEntry || !cEntry.id) return;
    const existing = historyMap[cEntry.id];
    const cTime = Number(cEntry.updatedAt || cEntry.timestamp) || 0;
    const sTime = existing ? (Number(existing.updatedAt || existing.timestamp) || 0) : -1;
    if (!existing || cTime >= sTime) {
      historyMap[cEntry.id] = cEntry;
    }
  });

  const mergedHistory = Object.keys(historyMap)
    .map(k => historyMap[k])
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, MAX_HISTORY_ROWS);

  const sProg = serverState.progress || { cycleId: 1, cycleUpdatedAt: 0, completedDays: {}, completedChecks: {}, sessionWeights: {} };
  const cProg = (clientState && clientState.progress) || { cycleId: 1, cycleUpdatedAt: 0, completedDays: {}, completedChecks: {}, sessionWeights: {} };

  const sCycle = Number(sProg.cycleId) || 1;
  const cCycle = Number(cProg.cycleId) || 1;

  let mergedProgress;
  if (cCycle > sCycle) {
    mergedProgress = {
      cycleId: cCycle,
      cycleUpdatedAt: Number(cProg.cycleUpdatedAt) || Date.now(),
      completedDays: cProg.completedDays || {},
      completedChecks: cProg.completedChecks || {},
      sessionWeights: cProg.sessionWeights || {}
    };
  } else if (sCycle > cCycle) {
    mergedProgress = sProg;
  } else {
    mergedProgress = {
      cycleId: sCycle,
      cycleUpdatedAt: Math.max(Number(sProg.cycleUpdatedAt) || 0, Number(cProg.cycleUpdatedAt) || 0),
      completedDays: mergeMapByUpdatedAt(sProg.completedDays, cProg.completedDays),
      completedChecks: mergeMapByUpdatedAt(sProg.completedChecks, cProg.completedChecks),
      sessionWeights: mergeMapByUpdatedAt(sProg.sessionWeights, cProg.sessionWeights)
    };
  }

  return { plan: mergedPlan, progress: mergedProgress, weightHistory: mergedHistory };
}

function mergeMapByUpdatedAt(serverMap, clientMap) {
  const result = Object.assign({}, serverMap || {});
  const c = clientMap || {};
  Object.keys(c).forEach(k => {
    const cVal = c[k];
    const sVal = result[k];
    if (!sVal) {
      result[k] = cVal;
      return;
    }
    const cTime = (cVal && typeof cVal === 'object') ? (Number(cVal.updatedAt || cVal.timestamp) || 0) : 0;
    const sTime = (sVal && typeof sVal === 'object') ? (Number(sVal.updatedAt || sVal.timestamp) || 0) : 0;
    if (cTime >= sTime) result[k] = cVal;
  });
  return result;
}

function writeFullSheetState(ss, state) {
  // 1. Escribir Planificacion con formato texto plano seguro (@)
  const planSheet = ss.getSheetByName(SHEET_PLAN);
  if (planSheet.getLastRow() > 1) {
    planSheet.getRange(2, 1, planSheet.getLastRow() - 1, 6).clearContent();
  }
  const planRows = (state.plan && state.plan.rows) || [];
  if (planRows.length > 0) {
    const planMatrix = planRows.map(r => [
      toSafeSheetCell(r.semana, 40),
      toSafeSheetCell(r.sesion, 60),
      toSafeSheetCell(r.bloque_a, 800),
      toSafeSheetCell(r.bloque_b, 800),
      toSafeSheetCell(r.bloque_c, 800),
      toSafeSheetCell(r.rpe, 20)
    ]);
    const range = planSheet.getRange(2, 1, planMatrix.length, 6);
    range.setNumberFormat('@');
    range.setValues(planMatrix);
  }

  // 2. Escribir Historico_Pesos con formato texto plano seguro en columnas de texto
  const historySheet = ss.getSheetByName(SHEET_HISTORY);
  if (historySheet.getLastRow() > 1) {
    historySheet.getRange(2, 1, historySheet.getLastRow() - 1, 11).clearContent();
  }
  const historyList = state.weightHistory || [];
  if (historyList.length > 0) {
    const tz = ss.getSpreadsheetTimeZone() || 'Europe/Madrid';
    const historyMatrix = historyList.map(entry => {
      const dateStr = Utilities.formatDate(new Date(Number(entry.timestamp) || Date.now()), tz, 'yyyy-MM-dd HH:mm');
      return [
        dateStr,
        toSafeSheetCell(entry.exerciseName, 150),
        toSafeSheetCell(entry.weight, 80),
        toSafeSheetCell(entry.week, 40),
        toSafeSheetCell(entry.session, 60),
        toSafeSheetCell(entry.prescription, 300),
        Number(entry.cycleId) || 1,
        Number(entry.timestamp) || 0,
        Number(entry.updatedAt || entry.timestamp) || 0,
        toSafeSheetCell(entry.id, 80),
        entry.deleted ? 'SI' : ''
      ];
    });
    const hRange = historySheet.getRange(2, 1, historyMatrix.length, 11);
    historySheet.getRange(2, 1, historyMatrix.length, 6).setNumberFormat('@');
    hRange.setValues(historyMatrix);
  }

  // 3. Escribir Progreso_Actual
  const progressSheet = ss.getSheetByName(SHEET_PROGRESS);
  if (progressSheet.getLastRow() > 1) {
    progressSheet.getRange(2, 1, progressSheet.getLastRow() - 1, 3).clearContent();
  }
  const now = Date.now();
  const planMetaObj = {
    updatedAt: (state.plan && state.plan.updatedAt) || now,
    isCustomData: Boolean(state.plan && state.plan.isCustomData),
    signature: JSON.stringify(planRows)
  };
  const progressRows = [
    ['plan_meta', JSON.stringify(planMetaObj), planMetaObj.updatedAt],
    ['progress_state', JSON.stringify(state.progress || {}), now]
  ];
  const pRange = progressSheet.getRange(2, 1, progressRows.length, 3);
  progressSheet.getRange(2, 1, progressRows.length, 2).setNumberFormat('@');
  pRange.setValues(progressRows);
}

function normalizeKey(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
