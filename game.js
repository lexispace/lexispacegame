// ====================
// SECTION 1: GAME STATE
// ====================

let target = "";
let currentMask = 0;
let dictionary = new Set();
let dictionaryLoaded = false;
let playedWords = [];
let currentPuzzleId = null;
let puzzles = [];
let currentPuzzleIndex = -1;
// ====================
// SECTION 2: PUZZLES + DICTIONARY
// ====================

function normalizeWord(word) {
    return word.toLowerCase().replace(/[^a-z]/g, "");
}

function loadPuzzle(puzzle) {
    // Keep the original spelling for display, but normalize internally.
    const displayTarget = puzzle.target;
    target = normalizeWord(displayTarget);

    currentPuzzleId = puzzle.id;

    currentPuzzleIndex = puzzle.id !== null
        ? puzzles.findIndex(p => p.id === puzzle.id)
        : -1;

    currentMask = wordToMask(target);
    playedWords = [];

    solverReady = false;
    solverMoves = new Map();

    document.getElementById("target").textContent =
        displayTarget.toUpperCase();

    document.getElementById("puzzleNumber").textContent =
        puzzle.id !== null
            ? `${puzzle.setTitle} — Puzzle ${puzzle.id}`
            : "Random Puzzle";

    document.getElementById("wordList").innerHTML = "";

    document.getElementById("message").textContent = "";
    document.getElementById("solverResult").textContent = "";

    updateRemaining();

    document.getElementById("wordInput").value = "";
    document.getElementById("wordInput").focus();

    // Navigation is available only for curated puzzles.
    document.getElementById("previousPuzzle").style.display =
        currentPuzzleIndex > 0 ? "inline-block" : "none";

    document.getElementById("nextPuzzle").style.display =
        currentPuzzleIndex >= 0 &&
        currentPuzzleIndex < puzzles.length - 1
            ? "inline-block"
            : "none";
}


function loadPuzzleById(id) {
    const puzzle = puzzles.find(p => p.id === id);

    if (!puzzle) {
        console.log("Puzzle not found:", id);
        return;
    }

    loadPuzzle(puzzle);
}


function previousPuzzle() {
    if (currentPuzzleIndex <= 0) {
        return;
    }

    loadPuzzleById(puzzles[currentPuzzleIndex - 1].id);
}


function nextPuzzle() {
    if (
        currentPuzzleIndex < 0 ||
        currentPuzzleIndex >= puzzles.length - 1
    ) {
        return;
    }

    loadPuzzleById(puzzles[currentPuzzleIndex + 1].id);
}


function newPuzzle() {
    const candidates = [...dictionary].filter(
        word => wordToMask(word) !== 0
    );

    if (candidates.length === 0) {
        document.getElementById("message").textContent =
            "No suitable words are available.";
        return;
    }

    const randomTarget =
        candidates[Math.floor(Math.random() * candidates.length)];

    loadPuzzle({
        id: null,
        target: randomTarget,
        setTitle: null
    });
}


// Load the dictionary and curated puzzles.
// Start the game only after both have loaded.

