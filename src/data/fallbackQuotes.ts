/**
 * Fallback Quotes
 *
 * Static quotes used when all APIs fail
 * Ensures widget always has content
 */

export interface Quote {
  content: string;
  author: string;
  tags: string[];
}

export const fallbackQuotes: Quote[] = [
  {
    content: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    tags: ["inspiration", "work"],
  },
  {
    content: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
    tags: ["innovation", "leadership"],
  },
  {
    content: "Life is what happens when you're busy making other plans.",
    author: "John Lennon",
    tags: ["life", "philosophy"],
  },
  {
    content: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    tags: ["future", "dreams"],
  },
  {
    content: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle",
    tags: ["inspiration", "perseverance"],
  },
  {
    content: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
    tags: ["journey", "motivation"],
  },
  {
    content: "In the end, we will remember not the words of our enemies, but the silence of our friends.",
    author: "Martin Luther King Jr.",
    tags: ["friendship", "wisdom"],
  },
  {
    content: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
    tags: ["action", "wisdom"],
  },
  {
    content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    tags: ["success", "courage"],
  },
  {
    content: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    tags: ["belief", "motivation"],
  },
  {
    content: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt",
    tags: ["future", "doubt"],
  },
  {
    content: "Do what you can, with what you have, where you are.",
    author: "Theodore Roosevelt",
    tags: ["action", "pragmatism"],
  },
  {
    content: "Everything you've ever wanted is on the other side of fear.",
    author: "George Addair",
    tags: ["fear", "courage"],
  },
  {
    content: "Hardships often prepare ordinary people for an extraordinary destiny.",
    author: "C.S. Lewis",
    tags: ["hardship", "destiny"],
  },
  {
    content: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "Nelson Mandela",
    tags: ["resilience", "perseverance"],
  },
  {
    content: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    tags: ["action", "motivation"],
  },
  {
    content: "Your time is limited, don't waste it living someone else's life.",
    author: "Steve Jobs",
    tags: ["life", "authenticity"],
  },
  {
    content: "If life were predictable it would cease to be life, and be without flavor.",
    author: "Eleanor Roosevelt",
    tags: ["life", "unpredictability"],
  },
  {
    content: "Life is either a daring adventure or nothing at all.",
    author: "Helen Keller",
    tags: ["adventure", "life"],
  },
  {
    content: "Many of life's failures are people who did not realize how close they were to success when they gave up.",
    author: "Thomas A. Edison",
    tags: ["failure", "perseverance"],
  },
  {
    content: "You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.",
    author: "Dr. Seuss",
    tags: ["self-determination", "choice"],
  },
  {
    content: "Attitude is a little thing that makes a big difference.",
    author: "Winston Churchill",
    tags: ["attitude", "mindset"],
  },
  {
    content: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
    author: "Ralph Waldo Emerson",
    tags: ["authenticity", "individuality"],
  },
  {
    content: "I have learned over the years that when one's mind is made up, this diminishes fear.",
    author: "Rosa Parks",
    tags: ["courage", "determination"],
  },
  {
    content: "Whoever is happy will make others happy too.",
    author: "Anne Frank",
    tags: ["happiness", "kindness"],
  },
  {
    content: "Do not go where the path may lead, go instead where there is no path and leave a trail.",
    author: "Ralph Waldo Emerson",
    tags: ["pioneering", "individuality"],
  },
  {
    content: "You will face many defeats in life, but never let yourself be defeated.",
    author: "Maya Angelou",
    tags: ["resilience", "perseverance"],
  },
  {
    content: "The greatest wealth is to live content with little.",
    author: "Plato",
    tags: ["contentment", "wealth"],
  },
  {
    content: "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success.",
    author: "James Cameron",
    tags: ["goals", "success"],
  },
  {
    content: "Life is really simple, but we insist on making it complicated.",
    author: "Confucius",
    tags: ["simplicity", "life"],
  },
  {
    content: "May you live every day of your life.",
    author: "Jonathan Swift",
    tags: ["life", "presence"],
  },
  {
    content: "Life itself is the most wonderful fairy tale.",
    author: "Hans Christian Andersen",
    tags: ["life", "wonder"],
  },
  {
    content: "Do not let making a living prevent you from making a life.",
    author: "John Wooden",
    tags: ["life", "balance"],
  },
  {
    content: "Go confidently in the direction of your dreams! Live the life you've imagined.",
    author: "Henry David Thoreau",
    tags: ["dreams", "confidence"],
  },
  {
    content: "When you reach the end of your rope, tie a knot in it and hang on.",
    author: "Franklin D. Roosevelt",
    tags: ["perseverance", "resilience"],
  },
  {
    content: "Always remember that you are absolutely unique. Just like everyone else.",
    author: "Margaret Mead",
    tags: ["individuality", "humor"],
  },
  {
    content: "Don't judge each day by the harvest you reap but by the seeds that you plant.",
    author: "Robert Louis Stevenson",
    tags: ["patience", "growth"],
  },
  {
    content: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
    tags: ["action", "future"],
  },
  {
    content: "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
    author: "Benjamin Franklin",
    tags: ["learning", "education"],
  },
  {
    content: "It is better to be hated for what you are than to be loved for what you are not.",
    author: "Andre Gide",
    tags: ["authenticity", "self-acceptance"],
  },
  {
    content: "Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do.",
    author: "Mark Twain",
    tags: ["regret", "action"],
  },
  {
    content: "It is never too late to be what you might have been.",
    author: "George Eliot",
    tags: ["potential", "change"],
  },
  {
    content: "A person who never made a mistake never tried anything new.",
    author: "Albert Einstein",
    tags: ["mistakes", "innovation"],
  },
  {
    content: "The person who says it cannot be done should not interrupt the person who is doing it.",
    author: "Chinese Proverb",
    tags: ["action", "perseverance"],
  },
  {
    content: "There are no traffic jams along the extra mile.",
    author: "Roger Staubach",
    tags: ["effort", "success"],
  },
  {
    content: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle Onassis",
    tags: ["adversity", "hope"],
  },
  {
    content: "The only person you are destined to become is the person you decide to be.",
    author: "Ralph Waldo Emerson",
    tags: ["destiny", "choice"],
  },
  {
    content: "Be yourself; everyone else is already taken.",
    author: "Oscar Wilde",
    tags: ["authenticity", "individuality"],
  },
  {
    content: "Strive not to be a success, but rather to be of value.",
    author: "Albert Einstein",
    tags: ["value", "purpose"],
  },
  {
    content: "I attribute my success to this: I never gave or took any excuse.",
    author: "Florence Nightingale",
    tags: ["success", "accountability"],
  },
];

export function getRandomFallbackQuote(): Quote {
  const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
  return fallbackQuotes[randomIndex];
}
