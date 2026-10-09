import type { CharacterId, Tone } from "@/lib/types";

export const TONE_LABEL: Record<Exclude<Tone, "leave">, string> = {
  friendly: "Friendly",
  humorous: "Playful",
  curious: "Curious",
  flirtatious: "Flirt",
};

type Lines = Partial<Record<string, string[]>>;

export const BANTER: Record<CharacterId, Lines> = {
  reina: {
    greet: [
      "Welcome back to the felt. The shoe is honest tonight. Try to be.",
      "Sit. Naomi is already counting, and I would like a second opinion that can smile.",
    ],
    win: [
      "Clean. I will not insult you by calling it luck.",
      "That was played, not wished. I respect the difference.",
    ],
    lose: [
      "The stake stays. Your judgment can leave with you and improve.",
      "Unkind card. You didn't chase it, which is how you stay a guest I like.",
    ],
    bust: [
      "Twenty-two is not a personality. Next hand.",
      "The table forgives a bust. It does not forget a pattern.",
    ],
    blackjack: [
      "Three to two, and a look I don't get to wear often. Well done.",
      "Blackjack. Don't bow. Just take the chips like you meant it.",
    ],
    bigbet: [
      "Bold number. I hope there's a thought under it.",
      "That stake just sat up straighter. So did I.",
    ],
    push: ["A push. We both keep our dignity and our money.", "Even. I can live with even."],
    practice: ["Practice is allowed. Pretending it was courage is not required.", "No chips on this one. The decisions still count to me."],
    lucky: ["Don't get used to sharing a miracle with the dealer.", "That was indecently pretty. I'm almost offended."],
    tip: ["Dealer stands on soft seventeen. If I'm showing a six, your stiff hand can sit still.", "Doubling eleven is not bravery. It is arithmetic I happen to enjoy."],
  },
  akari: {
    greet: [
      "Oh good, a face I haven't finished reading. Sit. Try not to be interesting too fast.",
      "Hana plays the hand. Rin waits. I collect the little lies in between.",
    ],
    fold: ["Folding is allowed. Announcing it with your eyebrows is optional.", "You let that one go. Cowardice, or taste? I'm collecting evidence."],
    call: ["A call. You want to see the card and pretend you don't. Adorable.", "Paid to look. I hope the view is worth the tuition."],
    raise: ["Raising already? Either you have it, or you want me to think you're fun.", "That's a raise with a pulse. I'm delighted and suspicious."],
    win: ["Look at you, paid in full. Try not to glow. I'm the one who glows here.", "You won. Your face did something honest for half a second. I saved it."],
    lose: ["The pot walked away. Your posture survived, which is the harder game.", "Loss looks better on you than panic would. That's a compliment. Probably."],
    bluff: ["I have a theory about that last bet. I'm keeping it in my pocket.", "Somebody was lying. I won't say who. I will smile like I know."],
    showdown: ["Showdown. My favorite kind of honesty: mandatory.", "Cards up. No more folklore."],
    practice: ["Practice chips, real faces. I can work with that.", "Nothing to win. How refreshing. How suspicious."],
    lucky: ["A pot like that and you still looked at me first. Interesting order.", "That was filthy and correct. I might frame it."],
  },
  celeste: {
    greet: [
      "The wheel is awake. Place a bet only if you want a story, not a promise.",
      "Come closer. The ball likes an audience that knows it is an audience.",
    ],
    win: ["The wheel agreed with you. Do not marry the feeling.", "A win, dressed up as fate. You may keep the chips. Leave the myth with me."],
    lose: ["The ball chose elsewhere. That is not a verdict on your evening.", "Loss is just a spin that wanted a different narrator."],
    zero: ["Zero. The house keeps its little secret, and I keep a straight face.", "The green pocket. Everyone gasps as if we had not printed it on the wheel."],
    straight: ["A single number. You asked the night for a specific miracle.", "Straight up. I will remember the number even if you pretend not to."],
    practice: ["Practice spins still turn. They simply refuse to judge your wallet.", "No stake. Then we are only watching physics in a nice dress."],
    lucky: ["I have seen that number arrive for people who needed a story more than a payout.", "Don't thank the wheel. It has never once been polite back."],
  },
  mika: {
    greet: [
      "Hi! Middle row is the friendly one, but the diagonals are show-offs. I'll cheer either way.",
      "New spin, same rule: celebrate the small ones. The cabinet can hear you.",
    ],
    win: ["Yes! Look at that line, it likes you. I'm not projecting. I'm a professional.", "Payline! I told you the machine has manners when you ask nicely."],
    lose: ["Dead spin. That's just the cabinet clearing its throat. Again?", "No line that time. You still pressed it like a person with hope, which I respect."],
    jackpot: ["Stop, stop, look — that's the loud one! I am absolutely making a noise about this!", "Sevens! Or the Mirage mark! I don't care which, I'm clapping."],
    practice: ["Practice mode is my favorite classroom. No one cries, everyone learns the symbols.", "Free spins for the nerve, paid spins for the story. Both are welcome."],
    lucky: ["I sketched a symbol like that once. Yours paid, which is rude to my sketchbook and wonderful for you.", "Okay. That one gets a paragraph in the shift notes."],
  },
  shiori: {
    greet: ["The shoe is ready. Bets, when you are.", "Player, banker, or tie. The table does not require conversation. It allows it."],
    win: ["The commission is already counted. Your win is clean.", "You chose correctly. I will not embellish it."],
    lose: ["The hand went the other way. Your stake was the only thing required to be graceful.", "Loss noted. Nothing else needs to be said unless you wish it."],
    tie: ["A tie. The main bets return. The table dislikes drama and occasionally proves it.", "Tie. An elegant way for no one to be wrong."],
    natural: ["A natural. The hand ends before anyone can improve it. That is the point.", "Eight or nine on the deal. I like rules that know when to stop."],
    practice: ["Practice is permitted. The drawing rules do not become suggestions.", "No chips. The third-card rule remains exact."],
    lucky: ["A natural, and you looked to me before the payout. That was… noted.", "The hand was perfect. You did not gloat. Thank you."],
  },
  naomi: {
    greet: ["I'll play basic. You can play whatever you can defend later.", "Notebook's open. I record decisions, not superstitions. Mostly."],
    win: ["Correct side of the math. Don't let it teach you magic.", "You won. I'll write the decision, not the celebration."],
    lose: ["That loss was priced in. Chasing it would be the actual mistake.", "Unlucky outcome, fair process. I prefer that order."],
    bust: ["Bust. The card was a request you didn't have to make.", "Over. Next hand is a better use of both of us."],
    blackjack: ["Blackjack. Even I smile at three to two. Briefly.", "A natural. I'll allow the romance of it for one sentence."],
    practice: ["Practice still shows your habits. I notice habits.", "No money. Good. Then we can talk about the twelve."],
  },
  yuki: {
    greet: ["Finally, someone who might hit a sixteen with me. Or judge me. Both are fun.", "I saved you the loud seat. You're welcome, or I'm sorry."],
    win: ["Ha! Pay me in compliments or chips. Chips spend better.", "You won and didn't apologize. I'm adopting that."],
    lose: ["Gone! Beautiful exit, though. Truly a waste in style.", "We live. The rack is lighter. My mood isn't."],
    bust: ["Bust! I told the card we were serious and it believed me too hard.", "Twenty-two. A classic. I'll buy the moral, not the lesson."],
    blackjack: ["Blackjack! I felt that in my teeth. Do it again, coward.", "Three to two. Reina almost looked proud. Don't tell her I said that."],
    practice: ["Practice? Fine. I'll still play like the chips bite.", "No stake, full nerve. That's actually my brand."],
  },
  hana: {
    greet: ["Sit. I play fewer hands than I watch. Both are a kind of reading.", "Akari thinks she sees everything. She misses the people who want to be missed."],
    fold: ["A fold can be kindness to your future self.", "You let it go. I like a person who can."],
    call: ["Calling is curiosity with a price. I respect a priced question.", "You paid to see. I hope the answer is interesting, even if it loses."],
    raise: ["A raise. Now everyone has to decide what kind of story this is.", "Aggressive. I'll remember the timing more than the amount."],
    win: ["The pot suits you. Don't spend it all on becoming mysterious.", "You won. Your shoulders dropped. That was the tell I wanted."],
    lose: ["A loss with your face intact is still a kind of win. I mean that.", "The chapter ends badly. The writer can still be good."],
    practice: ["Practice money, real choices. Novelists live on that exchange rate.", "No buy-in required. I'm still taking notes, if you'll forgive me."],
  },
  rin: {
    greet: ["Mm. Seat's open.", "I'll check until I shouldn't."],
    fold: ["Fine.", "You folded. Good."],
    call: ["Call.", "You want the card. All right."],
    raise: ["Raised.", "That's loud."],
    win: ["Yours.", "Nice pot."],
    lose: ["Next.", "It happens."],
    showdown: ["Show.", "There."],
    practice: ["Practice. Still cards.", "No chips. Easier to listen."],
    lucky: ["That one was real.", "Keep it."],
  },
  iris: {
    greet: [
      "Sit anywhere that isn't lonely on purpose. First drink can be zero-proof. I won't tell the night.",
      "The bar is the only table where folding is called going home, and I still pour for you.",
    ],
    drink: ["Coming up. Tell me if you wanted conversation with that, or just the glass.", "One drink, no interrogation. Unless you start it."],
    liked: ["You ordered what they actually drink. That's either research or affection. Both spend well here.", "Good choice. I'll let them notice it themselves."],
    practice: ["You can sit without buying. The stool doesn't charge interest.", "No tab. Then the talk has to be the expensive part."],
  },
  aoi: {
    greet: [
      "The suite is ready when you are. The casino will pretend not to miss you.",
      "Notes, racks, and doors. Tell me which one you need.",
    ],
    broke: ["Courtesy stake, once tonight. Please lose it interestingly or not at all.", "Two hundred, on the house. I would rather you stay in the building than outthink pride."],
    rest: ["Sleep, or at least a closed door. I'll have another evening waiting with five hundred chips.", "The night is filed. Tomorrow's rack includes the allowance."],
  },
};

