/**
 * Sound effects hook — ready for expo-audio integration.
 * To enable real audio: install expo-audio, load .mp3 files,
 * and replace the stub functions below.
 */
export function useSoundEffects() {
  return {
    playWin:         () => { /* TODO: play win.mp3 */ },
    playBigWin:      () => { /* TODO: play big-win.mp3 */ },
    playLose:        () => { /* TODO: play lose.mp3 */ },
    playSpin:        () => { /* TODO: play spin.mp3 */ },
    playFlip:        () => { /* TODO: play flip.mp3 */ },
    playRoll:        () => { /* TODO: play roll.mp3 */ },
    playClick:       () => { /* TODO: play click.mp3 */ },
    playDailyReward: () => { /* TODO: play coins.mp3 */ },
    playLevelUp:     () => { /* TODO: play level-up.mp3 */ },
  };
}
