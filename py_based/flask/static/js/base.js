// This example uses the Phaser 2.2.2 framework

// Copyright © 2014 John Watson
// Licensed under the terms of the MIT License

//AJAX FUNCTION(S)
var AJAX_PostEvent = function() {

// This function defines the method we used to send Ys upon
// 1. a moonlanding crash
// 2. timeout

  var data = {
      'status':'success'
  }

  $.ajax({
      type: 'POST',
      url:  '/',
      data: data,
      dataType: 'json',
      success:function(data){
          alert(JSON.stringify(data));
      }
  });
} 

//GLOBAL VARIABLES
var DISABLE_ROTATION = 1; // DISABLES ROTATION OF ROCKET
var ENABLE_DEBUG_MSGS = 1; // ENABLES DEBUG MESSAGES

var GameState = function(game) {

    // Define feature as state member variables
    this.Y = 0;
    this.acceleration = 0;
    this.velocity = 0;
    this.explode = 0;

};

// Load images and sounds
GameState.prototype.preload = function() {
   this.game.load.spritesheet('ship', '/static/assets/gfx/ship.png', 32, 32);
   this.game.load.image('ground', '/static/assets/gfx/ground.png');
   this.game.load.spritesheet('explosion', '/static/assets/gfx/explosion.png', 128, 128);
};

// Setup the example
GameState.prototype.create = function() {
    // Enable FPS counter
    this.game.time.advancedTiming = true;

    // Set stage background color
    this.game.stage.backgroundColor = 0x333333;

    // Define motion constants
    if(DISABLE_ROTATION)
      this.ROTATION_SPEED = 0; // degrees/second
    else{
      this.ROTATION_SPEED = 180; // degrees/second
    }
    this.ACCELERATION = 200; // pixels/second/second
    this.MAX_SPEED = 250; // pixels/second
    this.DRAG = 0; // pixels/second
    this.GRAVITY = 50; // pixels/second/second

    // Add the ship to the stage
    this.ship = this.game.add.sprite(0, 0, 'ship');
    this.ship.anchor.setTo(0.5, 0.5);
    this.ship.angle = -90; // Point the ship up

    // Enable physics on the ship
    this.game.physics.enable(this.ship, Phaser.Physics.ARCADE);

    // Set maximum velocity
    this.ship.body.maxVelocity.setTo(this.MAX_SPEED, this.MAX_SPEED); // x, y

    // Add drag to the ship that slows it down when it is not accelerating
    this.ship.body.drag.setTo(this.DRAG, this.DRAG); // x, y

    // Choose a random starting angle and velocity for the ship
    this.resetShip();

    // Turn on gravity
    game.physics.arcade.gravity.y = this.GRAVITY;

    // Make ship bounce a little
    this.ship.body.bounce.setTo(0.25, 0.25);

    // Create some ground for the ship to land on
    this.ground = this.game.add.group();
    for(var x = 0; x < this.game.width; x += 32) {
        // Add the ground blocks, enable physics on each, make them immovable
        var groundBlock = this.game.add.sprite(x, this.game.height - 32, 'ground');
        this.game.physics.enable(groundBlock, Phaser.Physics.ARCADE);
        groundBlock.body.immovable = true;
        groundBlock.body.allowGravity = false;
        this.ground.add(groundBlock);
    }

    // Create a group for explosions
    this.explosionGroup = this.game.add.group();

    // Capture certain keys to prevent their default actions in the browser.
    // This is only necessary because this is an HTML5 game. Games on other
    // platforms may not need code like this.
    this.game.input.keyboard.addKeyCapture([
        Phaser.Keyboard.LEFT,
        Phaser.Keyboard.RIGHT,
        Phaser.Keyboard.UP,
        Phaser.Keyboard.DOWN
    ]);
};

// Try to get a used explosion from the explosionGroup.
// If an explosion isn't available, create a new one and add it to the group.
// Setup new explosions so that they animate and kill themselves when the
// animation is complete.
GameState.prototype.getExplosion = function(x, y) {
    // Get the first dead explosion from the explosionGroup
    var explosion = this.explosionGroup.getFirstDead();

    // If there aren't any available, create a new one
    if (explosion === null) {
        explosion = this.game.add.sprite(0, 0, 'explosion');
        explosion.anchor.setTo(0.5, 0.5);

        // Add an animation for the explosion that kills the sprite when the
        // animation is complete
        var animation = explosion.animations.add('boom', [0,1,2,3], 60, false);
        animation.killOnComplete = true;

        // Add the explosion sprite to the group
        this.explosionGroup.add(explosion);
    }

    // Revive the explosion (set it's alive property to true)
    // You can also define a onRevived event handler in your explosion objects
    // to do stuff when they are revived.
    explosion.revive();

    // Move the explosion to the given coordinates
    explosion.x = x;
    explosion.y = y;

    // Set rotation of the explosion at random for a little variety
    // explosion.angle = this.game.rnd.integerInRange(0, 360);

    // Play the animation
    explosion.animations.play('boom');

    // Return the explosion itself in case we want to do anything else with it
    return explosion;
};

GameState.prototype.resetShip = function() {
    // Move the ship back to the top of the stage
    this.ship.x = this.game.width/2;
    this.ship.y = 32;
    this.ship.body.acceleration.setTo(0, 0);

    // Select a random starting angle and velocity
    this.ship.body.velocity.setTo(0, 0);
};