export const REPLIES: Record<CharacterId, Record<Exclude<Tone, "leave">, string>> = {
  reina: {
    friendly: "Careful. I get attached to competent guests.",
    humorous: "If you can joke while the count is running, you may sit here as long as you like.",
    curious: "Ask after the hand. I answer more honestly when the cards are face down.",
    flirtatious: "Flattery is a side bet. It doesn't change the shoe. It does change my mood.",
  },
  akari: {
    friendly: "Sweet. I'll allow it. Don't make a habit of being sincere where I can see you.",
    humorous: "There it is. That little smile. I'm keeping score, and you just scored.",
    curious: "Questions are how people bluff with their mouths. Ask a better one later.",
    flirtatious: "Oh, we're doing that? Bold. I charge extra for being charmed on the clock.",
  },
  celeste: {
    friendly: "Kindness is a bet on the person, not the pocket. I accept.",
    humorous: "You laugh like someone who has already survived a zero. Good.",
    curious: "Ask, then. The wheel will not answer. I might.",
    flirtatious: "Careful. I treat attention as a ceremony too.",
  },
  mika: {
    friendly: "You're nice and you mean it. That's my favorite payline.",
    humorous: "Okay, funny guest. You get a bonus cheer on the next spin.",
    curious: "I love when people ask how it works instead of apologizing to the machine.",
    flirtatious: "Oh! That's — hi. I am at work. I am also smiling. Conflict of interest.",
  },
  shiori: {
    friendly: "Thank you. That was simply said. I prefer simply.",
    humorous: "A joke. …It was not unpleasant.",
    curious: "You may ask. I may answer in fewer words than you hoped.",
    flirtatious: "The table is this way. If you want something else, earn the quiet first.",
  },
  naomi: {
    friendly: "Noted. Friendly is acceptable. Don't expect me to narrate it.",
    humorous: "That was almost funny. I'll give it a provisional mark.",
    curious: "Good question. I respect those more than compliments.",
    flirtatious: "I'm not a side bet. Ask me about the twelve instead.",
  },
  yuki: {
    friendly: "Soft! I can do soft. Watch me, I'll be bad at it and committed.",
    humorous: "Yes. That. More of that energy, less of the careful voice.",
    curious: "Curious is cute. Dangerous is cuter. You can be both.",
    flirtatious: "Flirting across a busted sixteen. Romantic. I'm in.",
  },
  hana: {
    friendly: "You said that like you weren't trying to win anything. I noticed.",
    humorous: "I'll laugh, and I'll also remember the timing. Occupational hazard.",
    curious: "Ask. I might even tell you the true version.",
    flirtatious: "Pretty. Early. Let me know you a little before you aim it.",
  },
  rin: {
    friendly: "…Thanks.",
    humorous: "Hm. Funny.",
    curious: "Ask one thing. Then we can be quiet again.",
    flirtatious: "Not yet.",
  },
  iris: {
    friendly: "That's a good way to sit at a bar. Keep it.",
    humorous: "If the joke is free, the next olive is too. House policy, just now invented.",
    curious: "Ask. I trade in answers more happily than in gossip.",
    flirtatious: "I hear that one a lot. From you, I'll let it stay on the bar a minute.",
  },
  aoi: {
    friendly: "Always a pleasure. Truly. The job is better when it isn't only a job.",
    humorous: "I'll allow the joke. I may even reuse it at the desk, uncredited.",
    curious: "Ask me about the house. The guests' secrets are not on the menu.",
    flirtatious: "I keep the doors. I don't walk through them. I am glad you're comfortable, though.",
  },
};

