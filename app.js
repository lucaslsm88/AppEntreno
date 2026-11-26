// ==========================================
// APLICACIÓN WEB DE PLANIFICACIÓN DE EJERCICIOS
// ==========================================

const STORAGE_KEY_DATA = 'gym_workout_plan_data';
const STORAGE_KEY_SELECTION = 'gym_workout_selection';
const STORAGE_KEY_CHECKS = 'gym_workout_completed_checks';
const STORAGE_KEY_CHECKS_META = 'gym_workout_checks_meta';
const STORAGE_KEY_THEME = 'gym_workout_theme';
const STORAGE_KEY_COMPLETED_DAYS = 'gym_workout_completed_days';
const STORAGE_KEY_HIDE_COMPLETED = 'gym_workout_hide_completed';
const STORAGE_KEY_CYCLE_ID = 'gym_workout_cycle_id';
const STORAGE_KEY_CYCLE_UPDATED_AT = 'gym_workout_cycle_updated_at';
const STORAGE_KEY_PROGRESS_RESET_AT = 'gym_workout_progress_reset_at';
const STORAGE_KEY_PLAN_UPDATED_AT = 'gym_workout_plan_updated_at';
const STORAGE_KEY_SESSION_WEIGHTS = 'gym_workout_session_weights';
const STORAGE_KEY_WEIGHT_HISTORY = 'gym_workout_weight_history';
const STORAGE_KEY_ENCRYPTED_VAULT = 'gym_workout_encrypted_vault';
const LEGACY_PLAINTEXT_URL_KEY = 'gym_workout_gsheets_url';
const STORAGE_KEY_SYNC_PENDING = 'gym_workout_sync_pending';
const STORAGE_KEY_LAST_SYNC = 'gym_workout_last_sync';

// Parámetros de seguridad y límites defensivos
const PBKDF2_ITERATIONS = 150000;
const MAX_EXCEL_FILE_BYTES = 5 * 1024 * 1024; // 5 MB máx.
const MAX_IMPORT_ROWS = 500;

// Ventana de 3 meses (90 días en milisegundos)
const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

// Datos por defecto (4 Semanas, 3 Días, Bloques A, B, C y RPE)
const DEFAULT_WORKOUT_DATA = [
  // SEMANA 1
  { semana: 1, sesion: 'Dia 1', bloque_a: 'Sentadilla trasera con barra 4x6', bloque_b: 'Press banca plano 3x8\nRemo con barra 3x10', bloque_c: 'Plancha abdominal 3x45s\nElevaciones de piernas 3x12', rpe: 7 },
  { semana: 1, sesion: 'Dia 2', bloque_a: 'Peso muerto convencional 3x5', bloque_b: 'Press militar con barra 3x8\nDominadas asistidas 3x8', bloque_c: 'Paseo del granjero 3x30m\nFace pull en polea 3x15', rpe: 7.5 },
  { semana: 1, sesion: 'Dia 3', bloque_a: 'Hip thrust con barra 4x8', bloque_b: 'Press inclinado con mancuernas 3x10\nJalón al pecho agarre neutro 3x10', bloque_c: 'Press pallof 3x12\nCurl de bíceps con barra 3x12', rpe: 7 },

  // SEMANA 2
  { semana: 2, sesion: 'Dia 1', bloque_a: 'Sentadilla trasera con barra 4x6 (+2.5kg)', bloque_b: 'Press banca plano 3x8\nRemo con barra 3x10', bloque_c: 'Plancha abdominal 3x50s\nElevaciones de piernas 3x15', rpe: 7.5 },
  { semana: 2, sesion: 'Dia 2', bloque_a: 'Peso muerto convencional 3x5 (+5kg)', bloque_b: 'Press militar con barra 3x8\nDominadas 3x8', bloque_c: 'Paseo del granjero 3x35m\nFace pull en polea 3x15', rpe: 8 },
  { semana: 2, sesion: 'Dia 3', bloque_a: 'Hip thrust con barra 4x8 (+5kg)', bloque_b: 'Press inclinado con mancuernas 3x10\nJalón al pecho agarre neutro 3x10', bloque_c: 'Press pallof 3x12\nCurl de bíceps con barra 3x12', rpe: 7.5 },

  // SEMANA 3
  { semana: 3, sesion: 'Dia 1', bloque_a: 'Sentadilla trasera con barra 4x5 (+5kg)', bloque_b: 'Press banca plano 4x6\nRemo con barra 4x8', bloque_c: 'Ab wheel rollout 3x10\nElevaciones de piernas 3x15', rpe: 8 },
  { semana: 3, sesion: 'Dia 2', bloque_a: 'Peso muerto convencional 3x4 (+7.5kg)', bloque_b: 'Press militar con barra 4x6\nDominadas lastradas 3x6', bloque_c: 'Paseo del granjero 3x40m\nFace pull en polea 3x20', rpe: 8.5 },
  { semana: 3, sesion: 'Dia 3', bloque_a: 'Hip thrust con barra 4x6 (+10kg)', bloque_b: 'Press inclinado con mancuernas 4x8\nJalón al pecho agarre neutro 4x8', bloque_c: 'Press pallof 3x15\nCurl martillo con mancuernas 3x12', rpe: 8 },

  // SEMANA 4 (Descarga activa)
  { semana: 4, sesion: 'Dia 1', bloque_a: 'Sentadilla trasera con barra 3x5 (carga ligera)', bloque_b: 'Press banca plano 3x6\nRemo con mancuerna 3x8', bloque_c: 'Plancha abdominal 3x30s', rpe: 6 },
  { semana: 4, sesion: 'Dia 2', bloque_a: 'Peso muerto convencional 2x5 (carga ligera)', bloque_b: 'Press militar con mancuernas 3x8\nJalón al pecho 3x10', bloque_c: 'Face pull en polea 3x12', rpe: 6 },
  { semana: 4, sesion: 'Dia 3', bloque_a: 'Hip thrust con barra 3x8 (carga ligera)', bloque_b: 'Press banca con mancuernas 3x10\nRemo en polea baja 3x10', bloque_c: 'Paseo del granjero 2x30m', rpe: 6 }
];

// Estado de la Aplicación
let workoutData = [];
let isCustomData = false;
let planUpdatedAt = 0;
let currentWeek = 1;
let currentSession = 'Dia 1';
let completedChecks = {};
let checksMeta = {};
let completedDays = {};
let hideCompleted = true;
let currentCycleId = 1;
let cycleUpdatedAt = 0;
let progressResetAt = 0;
let sessionWeights = {};
let weightHistory = [];
let activeView = 'workout';
let selectedHistoryExerciseKey = '';
let historyDropdownHighlightedIndex = -1;
let historyFilteredExercises = [];

// Estado de Sincronización Cifrada con Google Sheets (Offline-First)
// Las credenciales desencriptadas viven ÚNICAMENTE en esta variable de RAM mientras la pestaña esté abierta y desbloqueada
let unlockedCloudCredentials = null; // { url: string, apiSecret: string } | null
let syncPending = false;
let lastSyncTimestamp = 0;
let isSyncInFlight = false;
let cloudSyncTimer = null;
let localMutationSeq = 0;

// Elementos DOM
const weekSelect = document.getElementById('weekSelect');
const sessionPillsContainer = document.getElementById('sessionPillsContainer');
const rpeBadge = document.getElementById('rpeBadge');
const rpeInfoBtn = document.getElementById('rpeInfoBtn');
const rpeExplanation = document.getElementById('rpeExplanation');
const progressText = document.getElementById('progressText');
const resetChecksBtn = document.getElementById('resetChecksBtn');

const hideCompletedToggle = document.getElementById('hideCompletedToggle');
const overallProgressPill = document.getElementById('overallProgressPill');
const toggleDayCompleteBtn = document.getElementById('toggleDayCompleteBtn');
const btnCompleteIcon = document.getElementById('btnCompleteIcon');
const btnCompleteText = document.getElementById('btnCompleteText');
const dayActionSection = document.getElementById('dayActionSection');
const allCompletedCard = document.getElementById('allCompletedCard');
const viewAllDaysBtn = document.getElementById('viewAllDaysBtn');
const resetPlanProgressBtn = document.getElementById('resetPlanProgressBtn');
const resetCompletedDaysBtn = document.getElementById('resetCompletedDaysBtn');
const blocksSection = document.querySelector('.blocks-section');

const blockAContainer = document.getElementById('blockAContainer');
const blockBContainer = document.getElementById('blockBContainer');
const blockCContainer = document.getElementById('blockCContainer');
const countA = document.getElementById('countA');
const countB = document.getElementById('countB');
const countC = document.getElementById('countC');

const fileStatusText = document.getElementById('fileStatusText');
const uploadModal = document.getElementById('uploadModal');
const openUploadBtn = document.getElementById('openUploadBtn');
const closeUploadModal = document.getElementById('closeUploadModal');
const cancelUploadModalBtn = document.getElementById('cancelUploadModalBtn');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const restoreSampleBtn = document.getElementById('restoreSampleBtn');
const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

const qrModalBtn = document.getElementById('qrModalBtn');
const qrModal = document.getElementById('qrModal');
const closeQrModal = document.getElementById('closeQrModal');
const understandQrModalBtn = document.getElementById('understandQrModalBtn');

const cloudModalBtn = document.getElementById('cloudModalBtn');
const cloudStatusDot = document.getElementById('cloudStatusDot');
const cloudStatusLabel = document.getElementById('cloudStatusLabel');
const cloudSyncModal = document.getElementById('cloudSyncModal');
const closeCloudModal = document.getElementById('closeCloudModal');
const cloudSyncStatusInfo = document.getElementById('cloudSyncStatusInfo');

const cloudUnlockPanel = document.getElementById('cloudUnlockPanel');
const unlockVaultPinInput = document.getElementById('unlockVaultPinInput');
const unlockAndSyncBtn = document.getElementById('unlockAndSyncBtn');
const reconfigureVaultBtn = document.getElementById('reconfigureVaultBtn');

const cloudUnlockedActionsPanel = document.getElementById('cloudUnlockedActionsPanel');
const syncNowUnlockedBtn = document.getElementById('syncNowUnlockedBtn');
const lockVaultNowBtn = document.getElementById('lockVaultNowBtn');
const disconnectCloudBtn = document.getElementById('disconnectCloudBtn');

const cloudSetupPanel = document.getElementById('cloudSetupPanel');
const cloudScriptUrlInput = document.getElementById('cloudScriptUrlInput');
const cloudApiSecretInput = document.getElementById('cloudApiSecretInput');
const generateSecretKeyBtn = document.getElementById('generateSecretKeyBtn');
const cloudVaultPinInput = document.getElementById('cloudVaultPinInput');
const saveAndSyncCloudBtn = document.getElementById('saveAndSyncCloudBtn');
const copyAppsScriptBtn = document.getElementById('copyAppsScriptBtn');

const tabWorkoutBtn = document.getElementById('tabWorkoutBtn');
const tabHistoryBtn = document.getElementById('tabHistoryBtn');
const workoutView = document.getElementById('workoutView');
const historyView = document.getElementById('historyView');
const backToWorkoutBtn = document.getElementById('backToWorkoutBtn');
const exerciseSearchBox = document.getElementById('exerciseSearchBox');
const historyExerciseSearch = document.getElementById('historyExerciseSearch');
const clearHistorySearchBtn = document.getElementById('clearHistorySearchBtn');
const historyExerciseDropdown = document.getElementById('historyExerciseDropdown');
const historyLastWeight = document.getElementById('historyLastWeight');
const historyCountValue = document.getElementById('historyCountValue');
const historyExerciseTitle = document.getElementById('historyExerciseTitle');
const historyListCount = document.getElementById('historyListCount');
const historyListContainer = document.getElementById('historyListContainer');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadStoredData();
  setupEventListeners();
  renderApp();
  updateCloudStatusUI();
  registerServiceWorkerIfSupported();
});

function registerServiceWorkerIfSupported() {
  if (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    window.location &&
    (window.location.protocol === 'http:' || window.location.protocol === 'https:')
  ) {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        if (reg && typeof reg.update === 'function') {
          reg.update().catch(() => {});
        }
      })
      .catch(() => {});
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing && window.location && typeof window.location.reload === 'function') {
        refreshing = true;
        window.location.reload();
      }
    });
  }
}

// Configuración de Tema (Oscuro / Claro)
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(STORAGE_KEY_THEME, newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
  }
}

// Carga de datos
function loadStoredData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DATA);
    if (stored) {
      workoutData = JSON.parse(stored);
      isCustomData = true;
    } else {
      workoutData = [...DEFAULT_WORKOUT_DATA];
      isCustomData = false;
    }

    const savedPlanUpdatedAt = localStorage.getItem(STORAGE_KEY_PLAN_UPDATED_AT);
    if (savedPlanUpdatedAt) {
      planUpdatedAt = parseInt(savedPlanUpdatedAt, 10) || 0;
    } else {
      planUpdatedAt = isCustomData ? 1 : 0;
    }

    const savedChecks = localStorage.getItem(STORAGE_KEY_CHECKS);
    if (savedChecks) {
      completedChecks = JSON.parse(savedChecks);
    }

    const savedChecksMeta = localStorage.getItem(STORAGE_KEY_CHECKS_META);
    if (savedChecksMeta) {
      checksMeta = JSON.parse(savedChecksMeta) || {};
    } else {
      checksMeta = {};
      Object.keys(completedChecks).forEach(k => {
        if (completedChecks[k]) checksMeta[k] = { checked: true, updatedAt: 1 };
      });
    }

    const savedCompletedDays = localStorage.getItem(STORAGE_KEY_COMPLETED_DAYS);
    if (savedCompletedDays) {
      const rawDays = JSON.parse(savedCompletedDays) || {};
      completedDays = {};
      Object.keys(rawDays).forEach(k => {
        const v = rawDays[k];
        if (typeof v === 'boolean') {
          completedDays[k] = { completed: v, timestamp: 1, updatedAt: 1 };
        } else if (v && typeof v === 'object') {
          const ts = Number(v.timestamp) || 1;
          completedDays[k] = {
            completed: Boolean(v.completed),
            timestamp: ts,
            updatedAt: Number(v.updatedAt) || ts
          };
        }
      });
    }

    const savedHideCompleted = localStorage.getItem(STORAGE_KEY_HIDE_COMPLETED);
    if (savedHideCompleted !== null) {
      hideCompleted = JSON.parse(savedHideCompleted);
    } else {
      hideCompleted = true;
    }

    const savedSelection = localStorage.getItem(STORAGE_KEY_SELECTION);
    if (savedSelection) {
      const parsed = JSON.parse(savedSelection);
      if (parsed.week) currentWeek = parsed.week;
      if (parsed.session) currentSession = parsed.session;
    }

    const savedCycle = localStorage.getItem(STORAGE_KEY_CYCLE_ID);
    if (savedCycle) {
      const parsedCycle = parseInt(savedCycle, 10);
      if (!isNaN(parsedCycle) && parsedCycle >= 1) currentCycleId = parsedCycle;
    }

    const savedCycleUpdatedAt = localStorage.getItem(STORAGE_KEY_CYCLE_UPDATED_AT);
    if (savedCycleUpdatedAt) {
      cycleUpdatedAt = parseInt(savedCycleUpdatedAt, 10) || 0;
    }

    const savedResetAt = localStorage.getItem(STORAGE_KEY_PROGRESS_RESET_AT);
    if (savedResetAt) {
      progressResetAt = parseInt(savedResetAt, 10) || 0;
    }

    const savedSessionWeights = localStorage.getItem(STORAGE_KEY_SESSION_WEIGHTS);
    if (savedSessionWeights) {
      sessionWeights = JSON.parse(savedSessionWeights) || {};
    }

    // Purgar cualquier URL antigua que hubiera quedado en texto plano de versiones previas
    localStorage.removeItem(LEGACY_PLAINTEXT_URL_KEY);
    unlockedCloudCredentials = null;

    const savedPending = localStorage.getItem(STORAGE_KEY_SYNC_PENDING);
    syncPending = savedPending === 'true';

    const savedLastSync = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
    if (savedLastSync) {
      lastSyncTimestamp = parseInt(savedLastSync, 10) || 0;
    }

    const savedHistory = localStorage.getItem(STORAGE_KEY_WEIGHT_HISTORY);
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      if (Array.isArray(parsedHistory)) {
        let needsMigration = false;
        weightHistory = parsedHistory.map(entry => {
          const source = entry.prescription || entry.exerciseName || entry.exerciseKey || '';
          const cleanName = extractBaseExerciseName(source);
          const cleanKey = normalizeExerciseKey(cleanName);
          if (cleanName && (entry.exerciseName !== cleanName || entry.exerciseKey !== cleanKey)) {
            needsMigration = true;
            return { ...entry, exerciseName: cleanName, exerciseKey: cleanKey };
          }
          return entry;
        });
        if (needsMigration) {
          saveWeightHistory();
        }
      } else {
        weightHistory = [];
      }
    }

    // Si hideCompleted está activo y el día seleccionado ya fue completado,
    // saltar automáticamente al siguiente día pendiente disponible!
    if (hideCompleted && isDayCompleted(currentWeek, currentSession)) {
      const next = getNextPendingDay();
      if (next) {
        currentWeek = next.semana;
        currentSession = next.sesion;
      }
    }
  } catch (err) {
    console.error('Error al cargar datos:', err);
    workoutData = [...DEFAULT_WORKOUT_DATA];
    isCustomData = false;
  }
}

function saveSelection() {
  localStorage.setItem(STORAGE_KEY_SELECTION, JSON.stringify({
    week: currentWeek,
    session: currentSession
  }));
}

function saveChecks() {
  localStorage.setItem(STORAGE_KEY_CHECKS, JSON.stringify(completedChecks));
  localStorage.setItem(STORAGE_KEY_CHECKS_META, JSON.stringify(checksMeta));
}

// Funciones de estado para días completados
function getDayKey(week, session) {
  return `${String(week).trim()}__${String(session).trim()}`;
}

