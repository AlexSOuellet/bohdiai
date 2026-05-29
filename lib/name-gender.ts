// First name → likely gender inference. Used to default the human in
// generated imagery to match the maker. Common names map cleanly; unisex,
// uncommon, or unknown names fall back to the audience default (woman —
// 60%+ of the maker audience).
//
// This is a lookup table by design, not a model call. It only needs to be
// right most of the time; falling back to the audience default is graceful
// when wrong.

const FEMALE_NAMES = new Set<string>([
  'sarah', 'sara', 'jessica', 'jennifer', 'jenny', 'amanda', 'ashley', 'melissa',
  'nicole', 'elizabeth', 'liz', 'beth', 'megan', 'rachel', 'lauren', 'stephanie',
  'rebecca', 'becky', 'kayla', 'amy', 'amber', 'kimberly', 'kim', 'lisa',
  'mary', 'patricia', 'patty', 'linda', 'barbara', 'susan', 'sue', 'margaret',
  'maggie', 'dorothy', 'sandra', 'sandy', 'donna', 'carol', 'ruth', 'sharon',
  'michelle', 'shelly', 'laura', 'emily', 'emma', 'olivia', 'sophia', 'ava',
  'isabella', 'mia', 'charlotte', 'amelia', 'harper', 'evelyn', 'abigail',
  'abby', 'ella', 'elizabeth', 'sofia', 'avery', 'scarlett', 'grace', 'chloe',
  'victoria', 'tori', 'madison', 'maddie', 'eleanor', 'hannah', 'lily', 'lillian',
  'addison', 'aubrey', 'natalie', 'zoe', 'audrey', 'leah', 'hazel', 'violet',
  'aria', 'penelope', 'nora', 'savannah', 'anna', 'caroline', 'genesis', 'aaliyah',
  'kennedy', 'kinsley', 'allison', 'maya', 'sarah', 'madelyn', 'adeline',
  'alexa', 'ariana', 'elena', 'gabriella', 'naomi', 'alice', 'sadie', 'hailey',
  'eva', 'emilia', 'autumn', 'quinn', 'nevaeh', 'piper', 'ruby', 'serenity',
  'willow', 'everly', 'cora', 'kaylee', 'lydia', 'aubree', 'arianna', 'eliana',
  'peyton', 'melanie', 'gianna', 'isabelle', 'julianna', 'valentina', 'morgan',
  'kylie', 'isla', 'arya', 'faith', 'brielle', 'mackenzie', 'mckenzie', 'kendall',
  'ariel', 'jade', 'iris', 'rose', 'maria', 'sophie', 'sienna', 'lila', 'mila',
  'luna', 'stella', 'aurora', 'paige', 'brooke', 'bailey', 'sierra', 'jasmine',
  'jordyn', 'erin', 'haley', 'kate', 'katie', 'katherine', 'kathryn', 'taylor',
  'alyssa', 'samantha', 'sam', 'sammy', 'courtney', 'brittany', 'brittney',
  'crystal', 'tiffany', 'whitney', 'kelsey', 'monica', 'jenna', 'kelly', 'kelli',
  'tina', 'gina', 'angela', 'angie', 'tracy', 'stacy', 'lori', 'kathy', 'wendy',
  'maureen', 'shannon', 'cheryl', 'pam', 'pamela', 'denise', 'diane', 'cynthia',
  'cindy', 'janet', 'jan', 'judith', 'judy', 'janice', 'rose', 'rosa', 'martha',
  'theresa', 'teresa', 'helen', 'gloria', 'frances', 'fran', 'joan', 'jean',
  'joyce', 'cathy', 'catherine', 'christine', 'chris', 'christina', 'christy',
  'kristen', 'kristin', 'kristine', 'heather', 'tammy', 'pat', 'lynn', 'paula',
]);

