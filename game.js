// ====================
// SECTION 1: GAME STATE
// ====================

const target = "HAPPINESS";
let currentMask = wordToMask(target);
let dictionary = new Set();
let dictionaryLoaded = false;
let playedWords = [];


// ====================
// SECTION 2: DICTIONARY
// ====================

fetch("words_enable.txt")
    .then(response => {
        if (!response.ok) {
            throw new Error("Dictionary could not be loaded.");
        }
        return response.text();
    })
    .then(text => {
        const words = text
            .split(/\r?\n/)
            .map(word => word.trim().toLowerCase())
            .filter(word => word.length > 0);

        dictionary = new Set(words);
        dictionaryLoaded = true;

        document.getElementById("message").textContent =
            "Dictionary loaded: " + dictionary.size + " words.";
    })
    .catch(error => {
        document.getElementById("message").textContent =
            "Error loading dictionary.";
        console.error(error);
    });


// ====================
// SECTION 3: WORD / MASK UTILITIES
// ====================

function wordToMask(word) {
    let mask = 0;

    for (const letter of word.toLowerCase()) {
        const index = letter.charCodeAt(0) - 97;

        if (index >= 0 && index < 26) {
            mask ^= (1 << index);
        }
    }

    return mask;
}

function maskToLetters(mask) {
    let result = "";

    for (let i = 0; i < 26; i++) {
        if (mask & (1 << i)) {
            result += String.fromCharCode(97 + i).toUpperCase();
        }
    }

    return result || "—";
}


// ====================
// SECTION 4: NORMAL GAME
// ====================

function updateRemaining() {
    document.getElementById("remaining").textContent =
        maskToLetters(currentMask);
}

function addWord() {
    if (!dictionaryLoaded) {
        document.getElementById("message").textContent =
            "Dictionary is still loading.";
        return;
    }

    const input = document.getElementById("wordInput");
    const word = input.value.trim().toLowerCase();

    if (word === "") {
        return;
    }

    if (!dictionary.has(word)) {
        document.getElementById("message").textContent =
            "Not in dictionary.";
        return;
    }

    if (word === target.toLowerCase()) {
        document.getElementById("message").textContent =
            "You cannot use the target word.";
        return;
    }

    currentMask ^= wordToMask(word);
    playedWords.push(word);

    const listItem = document.createElement("li");
    listItem.textContent = word;
    document.getElementById("wordList").appendChild(listItem);

    input.value = "";
    input.focus();

    updateRemaining();

    if (currentMask === 0) {
        document.getElementById("message").textContent =
            "Solved!";
    } else {
        document.getElementById("message").textContent = "";
    }
}

function shuffleLetters() {
    const remaining = maskToLetters(currentMask);

    if (remaining === "—") {
        return;
    }

    const letters = remaining.split("");

    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }

    document.getElementById("remaining").textContent =
        letters.join("");
}


// ====================
// SECTION 5: SOLVER
// ====================

// Solver will go here.


// ====================
// SECTION 6: INPUT SETUP
// ====================

document.getElementById("wordInput").addEventListener("keydown", event => {
    if (event.key === "Enter") {
        addWord();
    }
});

document.getElementById("wordInput").focus();

updateRemaining();