// The update() method is called every frame
GameState.prototype.update = function() {

    // Feature values display at the top-left corner on screen 
    if(ENABLE_DEBUG_MSGS){
      this.game.debug.text(this.game.time.fps, 2, 14, "#00ff00");
      this.game.debug.text("Y = " + Number(this.ship.y).toFixed(2), 2, 34, "#00ff00");
      this.game.debug.text("Velocity = " + Number(this.ship.body.velocity.y).toFixed(2), 2, 54, "#00ff00");
      
      // Keeping track of feature values
      this.Y = this.ship.y.toFixed(2);
      this.acceleration = this.ship.body.acceleration;
      this.velocity = this.ship.body.velocity.y.toFixed(2);
    }

    // Collide the ship with the ground
    this.game.physics.arcade.collide(this.ship, this.ground);

    // Keep the ship on the screen
    if (this.ship.x > this.game.width) this.ship.x = 0;
    if (this.ship.x < 0) this.ship.x = this.game.width;

    if (this.leftInputIsActive()) {
        // If the LEFT key is down, rotate left
        this.ship.body.angularVelocity = -this.ROTATION_SPEED;
    } else if (this.rightInputIsActive()) {
        // If the RIGHT key is down, rotate right
        this.ship.body.angularVelocity = this.ROTATION_SPEED;
    } else {
        // Stop rotating
        this.ship.body.angularVelocity = 0;
    }

    // Set a variable that is true when the ship is touching the ground
    var onTheGround = this.ship.body.touching.down;

    if (onTheGround) {
        if (Math.abs(this.ship.body.velocity.y) > 20 || Math.abs(this.ship.body.velocity.x) > 30) {
            // The ship hit the ground too hard.
            // Blow it up and start the game over.
            this.getExplosion(this.ship.x, this.ship.y);
            
            // Explosion triggers an event termination signal and 
            // at the same time we log and pass over feature values
            // to render() function where we stop the game
            this.resetShip();
            this.explode = 1;
            
        } else {
            // We've landed!
            // Stop rotating and moving and aim the ship up.
            this.ship.body.angularVelocity = 0;
            this.ship.body.velocity.setTo(0, 0);
            this.ship.angle = -90;
        }

    }

    if(this.ship.y < 0) {
      // The ship hit the 'ceiling'
      // Blow it up and start the game over.
      this.getExplosion(this.ship.x, this.ship.y);
      
      // Same idea as when we hit the ground
      this.resetShip();
      this.explode = 1;
    }

    if (this.upInputIsActive()) {
        // If the UP key is down, thrust
        // Calculate acceleration vector based on this.angle and this.ACCELERATION
        this.ship.body.acceleration.x = Math.cos(this.ship.rotation) * this.ACCELERATION;
        this.ship.body.acceleration.y = Math.sin(this.ship.rotation) * this.ACCELERATION;

        // Show the frame from the spritesheet with the engine on
        this.ship.frame = 1;
    } else {
        // Otherwise, stop thrusting
        this.ship.body.acceleration.setTo(0, 0);

        // Show the frame from the spritesheet with the engine off
        this.ship.frame = 0;
    }
};

// Try overloading the render function
GameState.prototype.render = function() {

    // When we receive the explode signal we stop the game
    // exit and return to the calling function with fitness score
    if (1 == this.explode) {

        console.log(this.Y);
        console.log(this.acceleration);
        console.log(this.velocity);
        console.log(this.explode);
        this.explode = 0;

        // DEBUG
        // Stop game when ship explodes
        // function StopGame(){ Error.apply(this, arguments); this.name = "StopGame";  }
        // StopGame.prototype = Object.create(Error.prototype);
        // throw new StopGame("Stopping game..");
        
        // A moonlanding crash will trigger a POST event
        // and we need to let timeout trigger the POST as well
        AJAX_PostEvent('', 'test', 'test');
    }
};

// This function should return true when the player activates the "go left" control
// In this case, either holding the right arrow or tapping or clicking on the left
// side of the screen.
GameState.prototype.leftInputIsActive = function() {
    var isActive = false;

    isActive = this.input.keyboard.isDown(Phaser.Keyboard.LEFT);
    isActive |= (this.game.input.activePointer.isDown &&
        this.game.input.activePointer.x < this.game.width/4);

    return isActive;
};

// This function should return true when the player activates the "go right" control
// In this case, either holding the right arrow or tapping or clicking on the right
// side of the screen.
GameState.prototype.rightInputIsActive = function() {
    var isActive = false;

    isActive = this.input.keyboard.isDown(Phaser.Keyboard.RIGHT);
    isActive |= (this.game.input.activePointer.isDown &&
        this.game.input.activePointer.x > this.game.width/2 + this.game.width/4);

    return isActive;
};

// This function should return true when the player activates the "jump" control
// In this case, either holding the up arrow or tapping or clicking on the center
// part of the screen.
GameState.prototype.upInputIsActive = function() {
    var isActive = false;

    isActive = this.input.keyboard.isDown(Phaser.Keyboard.UP);
    isActive |= (this.game.input.activePointer.isDown &&
        this.game.input.activePointer.x > this.game.width/4 &&
        this.game.input.activePointer.x < this.game.width/2 + this.game.width/4);

    return isActive;
};

var game = new Phaser.Game(848, 450, Phaser.AUTO, 'game');
game.state.add('game', GameState, true);
