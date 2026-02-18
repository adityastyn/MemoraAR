const systemStatus = document.getElementById("system-status");
const personCard = document.querySelector("#person-card");
const medCard = document.querySelector("#med-card");
const orientationText = document.querySelector("#orientation-text");
const canvas = document.getElementById("canvas");

// AR Text Fields
const arName = document.querySelector("#ar-name");
const arRelation = document.querySelector("#ar-relation");
const arNote = document.querySelector("#ar-note");
const cardBorder = document.querySelector("#card-border");

let video;
let hideTimeout;

function initAR() {
    video = document.querySelector('video');
    if (!video) {
        setTimeout(initAR, 500);
        return;
    }
    
    // Scan every 2 seconds
    setInterval(scanEnvironment, 2000);
    
    // Update orientation every minute
    setInterval(updateOrientation, 60000);
    updateOrientation();

    setupInteractions();
}

async function scanEnvironment() {
    // 1. Pause scanning if Med Alert is active
    if (medCard.getAttribute("visible") === "true") return;
    if (!video) return;

    // 2. Capture Frame
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"));
    const formData = new FormData();
    formData.append("file", blob, "scan.jpg");

    try {
        const response = await fetch("http://127.0.0.1:8000/recognize", {
            method: "POST",
            body: formData
        });
        const data = await response.json();

        // 3. Logic: Show or Hide Card
        if (data.status === "success") {
            showKnownPerson(data);
        } else if (data.status === "unknown") {
            showUnknownPerson();
        } else {
            // "no_face" or "error" -> Hide everything
            hideCard();
        }
    } catch (err) {
        console.error("Backend offline");
    }
}

// --- STATE 1: KNOWN PERSON (Cyan) ---
function showKnownPerson(data) {
    clearTimeout(hideTimeout);
    personCard.setAttribute("visible", "true");

    arName.setAttribute("value", data.name);
    arName.setAttribute("color", "#00E5FF"); // Cyan
    arRelation.setAttribute("value", data.relation);
    arNote.setAttribute("value", data.note);
    cardBorder.setAttribute("color", "#00E5FF");

    systemStatus.innerText = `Identified: ${data.name}`;
    
    // Keep visible for 5s then hide if no update
    hideTimeout = setTimeout(hideCard, 5000);
}

// --- STATE 2: UNKNOWN PERSON (Red) ---
function showUnknownPerson() {
    clearTimeout(hideTimeout);
    personCard.setAttribute("visible", "true");

    arName.setAttribute("value", "UNKNOWN");
    arName.setAttribute("color", "#FF5252"); // Red
    arRelation.setAttribute("value", "Not in database");
    arNote.setAttribute("value", "Caution advised");
    cardBorder.setAttribute("color", "#FF5252");

    systemStatus.innerText = "Unknown Person Detected";
    
    hideTimeout = setTimeout(hideCard, 5000);
}

// --- STATE 3: HIDE ---
function hideCard() {
    personCard.setAttribute("visible", "false");
    systemStatus.innerText = "Scanning...";
}

// --- UTILITIES ---
function updateOrientation() {
    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const message = `Home | ${days[now.getDay()]}, ${timeString}`;
    orientationText.setAttribute("value", message);
}

function setupInteractions() {
    const btnTaken = document.querySelector("#btn-taken");
    if(btnTaken){
        btnTaken.addEventListener('click', function() {
            medCard.setAttribute("visible", "false");
            systemStatus.innerText = "Medication Confirmed.";
            setTimeout(() => systemStatus.innerText = "Scanning...", 3000);
        });
        // Hover effects for mouse
        btnTaken.addEventListener('mouseenter', () => btnTaken.setAttribute('scale', '1.1 1.1 1.1'));
        btnTaken.addEventListener('mouseleave', () => btnTaken.setAttribute('scale', '1 1 1'));
    }
}

// Global Window Triggers
window.triggerMedication = function() {
    personCard.setAttribute("visible", "false"); 
    medCard.setAttribute("visible", "true");
    systemStatus.innerText = "ALARM: Medication";
};

window.triggerOrientation = function() {
    updateOrientation();
    systemStatus.innerText = "Location Updated";
};

window.addEventListener('load', initAR);