Promise.all([
    fetch("words_enable.txt").then(response => {
        if (!response.ok) {
            throw new Error("Dictionary could not be loaded.");
        }
        return response.text();
    }),

    fetch("puzzles.json").then(response => {
        if (!response.ok) {
            throw new Error("Puzzle data could not be loaded.");
        }
        return response.json();
    })
])
.then(([dictionaryText, puzzleData]) => {
    // Load dictionary.
    const words = dictionaryText
        .split(/\r?\n/)
        .map(word => word.trim().toLowerCase())
        .filter(word => word.length > 0);

    dictionary = new Set(words);
    dictionaryLoaded = true;

    // Flatten the sets into one ordered list of puzzles.
    puzzles = [];

    for (const set of puzzleData.sets) {
        if (
            !Array.isArray(set.words) ||
            !Array.isArray(set.difficulties) ||
            set.words.length !== set.difficulties.length
        ) {
            throw new Error(
                `Invalid puzzle data in set ${set.id}: ` +
                "words and difficulties must be arrays of equal length."
            );
        }

        set.words.forEach((word, index) => {
            puzzles.push({
                id: `${set.id}-${index + 1}`,
                target: word,
                setId: set.id,
                setTitle: set.title,
                description: set.description,
                mode: set.mode,
                difficulty: set.difficulties[index]
            });
        });
    }

    if (puzzles.length === 0) {
        throw new Error("No curated puzzles were found.");
    }

    // Start at the first curated puzzle.
    loadPuzzle(puzzles[0]);

    document.getElementById("message").textContent =
        "Dictionary loaded: " + dictionary.size + " words.";
})
.catch(error => {
    document.getElementById("message").textContent =
        "Error loading game data. Check that words_enable.txt " +
        "and puzzles.json are available and valid.";

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

let solverMoves = new Map();
let solverReady = false;

function buildSolverDictionary() {
    solverMoves = new Map();

    for (const word of dictionary) {
        if (word === target.toLowerCase()) {
            continue;
        }

        const mask = wordToMask(word);

        if (mask === 0) {
            continue;
        }

        if (!solverMoves.has(mask)) {
            solverMoves.set(mask, word);
        }
    }

    solverReady = true;

    console.log("Unique solver masks:", solverMoves.size);
}

function solvePuzzle() {
    const result = document.getElementById("solverResult");

    if (!dictionaryLoaded) {
        result.textContent = "Dictionary is still loading.";
        return;
    }

    if (!solverReady) {
        buildSolverDictionary();
    }

    if (currentMask === 0) {
        result.textContent = "Already solved.";
        return;
    }

    const start = performance.now();
    const solution = bidirectionalBFS(currentMask, 0);
    const time = performance.now() - start;

    if (solution === null) {
        result.textContent = "No solution found.";
        return;
    }

    result.textContent =
        "Solution (" + solution.length + " words): " +
        solution.join(" → ") +
        " | " + time.toFixed(1) + " ms";

    console.log("Solver time:", time.toFixed(1), "ms");
    console.log("Solution:", solution);
}

function bidirectionalBFS(start, goal) {
    const moves = [...solverMoves.entries()];

    const startParent = new Map();
    const goalParent = new Map();

    const startMove = new Map();
    const goalMove = new Map();

    startParent.set(start, null);
    goalParent.set(goal, null);

    let startFrontier = [start];
    let goalFrontier = [goal];

    while (startFrontier.length > 0 && goalFrontier.length > 0) {
        const startResult = expandFrontier(
            startFrontier,
            startParent,
            startMove,
            goalParent,
            moves
        );

        if (startResult.meeting !== null) {
            return reconstructSolution(
                startResult.meeting,
                startParent,
                startMove,
                goalParent,
                goalMove
            );
        }

        startFrontier = startResult.nextFrontier;

        const goalResult = expandFrontier(
            goalFrontier,
            goalParent,
            goalMove,
            startParent,
            moves
        );

        if (goalResult.meeting !== null) {
            return reconstructSolution(
                goalResult.meeting,
                startParent,
                startMove,
                goalParent,
                goalMove
            );
        }

        goalFrontier = goalResult.nextFrontier;
    }

    return null;
}

function expandFrontier(
    frontier,
    parent,
    moveUsed,
    otherParent,
    moves
) {
    const nextFrontier = [];

    for (const state of frontier) {
        for (const [mask, word] of moves) {
            const next = state ^ mask;

            if (parent.has(next)) {
                continue;
            }

            parent.set(next, state);
            moveUsed.set(next, word);

            if (otherParent.has(next)) {
                return {
                    nextFrontier: [],
                    meeting: next
                };
            }

            nextFrontier.push(next);
        }
    }

    return {
        nextFrontier: nextFrontier,
        meeting: null
    };
}

function reconstructSolution(
    meeting,
    startParent,
    startMove,
    goalParent,
    goalMove
) {
    const firstHalf = [];
    let state = meeting;

    while (startParent.get(state) !== null) {
        firstHalf.push(startMove.get(state));
        state = startParent.get(state);
    }

    firstHalf.reverse();

    const secondHalf = [];
    state = meeting;

    while (goalParent.get(state) !== null) {
        secondHalf.push(goalMove.get(state));
        state = goalParent.get(state);
    }

    return firstHalf.concat(secondHalf);
}
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
// ====================
// SECTION 7: EQUIVALENCE FINDER
// ====================

function equivFinder(input) {
    const result = document.getElementById("equivFinderResult");

    if (!dictionaryLoaded) {
        result.textContent = "Dictionary is still loading.";
        return;
    }

    const mask = wordToMask(input);
    const sortBy = document.getElementById("equivFinderSort").value;
const matches = [...dictionary]
    .filter(word => wordToMask(word) === mask);

if (sortBy === "length") {
    matches.sort((a, b) => a.length - b.length || a.localeCompare(b));
} else {
    matches.sort((a, b) => a.localeCompare(b));
}

    result.textContent = matches.length > 0
        ? matches.join("\n")
        : "No matching words found.";
}
