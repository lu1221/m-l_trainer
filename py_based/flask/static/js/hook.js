// 
// This example uses the Phaser 2.2.2 framework and additional edits
// are performed on top of the framework to addin Ajax support.
// This forms the basis of our genetic evo algo
//

// Base Copyright © 2014 John Watson
// Licensed under the terms of the MIT License

//GLOBAL VARIABLES
var DISABLE_ROTATION = 1; // DISABLES ROTATION OF ROCKET
var ENABLE_DEBUG_MSGS = 1; // ENABLES DEBUG MESSAGES
var TIMEOUT = 25;

var GLOBAL_MATRIX_COUNT = -1;
var GLOBAL_MATRIX = [];

var GLOBAL_INIT = 0;
var GLOBAL_RUN = 0;
var GLOBAL_RET = 0;

var GLOBAL_STARTTIME;
var GLOBAL_ENDTIME;
var GLOBAL_TIMEDIFF;

// The following UTILS_* functions are Pretty self-explanatory,
// they are helper functions that does matrix operations
var UTILS_starttimer = function() {
    GLOBAL_STARTTIME = new Date();
}

var UTILS_endtimer = function() {
    GLOBAL_ENDTIME = new Date();
    GLOBAL_TIMEDIFF = GLOBAL_ENDTIME - GLOBAL_STARTTIME;
    
    // Use second as the unit but have ms as the precision
    GLOBAL_TIMEDIFF /= 1000;
    GLOBAL_TIMEDIFF = Math.round(GLOBAL_TIMEDIFF*1000)/1000;
}

var UTILS_thresholdcheck = function(input, threshold) {
    return (input < 0.54);
}

var UTILS_activation = function(x) {
    
    var result;

    // Sigmoid
    result = 1 / (1 + Math.exp(-1 * x));

    return result;

}

var UTILS_matrixMultiple = function(matrixA, matrixB) {

    // Matrix A - getting row and column counts
    var mA_row = matrixA.length;
    var mA_col = matrixA[0].length;

    // Matrix B - getting row and column counts
    var mB_row = matrixB.length;
    var mB_col = matrixB[0].length;

    // DBG
    // console.log(mA_row, mA_col, mB_row, mB_col);

    // Perform A X B
    // dim(result) = (mA_row x mB_col)
    var result = [];
    for (var i=0; i<mA_row; i++) {
        // Finish declaring 2D array
        result[i] = [];
        for (var j=0; j<mB_col; j++) {
            // Temp VAR to store matrixA[row#][*] * matrixB[*][col#]
            var interim = 0;
            // Either dim(mA_col) or dim(mB_row) is ok as they should match
            for (var k=0; k<mA_col; k++) {
                interim += matrixA[i][k] * matrixB[k][j];
            }
            // Apply activation function (in this case we keep it sigmoid)
            result[i][j] = UTILS_activation(interim);
        }
    } 
    
    return result;
}

var UTILS_matrixTranspose = function(matrix) {

    var row = matrix.length;
    var col = matrix[0].length;

    var result = [];
    for (var j=0; j<col; j++) {
        result[j] = [];
    }

    for (var i=0; i<row; i++) {
        for (var j=0; j<col; j++) {
            result[j][i] = matrix[i][j];
        }
    }

    return result;
}

// This event handler function makes the game engine render/do
// nothing until get a successful init response containing
// weight matrix
var AJAXCall_initReq = function(data) {
  
  $.ajax({
      contentType: "application/json; charset=utf-8",
      type:     'GET',
      url:      '/init',
      data:     JSON.stringify(data),
      dataType: "text",
      error:    function(XMLHttpRequest, textStatus, errorThrown) {
          alert(XMLHttpRequest.status)
          alert(XMLHttpRequest.readyState)
          alert(textStatus)
      },
      success:  function(data) {
          var ack = JSON.parse(data);
          GLOBAL_MATRIX_COUNT = ack["matrix_count"]; 
          GLOBAL_MATRIX = ack["matrix"];
          GLOBAL_INIT = ack["status"];
      }
  });

}

