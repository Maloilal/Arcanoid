import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const Game = () => {
  const gameRef = useRef(null);

  useEffect(() => {
    let ball,
      paddle,
      bricks,
      cursors,
      score = 0,
      scoreText,
      gameOverText,
      restartKey,
      gamePauseText,
      gamePauseKey,
      levelText;
    let level = 1;
    const initialBallSpeed = 150;
    const ballSpeedIncrement = 50;
    let isPaused = false;

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scene: {
        preload,
        create,
        update,
      },
    };

    const game = new Phaser.Game(config);

    function createBrickTexture(scene, name, color) {
      const graphics = scene.add.graphics();
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 0, 60, 20);
      graphics.generateTexture(name, 60, 20);
      graphics.destroy();
    }

    function preload() {
      const ballGraphics = this.add.graphics();
      ballGraphics.fillStyle(0xff0000, 1);
      ballGraphics.fillCircle(10, 10, 10);
      ballGraphics.generateTexture("ballTexture", 20, 20);
      ballGraphics.destroy();

      const paddleGraphics = this.add.graphics();
      paddleGraphics.fillStyle(0x00ff00, 1);
      paddleGraphics.fillRect(0, 0, 100, 20);
      paddleGraphics.generateTexture(
        "paddleTexture",
        100,
        20,
      );
      paddleGraphics.destroy();

      createBrickTexture(this, "yellow_brick", 0xd8d839);
      createBrickTexture(this, "green_brick", 0x93df76);
      createBrickTexture(this, "blue_brick", 0x76badf);
    }

    function create() {
      ball = this.physics.add
        .image(400, 500, "ballTexture")
        .setCircle(10)
        .setBounce(1, 1)
        .setCollideWorldBounds(true)
        .setVelocity(initialBallSpeed, -initialBallSpeed);

      paddle = this.physics.add
        .image(400, 550, "paddleTexture")
        .setImmovable(true)
        .setCollideWorldBounds(true);

      const rows = 5;
      const cols = Math.floor(this.cameras.main.width / (60 + 10));
      const brickWidth = 60;
      const brickHeight = 30;
      const spaceBetweenBricks = 10;

      bricks = this.physics.add.group();

      const colors = ["yellow_brick", "green_brick", "blue_brick"];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = 50 + col * (brickWidth + spaceBetweenBricks);
          const y = 100 + row * (brickHeight + spaceBetweenBricks);
          const colorIndex = (row + col) % colors.length;
          const brick = bricks.create(x, y, colors[colorIndex]);
          brick.setImmovable(true);
        }
      }

      this.physics.add.collider(ball, paddle, ballHitPaddle, null, this);
      this.physics.add.collider(ball, bricks, ballHitBrick, null, this);

      scoreText = this.add.text(16, 16, "Score: 0", {
        fontSize: "32px",
        fill: "#fff",
      });

      gameOverText = this.add.text(400, 300, "Game Over", {
        fontSize: "64px",
        fill: "#fff",
      });
      gameOverText.setOrigin(0.5);
      gameOverText.setVisible(false);

      gamePauseText = this.add.text(400, 300, "Pause", {
        fontSize: "64px",
        fill: "#fff",
      });
      gamePauseText.setOrigin(0.5);
      gamePauseText.setVisible(false);

      levelText = this.add.text(400, 20, `Level: ${level}`, {
        fontSize: "30px",
        fill: "#fff",
      });
      levelText.setOrigin(0.5, 0);

      cursors = this.input.keyboard.createCursorKeys();
      restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      gamePauseKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ESC,
      );

      this.physics.world.TILE_BIAS = 16;
      this.physics.world.on("worldbounds", checkGameOver, this);
      ball.body.onWorldBounds = true;
    }

    function updatePuddleSpeed() {
      if (isPaused) return;

      if (cursors.left.isDown) {
        paddle.setVelocityX(-500);
        return;
      }
      
      if (cursors.right.isDown) {
        paddle.setVelocityX(500);
        return;
      }
      
      paddle.setVelocityX(0);
    }

    function updatePauseState(scene) {
      if (!Phaser.Input.Keyboard.JustDown(gamePauseKey)) return;

      if (isPaused) {
        scene.physics.resume();
      } else {
        scene.physics.pause();
      }
      
      gamePauseText.setVisible(!isPaused);
      isPaused = !isPaused;
    }
    
    function update() {
      updatePuddleSpeed();
      updatePauseState(this);
      restartGame(this);
    }

    function ballHitPaddle(ball, paddle) {
      let diff = 0;
      
      if (ball.x < paddle.x) {
        diff = paddle.x - ball.x;
        ball.setVelocityX(-10 * diff);
      }
      
      if (ball.x > paddle.x) {
        diff = ball.x - paddle.x;
        ball.setVelocityX(10 * diff);
      }
    }

    function ballHitBrick(ball, brick) {
      brick.disableBody(true, true);
      score += 10;
      scoreText.setText("Score: " + score);

      if (bricks.countActive() === 0) {
        level++;
        increaseBallSpeed();
        resetBricks(this);
      }
    }

    function increaseBallSpeed() {
      ball.setVelocity(
        initialBallSpeed + level * ballSpeedIncrement,
        -(initialBallSpeed + level * ballSpeedIncrement),
      );
    }

    function resetBricks() {
      bricks.children.iterate((brick) => {
        brick.enableBody(true, brick.x, brick.y, true, true);
      });
    }

    function checkGameOver(body, up, down, left, right) {
      if (down) {
        gameOverText.setVisible(true);
        ball.setVelocity(0);
        ball.body.setCollideWorldBounds(false);
        this.physics.pause();
      }
    }

    function restartGame(scene) {
      if (isPaused || !restartKey.isDown) return;
      
      score = 0;
      level = 1;
      scoreText.setText("Score: 0");
      gameOverText.setVisible(false);

      ball.setPosition(400, 500);
      ball.setVelocity(initialBallSpeed, -initialBallSpeed);
      ball.body.setCollideWorldBounds(true);

      resetBricks(scene);

      scene.physics.resume();
    }

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={gameRef} />;
};

export default Game;
