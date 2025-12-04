// clock.js
// Ce fichier utilise des modules ES6 et Day.js pour une architecture propre.

/**
 * Interface pour les données des Zmanim.
 * @typedef {Object} Zmanim
 * @property {string} sunrise - Heure du lever du soleil (Netz).
 * @property {string} sunset - Heure du coucher du soleil (Shkiah).
 * @property {string} [alotHashahar] - Heure de l'aube (Alot Hashahar) (estimée).
 */

/**
 * Type pour le mode de compte à rebours actuel.
 * @typedef {'netz' | 'sunset'} CountdownMode
 */

const LAT = 31.7946859557658;
const LNG = 35.21589133333333; // Correction de la longitude pour Jérusalem (cette valeur était négative et incorrecte)
const TIMEZONE = 'Asia/Jerusalem';

/** @type {dayjs.Dayjs | null} */
let netzTime = null;
/** @type {dayjs.Dayjs | null} */
let sunsetTime = null;
/** @type {dayjs.Dayjs | null} */
let alotHashaharTime = null;
/** @type {CountdownMode} */
let mode = 'netz';
let countdownInterval = 0; // Utilisation de number pour l'ID d'intervalle

// --- Fonctions d'Utilité (DRY Principle) ---

/**
 * Obtient un élément HTML par son ID.
 * @param {string} id
 * @returns {HTMLElement}
 * @throws {Error} Si l'élément n'est pas trouvé.
 */
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with ID "${id}" not found.`);
    }
    return element;
}

/**
 * Met à jour le texte d'un élément.
 * @param {string} id
 * @param {string} text
 */
function updateText(id, text) {
    try {
        getElement(id).textContent = text;
    } catch (e) {
        console.error(`Failed to update element ${id}:`, e);
    }
}

/**
 * Gère les erreurs d'API et met à jour l'interface.
 * @param {string} message
 */
function handleApiError(message) {
    console.error(message);
    updateText('countdown-netz', 'שגיאת API');
    updateText('countdown-sunset', 'שגיאת API');
    updateText('alot-hashahar-time', 'שגיאה');
    updateText('sunrise-time', 'שגיאה');
    updateText('sunset-time', 'שגיאה');
}

// --- Logique Horloge Numérique ---

/**
 * Met à jour l'affichage de l'heure et de la date.
 */
function updateClock() {
    const now = dayjs();

    const daysFr = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const monthsFr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

    const dayNameFr = daysFr[now.day()];
    const monthNameFr = monthsFr[now.month()];

    const hh = now.format('HH');
    const mm = now.format('mm');
    const ss = now.format('ss');

    const dd = now.format('DD');
    const yyyy = now.format('YYYY');

    // Utilisation de .innerHTML pour les balises span dans les secondes
    try {
        getElement('current-time').innerHTML = `${hh}:${mm}<span class="regular-seconds">:${ss}</span>`;
        updateText('current-date', `${dayNameFr}, ${dd} ${monthNameFr} ${yyyy}`);
    } catch (e) {
        console.error("Erreur lors de la mise à jour de l'horloge numérique:", e);
    }
}

// --- Logique Swiss Clock Simplifiée (Réduction) ---

/**
 * Initialise l'horloge de fond simplifiée.
 * Réduction drastique du code original tout en conservant l'effet visuel minimal.
 */
function initSimplifiedClock() {
    /** @type {HTMLCanvasElement} */
    const canvas = getElement('clock');
    /** @type {CanvasRenderingContext2D} */
    const ctx = canvas.getContext('2d');

    const sizeCanvas = () => {
        // Redimensionnement pour une haute densité (2x)
        canvas.width = window.innerWidth * 2;
        canvas.height = window.innerHeight * 2;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
    };

    const drawClock = () => {
        const center = { x: canvas.width * 0.5, y: canvas.height * 0.5 };
        const radius = Math.min(canvas.width, canvas.height) * 0.35; // Plus petit et moins envahissant
        const now = dayjs();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Cercle extérieur (Opacité déjà gérée par CSS)
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = radius * 0.005;
        ctx.stroke();

        // Pin central
        ctx.fillStyle = '#999';
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius * 0.02, 0, 2 * Math.PI);
        ctx.fill();

        // Aiguilles (l'heure utilise Day.js)
        const drawHand = (value, total, lengthRatio, thicknessRatio, color) => {
            // L'angle 0 est en haut (12h/60s), donc on utilise Math.PI * 0.5 pour décaler le départ de -90 degrés (haut)
            // L'horloge va dans le sens des aiguilles d'une montre (négatif sur le cercle trigo)
            const angle = (Math.PI * 2) * (value / total) - (Math.PI / 2);

            const handLength = radius * lengthRatio;
            const startX = center.x;
            const startY = center.y;
            const endX = startX + Math.cos(angle) * handLength;
            const endY = startY + Math.sin(angle) * handLength;

            ctx.strokeStyle = color;
            ctx.lineWidth = radius * thicknessRatio;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        };

        // Heure (format 12h)
        const hours = now.hour() % 12 + now.minute() / 60;
        drawHand(hours, 12, 0.5, 0.04, '#000');

        // Minute
        const minutes = now.minute() + now.second() / 60;
        drawHand(minutes, 60, 0.7, 0.025, '#000');

        // Seconde (rouge)
        const seconds = now.second() + now.millisecond() / 1000;
        drawHand(seconds, 60, 0.8, 0.01, '#cd151c');
    };

    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);

    const render = () => {
        drawClock();
        requestAnimationFrame(render);
    };

    render();
}

// --- Logique Zmanim (APIs, gestion des erreurs) ---

/**
 * Calcule l'heure d'Alot Hashahar (72 minutes avant Netz)
 * @param {dayjs.Dayjs} netz
 * @returns {dayjs.Dayjs}
 */
function calculateAlotHashahar(netz) {
    // Alot Hashahar est traditionnellement calculé comme 72 minutes *zmaniot* avant Netz.
    // Ici, nous utilisons l'approximation de 72 minutes fixes pour la simplicité de l'API.
    return netz.subtract(72, 'minutes');
}

/**
 * Démarre le compte à rebours vers une heure cible (Netz ou Sunset).
 * @param {dayjs.Dayjs | null} targetTime
 * @param {CountdownMode} targetId
 */
function startCountdown(targetTime, targetId) {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    if (!targetTime) return;

    const $countdownElement = getElement(`countdown-${targetId}`);

    const tick = () => {
        const now = dayjs();
        const diffMs = targetTime.diff(now);

        // Si le compte à rebours est terminé
        if (diffMs <= 0) {
            $countdownElement.textContent = 'עבר הזמן';
            $countdownElement.style.color = 'red';
            clearInterval(countdownInterval);

            // Passer au mode suivant après un délai
            setTimeout(() => {
                mode = (targetId === 'netz') ? 'sunset' : 'netz';
                fetchZmanim(mode === 'netz'); // Si on revient à 'netz', on va chercher les zmanim de demain
            }, 5000);
            return;
        }

        const duration = dayjs.duration(diffMs);

        // Si plus d'une heure et demie, ne pas afficher de compte à rebours (évite le spam visuel)
        if (diffMs > 90 * 60 * 1000) {
            $countdownElement.textContent = '--:--:--';
            $countdownElement.style.color = targetId === 'netz' ? 'blue' : 'orange';
            return;
        }

        const h = duration.hours().toString().padStart(2, '0');
        const m = duration.minutes().toString().padStart(2, '0');
        const s = duration.seconds().toString().padStart(2, '0');
        const timeStr = `${h}:${m}:${s}`;

        // Mise à jour de la couleur pour l'urgence
        let color = targetId === 'netz' ? 'blue' : 'orange';
        if (diffMs <= 2 * 60 * 1000) {
            color = 'red';
        } else if (diffMs <= 5 * 60 * 1000) {
            color = 'orange';
        }

        $countdownElement.textContent = timeStr;
        $countdownElement.style.color = color;
    };

    // Pour des raisons d'affichage, un seul compte à rebours actif à la fois
    const otherTargetId = targetId === 'netz' ? 'sunset' : 'netz';
    getElement(`countdown-${otherTargetId}`).textContent = '--:--:--';
    getElement(`countdown-${otherTargetId}`).style.color = otherTargetId === 'netz' ? 'blue' : 'orange';


    tick(); // Premier appel immédiat
    countdownInterval = setInterval(tick, 1000);
}

/**
 * Récupère les horaires de lever/coucher du soleil (Zmanim) via l'API.
 * @param {boolean} [forTomorrow=false] - Récupérer les données pour demain.
 */
async function fetchZmanim(forTomorrow = false) {
    const date = dayjs().add(forTomorrow ? 1 : 0, 'day').format('YYYY-MM-DD');
    const url = `https://api.sunrisesunset.io/json?lat=${LAT}&lng=${LNG}&date=${date}&timezone=${TIMEZONE}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();

        if (!data || !data.results || !data.results.sunrise || !data.results.sunset) {
            throw new Error('Données Zmanim incomplètes ou manquantes dans la réponse API.');
        }

        const { sunrise, sunset } = data.results;
        const baseDate = dayjs(date, 'YYYY-MM-DD'); // Pour s'assurer que l'heure est rattachée à la bonne date

        // Parsing des heures et application de la date correcte
        netzTime = dayjs(`${date} ${sunrise}`, 'YYYY-MM-DD h:mm:ss A');
        sunsetTime = dayjs(`${date} ${sunset}`, 'YYYY-MM-DD h:mm:ss A');
        alotHashaharTime = calculateAlotHashahar(netzTime);

        // Affichage des temps (Format H:mm)
        updateText('alot-hashahar-time', alotHashaharTime.format('H:mm'));
        updateText('sunrise-time', netzTime.format('H:mm'));
        updateText('sunset-time', sunsetTime.format('H:mm'));

        // Déterminer quel compte à rebours démarrer
        const now = dayjs();
        const diffNetz = netzTime.diff(now);
        const diffSunset = sunsetTime.diff(now);

        if (diffNetz > 0) {
            mode = 'netz';
            startCountdown(netzTime, 'netz');
        } else if (diffSunset > 0) {
            mode = 'sunset';
            startCountdown(sunsetTime, 'sunset');
        } else {
            // Après le coucher du soleil, on prépare déjà le compte à rebours pour le Netz de demain
            mode = 'netz';
            fetchZmanim(true);
        }

    } catch (error) {
        handleApiError(`Échec de la récupération des Zmanim: ${error.message}`);
    }
}

