// ==========================================
// Lexispace v0.4
// ==========================================


// ==========================================
// GAME SETUP
// ==========================================

const target = "HAPPINESS";

let dictionary = new Set();

let dictionaryLoaded = false;

let currentMask = wordToMask(target);

let playedWords = [];


// ==========================================
// SOLVER SETTINGS
// ==========================================

// Maximum number of states the solver is allowed
// to examine before giving up.
//
// This prevents a difficult puzzle from freezing
// the browser.
const SOLVER_STATE_LIMIT = 1000000;


// This will contain one representative English
// word for each unique parity mask.
let solverWords = [];


// ==========================================
// LOAD DICTIONARY
// ==========================================

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
            "Lexispace v0.4 — Dictionary loaded (" +
            dictionary.size + " words).";


        console.log(
            "Lexispace v0.4 — Dictionary loaded:",
            dictionary.size,
            "words."
        );


        // Prepare the solver's list of unique masks.
        buildSolverDictionary();

    })
    .catch(error => {

        dictionaryLoaded = false;

        document.getElementById("message").textContent =
            "Lexispace v0.4 — Dictionary ERROR: " +
            error.message;

        console.error(
            "Lexispace v0.4 — Dictionary ERROR:",
            error
        );
    });


// ==========================================
// WORD → 26-BIT MASK
// ==========================================

function wordToMask(word) {

    let mask = 0;

    word = word.toLowerCase();

    for (let letter of word) {

        let position =
            letter.charCodeAt(0) - 97;

        if (position >= 0 && position < 26) {

            mask ^= (1 << position);
        }
    }

    return mask;
}


// ==========================================
// MASK → LETTERS
// ==========================================

function maskToWord(mask) {

    let result = "";

    for (let i = 0; i < 26; i++) {

        if (mask & (1 << i)) {

            result +=
                String.fromCharCode(97 + i);
        }
    }

    return result.toUpperCase();
}


// ==========================================
// BUILD SOLVER DICTIONARY
// ==========================================

function buildSolverDictionary() {

    /*
     * Many English words have exactly the same
     * parity mask.
     *
     * For example, if two different words both
     * produce mask 12345, the solver doesn't
     * need to consider both during the search.
     *
     * We keep one representative word.
     */

    const maskToWordMap = new Map();


    for (const word of dictionary) {

        // The target itself is forbidden as a move.
        if (word === target.toLowerCase()) {
            continue;
        }


        const mask = wordToMask(word);


        // A word whose mask is zero does nothing.
        // It can never help a shortest solution.
        if (mask === 0) {
            continue;
        }


        if (!maskToWordMap.has(mask)) {

            maskToWordMap.set(mask, word);
        }
    }


    solverWords = [];


    for (const [mask, word] of maskToWordMap) {

        solverWords.push({
            mask: mask,
            word: word
        });
    }


    console.log(
        "Lexispace v0.4 — Solver dictionary:",
        solverWords.length,
        "unique masks."
    );
}


// ==========================================
// ADD WORD TO GAME
// ==========================================

function addWord() {

    const input =
        document.getElementById("wordInput");

    const word =
        input.value.trim().toLowerCase();


    input.focus();


    if (word === "") {
        return;
    }


    if (!dictionaryLoaded) {

        document.getElementById("message").textContent =
            "Lexispace v0.4 — Dictionary is not loaded.";

        return;
    }


    if (!dictionary.has(word)) {

        document.getElementById("message").textContent =
            "Lexispace v0.4 — Not in the dictionary.";

        input.value = "";

        input.focus();

        return;
    }


    if (word === target.toLowerCase()) {

        document.getElementById("message").textContent =
            "Lexispace v0.4 — You cannot play the target word.";

        input.value = "";

        input.focus();

        return;
    }


    currentMask ^= wordToMask(word);

    playedWords.push(word);


    document.getElementById("remaining").textContent =
        maskToWord(currentMask);


    const list =
        document.getElementById("wordList");


    const item =
        document.createElement("li");


    item.textContent = word;

    list.appendChild(item);


    input.value = "";

    input.focus();


    if (currentMask === 0) {

        document.getElementById("message").textContent =
            "Lexispace v0.4 — YOU WIN!";

    } else {

        document.getElementById("message").textContent =
            "Lexispace v0.4 — Word added.";
    }
}


// ==========================================
// ENTER KEY
// ==========================================

document.getElementById("wordInput")
    .addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                addWord();
            }
        }
    );


// ==========================================
// SHUFFLE
// ==========================================

function shuffleLetters() {

    const remainingElement =
        document.getElementById("remaining");


    let letters =
        remainingElement.textContent.split("");


    for (
        let i = letters.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(Math.random() * (i + 1));


        [
            letters[i],
            letters[j]
        ] =
        [
            letters[j],
            letters[i]
        ];
    }


    remainingElement.textContent =
        letters.join("");


    document.getElementById("wordInput").focus();


    document.getElementById("message").textContent =
        "Lexispace v0.4 — Letters shuffled.";
}


