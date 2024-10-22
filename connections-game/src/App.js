import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [theme, setTheme] = useState('');
    const [shuffledWords, setShuffledWords] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedWords, setSelectedWords] = useState([]);
    const [foundCategories, setFoundCategories] = useState([]);
    const [message, setMessage] = useState('');
    const [triesLeft, setTriesLeft] = useState(4);
    const [gameOver, setGameOver] = useState(false);

    // Darker color mapping based on the original order of the categories in the JSON response
    const categoryColors = ['#F9E256', '#A0C16B', '#B7C8EB', '#B48EAD']; // Matching colors from image

    const generateGame = async () => {
        try {
            // Reset everything on generating a new game
            setShuffledWords([]);
            setCategories([]);
            setSelectedWords([]);
            setFoundCategories([]);
            setTriesLeft(4);
            setGameOver(false);
            setMessage('');

            const response = await fetch('http://localhost:5001/generate_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ theme }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch game data: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Clean the words to remove unwanted characters
            const cleanedShuffledWords = data.shuffled_words.map((word) =>
                word.trim().replace(/[\[\]\n]/g, '').toUpperCase() // Capitalized words
            );

            // Clean the category words too
            const cleanedCategories = data.categories.map((category) => ({
                category: category.category.trim(),
                words: category.words.map((word) => word.trim().replace(/[\[\]\n]/g, '').toUpperCase()), // Capitalized words
            }));

            setCategories(cleanedCategories);
            setShuffledWords(cleanedShuffledWords);
        } catch (error) {
            console.error('Error details:', error);
            setMessage(`Error: Could not generate game. ${error.message}`);
        }
    };

    const selectWord = (word) => {
        if (gameOver || selectedWords.includes(word) || foundCategories.some(cat => cat.words.includes(word))) return;

        const newSelectedWords = [...selectedWords, word];
        setSelectedWords(newSelectedWords);

        // Automatically check selection when 4 words are chosen
        if (newSelectedWords.length === 4) {
            checkSelection(newSelectedWords);
        }
    };

    const deselectWord = (word) => {
        const newSelectedWords = selectedWords.filter(selected => selected !== word);
        setSelectedWords(newSelectedWords);
    };

    const unselectAll = () => {
        setSelectedWords([]); // Clear all selected words
    };

    const shuffleWords = () => {
        if (gameOver) return;
        const shuffled = [...shuffledWords].sort(() => Math.random() - 0.5);
        setShuffledWords(shuffled);
    };

    const checkSelection = (selected) => {
        const matchedCategory = categories.find(category =>
            selected.every(word => category.words.includes(word))
        );

        if (matchedCategory) {
            setFoundCategories([...foundCategories, matchedCategory]);
            setMessage(`Category found: ${matchedCategory.category}`);
        } else {
            setMessage('No match, try again.');
            setTriesLeft(triesLeft - 1);
        }

        setSelectedWords([]);
    };

    // End the game when out of tries and highlight all buttons in their correct colors
    useEffect(() => {
        if (triesLeft === 0) {
            setGameOver(true);
            // Highlight all buttons in their respective category colors
            categories.forEach((category, index) => {
                category.words.forEach(word => {
                    const button = document.querySelector(`button[data-word="${word}"]`);
                    if (button) {
                        button.style.backgroundColor = categoryColors[index];
                        button.style.color = 'black'; // Ensuring text stays black
                    }
                });
            });
            setMessage('Game over! No more tries left.');
        }
        if (foundCategories.length === 4) {
            setGameOver(true);
            setMessage('You matched all categories! You win!');
        }
    }, [triesLeft, foundCategories]);

    // Highlight the relevant buttons in the relevant color based on the original JSON order
    const renderWordButton = (word) => {
        const isFound = foundCategories.some(category => category.words.includes(word));
        const isSelected = selectedWords.includes(word);
        const matchedCategoryIndex = categories.findIndex(category => category.words.includes(word));
        const color = matchedCategoryIndex >= 0 ? categoryColors[matchedCategoryIndex] : '';

        const buttonClass = isFound ? 'found' : isSelected ? 'selected' : '';

        return (
            <button
                key={word}
                data-word={word} // Use this attribute to target button for final colorization
                onClick={() => (isSelected ? deselectWord(word) : selectWord(word))}
                disabled={isFound || gameOver} // Disable clicking after game over
                className={`word-button ${buttonClass}`}
                style={isFound ? { backgroundColor: color, color: 'black', border: '2px solid black' } : { border: '2px solid black' }}
            >
                {word}
            </button>
        );
    };

    const getCategoryColor = (index) => {
        return categoryColors[index];
    };

    // Reset the game entirely, clearing the theme and letting the user start again
    const resetGame = () => {
        setTheme(''); // Clear theme
        setShuffledWords([]); // Clear words
        setCategories([]); // Clear categories
        setSelectedWords([]); // Clear selections
        setFoundCategories([]); // Clear found categories
        setMessage(''); // Reset message
        setTriesLeft(4); // Reset tries
        setGameOver(false); // Reset game over state
    };

    return (
        <div className="App">
            <h1>Connections Game</h1>
            <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Enter a theme"
                disabled={gameOver} // Disable input when the game is over
            />
            <button onClick={generateGame}>Generate Game</button>
            <button onClick={shuffleWords} disabled={shuffledWords.length === 0 || triesLeft === 0}>Shuffle</button>
            <button onClick={unselectAll} disabled={selectedWords.length === 0}>Unselect</button>

            {/* Word Grid */}
            <div className="game-board">
                {shuffledWords.map((word) => renderWordButton(word))}
            </div>

            {/* Show "Tries Left" only after the grid is generated */}
            {shuffledWords.length > 0 && (
                <div className="tries">Tries Left: {triesLeft}</div>
            )}

            {/* Display Category Names in Rows at the Bottom */}
            <div className="categories-found">
                {foundCategories.map((category, index) => (
                    <div
                        key={index}
                        className="category-row"
                        style={{ backgroundColor: getCategoryColor(categories.indexOf(category)), color: 'black' }} // Darker colors and black text
                    >
                        <h2>{category.category.toUpperCase()}</h2> {/* Displaying the category name */}
                    </div>
                ))}
                {/* Show the remaining correct categories if the game is over */}
                {gameOver && triesLeft === 0 && (
                    categories
                        .filter(category => !foundCategories.includes(category))
                        .map((category, index) => (
                            <div
                                key={`missed-${index}`}
                                className="category-row"
                                style={{ backgroundColor: getCategoryColor(categories.indexOf(category)), color: 'black' }}
                            >
                                <h2>{category.category.toUpperCase()}</h2> {/* Displaying the missed category names */}
                            </div>
                        ))
                )}
            </div>

            <div className="message">{message}</div>

            {gameOver && (
                <button className="play-again-button" onClick={resetGame}>
                    Play Again
                </button>
            )}
        </div>
    );
}

export default App;
