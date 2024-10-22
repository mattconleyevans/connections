// App.js
import React, { useState } from 'react';
import './App.css';

function App() {
    const [theme, setTheme] = useState('');
    const [shuffledWords, setShuffledWords] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedWords, setSelectedWords] = useState([]);
    const [message, setMessage] = useState('');

    const generateGame = async () => {
        const response = await fetch('http://localhost:5000/generate_game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ theme })
        });

        const data = await response.json();
        setCategories(data.categories);
        setShuffledWords(data.shuffled_words);
    };

    const selectWord = (word) => {
        if (selectedWords.includes(word)) return;
        const newSelectedWords = [...selectedWords, word];
        setSelectedWords(newSelectedWords);

        if (newSelectedWords.length === 4) {
            checkSelection(newSelectedWords);
        }
    };

    const checkSelection = (selected) => {
        const matchedCategory = categories.find(category =>
            selected.every(word => category.words.includes(word))
        );

        if (matchedCategory) {
            setMessage(`You found a match: ${matchedCategory.category}`);
        } else {
            setMessage('No match, try again.');
        }

        setSelectedWords([]);
    };

    return (
        <div className="App">
            <h1>Connections Game</h1>
            <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Enter a theme"
            />
            <button onClick={generateGame}>Generate Game</button>

            <div className="game-board">
                {shuffledWords.map((word, index) => (
                    <button
                        key={index}
                        onClick={() => selectWord(word)}
                        disabled={selectedWords.includes(word)}
                    >
                        {word}
                    </button>
                ))}
            </div>

            <div className="message">{message}</div>
        </div>
    );
}

export default App;