function isDayCompleted(week, session) {
  const key = getDayKey(week, session);
  return !!(completedDays[key] && completedDays[key].completed);
}

function setDayCompleted(week, session, status) {
  const key = getDayKey(week, session);
  const now = Date.now();
  if (status) {
    completedDays[key] = { completed: true, timestamp: now, updatedAt: now };
    // También marcamos los checkboxes de los ejercicios del día para coherencia visual
    const row = workoutData.find(item => String(item.semana) === String(week) && String(item.sesion) === String(session));
    if (row) {
      ['A', 'B', 'C'].forEach(blockLetter => {
        const blockKey = `bloque_${blockLetter.toLowerCase()}`;
        const list = parseExerciseBlock(row[blockKey]);
        list.forEach((_, idx) => {
          const chkKey = `${week}-${session}-${blockLetter}-${idx}`;
          completedChecks[chkKey] = true;
          checksMeta[chkKey] = { checked: true, updatedAt: now };
        });
      });
      saveChecks();
    }
  } else {
    completedDays[key] = { completed: false, timestamp: 0, updatedAt: now };
  }
  localStorage.setItem(STORAGE_KEY_COMPLETED_DAYS, JSON.stringify(completedDays));
  scheduleCloudSync();
}

function getNextPendingDay() {
  for (let i = 0; i < workoutData.length; i++) {
    const row = workoutData[i];
    if (!isDayCompleted(row.semana, row.sesion)) {
      return { semana: row.semana, sesion: row.sesion };
    }
  }
  return null;
}

function getTotalCompletedDays() {
  let count = 0;
  workoutData.forEach(row => {
    if (isDayCompleted(row.semana, row.sesion)) count++;
  });
  return count;
}

// ==========================================
// GESTIÓN DE PESOS E HISTÓRICO (3 MESES)
// ==========================================

function saveSessionWeights() {
  localStorage.setItem(STORAGE_KEY_SESSION_WEIGHTS, JSON.stringify(sessionWeights));
}

function saveWeightHistory() {
  localStorage.setItem(STORAGE_KEY_WEIGHT_HISTORY, JSON.stringify(weightHistory));
}

// Avanza el ciclo al reiniciar el plan o cargar un nuevo Excel, conservando intacto el histórico de 3 meses
function advanceCyclePreserveHistory() {
  currentCycleId += 1;
  cycleUpdatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY_CYCLE_ID, String(currentCycleId));
  localStorage.setItem(STORAGE_KEY_CYCLE_UPDATED_AT, String(cycleUpdatedAt));
  sessionWeights = {};
  checksMeta = {};
  localStorage.removeItem(STORAGE_KEY_SESSION_WEIGHTS);
  localStorage.removeItem(STORAGE_KEY_CHECKS_META);
}

function getWeightSlotKey(week, session, blockLetter, index) {
  return `${currentCycleId}__${String(week).trim()}__${String(session).trim()}__${blockLetter}__${index}`;
}

function getSessionWeightValue(week, session, blockLetter, index) {
  const slot = sessionWeights[getWeightSlotKey(week, session, blockLetter, index)];
  return (slot && !slot.deleted) ? slot.weight : '';
}

function recordExerciseWeight(week, session, blockLetter, index, originalText, rawValue) {
  const trimmed = String(rawValue || '').trim();
  const slotKey = getWeightSlotKey(week, session, blockLetter, index);
  const existingSlot = sessionWeights[slotKey];
  const now = Date.now();

  const baseName = extractBaseExerciseName(originalText);
  const exKey = normalizeExerciseKey(baseName);

  // Si el usuario deja el campo vacío, marcamos el registro de esta sesión como eliminado (tombstone para sincronización)
  if (trimmed === '') {
    if (!existingSlot || existingSlot.deleted) {
      return;
    }
    if (existingSlot.historyId) {
      const entryToDel = weightHistory.find(entry => entry.id === existingSlot.historyId);
      if (entryToDel) {
        entryToDel.deleted = true;
        entryToDel.updatedAt = now;
      }
      saveWeightHistory();
    }
    sessionWeights[slotKey] = {
      weight: '',
      historyId: existingSlot.historyId || null,
      deleted: true,
      updatedAt: now
    };
    saveSessionWeights();
    scheduleCloudSync();
    return;
  }

  // Si el valor activo no cambió, no actualizamos innecesariamente la fecha
  if (existingSlot && !existingSlot.deleted && existingSlot.weight === trimmed) {
    return;
  }

  if (existingSlot && existingSlot.historyId) {
    const existingEntry = weightHistory.find(entry => entry.id === existingSlot.historyId);
    if (existingEntry) {
      existingEntry.weight = trimmed;
      existingEntry.exerciseKey = exKey;
      existingEntry.exerciseName = baseName;
      existingEntry.prescription = originalText;
      existingEntry.timestamp = now;
      existingEntry.updatedAt = now;
      existingEntry.deleted = false;
      sessionWeights[slotKey] = {
        weight: trimmed,
        historyId: existingSlot.historyId,
        deleted: false,
        updatedAt: now
      };
    } else {
      const newId = `log_${now}_${Math.random().toString(36).slice(2, 7)}`;
      weightHistory.push({
        id: newId,
        cycleId: currentCycleId,
        exerciseKey: exKey,
        exerciseName: baseName,
        prescription: originalText,
        weight: trimmed,
        week: String(week),
        session: String(session),
        timestamp: now,
        updatedAt: now,
        deleted: false
      });
      sessionWeights[slotKey] = { weight: trimmed, historyId: newId, deleted: false, updatedAt: now };
    }
  } else {
    const newId = `log_${now}_${Math.random().toString(36).slice(2, 7)}`;
    weightHistory.push({
      id: newId,
      cycleId: currentCycleId,
      exerciseKey: exKey,
      exerciseName: baseName,
      prescription: originalText,
      weight: trimmed,
      week: String(week),
      session: String(session),
      timestamp: now,
      updatedAt: now,
      deleted: false
    });
    sessionWeights[slotKey] = { weight: trimmed, historyId: newId, deleted: false, updatedAt: now };
  }

  saveSessionWeights();
  saveWeightHistory();
  scheduleCloudSync();
}

function deleteWeightHistoryEntry(historyId) {
  const now = Date.now();
  const target = weightHistory.find(entry => entry.id === historyId);
  if (target) {
    target.deleted = true;
    target.updatedAt = now;
  }
  Object.keys(sessionWeights).forEach(k => {
    if (sessionWeights[k] && sessionWeights[k].historyId === historyId) {
      sessionWeights[k] = {
        weight: '',
        historyId: historyId,
        deleted: true,
        updatedAt: now
      };
    }
  });
  saveSessionWeights();
  saveWeightHistory();
  scheduleCloudSync();
}

function getRecentHistoryForExercise(exerciseKey, referenceTime = Date.now()) {
  const cutoff = referenceTime - THREE_MONTHS_MS;
  return weightHistory
    .filter(entry => !entry.deleted && entry.exerciseKey === exerciseKey && entry.timestamp >= cutoff)
    .sort((a, b) => b.timestamp - a.timestamp);
}

// Cambio de vista entre Rutina del Día e Histórico de Pesos
function switchView(viewName) {
  activeView = viewName;

  if (tabWorkoutBtn) tabWorkoutBtn.classList.toggle('active', viewName === 'workout');
  if (tabHistoryBtn) tabHistoryBtn.classList.toggle('active', viewName === 'history');

  if (workoutView) workoutView.style.display = viewName === 'workout' ? 'block' : 'none';
  if (historyView) historyView.style.display = viewName === 'history' ? 'block' : 'none';

  if (viewName === 'history') {
    closeHistoryExerciseDropdown();
    renderHistoryView();
  } else {
    closeHistoryExerciseDropdown();
    renderApp();
  }
}

function openExerciseHistory(exerciseKey) {
  selectedHistoryExerciseKey = exerciseKey;
  switchView('history');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Configurar Event Listeners
function setupEventListeners() {
  if (tabWorkoutBtn) {
    tabWorkoutBtn.addEventListener('click', () => switchView('workout'));
  }
  if (tabHistoryBtn) {
    tabHistoryBtn.addEventListener('click', () => switchView('history'));
  }
  if (backToWorkoutBtn) {
    backToWorkoutBtn.addEventListener('click', () => switchView('workout'));
  }

  // Buscador de ejercicios por letras en la sección Histórico
  if (historyExerciseSearch) {
    historyExerciseSearch.addEventListener('focus', () => {
      const exercises = getAllKnownExercises();
      const currentSelected = exercises.find(e => e.key === selectedHistoryExerciseKey);
      // Si el campo muestra el ejercicio activo, seleccionamos su texto para que al teclear se reemplace directamente y abrimos toda la lista
      if (currentSelected && historyExerciseSearch.value === currentSelected.name) {
        if (typeof historyExerciseSearch.select === 'function') {
          setTimeout(() => historyExerciseSearch.select(), 0);
        }
        renderHistoryExerciseDropdown('');
      } else {
        renderHistoryExerciseDropdown(historyExerciseSearch.value);
      }
    });

    historyExerciseSearch.addEventListener('input', () => {
      const val = historyExerciseSearch.value;
      if (clearHistorySearchBtn) {
        clearHistorySearchBtn.classList.toggle('visible', val.length > 0);
      }
      renderHistoryExerciseDropdown(val);
    });

    historyExerciseSearch.addEventListener('keydown', (e) => {
      const isOpen = historyExerciseDropdown && historyExerciseDropdown.classList.contains('open');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) {
          renderHistoryExerciseDropdown(historyExerciseSearch.value);
        } else if (historyFilteredExercises.length > 0) {
          historyDropdownHighlightedIndex = Math.min(historyDropdownHighlightedIndex + 1, historyFilteredExercises.length - 1);
          updateDropdownHighlight();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (isOpen && historyFilteredExercises.length > 0) {
          historyDropdownHighlightedIndex = Math.max(historyDropdownHighlightedIndex - 1, 0);
          updateDropdownHighlight();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (historyFilteredExercises.length > 0) {
          const idx = historyDropdownHighlightedIndex >= 0 ? historyDropdownHighlightedIndex : 0;
          const chosen = historyFilteredExercises[idx];
          if (chosen) {
            selectHistoryExercise(chosen.key);
            historyExerciseSearch.blur();
          }
        }
      } else if (e.key === 'Escape') {
        closeHistoryExerciseDropdown(true);
        historyExerciseSearch.blur();
      }
    });
  }

  if (clearHistorySearchBtn) {
    clearHistorySearchBtn.addEventListener('click', () => {
      if (!historyExerciseSearch) return;
      historyExerciseSearch.value = '';
      clearHistorySearchBtn.classList.remove('visible');
      renderHistoryExerciseDropdown('');
      historyExerciseSearch.focus();
    });
  }

  document.addEventListener('click', (e) => {
    if (exerciseSearchBox && !exerciseSearchBox.contains(e.target)) {
      closeHistoryExerciseDropdown(true);
    }
  });

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  if (weekSelect) {
    weekSelect.addEventListener('change', (e) => {
      currentWeek = e.target.value;
      // Comprobar si la sesión actual existe en esta semana, si no, seleccionar la primera disponible
      const availableSessions = getSessionsForWeek(currentWeek);
      if (!availableSessions.includes(currentSession) && availableSessions.length > 0) {
        currentSession = availableSessions[0];
      }
      saveSelection();
      renderApp();
    });
  }

  if (rpeInfoBtn) {
    rpeInfoBtn.addEventListener('click', () => {
      rpeExplanation.classList.toggle('visible');
    });
  }

  if (resetChecksBtn) {
    resetChecksBtn.addEventListener('click', () => {
      // Limpiar checks solo de la semana y sesión actual
      const prefix = `${currentWeek}-${currentSession}-`;
      const now = Date.now();
      Object.keys(completedChecks).forEach(k => {
        if (k.startsWith(prefix)) {
          delete completedChecks[k];
          checksMeta[k] = { checked: false, updatedAt: now };
        }
      });
      saveChecks();
      scheduleCloudSync();
      renderApp();
      showToast('Progreso del día reiniciado');
    });
  }

  // Filtro de días pendientes
  if (hideCompletedToggle) {
    hideCompletedToggle.checked = hideCompleted;
    hideCompletedToggle.addEventListener('change', () => {
      hideCompleted = hideCompletedToggle.checked;
      localStorage.setItem(STORAGE_KEY_HIDE_COMPLETED, JSON.stringify(hideCompleted));
      
      if (hideCompleted && isDayCompleted(currentWeek, currentSession)) {
        const next = getNextPendingDay();
        if (next) {
          currentWeek = next.semana;
          currentSession = next.sesion;
          saveSelection();
        }
      }
      renderApp();
    });
  }

  // Marcar / Desmarcar día como completado
  if (toggleDayCompleteBtn) {
    toggleDayCompleteBtn.addEventListener('click', () => {
      const isDone = isDayCompleted(currentWeek, currentSession);
      if (!isDone) {
        setDayCompleted(currentWeek, currentSession, true);
        
        // Si el filtro "Ver solo pendientes" está activo, avanzar automáticamente al siguiente día pendiente
        if (hideCompleted) {
          const next = getNextPendingDay();
          if (next) {
            currentWeek = next.semana;
            currentSession = next.sesion;
            saveSelection();
            showToast(`¡Día completado! Pasando a ${next.sesion} (Semana ${next.semana})`);
          } else {
            showToast('¡Felicidades! Has completado todas las sesiones del plan 🏆');
          }
        } else {
          showToast(`¡${currentSession} marcado como completado!`);
        }
      } else {
        setDayCompleted(currentWeek, currentSession, false);
        showToast(`${currentSession} marcado como pendiente`);
      }
      renderApp();
    });
  }

  // Ver historial desde tarjeta final
  if (viewAllDaysBtn) {
    viewAllDaysBtn.addEventListener('click', () => {
      hideCompleted = false;
      if (hideCompletedToggle) hideCompletedToggle.checked = false;
      localStorage.setItem(STORAGE_KEY_HIDE_COMPLETED, JSON.stringify(false));
      renderApp();
    });
  }

  // Reiniciar días completados (conservando el histórico de pesos de 3 meses)
  const handleResetCompletedDays = () => {
    if (confirm('¿Deseas reiniciar todos los días completados y volver a empezar tu plan? (Tu histórico de pesos de los últimos 3 meses se conservará).')) {
      progressResetAt = Date.now();
      localStorage.setItem(STORAGE_KEY_PROGRESS_RESET_AT, String(progressResetAt));
      completedDays = {};
      localStorage.removeItem(STORAGE_KEY_COMPLETED_DAYS);
      completedChecks = {};
      localStorage.removeItem(STORAGE_KEY_CHECKS);
      advanceCyclePreserveHistory();
      const next = getNextPendingDay();
      if (next) {
        currentWeek = next.semana;
        currentSession = next.sesion;
        saveSelection();
      }
      scheduleCloudSync();
      showToast('Nuevo ciclo iniciado (histórico de pesos conservado)');
      renderApp();
    }
  };

  if (resetPlanProgressBtn) {
    resetPlanProgressBtn.addEventListener('click', handleResetCompletedDays);
  }
  if (resetCompletedDaysBtn) {
    resetCompletedDaysBtn.addEventListener('click', handleResetCompletedDays);
  }

  // Modales y Subida de Archivos
  if (openUploadBtn && uploadModal) {
    openUploadBtn.addEventListener('click', () => uploadModal.classList.add('active'));
  }
  if (closeUploadModal && uploadModal) {
    closeUploadModal.addEventListener('click', () => uploadModal.classList.remove('active'));
  }
  if (cancelUploadModalBtn && uploadModal) {
    cancelUploadModalBtn.addEventListener('click', () => uploadModal.classList.remove('active'));
  }
  if (uploadModal) {
    uploadModal.addEventListener('click', (e) => {
      if (e.target === uploadModal) uploadModal.classList.remove('active');
    });
  }

  // Modal QR Móvil
  if (qrModalBtn && qrModal) {
    qrModalBtn.addEventListener('click', () => qrModal.classList.add('active'));
  }
  if (closeQrModal && qrModal) {
    closeQrModal.addEventListener('click', () => qrModal.classList.remove('active'));
  }
  if (understandQrModalBtn && qrModal) {
    understandQrModalBtn.addEventListener('click', () => qrModal.classList.remove('active'));
  }
  if (qrModal) {
    qrModal.addEventListener('click', (e) => {
      if (e.target === qrModal) qrModal.classList.remove('active');
    });
  }

  // Modal Sincronización Blindada con Google Sheets (AES-256-GCM + HMAC-SHA256)
  if (cloudModalBtn && cloudSyncModal) {
    cloudModalBtn.addEventListener('click', () => {
      clearSensitiveCloudInputs();
      updateCloudStatusUI();
      cloudSyncModal.classList.add('active');
      if (hasEncryptedVault() && !isCloudVaultUnlocked() && unlockVaultPinInput) {
        setTimeout(() => unlockVaultPinInput.focus(), 50);
      }
    });
  }
  if (closeCloudModal && cloudSyncModal) {
    closeCloudModal.addEventListener('click', () => {
      clearSensitiveCloudInputs();
      cloudSyncModal.classList.remove('active');
    });
  }
  if (cloudSyncModal) {
    cloudSyncModal.addEventListener('click', (e) => {
      if (e.target === cloudSyncModal) {
        clearSensitiveCloudInputs();
        cloudSyncModal.classList.remove('active');
      }
    });
  }

  if (generateSecretKeyBtn) {
    generateSecretKeyBtn.addEventListener('click', () => {
      try {
        const randomSecret = generateRandomHex(32); // 256 bits (64 caracteres hex)
        if (cloudApiSecretInput) {
          cloudApiSecretInput.value = randomSecret;
        }
        copyTextToClipboard(
          randomSecret,
          'Clave secreta de 256 bits generada y copiada al portapapeles'
        );
      } catch (err) {
        alert('No se pudo generar una clave aleatoria segura en este navegador: ' + err.message);
      }
    });
  }

  if (saveAndSyncCloudBtn) {
    saveAndSyncCloudBtn.addEventListener('click', async () => {
      const rawUrl = cloudScriptUrlInput ? cloudScriptUrlInput.value.trim() : '';
      const rawSecret = cloudApiSecretInput ? cloudApiSecretInput.value.trim() : '';
      const rawPin = cloudVaultPinInput ? cloudVaultPinInput.value.trim() : '';

      if (!rawUrl || !/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(rawUrl)) {
        alert('URL inválida. Debe ser exactamente la URL privada HTTPS de tu Web App de Google Apps Script terminada en "/exec".');
        return;
      }
      if (!rawSecret || rawSecret.length < 24) {
        alert('La Clave Secreta API (API_SECRET_KEY) debe tener al menos 24 caracteres. Puedes pulsar "🎲 Generar y Copiar" para crear una de 256 bits.');
        return;
      }
      if (!rawPin || rawPin.length < 6) {
        alert('Crea un PIN o contraseña local de al menos 6 caracteres para cifrar tus credenciales en este dispositivo.');
        return;
      }

      try {
        await saveEncryptedCredentialsVault(rawUrl, rawSecret, rawPin);
        unlockedCloudCredentials = { url: rawUrl, apiSecret: rawSecret };
        clearSensitiveCloudInputs();
        updateCloudStatusUI();
        await syncWithGoogleSheets({ silent: false });
      } catch (err) {
        alert('Error al cifrar las credenciales localmente: ' + (err && err.message ? err.message : String(err)));
      }
    });
  }

  const handleUnlockAndSync = async () => {
    const pin = unlockVaultPinInput ? unlockVaultPinInput.value.trim() : '';
    if (!pin) {
      alert('Introduce tu PIN o contraseña local para desbloquear el cofre cifrado.');
      return;
    }
    try {
      const creds = await decryptCredentialsVault(pin);
      unlockedCloudCredentials = creds;
      clearSensitiveCloudInputs();
      updateCloudStatusUI();
      await syncWithGoogleSheets({ silent: false });
    } catch (_) {
      unlockedCloudCredentials = null;
      if (unlockVaultPinInput) unlockVaultPinInput.value = '';
      updateCloudStatusUI();
      alert('PIN o contraseña local incorrecta. Tus credenciales siguen cifradas y protegidas.');
    }
  };

  if (unlockAndSyncBtn) {
    unlockAndSyncBtn.addEventListener('click', handleUnlockAndSync);
  }
  if (unlockVaultPinInput) {
    unlockVaultPinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleUnlockAndSync();
      }
    });
  }

  if (syncNowUnlockedBtn) {
    syncNowUnlockedBtn.addEventListener('click', () => {
      syncWithGoogleSheets({ silent: false });
    });
  }

  if (lockVaultNowBtn) {
    lockVaultNowBtn.addEventListener('click', () => {
      unlockedCloudCredentials = null;
      clearSensitiveCloudInputs();
      updateCloudStatusUI();
      showToast('Cofre bloqueado (credenciales borradas de la memoria RAM)');
    });
  }

  const handleDeleteVault = () => {
    if (confirm('¿Borrar el cofre cifrado de este navegador? Tus datos locales de entrenamiento y tu hoja en Google Drive se conservarán intactos.')) {
      clearEncryptedVault();
      clearSensitiveCloudInputs();
      updateCloudStatusUI();
      showToast('Cofre cifrado eliminado de este navegador');
    }
  };

  if (disconnectCloudBtn) {
    disconnectCloudBtn.addEventListener('click', handleDeleteVault);
  }
  if (reconfigureVaultBtn) {
    reconfigureVaultBtn.addEventListener('click', handleDeleteVault);
  }
  if (copyAppsScriptBtn) {
    copyAppsScriptBtn.addEventListener('click', copyAppsScriptCode);
  }

  // Reconexión automática al salir del gimnasio y recuperar internet (solo si el cofre ya está desbloqueado en RAM)
  window.addEventListener('online', () => {
    if (isCloudVaultUnlocked()) {
      syncWithGoogleSheets({ silent: true });
    }
  });

  // Dropzone
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        processExcelFile(e.dataTransfer.files[0]);
      }
    });
  }

  // Restaurar datos de ejemplo
  if (restoreSampleBtn) {
    restoreSampleBtn.addEventListener('click', () => {
      workoutData = [...DEFAULT_WORKOUT_DATA];
      isCustomData = false;
      planUpdatedAt = Date.now();
      localStorage.removeItem(STORAGE_KEY_DATA);
      localStorage.setItem(STORAGE_KEY_PLAN_UPDATED_AT, String(planUpdatedAt));
      completedDays = {};
      localStorage.removeItem(STORAGE_KEY_COMPLETED_DAYS);
      completedChecks = {};
      localStorage.removeItem(STORAGE_KEY_CHECKS);
      advanceCyclePreserveHistory();
      currentWeek = 1;
      currentSession = 'Dia 1';
      saveSelection();
      scheduleCloudSync();
      renderApp();
      uploadModal.classList.remove('active');
      showToast('Datos de ejemplo restaurados');
    });
  }

  // Descargar plantilla Excel
  if (downloadTemplateBtn) {
    downloadTemplateBtn.addEventListener('click', generateTemplateExcel);
  }
}

