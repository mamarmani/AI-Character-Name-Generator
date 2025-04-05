document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const generateBtn = document.getElementById('generate-btn');
    const resultContainer = document.getElementById('result-container');
    const loadingIndicator = document.getElementById('loading');
    const categorySelect = document.getElementById('category');
    const genderSelect = document.getElementById('gender');
    const descriptionTextarea = document.getElementById('description');
    const descriptionFeedback = document.getElementById('description-feedback');
    const countSelect = document.getElementById('count');

    // Keywords to validate character-related descriptions
    const characterKeywords = [
        'character', 'hero', 'villain', 'protagonist', 'antagonist', 'warrior', 'wizard',
        'knight', 'prince', 'princess', 'king', 'queen', 'sorcerer', 'witch', 'vampire',
        'werewolf', 'alien', 'robot', 'cyborg', 'android', 'elf', 'dwarf', 'orc', 'goblin',
        'fairy', 'dragon', 'demon', 'angel', 'god', 'goddess', 'deity', 'spirit', 'ghost',
        'pirate', 'ninja', 'samurai', 'cowboy', 'detective', 'spy', 'assassin', 'thief',
        'mage', 'healer', 'necromancer', 'bard', 'ranger', 'druid', 'paladin', 'monk',
        'barbarian', 'fighter', 'archer', 'gunslinger', 'soldier', 'commander', 'captain',
        'pilot', 'astronaut', 'scientist', 'doctor', 'student', 'teacher', 'mentor',
        'personality', 'backstory', 'background', 'power', 'ability', 'skill', 'magical',
        'strength', 'weakness', 'motivation', 'goal', 'quest', 'journey', 'origin',
        'appearance', 'looks', 'tall', 'short', 'young', 'old', 'brave', 'fearless',
        'cowardly', 'smart', 'intelligent', 'wise', 'foolish', 'strong', 'weak', 'fast',
        'slow', 'agile', 'clumsy', 'beautiful', 'handsome', 'ugly', 'scarred'
    ];

    // Off-topic keywords that might indicate non-character requests
    const offTopicKeywords = [
        'essay', 'article', 'recipe', 'code', 'program', 'analysis', 'review',
        'email', 'letter', 'poem', 'song', 'lyrics', 'paper', 'report', 'homework',
        'assignment', 'solution', 'math', 'summary', 'recommendation', 'cryptocurrency',
        'stock', 'investment', 'market', 'buy', 'sell', 'cheap', 'expensive', 'money',
        'password', 'hack', 'cheat', 'exam', 'answer', 'test', 'template', 'resume',
        'cover letter', 'application', 'lawsuit', 'legal', 'medical', 'diagnosis', 'symptom'
    ];

    // Event Listeners
    generateBtn.addEventListener('click', validateAndGenerate);
    descriptionTextarea.addEventListener('input', validateDescription);

    // Function to validate description
    function validateDescription() {
        const description = descriptionTextarea.value.trim().toLowerCase();
        
        // Skip validation if empty
        if (!description) {
            descriptionFeedback.textContent = '';
            descriptionFeedback.className = 'feedback-text';
            return true;
        }
        
        // Check for off-topic content
        const containsOffTopic = offTopicKeywords.some(keyword => description.includes(keyword.toLowerCase()));
        if (containsOffTopic) {
            descriptionFeedback.textContent = 'Please provide a character-related description only.';
            descriptionFeedback.className = 'feedback-text error';
            return false;
        }
        
        // Check for character-related content
        const isCharacterRelated = characterKeywords.some(keyword => description.includes(keyword.toLowerCase()));
        if (!isCharacterRelated && description.length > 20) {
            descriptionFeedback.textContent = 'Your description may not be character-related. Please focus on character traits, background, or appearance.';
            descriptionFeedback.className = 'feedback-text warning';
            return true; // Allow submission but with warning
        }
        
        // Valid description
        descriptionFeedback.textContent = '';
        descriptionFeedback.className = 'feedback-text';
        return true;
    }

    // Function to validate and then generate
    function validateAndGenerate() {
        const isValid = validateDescription();
        
        if (isValid) {
            generateNames();
        } else {
            // Highlight the textarea for user attention
            descriptionTextarea.style.borderColor = 'var(--error-color)';
            setTimeout(() => {
                descriptionTextarea.style.borderColor = '';
            }, 2000);
        }
    }

    // Main function to generate names
    async function generateNames() {
        // Show loading indicator and disable button
        loadingIndicator.style.display = 'block';
        generateBtn.disabled = true;
        resultContainer.innerHTML = '';

        // Get user inputs
        const category = categorySelect.value;
        const gender = genderSelect.value;
        const description = descriptionTextarea.value.trim();
        const count = parseInt(countSelect.value);

        try {
            const names = await fetchNamesFromGemini(category, gender, description, count);
            displayResults(names);
        } catch (error) {
            showError("Failed to generate names. Please try again later.");
            console.error("Error:", error);
        } finally {
            // Hide loading indicator and enable button
            loadingIndicator.style.display = 'none';
            generateBtn.disabled = false;
        }
    }

    // Function to fetch names from Gemini API
    async function fetchNamesFromGemini(category, gender, description, count) {
        // Construct the prompt
        let prompt = `Generate ${count} unique and creative character names for ${category} genre`;
        
        if (gender !== 'any') {
            prompt += ` with ${gender} gender`;
        }
        
        if (description) {
            prompt += `. Character description: ${description}`;
        }
        
        prompt += `. IMPORTANT: ONLY generate character names with brief descriptions. This is strictly a character name generator.
        Format the response as a JSON array with objects containing: 
        {
            "name": "Character Name",
            "description": "Brief character description",
            "traits": ["trait1", "trait2"]
        }`;

        // For debugging
        console.log("Sending prompt to Gemini:", prompt);

        // Gemini API request
        const response = await fetch(`${API_CONFIG.apiEndpoint}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: API_CONFIG.temperature,
                    maxOutputTokens: API_CONFIG.maxOutputTokens,
                    topP: 0.95,
                    topK: 40
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        try {
            // Extract JSON from the response
            const responseText = data.candidates[0].content.parts[0].text;
            
            // Find JSON in the response (Gemini sometimes adds markdown code blocks)
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                              responseText.match(/```\s*([\s\S]*?)\s*```/) || 
                              [null, responseText];
            
            const jsonString = jsonMatch[1].trim();
            return JSON.parse(jsonString);
        } catch (error) {
            console.error("Error parsing JSON response:", error);
            console.log("Raw response:", data);
            return parseResponseManually(data.candidates[0].content.parts[0].text);
        }
    }

    // Fallback function to handle non-JSON responses
    function parseResponseManually(text) {
        const names = [];
        // Simple pattern matching to find name-description pairs
        const entries = text.split(/\d+\.\s+/).filter(Boolean);
        
        entries.forEach(entry => {
            const nameMatch = entry.match(/^([^:]+):/);
            if (nameMatch) {
                const name = nameMatch[1].trim();
                const description = entry.replace(nameMatch[0], '').trim();
                
                names.push({
                    name: name,
                    description: description,
                    traits: ["character", categorySelect.value]
                });
            }
        });
        
        return names.length > 0 ? names : [
            { name: "API Response Error", description: "Could not parse response. Please try again.", traits: ["error"] }
        ];
    }

    // Function to display results
    function displayResults(names) {
        resultContainer.innerHTML = '';
        
        if (!names || names.length === 0) {
            showError("No names were generated. Please try again.");
            return;
        }

        names.forEach(characterData => {
            const nameCard = document.createElement('div');
            nameCard.className = 'name-card';
            
            const nameElement = document.createElement('div');
            nameElement.className = 'name';
            nameElement.textContent = characterData.name;
            
            const descriptionElement = document.createElement('div');
            descriptionElement.className = 'description';
            descriptionElement.textContent = characterData.description;
            
            const tagsElement = document.createElement('div');
            tagsElement.className = 'tags';
            
            // Add traits as tags
            if (characterData.traits && Array.isArray(characterData.traits)) {
                characterData.traits.forEach(trait => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'tag';
                    tagElement.textContent = trait;
                    tagsElement.appendChild(tagElement);
                });
            }
            
            // Add category and gender tags
            const categoryTag = document.createElement('span');
            categoryTag.className = 'tag';
            categoryTag.textContent = categorySelect.value;
            tagsElement.appendChild(categoryTag);
            
            if (genderSelect.value !== 'any') {
                const genderTag = document.createElement('span');
                genderTag.className = 'tag';
                genderTag.textContent = genderSelect.value;
                tagsElement.appendChild(genderTag);
            }
            
            nameCard.appendChild(nameElement);
            nameCard.appendChild(descriptionElement);
            nameCard.appendChild(tagsElement);
            
            resultContainer.appendChild(nameCard);
        });
    }

    // Function to show error message
    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        resultContainer.innerHTML = '';
        resultContainer.appendChild(errorElement);
    }
});