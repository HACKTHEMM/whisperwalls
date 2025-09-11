// Moderation utilities for validating user-provided notes

// Keep lists small and maintainable; expand over time or swap to API later
const PROFANE_WORDS = [
	// Minimal starter set; consider external lists or APIs for production
	"fuck",
	"shit",
	"bitch",
	"asshole",
	"bastard",
	"slut",
	"whore",
	"nigger",
	"faggot",
	"cunt",
];

const DISALLOWED_PATTERNS: RegExp[] = [
	/https?:\/\//i, // links
	/@\w{2,}/i, // mass tagging/handles
	/(.)\1{4,}/i, // excessive repeated chars
	/[\p{So}\p{Sk}]{6,}/u, // excessive symbols/emojis
];

function containsProfanity(text: string): boolean {
	const normalized = text.toLowerCase();
	return PROFANE_WORDS.some((w) => normalized.includes(w));
}

function looksLikeGibberish(text: string): boolean {
	const letters = text.replace(/[^a-zA-Z]/g, "");
	if (letters.length < 6) return false; // short notes can be terse
	const vowels = (letters.match(/[aeiou]/gi) || []).length;
	const ratio = vowels / letters.length;
	return ratio < 0.18 || ratio > 0.9; // too few or too many vowels
}

export type ModerationResult = {
	allowed: boolean;
	reason?: string;
};

export function validateNoteForModeration(note: string): ModerationResult {
	const trimmed = note.trim();

	if (trimmed.length === 0) {
		return { allowed: false, reason: "Note cannot be empty." };
	}
	if (trimmed.length > 500) {
		return { allowed: false, reason: "Note is too long (max 500 characters)." };
	}
	if (containsProfanity(trimmed)) {
		return { allowed: false, reason: "Please remove offensive language." };
	}
	if (DISALLOWED_PATTERNS.some((re) => re.test(trimmed))) {
		return { allowed: false, reason: "Links, spam, or repeated characters are not allowed." };
	}
	if (looksLikeGibberish(trimmed)) {
		return { allowed: false, reason: "Note looks cryptic/gibberish. Add more meaningful words." };
	}
	return { allowed: true };
}

export function sanitizeNoteForDisplay(note: string): string {
	// Basic sanitizer: ensure it's plain text and clamp length
	const plain = note.replace(/[\r\n\t]+/g, " ").trim();
	return plain.length > 500 ? plain.slice(0, 500) + "…" : plain;
}
