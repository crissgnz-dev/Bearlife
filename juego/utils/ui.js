let heartsGroup;
export let lives = 3;

export function getLives() {
  return lives;
}

export function setLives(n) {
  lives = n;
}

export function getHeartsGroup() {
  return heartsGroup;
}

export function createHearts(scene, maxLives) {
  lives = maxLives;
  heartsGroup = scene.add.group();
  for (let i = 0; i < lives; i++) {
    let heart = scene.add.image(0, 0, "vida").setScale(0.45);
    heartsGroup.add(heart);
  }
}

export function updateHeartsPosition(player) {
  const totalWidth = (lives - 1) * 8;
  if (heartsGroup) {
    heartsGroup.children.iterate((heart, index) => {
      if (heart) {
        heart.x = player.x - totalWidth / 2 + index * 8;
        heart.y = player.y - 17;
      }
    });
  }
}

export function loseLife() {
  if (lives > 0) {
    lives -= 1;
    const hearts = heartsGroup.getChildren();
    if (hearts.length > 0) {
      hearts[hearts.length - 1].destroy();
    }
    return true;
  }
  return false;
}