// ==========================================
// BIDIRECTIONAL BFS SOLVER
// ==========================================

function solvePuzzle() {

    const result =
        document.getElementById("solverResult");


    result.textContent =
        "Lexispace v0.4 — Solving...";


    if (!dictionaryLoaded) {

        result.textContent =
            "Lexispace v0.4 — Solver cannot run: dictionary not loaded.";

        return;
    }


    if (currentMask === 0) {

        result.textContent =
            "Lexispace v0.4 — Already solved.";

        return;
    }


    const solution =
        bidirectionalBFS(
            currentMask,
            0
        );


    if (solution === null) {

        result.textContent =
            "Lexispace v0.4 — No solution found within search limit.";

        return;
    }


    if (solution.length === 0) {

        result.textContent =
            "Lexispace v0.4 — Already solved.";

        return;
    }


    result.textContent =
        "Lexispace v0.4 — Shortest solution (" +
        solution.length +
        " moves): " +
        solution.join(" → ");
}


// ==========================================
// BIDIRECTIONAL BFS
// ==========================================

function bidirectionalBFS(start, goal) {

    /*
     * Forward search:
     *
     *     start → ...
     *
     * Backward search:
     *
     *     goal ← ...
     *
     * Because XOR is reversible, going backward
     * uses exactly the same operation.
     */


    // If start and goal are identical.
    if (start === goal) {
        return [];
    }


    // ------------------------------------------
    // Forward search data
    // ------------------------------------------

    const forwardQueue = [start];

    let forwardIndex = 0;


    const forwardParent = new Map();

    const forwardMove = new Map();


    forwardParent.set(start, null);


    // ------------------------------------------
    // Backward search data
    // ------------------------------------------

    const backwardQueue = [goal];

    let backwardIndex = 0;


    const backwardParent = new Map();

    const backwardMove = new Map();


    backwardParent.set(goal, null);


    // ------------------------------------------
    // Search
    // ------------------------------------------

    let statesExamined = 0;


    while (
        forwardIndex < forwardQueue.length &&
        backwardIndex < backwardQueue.length
    ) {


        // ======================================
        // Expand one layer from the forward side
        // ======================================

        const forwardLayerEnd =
            forwardQueue.length;


        while (
            forwardIndex < forwardLayerEnd
        ) {

            const state =
                forwardQueue[forwardIndex++];


            statesExamined++;


            if (
                statesExamined >
                SOLVER_STATE_LIMIT
            ) {

                console.log(
                    "Lexispace v0.4 — Solver hit state limit."
                );

                return null;
            }


            for (const entry of solverWords) {

                const next =
                    state ^ entry.mask;


                if (
                    !forwardParent.has(next)
                ) {

                    forwardParent.set(
                        next,
                        state
                    );


                    forwardMove.set(
                        next,
                        entry.word
                    );


                    forwardQueue.push(next);


                    // Did the two searches meet?
                    if (
                        backwardParent.has(next)
                    ) {

                        return reconstructSolution(
                            next,
                            forwardParent,
                            forwardMove,
                            backwardParent,
                            backwardMove
                        );
                    }
                }
            }
        }


        // ======================================
        // Expand one layer from the backward side
        // ======================================

        const backwardLayerEnd =
            backwardQueue.length;


        while (
            backwardIndex < backwardLayerEnd
        ) {

            const state =
                backwardQueue[backwardIndex++];


            statesExamined++;


            if (
                statesExamined >
                SOLVER_STATE_LIMIT
            ) {

                console.log(
                    "Lexispace v0.4 — Solver hit state limit."
                );

                return null;
            }


            for (const entry of solverWords) {

                const next =
                    state ^ entry.mask;


                if (
                    !backwardParent.has(next)
                ) {

                    backwardParent.set(
                        next,
                        state
                    );


                    backwardMove.set(
                        next,
                        entry.word
                    );


                    backwardQueue.push(next);


                    // Did the two searches meet?
                    if (
                        forwardParent.has(next)
                    ) {

                        return reconstructSolution(
                            next,
                            forwardParent,
                            forwardMove,
                            backwardParent,
                            backwardMove
                        );
                    }
                }
            }
        }
    }


    return null;
}


// ==========================================
// RECONSTRUCT THE SOLUTION
// ==========================================

function reconstructSolution(
    meetingPoint,
    forwardParent,
    forwardMove,
    backwardParent,
    backwardMove
) {


    // ------------------------------------------
    // Forward half
    // ------------------------------------------

    const firstHalf = [];

    let current =
        meetingPoint;


    while (
        forwardParent.get(current) !== null
    ) {

        firstHalf.push(
            forwardMove.get(current)
        );


        current =
            forwardParent.get(current);
    }


    firstHalf.reverse();


    // ------------------------------------------
    // Backward half
    // ------------------------------------------

    const secondHalf = [];

    current =
        meetingPoint;


    while (
        backwardParent.get(current) !== null
    ) {

        secondHalf.push(
            backwardMove.get(current)
        );


        current =
            backwardParent.get(current);
    }


    return firstHalf.concat(secondHalf);
}    })
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
