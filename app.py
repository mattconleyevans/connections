# app.py
from flask import Flask, request, jsonify
from openai import OpenAI
import random
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Set your OpenAI API key
client = OpenAI()

# Function to generate categories
def generate_categories(theme):
    prompt = (
        f"Generate a list of 4 distinct categories of increasing difficulty based on the theme '{theme}', "
        "and provide 4 words that belong in each category. You should be inspired by the categories in the New York Times game Connections. You must not repeat words across multiple categories."
        "The output should follow this exact structure: "
        "Category 1: [category name], Words: [word1, word2, word3, word4] "
        "Category 2: [category name], Words: [word1, word2, word3, word4] "
        "Category 3: [category name], Words: [word1, word2, word3, word4] "
        "Category 4: [category name], Words: [word1, word2, word3, word4]"
    )

    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    categories = completion.choices[0].message.content.split('Category ')[1:]  # Split by category number
    category_list = []

    for category in categories:
        lines = category.split(', Words: ')
        category_name = lines[0].split(': ')[1].strip('[]')
        words = [word.strip('[] \n') for word in lines[1].split(', ')]
        category_list.append({'category': category_name, 'words': words})

    return category_list


@app.route('/generate_game', methods=['POST'])
def generate_game():
    data = request.json
    theme = data.get('theme', 'general')

    categories = generate_categories(theme)

    # Shuffle the words
    all_words = [word for cat in categories for word in cat['words']]
    random.shuffle(all_words)

    return jsonify({
        'categories': categories,
        'shuffled_words': all_words
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0')