export const MOTIVATIONAL_QUOTES = [
  "You don't have to see the whole staircase, just take the first step. — Martin Luther King Jr.",
  "Self-care is how you take your power back. — Lalah Delia",
  "It is during our darkest moments that we must focus to see the light. — Aristotle",
  "Believe you can and you're halfway there. — Theodore Roosevelt",
  "You are enough just as you are. — Meghan Markle",
  "The only way out is through. — Robert Frost",
  "Healing takes time, and asking for help is a courageous step.",
  "Your current situation is not your final destination.",
  "Small progress is still progress.",
  "Be gentle with yourself. You're doing the best you can."
];

export const SUPPORTIVE_MESSAGES = [
  "Thank you for sharing that with us. Your feelings are valid.",
  "I'm proud of you for checking in today. It takes strength to reflect.",
  "You're taking great care of yourself by being honest about your day.",
  "Remember that every day is a new opportunity to be kind to yourself.",
  "It's okay to have hard days. You're showing up, and that matters.",
  "Your resilience is inspiring. Keep going.",
  "Taking a moment for yourself is a powerful act of self-love.",
  "You're not alone in this journey. We're here with you.",
  "Every small step you take is a victory.",
  "Breathe. You've handled everything life has thrown at you so far."
];

export const WELCOME_MESSAGES = [
  "Welcome back. How are you feeling in this moment?",
  "It's good to see you again. Let's take a breath together.",
  "Ready for a fresh start? I'm here to listen.",
  "Your safe space is ready. What's on your mind today?",
  "Hello! Remember to be patient with yourself today.",
  "I'm glad you're here. Let's check in on your well-being.",
  "Take a moment to center yourself. You're doing important work.",
  "Welcome back to your bridge to care. How can I support you today?"
];

export const getRandomMessage = (array: string[]) => {
  return array[Math.floor(Math.random() * array.length)];
};