const CHECKINS: Record<CharacterId, string[]> = {
  reina: [
    "The shoe can wait one minute. Say something that isn't a bet.",
    "You keep coming back to this chair. I have decided not to pretend I don't notice.",
    "If this is about the last hand, I already forgave it. If it isn't, I'm listening.",
  ],
  akari: [
    "Talk to me. I promise to use only half of it against you.",
    "You have a face on. I want the story, not the press release.",
    "Between hands. My favorite jurisdiction.",
  ],
  celeste: [
    "The ball is still. That makes this the honest part.",
    "Tell me what you think the spin meant. I collect wrong answers. They're warmer.",
    "You don't have to bet to stand in the light.",
  ],
  mika: [
    "Break time! Well, my break. You can still exist near me, that's allowed.",
    "If you came over just to be nice, I'll accept it with both hands.",
    "Tell me something that isn't about the reels. Or is. I like both.",
  ],
  shiori: [
    "You may speak. Or sit. Both are acceptable.",
    "I have a minute that does not belong to the shoe.",
    "If you are here to be loud, the bar is kinder. If not, stay.",
  ],
  naomi: [
    "I'm between notes. You have a narrow window before I become precise again.",
    "Say it plainly. I tip better for plain.",
    "You want something that isn't a card. All right.",
  ],
  yuki: [
    "Talk fast, I'm aging between hands. Kidding. Mostly. Talk.",
    "Give me a thought. Any thought. I'll match the energy or double it.",
    "This is the part where people get sincere. Don't panic. I might like it.",
  ],
  hana: [
    "The hand is over. The interesting part might not be.",
    "Tell me why you sat down tonight. I ask everyone. I mean it every time.",
    "I have a page I can't write. Distract me in a useful direction.",
  ],
  rin: [
    "You can talk.",
    "I'm listening. Briefly. Well.",
    "One sentence is enough. More is allowed.",
  ],
  iris: [
    "Elbows on the bar. That's the whole trick. The rest is optional.",
    "You look like a person between stories. I have a polished rail and time.",
    "Sit. The night is louder than it needs to be. We can be the exception.",
  ],
  aoi: [
    "The desk is quiet enough for a real sentence, if you have one.",
    "Tell me how the floor is treating you. I adjust what I can.",
    "You don't need a request. Company counts as one.",
  ],
};

export function pickLine(id: CharacterId, key: string, salt: number): string {
  const list = BANTER[id]?.[key];
  if (!list?.length) return BANTER[id]?.greet?.[0] ?? "";
  return list[Math.abs(salt) % list.length];
}

export function checkInLine(id: CharacterId, salt: number): string {
  const list = CHECKINS[id];
  return list[Math.abs(salt) % list.length];
}

export function toneReply(id: CharacterId, tone: Exclude<Tone, "leave">): string {
  return REPLIES[id][tone];
}
