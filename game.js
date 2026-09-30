// The word we want to delete
const target = "HAPPINESS";

// The current state of the game
let currentMask = wordToMask(target);

// Words the player has entered
let playedWords = [];


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

    if (word === "") {
        return;
    }

    // XOR the new word with the current state
    currentMask ^= wordToMask(word);

    playedWords.push(word);

    // Update the screen
    document.getElementById("remaining").textContent =
        maskToWord(currentMask);

    const list = document.getElementById("wordList");

    const item = document.createElement("li");
    item.textContent = word;

    list.appendChild(item);

    input.value = "";

    // Have we reached zero?
    if (currentMask === 0) {
        document.getElementById("message").textContent =
            "YOU WIN!";
    }
}
