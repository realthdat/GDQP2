let username = "";
let startTime = null;
let quizData = {};
let currentTopic = null;
let questions = [];
let currentQuestionIndex = 0;
let score = 0;

function startApp() {
    const input = document.getElementById('username-input').value.trim();
    console.log("Username entered:", input);
    if (input === '') {
        alert("Please enter your name.");
        return;
    }
    username = input;
    document.getElementById('user-popup').classList.add('hidden');
}

async function loadQuizData() {
    try {
        const response = await fetch('quizData.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        quizData = await response.json();
        loadTopics();
    } catch (error) {
        console.error('Error loading quiz data:', error);
        const topicsDiv = document.getElementById('topics');
        topicsDiv.innerHTML = '<p class="text-red-600">Failed to load quiz data. Please check if quizData.json exists.</p>';
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function loadTopics() {
    const topicsDiv = document.getElementById('topics');
    topicsDiv.innerHTML = '';
    Object.keys(quizData).forEach(topic => {
        const button = document.createElement('button');
        button.className = 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600';
        button.textContent = topic;
        button.onclick = () => startQuiz(topic);
        topicsDiv.appendChild(button);
    });
}

function startQuiz(topic) {
    console.log("Starting quiz for topic:", topic);
    currentTopic = topic;
    questions = shuffle([...quizData[topic]]);
    currentQuestionIndex = 0;
    score = 0;
    startTime = new Date();

    document.getElementById('course-selection').classList.add('hidden');
    document.getElementById('quiz-section').classList.remove('hidden');
    document.getElementById('quiz-title').textContent = `${topic}`;
    document.getElementById('score').textContent = `Score: ${score} / ${questions.length}`;
    document.getElementById('back-to-topics-btn').classList.remove('hidden');
    updateProgressBar();
    loadQuestion();
}

function updateProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progress = questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
}

function loadQuestion() {
    const questionData = questions[currentQuestionIndex];
    document.getElementById('question').textContent = questionData.question;

    const shuffledOptions = shuffle([...questionData.options]);
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    shuffledOptions.forEach(option => {
        const button = document.createElement('button');
        button.className = 'quiz-option w-full bg-gray-200 text-left px-4 py-2 rounded hover:bg-gray-300';
        button.textContent = option;
        button.dataset.option = option;
        button.addEventListener('click', (e) => {
            const selectedOption = e.currentTarget.dataset.option;
            checkAnswer(selectedOption, questionData.correct);
        });
        optionsDiv.appendChild(button);
    });

    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    updateProgressBar();
}

function checkAnswer(selected, correct) {
    const feedbackDiv = document.getElementById('feedback');
    const nextBtn = document.getElementById('next-btn');
    feedbackDiv.classList.remove('hidden');

    if (selected === correct) {
        score++;
        feedbackDiv.className = 'mt-4 text-green-600';
        feedbackDiv.textContent = 'Correct!';
        const sound = document.getElementById('correct-sound');
        sound.currentTime = 0;
        sound.play();
    } else {
        feedbackDiv.className = 'mt-4 text-red-600';
        feedbackDiv.textContent = `Wrong! The correct answer is: ${correct}`;
    }

    document.getElementById('score').textContent = `Score: ${score} / ${questions.length}`;
    nextBtn.classList.remove('hidden');
    nextBtn.onclick = nextQuestion;

    document.querySelectorAll('#options button').forEach(button => {
        const optionValue = button.dataset.option;
        button.disabled = true;
        button.classList.remove('hover:bg-gray-300');
        button.offsetHeight;
        if (optionValue === correct) {
            button.classList.add('bg-green-200');
        } else if (optionValue === selected) {
            button.classList.add('bg-red-200');
        }
    });
}

async function nextQuestion() {
    currentQuestionIndex++;
    console.log("Current question index:", currentQuestionIndex, "Total questions:", questions.length);
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        console.log("Quiz completed, preparing to send data...");
        const endTime = new Date();
        const duration = Math.floor((endTime - startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const timeText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        const date = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

        document.getElementById('final-score-text').textContent = `You got ${score} out of ${questions.length} correct!`;
        document.getElementById('completion-time').textContent = `Time taken: ${timeText}`;
        document.getElementById('completion-popup').classList.remove('hidden');

        const dataToSend = {
            date: date,
            name: username,
            topic: currentTopic,
            score: score,
            total: questions.length,
            time: timeText
        };
        console.log("Data to send:", dataToSend);

        const scriptURL = 'https://script.google.com/macros/s/AKfycbwCUcL9y33Qw_CdGDA6RAdXLvecBZlYMX6p32x5t6ZnP4Q7G3SboljetjN_ZGte1jSJ/exec'; 
        try {
            await fetch(scriptURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
                mode: 'no-cors'
            });
            console.log("Data sent to Google Sheets successfully");
        } catch (err) {
            console.error("Error sending data to Google Sheets:", err);
        }
    }
}

function backToTopics() {
    document.getElementById('quiz-section').classList.add('hidden');
    document.getElementById('course-selection').classList.remove('hidden');
    document.getElementById('question').textContent = '';
    document.getElementById('options').innerHTML = '';
    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('back-to-topics-btn').classList.add('hidden');
    currentQuestionIndex = 0;
    score = 0;
    questions = [];
    currentTopic = null;
}

function closePopup() {
    document.getElementById('completion-popup').classList.add('hidden');
    backToTopics();
}

document.getElementById('back-to-topics-btn').onclick = backToTopics;

const countdownEndTime = new Date('2025-06-23T19:15:00');

function updateCountdown() {
    const now = new Date().getTime();
    const distance = countdownEndTime.getTime() - now;

    if (distance <= 0) {
        document.getElementById('countdown-timer').textContent = "Good luck on your exam! You’ve got this!🍀";
        clearInterval(countdownInterval);
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    document.getElementById('countdown-timer').textContent =
        `${String(hours).padStart(2, '0')} giờ ${String(minutes).padStart(2, '0')} phút ${String(seconds).padStart(2, '0')} giây`;
}

const countdownInterval = setInterval(updateCountdown, 1000);
updateCountdown();
loadQuizData();