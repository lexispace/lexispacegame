// The word we want to delete
const target = "HAPPINESS";

// The dictionary
let dictionary = new Set();

// The current state of the game
let currentMask;

// Words the player has entered
let playedWords = [];


// Load the dictionary when the website starts
fetch("words-enable.txt")
    .then(response => response.text())
    .then(text => {

        // Turn the text file into a set of words
        const words = text
            .split(/\r?\n/)
            .map(word => word.trim().toLowerCase())
            .filter(word => word !== "");

        dictionary = new Set(words);

        // Start the game
        currentMask = wordToMask(target);

        document.getElementById("remaining").textContent =
            maskToWord(currentMask);

        document.getElementById("message").textContent =
            "Dictionary loaded!";

    })
    .catch(error => {

        document.getElementById("message").textContent =
            "Could not load dictionary.";

        console.error(error);
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
    if (dictionary.size === 0) {

        document.getElementById("message").textContent =
            "Dictionary is still loading.";

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


    // Update the remaining letters
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
