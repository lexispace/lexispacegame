// ==============================
// Lexispace v0.3
// ==============================


// The word we want to delete
const target = "HAPPINESS";

// The dictionary
let dictionary = new Set();

// Whether the dictionary has successfully loaded
let dictionaryLoaded = false;

// The current state of the game
let currentMask = wordToMask(target);

// Words the player has entered
let playedWords = [];


// ==============================
// Load the dictionary
// ==============================

fetch("words_enable.txt")
    .then(response => {

        if (!response.ok) {
            throw new Error(
                "HTTP " + response.status +
                " while loading words_enable.txt"
            );
        }

        return response.text();
    })
    .then(text => {

        const words = text
            .split(/\r?\n/)
            .map(word => word.trim().toLowerCase())
            .filter(word => /^[a-z]+$/.test(word));

        dictionary = new Set(words);
        dictionaryLoaded = true;

        // Show the original target at the beginning
        document.getElementById("remaining").textContent =
            target;

        document.getElementById("message").textContent =
            "Lexispace v0.3 — Dictionary loaded (" +
            dictionary.size + " words).";

        console.log(
            "Lexispace v0.3 — Dictionary loaded:",
            dictionary.size,
            "words."
        );
    })
    .catch(error => {

        dictionaryLoaded = false;

        document.getElementById("message").textContent =
            "Lexispace v0.3 — Dictionary ERROR: " +
            error.message;

        console.error(
            "Lexispace v0.3 — Dictionary ERROR:",
            error
        );
    });


// ==============================
// Convert word to parity mask
// ==============================

function wordToMask(word) {

    let mask = 0;

    word = word.toLowerCase();

    for (let letter of word) {

        let position = letter.charCodeAt(0) - 97;

        if (position >= 0 && position < 26) {
            mask ^= (1 << position);
        }
    }

    return mask;
}


// ==============================
// Convert mask back to letters
// ==============================

function maskToWord(mask) {

    let result = "";

    for (let i = 0; i < 26; i++) {

        if (mask & (1 << i)) {
            result += String.fromCharCode(97 + i);
        }
    }

    return result.toUpperCase();
}


// ==============================
// Add a word
// ==============================

function addWord() {

    const input = document.getElementById("wordInput");

    const word = input.value.trim().toLowerCase();


    // Always put the caret back in the input box
    input.focus();


    // Don't do anything if the input is empty
    if (word === "") {
        return;
    }


    // Check whether dictionary has loaded
    if (!dictionaryLoaded) {

        document.getElementById("message").textContent =
            "Lexispace v0.3 — Dictionary is not loaded.";

        return;
    }


    // Check whether word is in dictionary
    if (!dictionary.has(word)) {

        document.getElementById("message").textContent =
            "Lexispace v0.3 — Not in the dictionary.";

        input.value = "";

        input.focus();

        return;
    }


    // The target itself is not allowed
    if (word === target.toLowerCase()) {

        document.getElementById("message").textContent =
            "Lexispace v0.3 — You cannot play the target word.";

        input.value = "";

        input.focus();

        return;
    }


    // XOR the word with the current state
    currentMask ^= wordToMask(word);

    playedWords.push(word);


    // Display the new state
    document.getElementById("remaining").textContent =
        maskToWord(currentMask);


    // Add word to the list
    const list = document.getElementById("wordList");

    const item = document.createElement("li");

    item.textContent = word;

    list.appendChild(item);


    // Clear the input
    input.value = "";

    // Put the caret back in the input box
    input.focus();


    // Check for victory
    if (currentMask === 0) {

        document.getElementById("message").textContent =
            "Lexispace v0.3 — YOU WIN!";

    } else {

        document.getElementById("message").textContent =
            "Lexispace v0.3 — Word added.";

    }
}


// ==============================
// Press Enter to add word
// ==============================

document.getElementById("wordInput").addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            addWord();
        }
    }
);


// ==============================
// Shuffle the current letters
// ==============================

function shuffleLetters() {

    const remainingElement =
        document.getElementById("remaining");

    let letters =
        remainingElement.textContent.split("");


    // Fisher-Yates shuffle
    for (let i = letters.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [letters[i], letters[j]] =
            [letters[j], letters[i]];
    }


    remainingElement.textContent =
        letters.join("");


    // Keep the caret in the word input
    document.getElementById("wordInput").focus();

    document.getElementById("message").textContent =
        "Lexispace v0.3 — Letters shuffled.";
}
