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


// Load the dictionary when the website starts
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

        document.getElementById("remaining").textContent =
            target;

        document.getElementById("message").textContent =
            "Lexispace v0.2 — Dictionary loaded (" +
            dictionary.size + " words).";

        console.log(
            "Lexispace v0.2 — Dictionary loaded:",
            dictionary.size,
            "words."
        );
    })
    .catch(error => {

        dictionaryLoaded = false;

        document.getElementById("message").textContent =
            "Lexispace v0.2 — Dictionary ERROR: " +
            error.message;

        console.error(
            "Lexispace v0.2 — Dictionary ERROR:",
            error
        );
    });

// Convert a word into its 26-bit parity representation
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


// Convert a mask back into letters
function maskToWord(mask) {

    let result = "";

    for (let i = 0; i < 26; i++) {

        if (mask & (1 << i)) {
            result += String.fromCharCode(97 + i);
        }
    }

    return result.toUpperCase();
}


// Add a word to the game
function addWord() {

    const input = document.getElementById("wordInput");

    const word = input.value.trim().toLowerCase();

    // Don't do anything if the input is empty
    if (word === "") {
        return;
    }


    // Check whether the dictionary has loaded
    if (!dictionaryLoaded) {

        document.getElementById("message").textContent =
            "Dictionary is not loaded.";
        
        return;
    }


    // Check whether the word is in the dictionary
    if (!dictionary.has(word)) {

        document.getElementById("message").textContent =
            "Not in the dictionary.";

        input.value = "";

        return;
    }


    // The target word itself is not allowed
    if (word === target.toLowerCase()) {

        document.getElementById("message").textContent =
            "You cannot play the target word.";

        input.value = "";

        return;
    }


    // XOR the new word with the current state
    currentMask ^= wordToMask(word);

    playedWords.push(word);


    // Now that the player has made a move,
    // show the parity representation of the remaining state.
    document.getElementById("remaining").textContent =
        maskToWord(currentMask);


    // Add the word to the list
    const list = document.getElementById("wordList");

    const item = document.createElement("li");

    item.textContent = word;

    list.appendChild(item);

    input.value = "";


    // Have we reached zero?
    if (currentMask === 0) {

        document.getElementById("message").textContent =
            "YOU WIN!";

    } else {

        document.getElementById("message").textContent =
            "";
    }
}
