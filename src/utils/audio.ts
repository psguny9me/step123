import { Howl } from 'howler';

// Placeholder sounds - in a real app these would be actual files
// We can use base64 data URIs for simple beeps if files aren't available, 
// or just rely on the user providing them. 
// For this prototype, I'll use a simple oscillator beep if possible, but Howler needs files.
// I will assume we have some assets or just use a silent placeholder for now and instruct the user.

export const sfx = {
    step: new Howl({
        src: ['https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.mp3'], // Generic click/step
        volume: 0.5,
    }),
    miss: new Howl({
        src: ['https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.mp3'], // Reuse for now
        rate: 0.5, // Lower pitch for error
        volume: 0.5,
    }),
    bgm: new Howl({
        src: ['https://assets.mixkit.co/active_storage/sfx/110/110-preview.mp3'], // Simple beat
        loop: true,
        volume: 0.3,
    })
};