// --- Logique du Calendrier Juif (Réutilisation avec fetch) ---

/**
 * Récupère les données du calendrier juif (Daf Yomi, Parasha)
 */
async function fetchJewishCalendarData() {
    try {
        const response = await fetch('https://www.sefaria.org/api/calendars');
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();

        const dafYomi = data.calendar_items.find(item => item.title?.he === 'דף יומי');
        updateText('dailyDaf', dafYomi?.displayValue?.he || 'לא נמצא דף');

        const parashaItem = data.calendar_items.find(item => item.title?.he === 'פרשת השבוע');
        updateText('parashaName', parashaItem?.displayValue?.he || 'לא נמצאה פרשה');

    } catch (error) {
        console.error('שגיאה בשליפת מידע Sefaria:', error);
        updateText('dailyDaf', 'שגיאה');
        updateText('parashaName', 'שגיאה');
    }
}

/**
 * Récupère le calendrier hébreu.
 */
async function fetchHebrewDate() {
    try {
        const today = dayjs();
        const gy = today.year();
        const gm = today.month() + 1; // months are 0-indexed
        const gd = today.date();

        const response = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${gy}&gm=${gm}&gd=${gd}&g2h=1`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();

        if (data && data.hebrew) {
            updateText('dateHeb', data.hebrew);
        } else {
            updateText('dateHeb', 'תאריך לא זמין');
        }
    } catch (error) {
        console.error('שגיאה בשליפת התאריך העברי:', error);
        updateText('dateHeb', 'שגיאה');
    }
}

// --- Initialisation ---

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialisation des éléments visuels et du temps
        updateClock();
        setInterval(updateClock, 1000);

        // Initialisation de l'horloge simplifiée
        initSimplifiedClock();

        // Récupération des données du calendrier
        fetchJewishCalendarData();
        fetchHebrewDate();

        // Récupération et gestion des Zmanim/Compte à rebours
        fetchZmanim();
    } catch (error) {
        console.error("Erreur fatale lors de l'initialisation:", error);
    }
});