// This even handler function simplely POST the award score our
// main python
var AJAXCall_retAwardScore = function(data) {
  
  $.ajax({
      contentType: "application/json; charset=utf-8",
      type:     'POST',
      url:      '/ret',
      data:     JSON.stringify(data),
      dataType: "text",
      error:    function(XMLHttpRequest, textStatus, errorThrown) {
          alert(XMLHttpRequest.status)
          alert(XMLHttpRequest.readyState)
          alert(textStatus)
      },
      success:  function(data) {
      }
  });

}


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

    // Init REQ, non-blocking wait for ACK
    // Once we have the ACK, "de"-reset the ship and start
    // simulate
    AJAXCall_initReq("REQ_1");
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

      // DBG
      // console.log(init);
    }

    // Early catch RET flag
    // If we arrive at the point it means we already went
    // through simulation once, and this is the 2+ round
    if (GLOBAL_RET) {
        GLOBAL_RET = 0;
        AJAXCall_initReq("REQ_N");
    }

    // Have we init i.e. received a weight matrix yet?
    // Yes? continue
    // No? reset and return
    // We are in the init phase
    if (!GLOBAL_INIT && !GLOBAL_RUN) {
        this.resetShip();
        return;
    }

    // If we arrive at this point we've already received the
    // ACK as well as the weight matrix
    // We are in the run phase
    if (GLOBAL_INIT && !GLOBAL_RUN) {
        GLOBAL_INIT = 0;
        GLOBAL_RUN  = 1;

        // Start timer
        UTILS_starttimer();
    }

    // Get current state of altitude and velocity
    var data = {
        "status" : "success",
        "altitude" : this.Y,
        "acceleration" : this.acceleration,
        "velocity" : this.velocity,
        "explode" : this.explode
    }

    // Real-time prediction
    var input_matrix = [[data["altitude"], data["velocity"]]];
    var interim = UTILS_matrixMultiple(input_matrix, GLOBAL_MATRIX[0]);
    for (var i=1; i<GLOBAL_MATRIX_COUNT; i++) {
        interim = UTILS_matrixMultiple(interim, GLOBAL_MATRIX[i]);
    }
    var action = interim[0][0];
    // DBG
    // console.log(data["altitude"], data["velocity"],action);

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

    // Stop timer
    UTILS_endtimer();
    // DBG
    console.log("Elapsed time(s): " + GLOBAL_TIMEDIFF);

    // Set a variable that is true when the ship is touching the ground
    var onTheGround = this.ship.body.touching.down;

    // We are in the return phase
    // if (onTheGround || over the ceiling || Timeout)
    if (onTheGround || this.ship.y < 0 || GLOBAL_TIMEDIFF > TIMEOUT) {
        // Clear all flags and await for let-go signal from MAIN
        GLOBAL_INIT = 0;
        GLOBAL_RUN = 0;
        // Set return flag and send another REQ
        GLOBAL_RET = 1;

        // Award score calculation goes here
        // There are multiple criteria determining the reward score
        // 1st: range[0-402*200]: focusing on ruling out timing out
        // 2nd: range[0-(402+200)*1/(402/201)]: focusing on ruling out crashing with max speed
        // 3rd: range[0-350*35] : give timeout a weight
        var weight_1 = (402 - Math.abs(data["altitude"])) * Math.abs(data["velocity"]);
        var weight_2_f1 = (402 - Math.abs(data["altitude"])) + Number(Math.abs(data["velocity"]));
        var weight_2_f2 = 1/( Math.abs(data["altitude"])/(Math.abs(data["velocity"]) + 1) );
        var weight_2 = weight_2_f1 * weight_2_f2; 
        var weight_3 = 350 * GLOBAL_TIMEDIFF;
        
        // DBG
        console.log("weight 1 : " + weight_1);
        console.log("weight 2 : " + weight_2);
        console.log("weight 2 f1 : " + weight_2_f1);
        console.log("weight 2 f2 : " + weight_2_f2);
        console.log("weight 3 : " + weight_3);

        var rewardScore = weight_1 + weight_2 + weight_3;

        // POST award score to MAIN
        AJAXCall_retAwardScore(rewardScore);
    }

    if (GLOBAL_TIMEDIFF > TIMEOUT) {
        this.getExplosion(this.ship.x, this.ship.y);
        this.resetShip();
        this.explode = 1;
        UTILS_starttimer();
    }

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
        
        // Either a moonlanding crash or successful landing will trigger a POST event
        // and we need to let timeout trigger the POST as well
        data['explode'] = this.explode // explosion status update
    }

    if(this.ship.y < 0) {
      // The ship hit the 'ceiling'
      // Blow it up and start the game over.
      this.getExplosion(this.ship.x, this.ship.y);
      
      // Same idea as when we hit the ground
      this.resetShip();
      this.explode = 1;
        
      // Either a moonlanding crash or successful landing will trigger a POST event
      // and we need to let timeout trigger the POST as well
      data['explode'] = this.explode // explosion status update
    }

    // old: if (this.upInputIsActive()) {
    if ( UTILS_thresholdcheck(action, 0.5) ) {
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

        // DBG
        // console.log(this.Y);
        // console.log(this.acceleration);
        // console.log(this.velocity);
        // console.log(this.explode);
        this.explode = 0;

        // DEBUG
        // Stop game when ship explodes
        // function StopGame(){ Error.apply(this, arguments); this.name = "StopGame";  }
        // StopGame.prototype = Object.create(Error.prototype);
        // throw new StopGame("Stopping game..");
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