const MALE_NAMES = new Set<string>([
  'james', 'jim', 'jimmy', 'john', 'johnny', 'robert', 'rob', 'bob', 'bobby',
  'michael', 'mike', 'mikey', 'william', 'will', 'billy', 'bill', 'david',
  'dave', 'davey', 'richard', 'rick', 'ricky', 'dick', 'joseph', 'joe', 'joey',
  'thomas', 'tom', 'tommy', 'charles', 'chuck', 'charlie', 'christopher',
  'chris', 'topher', 'daniel', 'dan', 'danny', 'matthew', 'matt', 'matty',
  'anthony', 'tony', 'mark', 'donald', 'don', 'donny', 'steven', 'steve',
  'stevie', 'paul', 'andrew', 'andy', 'drew', 'joshua', 'josh', 'kenneth',
  'ken', 'kenny', 'kevin', 'brian', 'george', 'edward', 'ed', 'eddie', 'ronald',
  'ron', 'ronnie', 'timothy', 'tim', 'timmy', 'jason', 'jeffrey', 'jeff',
  'ryan', 'jacob', 'jake', 'gary', 'nicholas', 'nick', 'nicky', 'eric',
  'jonathan', 'jon', 'stephen', 'larry', 'lawrence', 'justin', 'scott',
  'brandon', 'benjamin', 'ben', 'benny', 'samuel', 'sam', 'gregory', 'greg',
  'alexander', 'alex', 'frank', 'francis', 'raymond', 'ray', 'jack', 'patrick',
  'pat', 'paddy', 'dennis', 'denny', 'jerry', 'gerald', 'tyler', 'aaron', 'henry',
  'hank', 'douglas', 'doug', 'peter', 'pete', 'walter', 'walt', 'jeremy',
  'roger', 'keith', 'arthur', 'art', 'austin', 'noah', 'liam', 'mason',
  'ethan', 'elijah', 'logan', 'lucas', 'oliver', 'caleb', 'isaac', 'owen',
  'wyatt', 'sebastian', 'gabriel', 'gabe', 'carter', 'jayden', 'dylan',
  'grayson', 'levi', 'isaiah', 'eli', 'aiden', 'julian', 'hudson', 'connor',
  'leonardo', 'leo', 'lincoln', 'jaxon', 'cameron', 'cam', 'colton', 'miles',
  'hunter', 'jameson', 'ezekiel', 'zeke', 'maxwell', 'max', 'easton', 'silas',
  'kai', 'jaxson', 'theo', 'theodore', 'ted', 'teddy', 'micah', 'roman',
  'rowan', 'asher', 'damian', 'declan', 'kingston', 'maverick', 'jude',
  'parker', 'beau', 'phoenix', 'graham', 'felix', 'milo', 'arlo', 'finn',
  'finley', 'walker', 'jett', 'archer', 'eric', 'derek', 'craig', 'jeffery',
  'kurt', 'curtis', 'allen', 'alan', 'ralph', 'roy', 'fred', 'frederick',
  'lou', 'louis', 'wayne', 'eugene', 'gene', 'russell', 'russ', 'jesse',
  'todd', 'phil', 'philip', 'phillip', 'shane', 'tony', 'antonio', 'darrell',
  'darren', 'travis', 'jorge', 'sean', 'shawn', 'glenn', 'allan', 'edwin',
  'eddy', 'micheal',
]);

export type Gender = 'female' | 'male';

/**
 * Infer likely gender from a first name. Unisex names and unknowns fall back
 * to the maker audience default (female — 60%+ of the audience).
 */
export function inferGenderFromName(name: string | undefined): Gender {
  const normalized = (name ?? '').trim().toLowerCase().split(/\s+/)[0] ?? '';
  if (normalized === '') return 'female';
  if (MALE_NAMES.has(normalized) && !FEMALE_NAMES.has(normalized)) return 'male';
  if (FEMALE_NAMES.has(normalized) && !MALE_NAMES.has(normalized)) return 'female';
  // Unisex (in both sets) or unknown (in neither) → fall back to audience default.
  return 'female';
}

/**
 * Phrasing used in image prompts. Lets callers say "a woman in her studio"
 * or "a man at his workbench" without sprinkling gender logic across prompts.
 */
export function personPhrase(gender: Gender): {
  /** Noun phrase: "a woman" / "a man" */
  noun: string;
  /** Possessive: "her" / "his" */
  poss: string;
  /** Subject pronoun: "she" / "he" */
  subj: string;
} {
  if (gender === 'male') {
    return { noun: 'a man', poss: 'his', subj: 'he' };
  }
  return { noun: 'a woman', poss: 'her', subj: 'she' };
}
