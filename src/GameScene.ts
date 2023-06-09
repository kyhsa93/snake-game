import { Snake } from './Snake';
import { Food } from './Food';
import { resetScore, updateScore } from './utility';
import { config, GRID_SIZE } from './config';

export class GameScene extends Phaser.Scene {
  snake?: Snake;
  food?: Food;
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  scoreText?: Phaser.GameObjects.Text;
  timeText?: Phaser.GameObjects.Text;
  startTime?: number;
  lastScoreUpdateTime: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.timeText = this.add.text(config.width - 100, 16, "00:00", { fontSize: "32px", color: "#FFF" });

    this.cameras.main.setBounds(0, 0, config.width, config.height);

    this.snake = new Snake(this);
    this.food = new Food(this);
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.scoreText = this.add.text(16, 16, "Score: 0", { fontSize: "32px", color: "#FFF" });
    this.cameras.main.setPosition((config.width - this.cameras.main.width) / 2, (config.height - this.cameras.main.height) / 2);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const touchX = pointer.x;
      const touchY = pointer.y;
      const centerX = this.cameras.main.centerX;
      const centerY = this.cameras.main.centerY;

      if (!this.snake || !this.snake.alive) return;

      const dx = touchX - centerX;
      const dy = touchY - centerY;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && !this.snake.direction.equals(Phaser.Math.Vector2.LEFT)) {
          this.snake.direction = Phaser.Math.Vector2.RIGHT;
        } else if (dx < 0 && !this.snake.direction.equals(Phaser.Math.Vector2.RIGHT)) {
          this.snake.direction = Phaser.Math.Vector2.LEFT;
        }
      } else {
        if (dy > 0 && !this.snake.direction.equals(Phaser.Math.Vector2.UP)) {
          this.snake.direction = Phaser.Math.Vector2.DOWN;
        } else if (dy < 0 && !this.snake.direction.equals(Phaser.Math.Vector2.DOWN)) {
          this.snake.direction = Phaser.Math.Vector2.UP;
        }
      }
    });

    this.startTime = this.time.now;
    this.lastScoreUpdateTime = this.startTime;
    this.updateTimeText(0);
    resetScore(this.scoreText);
  }

  updateTimeText(elapsedTime: number): void {
    if (this.timeText) {
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;
      this.timeText.setText(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }
  }

  changeBackgroundColor(): void {
    const randomColor = Phaser.Display.Color.RandomRGB().color32;
    this.cameras.main.setBackgroundColor(randomColor);
  }

  update(time: number): void {
    if (!this.startTime) {
      this.startTime = this.time.now;
      this.lastScoreUpdateTime = this.startTime;
    }

    if (!this.snake?.alive) {
      const score = this.scoreText ? parseInt(this.scoreText.text.split(' ')[1]) : 0;
      const elapsedTime = this.timeText ? this.timeText.text : "00:00";
      this.scene.start('GameOverScene', { score, elapsedTime });
      return;
    }

    if (!this.cursors || !this.food) return;

    const { left, right, up, down } = this.cursors;
    const { x, y } = this.snake.direction;

    if (Phaser.Input.Keyboard.JustDown(left) && x !== GRID_SIZE) {
      if (this.snake.direction !== Phaser.Math.Vector2.RIGHT)
        this.snake.direction = Phaser.Math.Vector2.LEFT;
    } else if (Phaser.Input.Keyboard.JustDown(right) && x !== -GRID_SIZE) {
      if (this.snake.direction !== Phaser.Math.Vector2.LEFT)
        this.snake.direction = Phaser.Math.Vector2.RIGHT;
    } else if (Phaser.Input.Keyboard.JustDown(up) && y !== GRID_SIZE) {
      if (this.snake.direction !== Phaser.Math.Vector2.DOWN)
        this.snake.direction = Phaser.Math.Vector2.UP;
    } else if (Phaser.Input.Keyboard.JustDown(down) && y !== -GRID_SIZE) {
      if (this.snake.direction !== Phaser.Math.Vector2.UP)
        this.snake.direction = Phaser.Math.Vector2.DOWN;
    }

    if (this.snake.update(time) && this.snake.collideWithFood(this.food)) {
      this.snake.grow();
      this.food.avoidOverlap(this.snake);
      if (this.scoreText) updateScore(this.scoreText, 10);
      this.changeBackgroundColor();
    }

    if (this.timeText && this.startTime) {
      const elapsedTime = Math.floor((this.time.now - this.startTime) / 1000);
      this.updateTimeText(elapsedTime);
    }

    if (this.lastScoreUpdateTime && this.time.now - this.lastScoreUpdateTime >= 1000) {
      if (this.scoreText) updateScore(this.scoreText, 1);
      this.lastScoreUpdateTime = this.time.now;
    }
  }
}