// Normalizador de Nombres de Columnas
// Soporta "Blaque A" (error ortográfico común del usuario) o "Bloque A", acentos, mayúsculas
function normalizeColumnHeader(col) {
  if (!col) return '';
  const clean = col.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  
  if (/semana|sem|week/.test(clean)) return 'semana';
  if (/sesion|dia|day/.test(clean)) return 'sesion';
  if (/(blaque|bloque).*a/.test(clean)) return 'bloque_a';
  if (/(blaque|bloque).*b/.test(clean)) return 'bloque_b';
  if (/(blaque|bloque).*c/.test(clean)) return 'bloque_c';
  if (/rpe|esfuerzo|rir/.test(clean)) return 'rpe';
  
  return clean;
}

// Procesar Archivo Excel
function handleFileSelect(e) {
  if (e.target.files.length > 0) {
    processExcelFile(e.target.files[0]);
  }
}

function processExcelFile(file) {
  if (!file) return;
  if (typeof file.size === 'number' && file.size > MAX_EXCEL_FILE_BYTES) {
    alert('El archivo supera el límite máximo permitido de 5 MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      if (typeof XLSX === 'undefined') {
        alert('Error: La librería de lectura Excel no está disponible.');
        return;
      }

      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      if (rawRows.length < 2) {
        alert('El archivo Excel parece estar vacío o no contiene filas de datos.');
        return;
      }

      // Detectar encabezados
      const headerRow = rawRows[0];
      const colMap = {};
      headerRow.forEach((col, idx) => {
        const normalized = normalizeColumnHeader(col);
        if (normalized) colMap[normalized] = idx;
      });

      // Validar columnas esenciales
      if (colMap['semana'] === undefined || colMap['sesion'] === undefined) {
        alert('No se encontraron las columnas requeridas: "Semana" y "Sesión" (o "Día"). Por favor verifica los encabezados.');
        return;
      }

      const parsedData = [];
      const maxRowIdx = Math.min(rawRows.length, MAX_IMPORT_ROWS + 1);
      for (let i = 1; i < maxRowIdx; i++) {
        const row = rawRows[i];
        if (!Array.isArray(row)) continue;
        const semVal = row[colMap['semana']];
        const sesVal = row[colMap['sesion']];

        // Ignorar filas totalmente vacías
        if ((semVal === '' || semVal === undefined) && (sesVal === '' || sesVal === undefined)) continue;

        const rowObj = {
          semana: semVal ? String(semVal).trim().slice(0, 40) : '1',
          sesion: sesVal ? String(sesVal).trim().slice(0, 60) : 'Dia 1',
          bloque_a: colMap['bloque_a'] !== undefined ? String(row[colMap['bloque_a']] || '').trim().slice(0, 800) : '',
          bloque_b: colMap['bloque_b'] !== undefined ? String(row[colMap['bloque_b']] || '').trim().slice(0, 800) : '',
          bloque_c: colMap['bloque_c'] !== undefined ? String(row[colMap['bloque_c']] || '').trim().slice(0, 800) : '',
          rpe: colMap['rpe'] !== undefined ? (row[colMap['rpe']] !== '' ? String(row[colMap['rpe']]).trim().slice(0, 20) : '-') : '-'
        };
        parsedData.push(rowObj);
      }

      if (parsedData.length === 0) {
        alert('No se encontraron filas válidas de entrenamiento en el archivo.');
        return;
      }

      workoutData = parsedData;
      isCustomData = true;
      planUpdatedAt = Date.now();
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(workoutData));
      localStorage.setItem(STORAGE_KEY_PLAN_UPDATED_AT, String(planUpdatedAt));
      completedDays = {};
      localStorage.removeItem(STORAGE_KEY_COMPLETED_DAYS);
      completedChecks = {};
      localStorage.removeItem(STORAGE_KEY_CHECKS);
      advanceCyclePreserveHistory();

      // Seleccionar primera semana y sesión disponible
      const allWeeks = getUniqueWeeks();
      if (allWeeks.length > 0) currentWeek = allWeeks[0];
      const allSessions = getSessionsForWeek(currentWeek);
      if (allSessions.length > 0) currentSession = allSessions[0];
      saveSelection();
      scheduleCloudSync();

      uploadModal.classList.remove('active');
      renderApp();
      showToast(`¡Excelente! Se cargaron ${parsedData.length} sesiones correctamente.`);
    } catch (err) {
      console.error(err);
      alert('Error al leer el archivo Excel: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

// Descargar plantilla Excel directamente desde el navegador
function generateTemplateExcel() {
  if (typeof XLSX === 'undefined') {
    alert('Librería de exportación no disponible');
    return;
  }

  const wsData = [
    ["Semana", "Sesion", "Bloque A", "Bloque B", "Bloque C", "RPE"],
    [1, "Dia 1", "Sentadilla trasera con barra 4x6", "Press banca plano 3x8\nRemo con barra 3x10", "Plancha abdominal 3x45s\nElevaciones de piernas 3x12", 7],
    [1, "Dia 2", "Peso muerto convencional 3x5", "Press militar con barra 3x8\nDominadas asistidas 3x8", "Paseo del granjero 3x30m\nFace pull en polea 3x15", 7.5],
    [1, "Dia 3", "Hip thrust con barra 4x8", "Press inclinado con mancuernas 3x10\nJalón al pecho agarre neutro 3x10", "Press pallof 3x12\nCurl de bíceps con barra 3x12", 7]
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Planificacion");
  XLSX.writeFile(wb, "plantilla_planificacion_ejercicios.xlsx");
  showToast('Plantilla descargada');
}

// Funciones de Ayuda de Datos
function getUniqueWeeks() {
  const weeks = [...new Set(workoutData.map(item => String(item.semana)))];
  // Ordenar numéricamente si es posible
  weeks.sort((a, b) => {
    const numA = parseFloat(a.replace(/[^\d.]/g, ''));
    const numB = parseFloat(b.replace(/[^\d.]/g, ''));
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
  return weeks;
}

function getSessionsForWeek(week) {
  const items = workoutData.filter(item => String(item.semana) === String(week));
  const sessions = [...new Set(items.map(item => String(item.sesion)))];
  return sessions;
}

function getCurrentRow() {
  return workoutData.find(item => 
    String(item.semana) === String(currentWeek) && 
    String(item.sesion) === String(currentSession)
  );
}

// Extracción y Normalización del Nombre Base del Ejercicio
// Permite agrupar y mostrar limpio el mismo ejercicio entre distintas semanas aunque varíen series/pesos/notas
function extractBaseExerciseName(exerciseText) {
  if (!exerciseText) return '';
  let cleanName = String(exerciseText)
    // Quitar saltos de línea y tabulaciones
    .replace(/[\r\n\t]+/g, ' ')
    // Quitar prefijos de bloque u orden como "A1)", "A1.", "B2 -", "C1:", "1.", "2)", "-", "•"
    .replace(/^(?:[a-zA-Z]\.?\d+\s*[\)\.\-–—:]+\s*|\d+\s*[\)\.\-–—:]+\s*|[\-\*\•]+\s*)+/, '')
    // Quitar paréntesis con notas de carga, series, pausas, tempo o intensidad: "(+2.5kg)", "(carga ligera)", "(4x8)", "(descanso 60s)"
    .replace(/\([^)]*(?:\b(?:kg|lbs|kilos?|libras?|carga|liger[oa]?s?|pesad[oa]?s?|descarga|descanso|desc\.?|pausa|tempo|rir|rpe|series?|reps?|repeticiones|seg|segundos?|min|minutos?|amrap|fallo)\b|\d+\s*[xX×*]\s*\d+|[+\-@]\s*\d+)[^)]*\)/gi, '')
    // Quitar paréntesis puramente numéricos o de tiempo/repeticiones como "(45\")", "(30s)", "(12)"
    .replace(/\(\s*\d+(?:\s*[-–\/]\s*\d+)*\s*(?:["'”′″]+|s|seg\.?|m|mts?|min\.?)?\s*\)/gi, '')
    // Quitar esquemas textuales como "4 series de 10", "3 series x 12 reps", "3 al fallo", "3xAMRAP"
    .replace(/\b\d+\s*(?:series?|vueltas?|rondas?)\s*(?:de|x|×|\*)?\s*[\d\-–\/+]+\s*(?:reps?|repeticiones|seg\.?|segundos?|min\.?|minutos?|s|m)?\b/gi, '')
    .replace(/\b\d+\s*(?:series?\s*)?(?:al\s+fallo|[xX×*]\s*(?:fallo|amrap|max|máx\.?))\b/gi, '')
    // Quitar series x repeticiones / tiempo / distancia como "4x6", "3 x 8-10", "3x10/10", "3x45s", "3x45\"", "3x45''", "3x30m"
    .replace(/\b\d+\s*[xX×*]\s*\(?[\d\-–\/+]+\)?(?:\s*(?:reps?|repeticiones|seg\.?|segundos?|min\.?|minutos?|metros?|mts?|s|m|kg|lbs)\b)?\s*(?:''|""|["'′″]+)?/gi, '')
    // Quitar pirámides de repeticiones como "15-12-10-8" o "12/10/8"
    .replace(/\b\d+\s*(?:[-–\/]\s*\d+\s*){2,}(?:reps?|repeticiones)?\b/gi, '')
    // Quitar conteos sueltos con unidad explícita como "12 reps", "45 seg", "30 mts", "45\""
    .replace(/\b\d+\s*(?:reps?|repeticiones|seg\.?|segundos?|min\.?|minutos?|metros?|mts?)\b/gi, '')
    .replace(/\b\d+\s*(?:''|""|["″]+)(?=\s|$)/g, '')
    // Quitar pesos sueltos como "+2.5kg", "80kg", "@80kg" y porcentajes como "75%", "@75% 1RM"
    .replace(/(?:[@+]\s*|\b)\d+(?:[.,]\d+)?\s*(?:kg|lbs|kilos?|libras?)\b/gi, '')
    .replace(/(?:@\s*)?\b\d+(?:[.,]\d+)?\s*%(?:\s*1?rm)?\b/gi, '')
    // Quitar notas sueltas de RPE, RIR, tempo o descanso fuera de paréntesis
    .replace(/(?:@\s*)?\b(?:rpe|rir|tempo|descanso|desc\.?|pausa)\s*[:=]?\s*[\d.,\-–\/s"']+\b/gi, '')
    .replace(/[@+]\s*\d+(?:[.,]\d+)?\b/g, '')
    .replace(/\b(?:al\s+fallo|amrap)\b/gi, '')
    // Quitar indicadores unilaterales residuales como "c/l", "c/p", "por lado", "cada pierna", "c/u"
    .replace(/\b(?:c\s*\/\s*(?:l|lado|p|pierna|b|brazo|m|mano|mancuerna|u)|(?:por|cada|x)\s+(?:lado|pierna|brazo|mano))\b/gi, '')
    // Quitar paréntesis vacíos y signos colgantes al inicio o final
    .replace(/\(\s*\)/g, '')
    .replace(/^[\s\-–—:,\/\.@+]+|[\s\-–—:,\/\.@+]+$/g, '')
    // Limpieza de espacios redundantes
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanName.length < 2) {
    cleanName = String(exerciseText).trim();
  }

  const lower = cleanName.toLocaleLowerCase('es');
  return lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1);
}

// Extrae solo el esquema corto de series/repeticiones (ej. "4x6") sin repetir el texto crudo del ejercicio
function extractPrescriptionSummary(exerciseText) {
  if (!exerciseText) return '';
  const match = String(exerciseText).match(/\b\d+\s*[xX×*]\s*\(?[\d\-–\/+]+\)?(?:\s*(?:reps?|seg\.?|s|m|min\.?)\b)?\s*(?:''|""|["'′″]+)?/i);
  return match ? match[0].trim() : '';
}

function normalizeExerciseKey(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Búsqueda Inteligente en YouTube
// Extrae el nombre puro del ejercicio eliminando series/repeticiones ("4x8", "3x10@70kg", etc.) y añade "tecnica"
function getYouTubeSearchUrl(exerciseText) {
  const cleanName = extractBaseExerciseName(exerciseText);
  const query = `${cleanName} tecnica ejecucion`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

// Parser de Bloque de Ejercicios
// Divide ejercicios si están en múltiples líneas o separados por punto y coma / numeración
function parseExerciseBlock(blockText) {
  if (!blockText || typeof blockText !== 'string') return [];
  
  // Dividir por saltos de línea o punto y coma
  const rawLines = blockText.split(/\r?\n|;/);
  const result = [];

  rawLines.forEach(line => {
    let text = line.trim();
    if (!text) return;

    // Detectar si hay serie/repetición destacable
    const matchSetsReps = text.match(/\b\d+\s*[xX*]\s*[\d\-]+(\s*(reps?|seg|s|m|kg|lbs)?)?/i);
    let details = '';
    if (matchSetsReps) {
      details = matchSetsReps[0];
    }

    const baseName = extractBaseExerciseName(text);
    const exerciseKey = normalizeExerciseKey(baseName);

    result.push({
      originalText: text,
      baseName: baseName,
      exerciseKey: exerciseKey,
      cleanQuery: getYouTubeSearchUrl(text),
      details: details
    });
  });

  return result;
}

// Renderizado Principal
function renderApp() {
  renderStatus();
  renderWeekSelector();
  renderSessionPills();
  renderWorkoutDetails();
}

function renderStatus() {
  if (!fileStatusText) return;
  fileStatusText.innerHTML = '';
  const dot = document.createElement('span');
  dot.className = 'status-dot';
  const label = isCustomData
    ? ` Usando tu archivo Excel personalizado (${workoutData.length} sesiones)`
    : ' Usando rutina de ejemplo (4 semanas)';
  fileStatusText.appendChild(dot);
  fileStatusText.appendChild(document.createTextNode(label));
}

function renderWeekSelector() {
  const weeks = getUniqueWeeks();
  if (weeks.length === 0) return;

  if (!weeks.includes(String(currentWeek))) {
    currentWeek = weeks[0];
  }

  weekSelect.innerHTML = '';
  weeks.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w;
    const sessions = getSessionsForWeek(w);
    const allDone = sessions.length > 0 && sessions.every(s => isDayCompleted(w, s));
    opt.textContent = `Semana ${w}${allDone ? ' (✓ Terminada)' : ''}`;
    if (String(w) === String(currentWeek)) {
      opt.selected = true;
    }
    weekSelect.appendChild(opt);
  });
}

function renderSessionPills() {
  const allSessions = getSessionsForWeek(currentWeek);
  sessionPillsContainer.innerHTML = '';

  if (allSessions.length === 0) {
    const emptySpan = document.createElement('span');
    emptySpan.style.color = 'var(--text-muted)';
    emptySpan.style.fontSize = '0.85rem';
    emptySpan.textContent = 'No hay sesiones';
    sessionPillsContainer.appendChild(emptySpan);
    return;
  }

  // Filtrar según el switch "Ver solo días pendientes"
  let visibleSessions = allSessions;
  if (hideCompleted) {
    visibleSessions = allSessions.filter(s => !isDayCompleted(currentWeek, s));
  }

  // Si todas las sesiones de esta semana están terminadas y el filtro está activo (sin innerHTML para impedir DOM XSS):
  if (hideCompleted && visibleSessions.length === 0) {
    const doneDiv = document.createElement('div');
    doneDiv.style.fontSize = '0.88rem';
    doneDiv.style.color = 'var(--success)';
    doneDiv.style.fontWeight = '600';
    doneDiv.style.padding = '6px 0';
    doneDiv.textContent = `✓ ¡Todos los días de la Semana ${currentWeek} completados!`;
    sessionPillsContainer.appendChild(doneDiv);
    return;
  }

  if (!visibleSessions.includes(String(currentSession))) {
    currentSession = visibleSessions[0];
    saveSelection();
  }

  visibleSessions.forEach(sess => {
    const isDone = isDayCompleted(currentWeek, sess);
    const isActive = String(sess) === String(currentSession);
    const pill = document.createElement('button');
    pill.className = `session-pill ${isActive ? 'active' : ''} ${isDone ? 'is-done' : ''}`;
    pill.textContent = isDone ? `✓ ${sess}` : sess;
    pill.title = isDone ? `${sess} (Completado)` : sess;
    pill.addEventListener('click', () => {
      currentSession = sess;
      saveSelection();
      renderApp();
    });
    sessionPillsContainer.appendChild(pill);
  });
}

function renderWorkoutDetails() {
  const totalDays = workoutData.length;
  const completedDaysCount = getTotalCompletedDays();

  // Actualizar píldora de progreso global
  if (overallProgressPill) {
    const pct = totalDays > 0 ? Math.round((completedDaysCount / totalDays) * 100) : 0;
    overallProgressPill.textContent = `${completedDaysCount} de ${totalDays} días terminados (${pct}%)`;
  }

  // Si hideCompleted está activo y absolutamente todos los días de la planificación están terminados:
  if (hideCompleted && totalDays > 0 && completedDaysCount === totalDays) {
    if (blocksSection) blocksSection.style.display = 'none';
    if (dayActionSection) dayActionSection.style.display = 'none';
    if (allCompletedCard) allCompletedCard.style.display = 'block';
    return;
  } else {
    if (blocksSection) blocksSection.style.display = 'flex';
    if (dayActionSection) dayActionSection.style.display = 'block';
    if (allCompletedCard) allCompletedCard.style.display = 'none';
  }

  // Si la semana actual está completamente terminada con filtro activo:
  const allSessionsInWeek = getSessionsForWeek(currentWeek);
  const weekAllDone = allSessionsInWeek.length > 0 && allSessionsInWeek.every(s => isDayCompleted(currentWeek, s));

  if (hideCompleted && weekAllDone) {
    if (blocksSection) blocksSection.style.display = 'none';
    if (dayActionSection) dayActionSection.style.display = 'none';
    return;
  }

  const row = getCurrentRow();
  if (!row) {
    if (blocksSection) blocksSection.style.display = 'none';
    if (dayActionSection) dayActionSection.style.display = 'none';
    return;
  }

  // Actualizar botón de marcar día
  if (toggleDayCompleteBtn && btnCompleteText && btnCompleteIcon) {
    const isDone = isDayCompleted(currentWeek, currentSession);
    if (isDone) {
      toggleDayCompleteBtn.className = 'btn-complete-day is-completed';
      btnCompleteIcon.textContent = '🎉';
      btnCompleteText.textContent = `¡${currentSession} Completado! (Toca para desmarcar)`;
    } else {
      toggleDayCompleteBtn.className = 'btn-complete-day';
      btnCompleteIcon.textContent = '✓';
      btnCompleteText.textContent = `Marcar ${currentSession} como Terminado`;
    }
  }

  // Render RPE
  renderRpeBadge(row ? row.rpe : null);

  // Render Bloques
  const exercisesA = row ? parseExerciseBlock(row.bloque_a) : [];
  const exercisesB = row ? parseExerciseBlock(row.bloque_b) : [];
  const exercisesC = row ? parseExerciseBlock(row.bloque_c) : [];

  countA.textContent = `${exercisesA.length} ej.`;
  countB.textContent = `${exercisesB.length} ej.`;
  countC.textContent = `${exercisesC.length} ej.`;

  renderBlockList(blockAContainer, exercisesA, 'A');
  renderBlockList(blockBContainer, exercisesB, 'B');
  renderBlockList(blockCContainer, exercisesC, 'C');

  updateProgressCounter(exercisesA.length + exercisesB.length + exercisesC.length);
}

function renderRpeBadge(rpeValue) {
  if (!rpeBadge) return;

  if (rpeValue === null || rpeValue === undefined || rpeValue === '-' || rpeValue === '') {
    rpeBadge.textContent = 'RPE: -';
    rpeBadge.className = 'rpe-badge';
    return;
  }

  const num = parseFloat(rpeValue);
  rpeBadge.textContent = `RPE ${rpeValue}`;
  
  if (isNaN(num)) {
    rpeBadge.className = 'rpe-badge';
  } else if (num <= 7) {
    rpeBadge.className = 'rpe-badge rpe-moderate';
  } else if (num <= 8) {
    rpeBadge.className = 'rpe-badge rpe-hard';
  } else {
    rpeBadge.className = 'rpe-badge rpe-max';
  }
}

function renderBlockList(container, exercises, blockLetter) {
  container.innerHTML = '';

  if (exercises.length === 0) {
    container.innerHTML = '<div class="empty-block">No hay ejercicios asignados en este bloque para este día.</div>';
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'exercise-list';

  const weekRef = currentWeek;
  const sessionRef = currentSession;

  exercises.forEach((item, index) => {
    const checkKey = `${weekRef}-${sessionRef}-${blockLetter}-${index}`;
    const isCompleted = !!completedChecks[checkKey];

    const li = document.createElement('li');
    li.className = `exercise-item ${isCompleted ? 'completed' : ''}`;

    // Contenido Izquierdo (Checkbox y Enlace sobre el nombre del ejercicio al Histórico)
    const leftDiv = document.createElement('div');
    leftDiv.className = 'exercise-left';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'exercise-checkbox';
    checkbox.checked = isCompleted;
    checkbox.addEventListener('change', () => {
      const now = Date.now();
      if (checkbox.checked) {
        completedChecks[checkKey] = true;
        checksMeta[checkKey] = { checked: true, updatedAt: now };
        li.classList.add('completed');
      } else {
        delete completedChecks[checkKey];
        checksMeta[checkKey] = { checked: false, updatedAt: now };
        li.classList.remove('completed');
      }
      saveChecks();
      scheduleCloudSync();
      const row = getCurrentRow();
      const total = (row ? parseExerciseBlock(row.bloque_a).length + parseExerciseBlock(row.bloque_b).length + parseExerciseBlock(row.bloque_c).length : 0);
      updateProgressCounter(total);
    });

    const textDiv = document.createElement('div');
    textDiv.className = 'exercise-text';

    const nameLink = document.createElement('button');
    nameLink.type = 'button';
    nameLink.className = 'exercise-name-link';
    nameLink.title = `Ver pesos usados en "${item.baseName}" en los últimos 3 meses`;
    nameLink.appendChild(document.createTextNode(item.originalText));

    const historyBadge = document.createElement('span');
    historyBadge.className = 'exercise-history-hint';
    historyBadge.textContent = '📈';
    nameLink.appendChild(historyBadge);

    nameLink.addEventListener('click', () => {
      openExerciseHistory(item.exerciseKey);
    });

    textDiv.appendChild(nameLink);

    // Referencia sutil del último peso previo en los últimos 3 meses (si existe de otra sesión)
    const rawSlot = sessionWeights[getWeightSlotKey(weekRef, sessionRef, blockLetter, index)];
    const currentSlot = (rawSlot && !rawSlot.deleted && rawSlot.weight) ? rawSlot : null;
    const recentForExercise = getRecentHistoryForExercise(item.exerciseKey);
    const previousEntry = recentForExercise.find(e => !currentSlot || e.id !== currentSlot.historyId);
    if (previousEntry) {
      const hintDiv = document.createElement('div');
      hintDiv.className = 'last-weight-hint';
      hintDiv.textContent = `Último previo: ${previousEntry.weight}`;
      textDiv.appendChild(hintDiv);
    }

    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(textDiv);

    // Contenido Derecho (Campo de Peso del Día + Botón de YouTube)
    const rightDiv = document.createElement('div');
    rightDiv.className = 'exercise-right';

    const savedWeight = currentSlot ? currentSlot.weight : '';
    const weightInput = document.createElement('input');
    weightInput.type = 'text';
    weightInput.className = `weight-input ${savedWeight ? 'has-value' : ''}`;
    weightInput.placeholder = 'Peso (ej: 60kg)';
    weightInput.ariaLabel = `Peso trabajado en ${item.baseName}`;
    weightInput.value = savedWeight;

    let debounceTimer = null;
    const commitWeight = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      const val = weightInput.value;
      weightInput.classList.toggle('has-value', val.trim().length > 0);
      recordExerciseWeight(weekRef, sessionRef, blockLetter, index, item.originalText, val);
    };

    weightInput.addEventListener('input', () => {
      weightInput.classList.toggle('has-value', weightInput.value.trim().length > 0);
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(commitWeight, 350);
    });
    weightInput.addEventListener('change', commitWeight);
    weightInput.addEventListener('blur', commitWeight);
    weightInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        weightInput.blur();
      }
    });

    const ytLink = document.createElement('a');
    ytLink.className = 'yt-btn';
    ytLink.href = item.cleanQuery;
    ytLink.target = '_blank';
    ytLink.rel = 'noopener noreferrer';
    ytLink.title = `Buscar técnica de ${item.originalText} en YouTube`;
    ytLink.innerHTML = `
      <svg class="yt-icon" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
      Ver Video
    `;

    rightDiv.appendChild(weightInput);
    rightDiv.appendChild(ytLink);
    li.appendChild(leftDiv);
    li.appendChild(rightDiv);
    ul.appendChild(li);
  });

  container.appendChild(ul);
}

// ==========================================
// RENDERIZADO DE LA SECCIÓN DE HISTÓRICO (3 MESES)
// ==========================================

function getAllKnownExercises() {
  const map = new Map();

  // Ejercicios de la rutina actual (siempre con nombre normalizado)
  workoutData.forEach(row => {
    ['bloque_a', 'bloque_b', 'bloque_c'].forEach(col => {
      const items = parseExerciseBlock(row[col]);
      items.forEach(ex => {
        if (ex.exerciseKey && !map.has(ex.exerciseKey)) {
          map.set(ex.exerciseKey, ex.baseName);
        }
      });
    });
  });

  // Ejercicios registrados en el histórico de 3 meses (normalizando siempre el nombre mostrado)
  const cutoff = Date.now() - THREE_MONTHS_MS;
  weightHistory.forEach(entry => {
    if (!entry.deleted && entry.timestamp >= cutoff) {
      const normalizedName = extractBaseExerciseName(entry.exerciseName || entry.prescription || entry.exerciseKey);
      const normalizedKey = normalizeExerciseKey(normalizedName);
      if (normalizedKey && !map.has(normalizedKey)) {
        map.set(normalizedKey, normalizedName);
      }
    }
  });

  return Array.from(map.entries())
    .map(([key, name]) => ({ key, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

// Filtra ejercicios normalizados según cualquier palabra o letras en cualquier parte del nombre (insensible a mayúsculas y tildes)
function filterHistoryExercises(queryText, allExercises = getAllKnownExercises()) {
  const normQuery = normalizeExerciseKey(queryText || '');
  if (!normQuery) {
    return [...allExercises];
  }

  const tokens = normQuery.split(' ').filter(Boolean);
  const startsWithList = [];
  const containsList = [];

  allExercises.forEach(ex => {
    const matchesAllTokens = tokens.every(token => ex.key.includes(token));
    if (!matchesAllTokens) return;

    if (ex.key.startsWith(normQuery)) {
      startsWithList.push(ex);
    } else {
      containsList.push(ex);
    }
  });

  return [...startsWithList, ...containsList];
}

function updateDropdownHighlight() {
  if (!historyExerciseDropdown) return;
  const items = historyExerciseDropdown.querySelectorAll('.exercise-search-option');
  items.forEach((el, idx) => {
    const isHighlighted = idx === historyDropdownHighlightedIndex;
    el.classList.toggle('highlighted', isHighlighted);
    if (isHighlighted && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  });
}

function renderHistoryExerciseDropdown(queryText = '') {
  if (!historyExerciseDropdown) return;

  const allExercises = getAllKnownExercises();
  historyFilteredExercises = filterHistoryExercises(queryText, allExercises);
  historyDropdownHighlightedIndex = historyFilteredExercises.length > 0 ? 0 : -1;

  historyExerciseDropdown.innerHTML = '';

  if (historyFilteredExercises.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'exercise-search-empty';
    emptyLi.textContent = `No se encontraron ejercicios con "${queryText.trim()}"`;
    historyExerciseDropdown.appendChild(emptyLi);
    historyExerciseDropdown.classList.add('open');
    return;
  }

  historyFilteredExercises.forEach((ex, idx) => {
    const li = document.createElement('li');
    const isSelected = ex.key === selectedHistoryExerciseKey;
    li.className = `exercise-search-option ${isSelected ? 'selected' : ''} ${idx === historyDropdownHighlightedIndex ? 'highlighted' : ''}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', isSelected ? 'true' : 'false');

    const nameSpan = document.createElement('span');
    nameSpan.className = 'exercise-option-name';
    nameSpan.textContent = ex.name;

    const count = getRecentHistoryForExercise(ex.key).length;
    const badgeSpan = document.createElement('span');
    badgeSpan.className = `exercise-option-badge ${count > 0 ? 'has-records' : ''}`;
    badgeSpan.textContent = count > 0 ? `${count} reg.` : '0 reg.';

    li.appendChild(nameSpan);
    li.appendChild(badgeSpan);

    li.addEventListener('mousedown', (e) => {
      // Evita que blur ocurra antes de seleccionar en escritorio y móvil
      e.preventDefault();
    });
    li.addEventListener('click', () => {
      selectHistoryExercise(ex.key);
    });

    historyExerciseDropdown.appendChild(li);
  });

  historyExerciseDropdown.classList.add('open');
}

function closeHistoryExerciseDropdown(restoreInputText = false) {
  if (historyExerciseDropdown) {
    historyExerciseDropdown.classList.remove('open');
  }
  historyDropdownHighlightedIndex = -1;

  if (restoreInputText && historyExerciseSearch) {
    const exercises = getAllKnownExercises();
    const typedKey = normalizeExerciseKey(historyExerciseSearch.value);
    const exactMatch = typedKey ? exercises.find(e => e.key === typedKey) : null;
    if (exactMatch && exactMatch.key !== selectedHistoryExerciseKey) {
      selectedHistoryExerciseKey = exactMatch.key;
      renderHistoryView();
      return;
    }
    const active = exercises.find(e => e.key === selectedHistoryExerciseKey);
    const activeName = active ? active.name : '';
    historyExerciseSearch.value = activeName;
    if (clearHistorySearchBtn) {
      clearHistorySearchBtn.classList.toggle('visible', activeName.length > 0);
    }
  }
}

function selectHistoryExercise(exerciseKey) {
  selectedHistoryExerciseKey = exerciseKey;
  closeHistoryExerciseDropdown(false);
  renderHistoryView();
}

function formatHistoryDate(timestamp) {
  try {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return '-';
  }
}

function renderHistoryView() {
  if (!historyListContainer) return;

  const exercises = getAllKnownExercises();

  if (exercises.length === 0) {
    if (historyExerciseSearch) {
      historyExerciseSearch.value = '';
      historyExerciseSearch.placeholder = 'Sin ejercicios disponibles';
    }
    if (clearHistorySearchBtn) clearHistorySearchBtn.classList.remove('visible');
    if (historyExerciseTitle) historyExerciseTitle.textContent = 'Registros de peso';
    if (historyLastWeight) historyLastWeight.textContent = '—';
    if (historyCountValue) historyCountValue.textContent = '0';
    if (historyListCount) historyListCount.textContent = '0 reg.';
    historyListContainer.innerHTML = '<div class="empty-block">No hay ejercicios cargados todavía.</div>';
    return;
  }

  // Si no hay un ejercicio válido seleccionado, tomar el primero
  if (!selectedHistoryExerciseKey || !exercises.some(e => e.key === selectedHistoryExerciseKey)) {
    selectedHistoryExerciseKey = exercises[0].key;
  }

  const selectedObj = exercises.find(ex => ex.key === selectedHistoryExerciseKey);
  const selectedName = selectedObj ? selectedObj.name : exercises[0].name;

  if (historyExerciseSearch) {
    historyExerciseSearch.value = selectedName;
  }
  if (clearHistorySearchBtn) {
    clearHistorySearchBtn.classList.toggle('visible', selectedName.length > 0);
  }

  const recentEntries = getRecentHistoryForExercise(selectedHistoryExerciseKey);

  if (historyExerciseTitle) {
    historyExerciseTitle.textContent = selectedName || 'Registros de peso';
  }
  if (historyLastWeight) {
    historyLastWeight.textContent = recentEntries.length > 0 ? recentEntries[0].weight : 'Sin registros';
  }
  if (historyCountValue) {
    historyCountValue.textContent = String(recentEntries.length);
  }
  if (historyListCount) {
    historyListCount.textContent = `${recentEntries.length} reg.`;
  }

  historyListContainer.innerHTML = '';

  if (recentEntries.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-block';
    emptyDiv.textContent = `No hay pesos registrados para "${selectedName}" en los últimos 3 meses. Anota el peso en tu rutina del día y se guardará aquí.`;
    historyListContainer.appendChild(emptyDiv);
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'history-list';

  recentEntries.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'history-row';

    const infoDiv = document.createElement('div');
    infoDiv.className = 'history-row-info';

    const dateDiv = document.createElement('div');
    dateDiv.className = 'history-row-date';
    dateDiv.textContent = formatHistoryDate(entry.timestamp);

    const metaDiv = document.createElement('div');
    metaDiv.className = 'history-row-meta';
    const setsSummary = extractPrescriptionSummary(entry.prescription);
    metaDiv.textContent = `Semana ${entry.week} · ${entry.session}${setsSummary ? ` · ${setsSummary}` : ''}`;

    infoDiv.appendChild(dateDiv);
    infoDiv.appendChild(metaDiv);

    const rightDiv = document.createElement('div');
    rightDiv.className = 'history-row-right';

    const weightPill = document.createElement('span');
    weightPill.className = 'history-weight-pill';
    weightPill.textContent = entry.weight;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'history-delete-btn';
    delBtn.title = 'Eliminar este registro';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => {
      if (confirm(`¿Eliminar el registro "${entry.weight}" del ${formatHistoryDate(entry.timestamp)}?`)) {
        deleteWeightHistoryEntry(entry.id);
        renderHistoryView();
        showToast('Registro eliminado');
      }
    });

    rightDiv.appendChild(weightPill);
    rightDiv.appendChild(delBtn);

    li.appendChild(infoDiv);
    li.appendChild(rightDiv);
    ul.appendChild(li);
  });

  historyListContainer.appendChild(ul);
}

function updateProgressCounter(totalExercises) {
  if (!progressText) return;
  const prefix = `${currentWeek}-${currentSession}-`;
  const completedCount = Object.keys(completedChecks).filter(k => k.startsWith(prefix)).length;

  if (totalExercises > 0) {
    progressText.textContent = `${completedCount} de ${totalExercises} hechos`;
  } else {
    progressText.textContent = '';
  }
}

// Toast Notificación
function showToast(msg) {
  if (!toast || !toastMessage) return;
  toastMessage.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}


// ==========================================
// CRIPTOGRAFÍA LOCAL (AES-256-GCM + PBKDF2 + HMAC-SHA256)
// ==========================================
// Usa Web Crypto API nativa (crypto.subtle) en contextos HTTPS / localhost y cuenta con
// implementación RFC/NIST bit-a-bit idéntica de respaldo para apertura directa por file:/// (modo offline).

function getCryptoRoot() {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') return crypto;
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') return window.crypto;
  return null;
}

function getSubtleCrypto(forceFallback = false) {
  if (forceFallback) return null;
  const root = getCryptoRoot();
  return (root && root.subtle) ? root.subtle : null;
}

function getRandomBytes(length) {
  const root = getCryptoRoot();
  if (!root) {
    throw new Error('Generador criptográfico CSPRNG no disponible en este entorno.');
  }
  const out = new Uint8Array(length);
  root.getRandomValues(out);
  return out;
}

function generateRandomHex(byteLength) {
  return bytesToHex(getRandomBytes(byteLength));
}

function utf8Encode(str) {
  const s = String(str || '');
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(s);
  }
  const bytes = [];
  for (let i = 0; i < s.length; i++) {
    let code = s.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < s.length) {
      const next = s.charCodeAt(++i);
      const cp = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f)
      );
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return new Uint8Array(bytes);
}

function utf8Decode(bytes) {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++];
    if (b0 < 0x80) {
      out += String.fromCharCode(b0);
    } else if ((b0 & 0xe0) === 0xc0) {
      const b1 = bytes[i++];
      out += String.fromCharCode(((b0 & 0x1f) << 6) | (b1 & 0x3f));
    } else if ((b0 & 0xf0) === 0xe0) {
      const b1 = bytes[i++], b2 = bytes[i++];
      out += String.fromCharCode(((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f));
    } else {
      const b1 = bytes[i++], b2 = bytes[i++], b3 = bytes[i++];
      const cp = (((b0 & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f)) - 0x10000;
      out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    }
  }
  return out;
}

function bytesToHex(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += ('0' + (bytes[i] & 0xff).toString(16)).slice(-2);
  }
  return hex;
}

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function bytesToBase64(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64_CHARS[b0 >> 2];
    out += B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    out += (i + 1 < bytes.length) ? B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += (i + 2 < bytes.length) ? B64_CHARS[b2 & 63] : '=';
  }
  return out;
}

function base64ToBytes(b64) {
  const clean = String(b64 || '').replace(/[\r\n\s]/g, '');
  if (!clean || clean.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(clean)) {
    throw new Error('Formato Base64 inválido');
  }
  const pad = clean.endsWith('==') ? 2 : (clean.endsWith('=') ? 1 : 0);
  const out = new Uint8Array((clean.length * 3) / 4 - pad);
  let outIdx = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64_CHARS.indexOf(clean[i]);
    const c1 = B64_CHARS.indexOf(clean[i + 1]);
    const c2 = clean[i + 2] === '=' ? 0 : B64_CHARS.indexOf(clean[i + 2]);
    const c3 = clean[i + 3] === '=' ? 0 : B64_CHARS.indexOf(clean[i + 3]);
    out[outIdx++] = (c0 << 2) | (c1 >> 4);
    if (outIdx < out.length) out[outIdx++] = ((c1 & 15) << 4) | (c2 >> 2);
    if (outIdx < out.length) out[outIdx++] = ((c2 & 3) << 6) | c3;
  }
  return out;
}

function constantTimeBytesEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

// --- Núcleo SHA-256 / HMAC / PBKDF2 / AES-256-GCM estándar NIST (para file:///) ---
const SHA256_K = new Int32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

const SHA256_H0 = new Int32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
]);

function sha256CompressBlock(state, W) {
  for (let i = 16; i < 64; i++) {
    const w15 = W[i - 15];
    const s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
    const w2 = W[i - 2];
    const s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
    W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
  }
  let a = state[0], b = state[1], c = state[2], d = state[3];
  let e = state[4], f = state[5], g = state[6], h = state[7];
  for (let i = 0; i < 64; i++) {
    const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
    const ch = (e & f) ^ ((~e) & g);
    const t1 = (h + S1 + ch + SHA256_K[i] + W[i]) | 0;
    const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
    const maj = (a & b) ^ (a & c) ^ (b & c);
    const t2 = (S0 + maj) | 0;
    h = g; g = f; f = e; e = (d + t1) | 0;
    d = c; c = b; b = a; a = (t1 + t2) | 0;
  }
  state[0] = (state[0] + a) | 0;
  state[1] = (state[1] + b) | 0;
  state[2] = (state[2] + c) | 0;
  state[3] = (state[3] + d) | 0;
  state[4] = (state[4] + e) | 0;
  state[5] = (state[5] + f) | 0;
  state[6] = (state[6] + g) | 0;
  state[7] = (state[7] + h) | 0;
}

function sha256Pure(msgBytes) {
  const len = msgBytes.length;
  const bitLen = len * 8;
  const totalLen = (((len + 9 + 63) >>> 6) << 6);
  const padded = new Uint8Array(totalLen);
  padded.set(msgBytes);
  padded[len] = 0x80;
  const hiBits = Math.floor(bitLen / 0x100000000);
  const loBits = bitLen >>> 0;
  padded[totalLen - 8] = (hiBits >>> 24) & 0xff;
  padded[totalLen - 7] = (hiBits >>> 16) & 0xff;
  padded[totalLen - 6] = (hiBits >>> 8) & 0xff;
  padded[totalLen - 5] = hiBits & 0xff;
  padded[totalLen - 4] = (loBits >>> 24) & 0xff;
  padded[totalLen - 3] = (loBits >>> 16) & 0xff;
  padded[totalLen - 2] = (loBits >>> 8) & 0xff;
  padded[totalLen - 1] = loBits & 0xff;

  const state = new Int32Array(SHA256_H0);
  const W = new Int32Array(64);
  for (let off = 0; off < totalLen; off += 64) {
    for (let i = 0; i < 16; i++) {
      const idx = off + i * 4;
      W[i] = (padded[idx] << 24) | (padded[idx + 1] << 16) | (padded[idx + 2] << 8) | padded[idx + 3];
    }
    sha256CompressBlock(state, W);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    const w = state[i];
    out[i * 4] = (w >>> 24) & 0xff;
    out[i * 4 + 1] = (w >>> 16) & 0xff;
    out[i * 4 + 2] = (w >>> 8) & 0xff;
    out[i * 4 + 3] = w & 0xff;
  }
  return out;
}

function hmacSha256Pure(keyBytes, msgBytes) {
  const k = keyBytes.length > 64 ? sha256Pure(keyBytes) : keyBytes;
  const kPad = new Uint8Array(64);
  kPad.set(k);
  const innerBuf = new Uint8Array(64 + msgBytes.length);
  const outerBuf = new Uint8Array(64 + 32);
  for (let i = 0; i < 64; i++) {
    innerBuf[i] = kPad[i] ^ 0x36;
    outerBuf[i] = kPad[i] ^ 0x5c;
  }
  innerBuf.set(msgBytes, 64);
  const innerHash = sha256Pure(innerBuf);
  outerBuf.set(innerHash, 64);
  return sha256Pure(outerBuf);
}

function pbkdf2Sha256Pure32(passwordBytes, saltBytes, iterations) {
  const k = passwordBytes.length > 64 ? sha256Pure(passwordBytes) : passwordBytes;
  const kPad = new Uint8Array(64);
  kPad.set(k);
  const ipadState = new Int32Array(SHA256_H0);
  const opadState = new Int32Array(SHA256_H0);
  const W = new Int32Array(64);

  for (let i = 0; i < 16; i++) {
    const idx = i * 4;
    W[i] = ((kPad[idx] ^ 0x36) << 24) | ((kPad[idx + 1] ^ 0x36) << 16) | ((kPad[idx + 2] ^ 0x36) << 8) | (kPad[idx + 3] ^ 0x36);
  }
  sha256CompressBlock(ipadState, W);

  for (let i = 0; i < 16; i++) {
    const idx = i * 4;
    W[i] = ((kPad[idx] ^ 0x5c) << 24) | ((kPad[idx + 1] ^ 0x5c) << 16) | ((kPad[idx + 2] ^ 0x5c) << 8) | (kPad[idx + 3] ^ 0x5c);
  }
  sha256CompressBlock(opadState, W);

  // U_1 = HMAC(P, salt || INT_32_BE(1))
  const saltBlock = new Uint8Array(saltBytes.length + 4);
  saltBlock.set(saltBytes);
  saltBlock[saltBytes.length + 3] = 1;
  const u1 = hmacSha256Pure(passwordBytes, saltBlock);

  const uWords = new Int32Array(8);
  const tWords = new Int32Array(8);
  for (let i = 0; i < 8; i++) {
    const idx = i * 4;
    const w = (u1[idx] << 24) | (u1[idx + 1] << 16) | (u1[idx + 2] << 8) | u1[idx + 3];
    uWords[i] = w;
    tWords[i] = w;
  }

  const state = new Int32Array(8);
  for (let iter = 1; iter < iterations; iter++) {
    state.set(ipadState);
    for (let i = 0; i < 8; i++) W[i] = uWords[i];
    W[8] = 0x80000000 | 0;
    for (let i = 9; i < 15; i++) W[i] = 0;
    W[15] = 768; // (64 + 32) * 8 bits
    sha256CompressBlock(state, W);

    for (let i = 0; i < 8; i++) W[i] = state[i];
    W[8] = 0x80000000 | 0;
    for (let i = 9; i < 15; i++) W[i] = 0;
    W[15] = 768;
    state.set(opadState);
    sha256CompressBlock(state, W);

    for (let i = 0; i < 8; i++) {
      uWords[i] = state[i];
      tWords[i] ^= state[i];
    }
  }

  const dk = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    const w = tWords[i];
    dk[i * 4] = (w >>> 24) & 0xff;
    dk[i * 4 + 1] = (w >>> 16) & 0xff;
    dk[i * 4 + 2] = (w >>> 8) & 0xff;
    dk[i * 4 + 3] = w & 0xff;
  }
  return dk;
}

const AES_SBOX = new Uint8Array([
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
]);

function aesExpandKey256(key32) {
  const rk = new Uint8Array(240);
  rk.set(key32);
  let rcon = 1;
  for (let i = 8; i < 60; i++) {
    const off = i * 4;
    let t0 = rk[off - 4], t1 = rk[off - 3], t2 = rk[off - 2], t3 = rk[off - 1];
    if (i % 8 === 0) {
      const tmp = t0;
      t0 = AES_SBOX[t1] ^ rcon;
      t1 = AES_SBOX[t2];
      t2 = AES_SBOX[t3];
      t3 = AES_SBOX[tmp];
      rcon = (rcon << 1) ^ ((rcon & 0x80) ? 0x1b : 0);
    } else if (i % 8 === 4) {
      t0 = AES_SBOX[t0];
      t1 = AES_SBOX[t1];
      t2 = AES_SBOX[t2];
      t3 = AES_SBOX[t3];
    }
    rk[off] = rk[off - 32] ^ t0;
    rk[off + 1] = rk[off - 31] ^ t1;
    rk[off + 2] = rk[off - 30] ^ t2;
    rk[off + 3] = rk[off - 29] ^ t3;
  }
  return rk;
}

function aesEncryptBlock(rk, block16) {
  const s = new Uint8Array(16);
  for (let i = 0; i < 16; i++) s[i] = block16[i] ^ rk[i];

  for (let r = 1; r <= 14; r++) {
    for (let i = 0; i < 16; i++) s[i] = AES_SBOX[s[i]];

    let tmp = s[1]; s[1] = s[5]; s[5] = s[9]; s[9] = s[13]; s[13] = tmp;
    tmp = s[2]; s[2] = s[10]; s[10] = tmp; tmp = s[6]; s[6] = s[14]; s[14] = tmp;
    tmp = s[15]; s[15] = s[11]; s[11] = s[7]; s[7] = s[3]; s[3] = tmp;

    if (r < 14) {
      for (let c = 0; c < 16; c += 4) {
        const a0 = s[c], a1 = s[c + 1], a2 = s[c + 2], a3 = s[c + 3];
        const x0 = ((a0 << 1) ^ ((a0 & 0x80) ? 0x1b : 0)) & 0xff;
        const x1 = ((a1 << 1) ^ ((a1 & 0x80) ? 0x1b : 0)) & 0xff;
        const x2 = ((a2 << 1) ^ ((a2 & 0x80) ? 0x1b : 0)) & 0xff;
        const x3 = ((a3 << 1) ^ ((a3 & 0x80) ? 0x1b : 0)) & 0xff;
        s[c] = x0 ^ x1 ^ a1 ^ a2 ^ a3;
        s[c + 1] = a0 ^ x1 ^ x2 ^ a2 ^ a3;
        s[c + 2] = a0 ^ a1 ^ x2 ^ x3 ^ a3;
        s[c + 3] = x0 ^ a0 ^ a1 ^ a2 ^ x3;
      }
    }

    const rOff = r * 16;
    for (let i = 0; i < 16; i++) s[i] ^= rk[rOff + i];
  }
  return s;
}

function gf128Mul(X, H) {
  const Z = new Uint8Array(16);
  const V = new Uint8Array(H);
  for (let i = 0; i < 128; i++) {
    if ((X[i >>> 3] >>> (7 - (i & 7))) & 1) {
      for (let k = 0; k < 16; k++) Z[k] ^= V[k];
    }
    const lsb = V[15] & 1;
    for (let k = 15; k > 0; k--) {
      V[k] = (V[k] >>> 1) | ((V[k - 1] & 1) << 7);
    }
    V[0] = (V[0] >>> 1) ^ (lsb ? 0xe1 : 0);
  }
  return Z;
}

function ghashCiphertext(H, cipherBytes) {
  let Y = new Uint8Array(16);
  for (let off = 0; off < cipherBytes.length; off += 16) {
    const chunk = Math.min(16, cipherBytes.length - off);
    for (let k = 0; k < chunk; k++) Y[k] ^= cipherBytes[off + k];
    Y = gf128Mul(Y, H);
  }
  const lenBlock = new Uint8Array(16);
  const bitLen = cipherBytes.length * 8;
  const hi = Math.floor(bitLen / 0x100000000);
  const lo = bitLen >>> 0;
  lenBlock[8] = (hi >>> 24) & 0xff;
  lenBlock[9] = (hi >>> 16) & 0xff;
  lenBlock[10] = (hi >>> 8) & 0xff;
  lenBlock[11] = hi & 0xff;
  lenBlock[12] = (lo >>> 24) & 0xff;
  lenBlock[13] = (lo >>> 16) & 0xff;
  lenBlock[14] = (lo >>> 8) & 0xff;
  lenBlock[15] = lo & 0xff;
  for (let k = 0; k < 16; k++) Y[k] ^= lenBlock[k];
  return gf128Mul(Y, H);
}

function aes256GcmCtrTransform(rk, iv12, inputBytes) {
  const out = new Uint8Array(inputBytes.length);
  const ctr = new Uint8Array(16);
  ctr.set(iv12, 0);
  let counterVal = 2;
  for (let off = 0; off < inputBytes.length; off += 16) {
    ctr[12] = (counterVal >>> 24) & 0xff;
    ctr[13] = (counterVal >>> 16) & 0xff;
    ctr[14] = (counterVal >>> 8) & 0xff;
    ctr[15] = counterVal & 0xff;
    counterVal = (counterVal + 1) >>> 0;
    const keystream = aesEncryptBlock(rk, ctr);
    const chunk = Math.min(16, inputBytes.length - off);
    for (let k = 0; k < chunk; k++) {
      out[off + k] = inputBytes[off + k] ^ keystream[k];
    }
  }
  return out;
}

function aes256GcmEncryptPure(key32, iv12, plainBytes) {
  const rk = aesExpandKey256(key32);
  const H = aesEncryptBlock(rk, new Uint8Array(16));
  const j0 = new Uint8Array(16);
  j0.set(iv12, 0);
  j0[15] = 1;
  const encJ0 = aesEncryptBlock(rk, j0);

  const cipherBytes = aes256GcmCtrTransform(rk, iv12, plainBytes);
  const ghash = ghashCiphertext(H, cipherBytes);
  const out = new Uint8Array(cipherBytes.length + 16);
  out.set(cipherBytes, 0);
  for (let k = 0; k < 16; k++) {
    out[cipherBytes.length + k] = ghash[k] ^ encJ0[k];
  }
  return out;
}

function aes256GcmDecryptPure(key32, iv12, cipherWithTagBytes) {
  if (!cipherWithTagBytes || cipherWithTagBytes.length < 16) {
    throw new Error('Datos cifrados truncados o inválidos.');
  }
  const cipherLen = cipherWithTagBytes.length - 16;
  const cipherBytes = cipherWithTagBytes.subarray(0, cipherLen);
  const receivedTag = cipherWithTagBytes.subarray(cipherLen);

  const rk = aesExpandKey256(key32);
  const H = aesEncryptBlock(rk, new Uint8Array(16));
  const j0 = new Uint8Array(16);
  j0.set(iv12, 0);
  j0[15] = 1;
  const encJ0 = aesEncryptBlock(rk, j0);

  const ghash = ghashCiphertext(H, cipherBytes);
  const expectedTag = new Uint8Array(16);
  for (let k = 0; k < 16; k++) {
    expectedTag[k] = ghash[k] ^ encJ0[k];
  }
  if (!constantTimeBytesEqual(receivedTag, expectedTag)) {
    throw new Error('Autenticación AES-GCM fallida (PIN incorrecto o datos alterados).');
  }
  return aes256GcmCtrTransform(rk, iv12, cipherBytes);
}

async function sha256Hex(text, forceFallback = false) {
  const data = utf8Encode(text);
  const subtle = getSubtleCrypto(forceFallback);
  if (subtle) {
    const digest = await subtle.digest('SHA-256', data);
    return bytesToHex(new Uint8Array(digest));
  }
  return bytesToHex(sha256Pure(data));
}

async function hmacSha256Hex(secretStr, messageStr, forceFallback = false) {
  const keyBytes = utf8Encode(secretStr);
  const msgBytes = utf8Encode(messageStr);
  const subtle = getSubtleCrypto(forceFallback);
  if (subtle) {
    const cryptoKey = await subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await subtle.sign('HMAC', cryptoKey, msgBytes);
    return bytesToHex(new Uint8Array(sig));
  }
  return bytesToHex(hmacSha256Pure(keyBytes, msgBytes));
}

async function deriveVaultKeyBytes(pinStr, saltBytes, iterations = PBKDF2_ITERATIONS, forceFallback = false) {
  const pinBytes = utf8Encode(pinStr);
  const subtle = getSubtleCrypto(forceFallback);
  if (subtle) {
    const baseKey = await subtle.importKey('raw', pinBytes, 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: iterations },
      baseKey,
      256
    );
    return new Uint8Array(bits);
  }
  return pbkdf2Sha256Pure32(pinBytes, saltBytes, iterations);
}

async function encryptCredentialsVaultObject(url, apiSecret, pin, forceFallback = false) {
  const salt = getRandomBytes(16);
  const iv = getRandomBytes(12);
  const keyBytes = await deriveVaultKeyBytes(pin, salt, PBKDF2_ITERATIONS, forceFallback);
  const plainBytes = utf8Encode(JSON.stringify({ url, apiSecret }));

  const subtle = getSubtleCrypto(forceFallback);
  let cipherWithTag;
  if (subtle) {
    const aesKey = await subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt']);
    const encrypted = await subtle.encrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, aesKey, plainBytes);
    cipherWithTag = new Uint8Array(encrypted);
  } else {
    cipherWithTag = aes256GcmEncryptPure(keyBytes, iv, plainBytes);
  }

  return {
    v: 1,
    alg: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iter: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ct: bytesToBase64(cipherWithTag)
  };
}

async function saveEncryptedCredentialsVault(url, apiSecret, pin) {
  const vaultObj = await encryptCredentialsVaultObject(url, apiSecret, pin);
  localStorage.setItem(STORAGE_KEY_ENCRYPTED_VAULT, JSON.stringify(vaultObj));
  localStorage.removeItem(LEGACY_PLAINTEXT_URL_KEY);
}

async function decryptCredentialsVaultFromObject(vaultObj, pin, forceFallback = false) {
  if (!vaultObj || vaultObj.v !== 1 || !vaultObj.salt || !vaultObj.iv || !vaultObj.ct) {
    throw new Error('Cofre cifrado inexistente o corrupto.');
  }
  const iterations = Math.max(100000, Math.min(600000, Number(vaultObj.iter) || PBKDF2_ITERATIONS));
  const salt = base64ToBytes(vaultObj.salt);
  const iv = base64ToBytes(vaultObj.iv);
  const cipherWithTag = base64ToBytes(vaultObj.ct);
  const keyBytes = await deriveVaultKeyBytes(pin, salt, iterations, forceFallback);

  const subtle = getSubtleCrypto(forceFallback);
  let plainBytes;
  if (subtle) {
    const aesKey = await subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
    const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, aesKey, cipherWithTag);
    plainBytes = new Uint8Array(decrypted);
  } else {
    plainBytes = aes256GcmDecryptPure(keyBytes, iv, cipherWithTag);
  }

  const parsed = JSON.parse(utf8Decode(plainBytes));
  if (!parsed || typeof parsed.url !== 'string' || typeof parsed.apiSecret !== 'string') {
    throw new Error('Estructura interna del cofre inválida.');
  }
  return { url: parsed.url, apiSecret: parsed.apiSecret };
}

async function decryptCredentialsVault(pin) {
  const raw = localStorage.getItem(STORAGE_KEY_ENCRYPTED_VAULT);
  if (!raw) throw new Error('No hay cofre configurado.');
  const vaultObj = JSON.parse(raw);
  return decryptCredentialsVaultFromObject(vaultObj, pin);
}

function hasEncryptedVault() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENCRYPTED_VAULT);
    if (!raw) return false;
    const obj = JSON.parse(raw);
    return Boolean(obj && obj.v === 1 && obj.salt && obj.iv && obj.ct);
  } catch (_) {
    return false;
  }
}

function isCloudVaultUnlocked() {
  return Boolean(
    unlockedCloudCredentials &&
    typeof unlockedCloudCredentials.url === 'string' &&
    unlockedCloudCredentials.url.length > 0 &&
    typeof unlockedCloudCredentials.apiSecret === 'string' &&
    unlockedCloudCredentials.apiSecret.length >= 24
  );
}

function clearEncryptedVault() {
  unlockedCloudCredentials = null;
  localStorage.removeItem(STORAGE_KEY_ENCRYPTED_VAULT);
  localStorage.removeItem(LEGACY_PLAINTEXT_URL_KEY);
}

function clearSensitiveCloudInputs() {
  if (unlockVaultPinInput) unlockVaultPinInput.value = '';
  if (cloudScriptUrlInput) cloudScriptUrlInput.value = '';
  if (cloudApiSecretInput) cloudApiSecretInput.value = '';
  if (cloudVaultPinInput) cloudVaultPinInput.value = '';
}


// ==========================================
// SINCRONIZACIÓN BLINDADA CON GOOGLE SHEETS (OFFLINE-FIRST)
// ==========================================

function formatSyncTime(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return '';
  }
}

function updateCloudStatusUI() {
  const vaultExists = hasEncryptedVault();
  const unlocked = isCloudVaultUnlocked();

  if (cloudUnlockPanel) {
    cloudUnlockPanel.style.display = (vaultExists && !unlocked) ? 'block' : 'none';
  }
  if (cloudUnlockedActionsPanel) {
    cloudUnlockedActionsPanel.style.display = (vaultExists && unlocked) ? 'block' : 'none';
  }
  if (cloudSetupPanel) {
    cloudSetupPanel.style.display = !vaultExists ? 'block' : 'none';
  }

  if (cloudStatusDot) {
    cloudStatusDot.className = 'sync-dot';
    if (!vaultExists) {
      cloudStatusDot.classList.add('unconfigured');
    } else if (!unlocked) {
      cloudStatusDot.classList.add(syncPending ? 'pending' : 'locked');
    } else if (isSyncInFlight) {
      cloudStatusDot.classList.add('syncing');
    } else if (syncPending) {
      cloudStatusDot.classList.add('pending');
    } else {
      cloudStatusDot.classList.add('synced');
    }
  }

  if (cloudStatusLabel) {
    if (!vaultExists) {
      cloudStatusLabel.textContent = '☁️ Nube';
    } else if (!unlocked) {
      cloudStatusLabel.textContent = syncPending ? '🔒 Pendiente' : '🔒 Protegido';
    } else if (isSyncInFlight) {
      cloudStatusLabel.textContent = '☁️ Sincronizando...';
    } else if (syncPending) {
      cloudStatusLabel.textContent = '☁️ Pendiente';
    } else {
      cloudStatusLabel.textContent = '🛡️ Sincronizado';
    }
  }

  if (cloudSyncStatusInfo) {
    if (!vaultExists) {
      cloudSyncStatusInfo.textContent = 'Estado: Sin configurar (guardando solo en este navegador).';
    } else if (!unlocked) {
      const pendingNote = syncPending ? ' Hay cambios locales pendientes que se enviarán al desbloquear.' : '';
      cloudSyncStatusInfo.textContent = `Estado: 🔒 Cofre cifrado con AES-256-GCM bloqueado.${pendingNote}`;
    } else if (isSyncInFlight) {
      cloudSyncStatusInfo.textContent = 'Estado: Firmando petición con HMAC-SHA256 y sincronizando...';
    } else if (syncPending) {
      const lastTxt = lastSyncTimestamp ? ` · Última conexión: ${formatSyncTime(lastSyncTimestamp)}` : '';
      cloudSyncStatusInfo.textContent = `Estado: Cambios guardados en local pendientes de enviar (se subirán al tener internet)${lastTxt}`;
    } else {
      const lastTxt = lastSyncTimestamp ? formatSyncTime(lastSyncTimestamp) : 'recién verificado';
      const doneDays = getTotalCompletedDays();
      const activeWeights = Array.isArray(weightHistory) ? weightHistory.filter(e => e && !e.deleted).length : 0;
      cloudSyncStatusInfo.textContent = `Estado: ✓ Sincronizado (${doneDays} días terminados · ${activeWeights} pesos en histórico · ${lastTxt})`;
    }
  }
}

function scheduleCloudSync() {
  localMutationSeq += 1;
  syncPending = true;
  localStorage.setItem(STORAGE_KEY_SYNC_PENDING, 'true');
  updateCloudStatusUI();

  if (!isCloudVaultUnlocked()) return;

  if (cloudSyncTimer) {
    clearTimeout(cloudSyncTimer);
  }
  cloudSyncTimer = setTimeout(() => {
    cloudSyncTimer = null;
    syncWithGoogleSheets({ silent: true });
  }, 1500);
}

function buildClientSyncPayload(options = { includePlanRows: true }) {
  const shouldSendRows = Boolean(options.includePlanRows && isCustomData);
  return {
    plan: {
      updatedAt: planUpdatedAt || 0,
      isCustomData: Boolean(isCustomData),
      rows: shouldSendRows ? workoutData : []
    },
    progress: {
      cycleId: currentCycleId,
      cycleUpdatedAt: cycleUpdatedAt || 0,
      resetAt: progressResetAt || 0,
      completedDays: completedDays,
      completedChecks: checksMeta,
      sessionWeights: sessionWeights
    },
    weightHistory: weightHistory
  };
}

function mergeKeyMapByUpdatedAt(localMap, serverMap) {
  const result = {};
  const l = localMap || {};
  const s = serverMap || {};

  Object.keys(s).forEach(k => {
    result[k] = s[k];
  });

  Object.keys(l).forEach(k => {
    const lVal = l[k];
    const sVal = result[k];
    if (!sVal) {
      result[k] = lVal;
      return;
    }
    const lTime = (lVal && typeof lVal === 'object') ? (Number(lVal.updatedAt || lVal.timestamp) || 0) : 0;
    const sTime = (sVal && typeof sVal === 'object') ? (Number(sVal.updatedAt || sVal.timestamp) || 0) : 0;
    if (lTime > sTime) {
      result[k] = lVal;
    }
  });

  return result;
}

function applyMergedCloudState(serverData) {
  if (!serverData || !serverData.ok) return;

  // 1. Planificación (con validación defensiva de tipos y límites)
  const sPlan = serverData.plan;
  if (sPlan && Array.isArray(sPlan.rows) && sPlan.rows.length > 0) {
    const sPlanTime = Number(sPlan.updatedAt) || 0;
    if (sPlanTime > (planUpdatedAt || 0) || (!isCustomData && sPlan.isCustomData)) {
      workoutData = sPlan.rows.slice(0, MAX_IMPORT_ROWS).map(r => ({
        semana: r && r.semana !== undefined ? String(r.semana).slice(0, 40) : '1',
        sesion: r && r.sesion !== undefined ? String(r.sesion).slice(0, 60) : 'Dia 1',
        bloque_a: r && r.bloque_a !== undefined ? String(r.bloque_a).slice(0, 800) : '',
        bloque_b: r && r.bloque_b !== undefined ? String(r.bloque_b).slice(0, 800) : '',
        bloque_c: r && r.bloque_c !== undefined ? String(r.bloque_c).slice(0, 800) : '',
        rpe: r && r.rpe !== undefined ? String(r.rpe).slice(0, 20) : '-'
      }));
      isCustomData = Boolean(sPlan.isCustomData);
      planUpdatedAt = sPlanTime;
      if (isCustomData) {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(workoutData));
      } else {
        localStorage.removeItem(STORAGE_KEY_DATA);
      }
      localStorage.setItem(STORAGE_KEY_PLAN_UPDATED_AT, String(planUpdatedAt));
    }
  }

  // 2. Histórico de Pesos (unión determinista por ID + normalización limpia)
  const historyMap = {};
  (weightHistory || []).forEach(entry => {
    if (entry && entry.id) historyMap[entry.id] = entry;
  });

  (serverData.weightHistory || []).slice(0, 2000).forEach(sEntry => {
    if (!sEntry || !sEntry.id) return;
    const cleanName = extractBaseExerciseName(sEntry.prescription || sEntry.exerciseName || sEntry.exerciseKey || '');
    const cleanKey = normalizeExerciseKey(cleanName);
    const normalizedServerEntry = {
      id: String(sEntry.id).slice(0, 80),
      cycleId: Number(sEntry.cycleId) || 1,
      exerciseName: (cleanName || String(sEntry.exerciseName || '')).slice(0, 150),
      exerciseKey: (cleanKey || String(sEntry.exerciseKey || '')).slice(0, 150),
      prescription: String(sEntry.prescription || cleanName || '').slice(0, 300),
      weight: String(sEntry.weight || '').slice(0, 80),
      week: String(sEntry.week || '1').slice(0, 40),
      session: String(sEntry.session || 'Dia 1').slice(0, 60),
      deleted: Boolean(sEntry.deleted),
      timestamp: Number(sEntry.timestamp) || Date.now(),
      updatedAt: Number(sEntry.updatedAt || sEntry.timestamp) || 0
    };

    const localEntry = historyMap[normalizedServerEntry.id];
    const lTime = localEntry ? (Number(localEntry.updatedAt || localEntry.timestamp) || 0) : -1;
    if (!localEntry || normalizedServerEntry.updatedAt >= lTime) {
      historyMap[normalizedServerEntry.id] = normalizedServerEntry;
    }
  });

  weightHistory = Object.keys(historyMap)
    .map(id => historyMap[id])
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  saveWeightHistory();

function filterLocalMapByResetAt(mapObj, resetAt) {
  if (!mapObj || typeof mapObj !== 'object') return {};
  if (!resetAt || resetAt <= 0) return mapObj;
  const out = {};
  Object.keys(mapObj).forEach(k => {
    const v = mapObj[k];
    const t = (v && typeof v === 'object') ? (Number(v.updatedAt || v.timestamp) || 0) : 0;
    if (t >= resetAt) out[k] = v;
  });
  return out;
}

  // 3. Progreso Actual (fusión aditiva por fecha sin perder días completados entre distintos ciclos/navegadores)
  const sProg = serverData.progress;
  if (sProg && typeof sProg === 'object') {
    const sCycle = Number(sProg.cycleId) || 1;
    const sCycleTime = Number(sProg.cycleUpdatedAt) || 0;
    const sResetAt = Number(sProg.resetAt) || 0;
    const effectiveResetAt = Math.max(progressResetAt || 0, sResetAt);

    currentCycleId = Math.max(currentCycleId || 1, sCycle);
    cycleUpdatedAt = Math.max(cycleUpdatedAt || 0, sCycleTime);
    progressResetAt = effectiveResetAt;

    completedDays = filterLocalMapByResetAt(
      mergeKeyMapByUpdatedAt(completedDays, sProg.completedDays),
      effectiveResetAt
    );
    checksMeta = filterLocalMapByResetAt(
      mergeKeyMapByUpdatedAt(checksMeta, sProg.completedChecks),
      effectiveResetAt
    );
    sessionWeights = filterLocalMapByResetAt(
      mergeKeyMapByUpdatedAt(sessionWeights, sProg.sessionWeights),
      effectiveResetAt
    );

    // Reconstruir completedChecks activo a partir de checksMeta
    completedChecks = {};
    Object.keys(checksMeta).forEach(k => {
      if (checksMeta[k] && checksMeta[k].checked) {
        completedChecks[k] = true;
      }
    });

    localStorage.setItem(STORAGE_KEY_CYCLE_ID, String(currentCycleId));
    localStorage.setItem(STORAGE_KEY_CYCLE_UPDATED_AT, String(cycleUpdatedAt));
    localStorage.setItem(STORAGE_KEY_PROGRESS_RESET_AT, String(progressResetAt));
    localStorage.setItem(STORAGE_KEY_COMPLETED_DAYS, JSON.stringify(completedDays));
    saveChecks();
    saveSessionWeights();
  }

  // 4. Vincular automáticamente pesos del Histórico_Pesos a su casilla de sesión correspondiente (sin bloqueo por cycleId)
  workoutData.forEach(row => {
    ['A', 'B', 'C'].forEach(blockLetter => {
      const col = `bloque_${blockLetter.toLowerCase()}`;
      const list = parseExerciseBlock(row[col]);
      list.forEach((item, idx) => {
        const slotKey = getWeightSlotKey(row.semana, row.sesion, blockLetter, idx);
        const existingSlot = sessionWeights[slotKey];
        if (!existingSlot || (!existingSlot.weight && !existingSlot.deleted)) {
          const matchEntry = weightHistory.find(e =>
            !e.deleted &&
            String(e.week).trim() === String(row.semana).trim() &&
            String(e.session).trim() === String(row.sesion).trim() &&
            e.exerciseKey === item.exerciseKey &&
            e.weight
          );
          if (matchEntry) {
            sessionWeights[slotKey] = {
              weight: matchEntry.weight,
              historyId: matchEntry.id,
              deleted: false,
              updatedAt: Number(matchEntry.updatedAt || matchEntry.timestamp) || Date.now()
            };
          }
        }
      });
    });
  });
  saveSessionWeights();

  // Si el día actual pasó a estar completado y el filtro de pendientes está activo, avanzar al siguiente pendiente
  if (hideCompleted && isDayCompleted(currentWeek, currentSession)) {
    const next = getNextPendingDay();
    if (next) {
      currentWeek = next.semana;
      currentSession = next.sesion;
      saveSelection();
    }
  }

  if (activeView === 'history') {
    renderHistoryView();
  } else {
    renderApp();
  }
}

function toAsciiSafeJson(obj) {
  return JSON.stringify(obj).replace(/[\u007f-\uffff]/g, (ch) => {
    return '\\u' + ('0000' + ch.charCodeAt(0).toString(16)).slice(-4);
  });
}

async function buildSignedSyncEnvelope(apiSecret, clientStateObj) {
  const clientStateJson = toAsciiSafeJson(clientStateObj);
  const ts = Date.now();
  const nonce = generateRandomHex(16); // 128 bits aleatorios únicos por petición
  const bodyHash = await sha256Hex(clientStateJson);
  const canonical = `${ts}.${nonce}.${bodyHash}`;
  const sig = await hmacSha256Hex(apiSecret, canonical);

  return {
    action: 'sync',
    auth: { ts, nonce, bodyHash, sig },
    clientStateJson
  };
}

function hasLocalMutationsToPush() {
  return Boolean(
    syncPending ||
    isCustomData ||
    currentCycleId > 1 ||
    Object.keys(completedDays || {}).length > 0 ||
    Object.keys(checksMeta || {}).length > 0 ||
    Object.keys(sessionWeights || {}).length > 0 ||
    (Array.isArray(weightHistory) && weightHistory.length > 0)
  );
}

async function decryptStateFromServer(encObj, apiSecret) {
  if (!encObj || typeof encObj.iv !== 'string' || typeof encObj.ct !== 'string' || typeof encObj.tag !== 'string') {
    throw new Error('Respuesta cifrada del servidor inválida.');
  }
  const expectedTag = await hmacSha256Hex(apiSecret, `TAG.${encObj.iv}.${encObj.ct}`);
  if (expectedTag.toLowerCase() !== encObj.tag.toLowerCase()) {
    throw new Error('No autorizado (la clave API_SECRET_KEY introducida no coincide con la guardada en Google Sheets).');
  }

  const encKeyHex = await hmacSha256Hex(apiSecret, `ENC_KEY.${encObj.iv}`);
  const cipherBytes = base64ToBytes(encObj.ct);
  const plainBytes = new Uint8Array(cipherBytes.length);
  let ksBytes = null;

  for (let i = 0; i < cipherBytes.length; i++) {
    const offsetInBlock = i & 31;
    if (offsetInBlock === 0) {
      const blockIdx = i >>> 5;
      ksBytes = sha256Pure(utf8Encode(`${encKeyHex}.${blockIdx}`));
    }
    plainBytes[i] = cipherBytes[i] ^ ksBytes[offsetInBlock];
  }

  return JSON.parse(utf8Decode(plainBytes));
}

async function buildSignedGetUrl(url, apiSecret) {
  const ts = Date.now();
  const nonce = generateRandomHex(16);
  const canonical = `GET.${ts}.${nonce}`;
  const sig = await hmacSha256Hex(apiSecret, canonical);
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}ts=${ts}&nonce=${nonce}&sig=${sig}`;
}

async function sendSignedSyncRequest(url, apiSecret) {
  // 1. Si el navegador tiene datos o cambios locales (pesos, días completados, checks o Excel),
  // los subimos primero mediante POST firmado con HMAC-SHA256 a doPost(e).
  if (hasLocalMutationsToPush()) {
    const fullPayload = buildClientSyncPayload({ includePlanRows: true });
    const postEnvelope = await buildSignedSyncEnvelope(apiSecret, fullPayload);
    const postEnvelopeStr = JSON.stringify(postEnvelope);

    try {
      const postResp = await fetch(url, {
        method: 'POST',
        redirect: 'follow',
        body: postEnvelopeStr
      });
      if (postResp.ok) {
        const postData = await postResp.json();
        if (postData && postData.ok && postData.plan) {
          return postData;
        }
      }
    } catch (postErr) {
      const msg = String(postErr && postErr.message ? postErr.message : postErr);
      if (!/failed to fetch|networkerror|load failed/i.test(msg)) {
        throw postErr;
      }
    }
  }

  // 2. Descargar el estado completo: intentamos primero GET con firma corta (?ts=...&nonce=...&sig=...)
  // compatible con v13 y v15, y si el navegador/proxy rechaza parámetros en la URL, usamos la URL base limpia (encryptedState).
  let getResp;
  try {
    const signedGetUrl = await buildSignedGetUrl(url, apiSecret);
    getResp = await fetch(signedGetUrl, {
      method: 'GET',
      redirect: 'follow'
    });
  } catch (_) {
    getResp = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });
  }

  if (!getResp.ok) {
    throw new Error(`HTTP ${getResp.status}`);
  }

  const getData = await getResp.json();
  if (getData && getData.ok === false) {
    throw new Error(getData.error || 'Solicitud rechazada por Google Sheets.');
  }
  if (getData && getData.ok && getData.apiSecretConfigured === false) {
    throw new Error(getData.status || 'Falta configurar API_SECRET_KEY en Propiedades de secuencia de comandos.');
  }

  if (getData && getData.ok && getData.encryptedState) {
    const decrypted = await decryptStateFromServer(getData.encryptedState, apiSecret);
    return {
      ok: true,
      serverTime: decrypted.serverTime || Date.now(),
      plan: decrypted.plan,
      progress: decrypted.progress,
      weightHistory: decrypted.weightHistory
    };
  }

  if (getData && getData.ok && getData.plan) {
    return getData;
  }

  throw new Error(
    'Tu Google Sheet respondió sin enviar los datos (tiene una versión anterior del código en Apps Script). ' +
    'Pulsa abajo "📋 Copiar código blindado", pégalo en Apps Script → Guardar → Administrar implementaciones → ✏️ Editar → Versión: Nueva versión → Implementar.'
  );
}

async function syncWithGoogleSheets(options = { silent: true }) {
  if (!isCloudVaultUnlocked()) return false;
  if (isSyncInFlight) return false;

  const { url, apiSecret } = unlockedCloudCredentials;
  isSyncInFlight = true;
  const seqAtStart = localMutationSeq;
  updateCloudStatusUI();

  try {
    const data = await sendSignedSyncRequest(url, apiSecret);
    if (!data || !data.ok) {
      throw new Error((data && data.error) || 'Respuesta rechazada por el servidor.');
    }

    applyMergedCloudState(data);

    lastSyncTimestamp = Date.now();
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, String(lastSyncTimestamp));

    if (localMutationSeq === seqAtStart) {
      syncPending = false;
      localStorage.setItem(STORAGE_KEY_SYNC_PENDING, 'false');
    } else {
      scheduleCloudSync();
    }

    if (!options.silent) {
      showToast('¡Sincronizado y verificado con Google Sheets!');
    }
    return true;
  } catch (err) {
    const rawErrMsg = String(err && err.message ? err.message : err);
    let diagDetail = '';
    if (/failed to fetch|networkerror|load failed/i.test(rawErrMsg)) {
      try {
        const probeResp = await fetch(url, { method: 'GET', redirect: 'follow' });
        const probeText = await probeResp.text();
        diagDetail = `\n\n🔎 Diagnóstico GET (HTTP ${probeResp.status}): ${probeText.slice(0, 220)}`;
      } catch (probeErr) {
        const probeMsg = String(probeErr && probeErr.message ? probeErr.message : probeErr);
        diagDetail = `\n\n🔎 Diagnóstico GET también falló (${probeMsg}). Verifica haber borrado el cofre y pegado la URL /exec exacta.`;
      }
    }
    const safeDetail = (rawErrMsg + diagDetail)
      .replace(/https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec/gi, '[URL_PROTEGIDA]');
    console.warn('Sincronización diferida o rechazada:', safeDetail);
    isSyncInFlight = false;
    updateCloudStatusUI();
    if (cloudSyncStatusInfo) {
      cloudSyncStatusInfo.textContent = `⚠️ Error al sincronizar: ${safeDetail}`;
    }
    if (!options.silent) {
      alert(
        '⚠️ Motivo del error: ' + safeDetail + '\n\n' +
        'Verifica:\n' +
        '1. Que la clave API_SECRET_KEY en la app sea exactamente la misma que guardaste en Apps Script (Configuración del proyecto → Propiedades de secuencia de comandos).\n' +
        '2. Haber elegido "Versión: Nueva versión" y "Usuarios con acceso: Cualquier persona" al implementar en Apps Script.'
      );
    }
    return false;
  } finally {
    if (isSyncInFlight) {
      isSyncInFlight = false;
      updateCloudStatusUI();
    }
  }
}

const APPS_SCRIPT_CODE_FOR_CLIPBOARD = `const SHEET_PLAN = 'Planificacion';
const SHEET_HISTORY = 'Historico_Pesos';
const SHEET_PROGRESS = 'Progreso_Actual';

const MAX_PAYLOAD_BYTES = 250 * 1024;
const MAX_AUTH_SKEW_MS = 5 * 60 * 1000;
const MAX_PLAN_ROWS = 500;
const MAX_HISTORY_ROWS = 2000;

const DEFAULT_PLAN_ROWS = [
  { semana: '1', sesion: 'Dia 1', bloque_a: 'Sentadilla trasera con barra 4x6', bloque_b: 'Press banca plano 3x8\\nRemo con barra 3x10', bloque_c: 'Plancha abdominal 3x45s\\nElevaciones de piernas 3x12', rpe: '7' },
  { semana: '1', sesion: 'Dia 2', bloque_a: 'Peso muerto convencional 3x5', bloque_b: 'Press militar con barra 3x8\\nDominadas asistidas 3x8', bloque_c: 'Paseo del granjero 3x30m\\nFace pull en polea 3x15', rpe: '7.5' },
  { semana: '1', sesion: 'Dia 3', bloque_a: 'Hip thrust con barra 4x8', bloque_b: 'Press inclinado con mancuernas 3x10\\nJalón al pecho agarre neutro 3x10', bloque_c: 'Press pallof 3x12\\nCurl de bíceps con barra 3x12', rpe: '7' },
  { semana: '2', sesion: 'Dia 1', bloque_a: 'Sentadilla trasera con barra 4x6 (+2.5kg)', bloque_b: 'Press banca plano 3x8\\nRemo con barra 3x10', bloque_c: 'Plancha abdominal 3x50s\\nElevaciones de piernas 3x15', rpe: '7.5' },
  { semana: '2', sesion: 'Dia 2', bloque_a: 'Peso muerto convencional 3x5 (+5kg)', bloque_b: 'Press militar con barra 3x8\\nDominadas 3x8', bloque_c: 'Paseo del granjero 3x35m\\nFace pull en polea 3x15', rpe: '8' },
  { semana: '2', sesion: 'Dia 3', bloque_a: 'Hip thrust con barra 4x8 (+5kg)', bloque_b: 'Press inclinado con mancuernas 3x10\\nJalón al pecho agarre neutro 3x10', bloque_c: 'Press pallof 3x12\\nCurl de bíceps con barra 3x12', rpe: '7.5' },
  { semana: '3', sesion: 'Dia 1', bloque_a: 'Sentadilla trasera con barra 4x5 (+5kg)', bloque_b: 'Press banca plano 4x6\\nRemo con barra 4x8', bloque_c: 'Ab wheel rollout 3x10\\nElevaciones de piernas 3x15', rpe: '8' },
  { semana: '3', sesion: 'Dia 2', bloque_a: 'Peso muerto convencional 3x4 (+7.5kg)', bloque_b: 'Press militar con barra 4x6\\nDominadas lastradas 3x6', bloque_c: 'Paseo del granjero 3x40m\\nFace pull en polea 3x20', rpe: '8.5' },
  { semana: '3', sesion: 'Dia 3', bloque_a: 'Hip thrust con barra 4x6 (+10kg)', bloque_b: 'Press inclinado con mancuernas 4x8\\nJalón al pecho agarre neutro 4x8', bloque_c: 'Press pallof 3x15\\nCurl martillo con mancuernas 3x12', rpe: '8' },
  { semana: '4', sesion: 'Dia 1', bloque_a: 'Sentadilla trasera con barra 3x5 (carga ligera)', bloque_b: 'Press banca plano 3x6\\nRemo con mancuerna 3x8', bloque_c: 'Plancha abdominal 3x30s', rpe: '6' },
  { semana: '4', sesion: 'Dia 2', bloque_a: 'Peso muerto convencional 2x5 (carga ligera)', bloque_b: 'Press militar con mancuernas 3x8\\nJalón al pecho 3x10', bloque_c: 'Face pull en polea 3x12', rpe: '6' },
  { semana: '4', sesion: 'Dia 3', bloque_a: 'Hip thrust con barra 3x8 (carga ligera)', bloque_b: 'Press banca con mancuernas 3x10\\nRemo en polea baja 3x10', bloque_c: 'Paseo del granjero 2x30m', rpe: '6' }
];

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

  if (typeof params.sig === 'string' && params.sig.length > 0) {
    const authCheck = verifySignedGetRequest(params, secret.trim());
    if (!authCheck.valid) {
      return jsonResponse({ ok: false, error: authCheck.reason });
    }
    return jsonResponse({
      ok: true,
      apiSecretConfigured: true,
      serverTime: Date.now(),
      plan: currentState.plan,
      progress: currentState.progress,
      weightHistory: currentState.weightHistory
    });
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
      return jsonResponse({ ok: false, error: 'Solicitud rechazada (tamano invalido).' });
    }

    const secret = PropertiesService.getScriptProperties().getProperty('API_SECRET_KEY');
    if (!secret || secret.trim().length < 24) {
      return jsonResponse({
        ok: false,
        error: 'Falta configurar API_SECRET_KEY en Configuracion del proyecto -> Propiedades de secuencia de comandos.'
      });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (_) {
      return jsonResponse({ ok: false, error: 'Formato JSON invalido.' });
    }

    const authCheck = verifySignedRequest(payload, secret.trim());
    if (!authCheck.valid) {
      return jsonResponse({ ok: false, error: authCheck.reason });
    }

    let clientState;
    try {
      clientState = JSON.parse(payload.clientStateJson);
    } catch (_) {
      return jsonResponse({ ok: false, error: 'Estado de cliente invalido.' });
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
    return jsonResponse({ ok: false, error: 'Error interno al procesar sincronizacion.' });
  } finally {
    if (lock) { try { lock.releaseLock(); } catch (_) {} }
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
    return { valid: false, reason: 'No autorizado (nonce invalido).' };
  }
  if (!/^[a-f0-9]{64}$/.test(bodyHash) || !/^[a-f0-9]{64}$/.test(sig)) {
    return { valid: false, reason: 'No autorizado (formato de firma invalido).' };
  }

  const computedBodyHex = bytesToHex(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payload.clientStateJson, Utilities.Charset.UTF_8)
  );
  if (!constantTimeEquals(computedBodyHex, bodyHash)) {
    return { valid: false, reason: 'No autorizado (integridad de datos fallida).' };
  }

  const canonical = String(ts) + '.' + nonce + '.' + computedBodyHex;
  const computedSigHex = bytesToHex(
    Utilities.computeHmacSha256Signature(canonical, secret, Utilities.Charset.UTF_8)
  );
  if (!constantTimeEquals(computedSigHex, sig)) {
    return { valid: false, reason: 'No autorizado (clave secreta incorrecta).' };
  }

  const cache = CacheService.getScriptCache();
  const nonceKey = 'nonce_' + nonce.toLowerCase();
  if (cache && cache.get(nonceKey)) {
    return { valid: false, reason: 'No autorizado (solicitud duplicada detectada).' };
  }
  if (cache) cache.put(nonceKey, '1', 360);

  return { valid: true };
}

function verifySignedGetRequest(params, secret) {
  const ts = Number(params && params.ts);
  const nonce = String((params && params.nonce) || '');
  const sig = String((params && params.sig) || '').toLowerCase();

  if (!ts || !isFinite(ts) || Math.abs(Date.now() - ts) > MAX_AUTH_SKEW_MS) {
    return { valid: false, reason: 'No autorizado (marca de tiempo expirada o reloj desajustado).' };
  }
  if (!/^[a-f0-9]{24,64}$/i.test(nonce) || !/^[a-f0-9]{64}$/.test(sig)) {
    return { valid: false, reason: 'No autorizado (formato de firma invalido).' };
  }

  const canonical = 'GET.' + String(ts) + '.' + nonce;
  const computedSigHex = bytesToHex(
    Utilities.computeHmacSha256Signature(canonical, secret, Utilities.Charset.UTF_8)
  );
  if (!constantTimeEquals(computedSigHex, sig)) {
    return { valid: false, reason: 'No autorizado (clave secreta incorrecta).' };
  }

  const cache = CacheService.getScriptCache();
  const nonceKey = 'nonce_' + nonce.toLowerCase();
  if (cache && cache.get(nonceKey)) {
    return { valid: false, reason: 'No autorizado (solicitud duplicada detectada).' };
  }
  if (cache) cache.put(nonceKey, '1', 360);

  return { valid: true };
}

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toAsciiJson(obj) {
  return JSON.stringify(obj).replace(/[\\u007f-\\uffff]/g, function(ch) {
    return '\\\\u' + ('0000' + ch.charCodeAt(0).toString(16)).slice(-4);
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
    out += ('0' + (byteArray[i] & 0xff).toString(16)).slice(-2);
  }
  return out;
}

function constantTimeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function sanitizeSheetCellText(value, maxLen) {
  let str = String(value === null || value === undefined ? '' : value).replace(/\\0/g, '').trim();
  if (maxLen && str.length > maxLen) str = str.slice(0, maxLen);
  if (/^[=+\\-@\\t\\r]/.test(str)) {
    if (/^[=@]/.test(str) || /(http|import|image|hyperlink|query|webservice|\\()/i.test(str)) {
      str = str.replace(/^[=+\\-@\\t\\r]+/, '').trim();
    }
  }
  return str;
}

function toSafeSheetCell(value, maxLen) {
  const clean = sanitizeSheetCellText(value, maxLen);
  return /^[=+\\-@\\t\\r]/.test(clean) ? ("'" + clean) : clean;
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
  return {
    plan: outPlan,
    progress: {
      cycleId: Math.max(1, parseInt(rawProg.cycleId, 10) || 1),
      cycleUpdatedAt: Math.max(0, Number(rawProg.cycleUpdatedAt) || 0),
      resetAt: Math.max(0, Number(rawProg.resetAt) || 0),
      completedDays: sanitizeRecordMap(rawProg.completedDays, 500),
      completedChecks: sanitizeRecordMap(rawProg.completedChecks, 2500),
      sessionWeights: sanitizeRecordMap(rawProg.sessionWeights, 2500)
    },
    weightHistory: outHistory
  };
}

function sanitizeRecordMap(obj, maxKeys) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  Object.keys(obj).slice(0, maxKeys).forEach(k => {
    const cleanKey = sanitizeSheetCellText(k, 120);
    const val = obj[k];
    if (!cleanKey || val === null || val === undefined) return;
    if (typeof val === 'boolean') {
      out[cleanKey] = { completed: val, checked: val, timestamp: 1, updatedAt: 1 };
      return;
    }
    if (typeof val === 'object') {
      const item = {};
      if ('completed' in val) item.completed = Boolean(val.completed);
      if ('checked' in val) item.checked = Boolean(val.checked);
      if ('deleted' in val) item.deleted = Boolean(val.deleted);
      if ('weight' in val) item.weight = sanitizeSheetCellText(val.weight, 80);
      if ('historyId' in val) item.historyId = val.historyId ? sanitizeSheetCellText(val.historyId, 80) : null;
      if ('timestamp' in val) item.timestamp = Math.max(0, Number(val.timestamp) || 0);
      if ('updatedAt' in val) item.updatedAt = Math.max(0, Number(val.updatedAt || val.timestamp) || 1);
      out[cleanKey] = item;
    }
  });
  return out;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ensureSheetsExist(ss) {
  const defs = [
    [SHEET_PLAN, ['Semana', 'Sesion', 'Bloque A', 'Bloque B', 'Bloque C', 'RPE', 'Completado']],
    [SHEET_HISTORY, ['Fecha', 'Ejercicio_Normalizado', 'Peso', 'Semana', 'Sesion', 'Prescripcion_Original', 'Ciclo', 'Timestamp_MS', 'UpdatedAt_MS', 'ID_Registro', 'Eliminado']],
    [SHEET_PROGRESS, ['Clave', 'Valor_JSON', 'Actualizado_MS']]
  ];
  defs.forEach(([name, headers]) => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(headers);
      sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    } else if (name === SHEET_PLAN) {
      const col7 = String(sh.getRange(1, 7, 1, 1).getValues()[0][0] || '').trim();
      if (!col7) {
        sh.getRange(1, 7, 1, 1).setValues([['Completado']]);
        sh.getRange(1, 7, 1, 1).setFontWeight('bold');
      }
    }
  });
}

function readFullSheetState(ss) {
  const progressSheet = ss.getSheetByName(SHEET_PROGRESS);
  const metaMap = {};
  if (progressSheet && progressSheet.getLastRow() > 1) {
    progressSheet.getRange(2, 1, progressSheet.getLastRow() - 1, 3).getValues().forEach(r => {
      const k = fromSafeSheetCell(r[0]).trim();
      if (!k) return;
      try { metaMap[k] = { value: r[1] !== '' ? JSON.parse(fromSafeSheetCell(r[1])) : null, updatedAt: Number(r[2]) || 0 }; } catch (_) {}
    });
  }
  const planSheet = ss.getSheetByName(SHEET_PLAN);
  const planRows = [];
  const planDoneMap = {};
  if (planSheet && planSheet.getLastRow() > 1) {
    planSheet.getRange(2, 1, planSheet.getLastRow() - 1, 7).getValues().forEach(r => {
      const sem = fromSafeSheetCell(r[0]).trim();
      const ses = fromSafeSheetCell(r[1]).trim();
      if (!sem && !ses) return;
      const cSem = sanitizeSheetCellText(sem, 40) || '1';
      const cSes = sanitizeSheetCellText(ses, 60) || 'Dia 1';
      planRows.push({
        semana: cSem,
        sesion: cSes,
        bloque_a: sanitizeSheetCellText(fromSafeSheetCell(r[2]), 800),
        bloque_b: sanitizeSheetCellText(fromSafeSheetCell(r[3]), 800),
        bloque_c: sanitizeSheetCellText(fromSafeSheetCell(r[4]), 800),
        rpe: sanitizeSheetCellText(fromSafeSheetCell(r[5]), 20) || '-'
      });
      const doneRaw = fromSafeSheetCell(r[6]).trim().toUpperCase();
      if (doneRaw === 'SI' || doneRaw === 'SÍ' || doneRaw === 'TRUE' || doneRaw === '1' || doneRaw === '✓') {
        planDoneMap[cSem + '__' + cSes] = { completed: true, timestamp: 1, updatedAt: 1 };
      }
    });
  }
  const planMeta = (metaMap['plan_meta'] && metaMap['plan_meta'].value) || { updatedAt: 0, isCustomData: false, signature: '' };
  const sig = JSON.stringify(planRows);
  let planUpdatedAt = Number(planMeta.updatedAt) || 0;
  let planIsCustom = Boolean(planMeta.isCustomData);
  if (planRows.length > 0 && sig !== planMeta.signature) { planUpdatedAt = Date.now(); planIsCustom = true; }

  const historySheet = ss.getSheetByName(SHEET_HISTORY);
  const weightHistory = [];
  if (historySheet && historySheet.getLastRow() > 1) {
    historySheet.getRange(2, 1, historySheet.getLastRow() - 1, 11).getValues().forEach((r, idx) => {
      const exName = sanitizeSheetCellText(fromSafeSheetCell(r[1]), 150);
      const weightVal = sanitizeSheetCellText(fromSafeSheetCell(r[2]), 80);
      if (!exName && !weightVal && !r[9]) return;
      const ts = Number(r[7]) || Date.now();
      const delRaw = fromSafeSheetCell(r[10]).trim().toUpperCase();
      weightHistory.push({
        id: sanitizeSheetCellText(fromSafeSheetCell(r[9]), 80) || ('sheet_row_' + (idx + 2)),
        cycleId: Number(r[6]) || 1,
        exerciseKey: normalizeKey(exName),
        exerciseName: exName,
        prescription: sanitizeSheetCellText(fromSafeSheetCell(r[5]) || exName, 300),
        weight: weightVal,
        week: sanitizeSheetCellText(fromSafeSheetCell(r[3]), 40) || '1',
        session: sanitizeSheetCellText(fromSafeSheetCell(r[4]), 60) || 'Dia 1',
        timestamp: ts,
        updatedAt: Number(r[8]) || ts,
        deleted: delRaw === 'SI' || delRaw === 'TRUE' || delRaw === '1'
      });
    });
  }
  const pData = (metaMap['progress_state'] && metaMap['progress_state'].value) || {};
  return {
    plan: { updatedAt: planUpdatedAt, isCustomData: planIsCustom, rows: planRows },
    progress: { cycleId: Number(pData.cycleId) || 1, cycleUpdatedAt: Number(pData.cycleUpdatedAt) || 0, resetAt: Number(pData.resetAt) || 0, completedDays: mergeMap(planDoneMap, pData.completedDays || {}), completedChecks: pData.completedChecks || {}, sessionWeights: pData.sessionWeights || {} },
    weightHistory: weightHistory
  };
}

function mergeStates(serverState, clientState) {
  let mergedPlan = serverState.plan;
  const cPlan = clientState.plan;
  const serverEmpty = !serverState.plan.rows || serverState.plan.rows.length === 0;
  if (cPlan && Array.isArray(cPlan.rows) && cPlan.rows.length > 0) {
    if (serverEmpty || (Number(cPlan.updatedAt) || 0) > (Number(serverState.plan.updatedAt) || 0)) {
      mergedPlan = { updatedAt: Number(cPlan.updatedAt) || Date.now(), isCustomData: Boolean(cPlan.isCustomData), rows: cPlan.rows.slice(0, MAX_PLAN_ROWS) };
    }
  } else if (serverEmpty) {
    mergedPlan = { updatedAt: 0, isCustomData: false, rows: DEFAULT_PLAN_ROWS };
  }
  const hMap = {};
  (serverState.weightHistory || []).forEach(e => { if (e && e.id) hMap[e.id] = e; });
  ((clientState && clientState.weightHistory) || []).forEach(c => {
    if (!c || !c.id) return;
    const ex = hMap[c.id];
    const cT = Number(c.updatedAt || c.timestamp) || 0;
    const sT = ex ? (Number(ex.updatedAt || ex.timestamp) || 0) : -1;
    if (!ex || cT >= sT) hMap[c.id] = c;
  });
  const sProg = serverState.progress || { cycleId: 1, cycleUpdatedAt: 0, resetAt: 0, completedDays: {}, completedChecks: {}, sessionWeights: {} };
  const cProg = (clientState && clientState.progress) || { cycleId: 1, cycleUpdatedAt: 0, resetAt: 0, completedDays: {}, completedChecks: {}, sessionWeights: {} };
  const sC = Number(sProg.cycleId) || 1, cC = Number(cProg.cycleId) || 1;
  const effReset = Math.max(Number(sProg.resetAt) || 0, Number(cProg.resetAt) || 0);
  const mergedProg = {
    cycleId: Math.max(sC, cC),
    cycleUpdatedAt: Math.max(Number(sProg.cycleUpdatedAt) || 0, Number(cProg.cycleUpdatedAt) || 0),
    resetAt: effReset,
    completedDays: filterReset(mergeMap(sProg.completedDays, cProg.completedDays), effReset),
    completedChecks: filterReset(mergeMap(sProg.completedChecks, cProg.completedChecks), effReset),
    sessionWeights: filterReset(mergeMap(sProg.sessionWeights, cProg.sessionWeights), effReset)
  };
  return {
    plan: mergedPlan,
    progress: mergedProg,
    weightHistory: Object.keys(hMap).map(k => hMap[k]).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, MAX_HISTORY_ROWS)
  };
}

function filterReset(m, rAt) {
  if (!m || typeof m !== 'object') return {};
  if (!rAt || rAt <= 0) return m;
  const out = {};
  Object.keys(m).forEach(k => {
    const v = m[k];
    if (((Number(v && (v.updatedAt || v.timestamp)) || 0)) >= rAt) out[k] = v;
  });
  return out;
}

function mergeMap(sMap, cMap) {
  const res = Object.assign({}, sMap || {});
  Object.keys(cMap || {}).forEach(k => {
    const cV = cMap[k], sV = res[k];
    if (!sV || ((Number(cV && (cV.updatedAt || cV.timestamp)) || 0) >= (Number(sV && (sV.updatedAt || sV.timestamp)) || 0))) res[k] = cV;
  });
  return res;
}

function writeFullSheetState(ss, state) {
  const planSheet = ss.getSheetByName(SHEET_PLAN);
  if (planSheet.getLastRow() > 1) planSheet.getRange(2, 1, planSheet.getLastRow() - 1, 7).clearContent();
  const pRows = (state.plan && state.plan.rows) || [];
  const dMap = (state.progress && state.progress.completedDays) || {};
  if (pRows.length > 0) {
    const pMatrix = pRows.map(r => {
      const dKey = String(r.semana || '').trim() + '__' + String(r.sesion || '').trim();
      return [toSafeSheetCell(r.semana, 40), toSafeSheetCell(r.sesion, 60), toSafeSheetCell(r.bloque_a, 800), toSafeSheetCell(r.bloque_b, 800), toSafeSheetCell(r.bloque_c, 800), toSafeSheetCell(r.rpe, 20), (dMap[dKey] && dMap[dKey].completed) ? 'SI' : ''];
    });
    const pRange = planSheet.getRange(2, 1, pMatrix.length, 7);
    pRange.setNumberFormat('@');
    pRange.setValues(pMatrix);
  }

  const hSheet = ss.getSheetByName(SHEET_HISTORY);
  if (hSheet.getLastRow() > 1) hSheet.getRange(2, 1, hSheet.getLastRow() - 1, 11).clearContent();
  const hList = state.weightHistory || [];
  if (hList.length > 0) {
    const tz = ss.getSpreadsheetTimeZone() || 'Europe/Madrid';
    const hMatrix = hList.map(e => [Utilities.formatDate(new Date(Number(e.timestamp) || Date.now()), tz, 'yyyy-MM-dd HH:mm'), toSafeSheetCell(e.exerciseName, 150), toSafeSheetCell(e.weight, 80), toSafeSheetCell(e.week, 40), toSafeSheetCell(e.session, 60), toSafeSheetCell(e.prescription, 300), Number(e.cycleId) || 1, Number(e.timestamp) || 0, Number(e.updatedAt || e.timestamp) || 0, toSafeSheetCell(e.id, 80), e.deleted ? 'SI' : '']);
    hSheet.getRange(2, 1, hMatrix.length, 6).setNumberFormat('@');
    hSheet.getRange(2, 1, hMatrix.length, 11).setValues(hMatrix);
  }

  const prSheet = ss.getSheetByName(SHEET_PROGRESS);
  if (prSheet.getLastRow() > 1) prSheet.getRange(2, 1, prSheet.getLastRow() - 1, 3).clearContent();
  const now = Date.now();
  const pMeta = { updatedAt: (state.plan && state.plan.updatedAt) || now, isCustomData: Boolean(state.plan && state.plan.isCustomData), signature: JSON.stringify(pRows) };
  prSheet.getRange(2, 1, 2, 2).setNumberFormat('@');
  prSheet.getRange(2, 1, 2, 3).setValues([['plan_meta', JSON.stringify(pMeta), pMeta.updatedAt], ['progress_state', JSON.stringify(state.progress || {}), now]]);
  try { SpreadsheetApp.flush(); } catch (_) {}
}

function normalizeKey(t) {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/\\s+/g, ' ').trim();
}`;

function copyTextToClipboard(text, successMsg) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showToast(successMsg))
      .catch(() => fallbackCopyText(text, successMsg));
  } else {
    fallbackCopyText(text, successMsg);
  }
}

function copyAppsScriptCode() {
  copyTextToClipboard(
    APPS_SCRIPT_CODE_FOR_CLIPBOARD,
    '¡Código blindado copiado! Pégalo en Extensiones → Apps Script'
  );
}

function fallbackCopyText(text, successMsg = '¡Texto copiado al portapapeles!') {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(successMsg);
  } catch (_) {
    alert('No se pudo copiar automáticamente al portapapeles en este navegador.');
  }
  document.body.removeChild(ta);
}
