# app.py
from flask import Flask, request, jsonify
from openai import OpenAI
import random
from dotenv import load_dotenv

app = Flask(__name__)

# Set your OpenAI API key
client = OpenAI()

# Function to generate categories
def generate_categories(theme):
    prompt = f"Generate four distinct categories based on the theme '{theme}', and give 5 words that fit in each category."

    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=prompt,
        max_tokens=100
    )

    # Process response
    categories = response.choices[0].text.strip().split('\n\n')
    category_list = []

    for category in categories:
        lines = category.strip().split('\n')
        category_name = lines[0].strip(':')
        words = [word.strip() for word in lines[1:]]
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
    app.run(debug=True)