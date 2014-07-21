/**
 * Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Based on THREE.PointerLockControls by mrdoob.
 * @author benvanik
 */

var getContainerDimensions = function() {
	if ( this && this.domElement && this.domElement != document ) {

		return {
			size	: [ this.domElement.offsetWidth, this.domElement.offsetHeight ],
			offset	: [ this.domElement.offsetLeft,  this.domElement.offsetTop ]
		};

	} else {

		return {
			size	: [ window.innerWidth, window.innerHeight ],
			offset	: [ 0, 0 ]
		};

	}
};

THREE.OculusRiftControls = function ( camera ) {

	var scope = this;

	var moveObject = new THREE.Object3D();
	moveObject.position.y = 10;
	moveObject.add( camera );

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;

	var isOnObject = false;
	var canJump = false;

	var velocity = new THREE.Vector3();

	var PI_2 = Math.PI / 2;

	this.moveSpeed = 0.12 / 4;
	this.jumpSpeed = 2;



	var moveState = { 
		up: 0, 
		down: 0, 
		left: 0, 
		right: 0, 
		forward: 0, 
		back: 0, 
		pitchUp: 0, 
		pitchDown: 0, 
		yawLeft: 0, 
		yawRight: 0, 
		rollLeft: 0, 
		rollRight: 0 
	};



	var _q1 = new THREE.Quaternion();
	var _q2 = new THREE.Quaternion();
	var rotationVector = new THREE.Vector3( 0, 0, 0 );
	var axisX = new THREE.Vector3( 1, 0, 0 );
	var axisY = new THREE.Vector3( 0, 1, 0 );
	var axisZ = new THREE.Vector3( 0, 0, 1 );

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var container = getContainerDimensions();
		var halfWidth  = container.size[ 0 ] / 2;
		var halfHeight = container.size[ 1 ] / 2;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
		var movementZ = event.movementZ || event.mozMovementZ || event.webkitMovementZ || 0;

		console.log( "Movement X: " + movementX );
		// console.log( "Movement Y: " + movementY );
		// console.log( "Movement Z: " + movementZ );

		moveState.yawLeft   = - ( ( movementX - container.offset[ 0 ] ) - halfWidth  ) / halfWidth;
		moveState.pitchDown =   ( ( movementY - container.offset[ 1 ] ) - halfHeight ) / halfHeight;

		rotationVector.x = ( -moveState.pitchDown + moveState.pitchUp );
		rotationVector.y = ( -moveState.yawRight  + moveState.yawLeft );
		rotationVector.z = ( -moveState.rollRight + moveState.rollLeft );

		//console.log( rotationVector );

		_q1.set( rotationVector.x * 0.01, rotationVector.y * 0.01, rotationVector.z * 0.01, 1 ).normalize();
		moveObject.quaternion.multiply( _q2 );

		//this.tmpQuaternion.set( this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
		//this.object.quaternion.multiply( this.tmpQuaternion );


		// moveObject.translateX( movementX * 0.01 );
		// moveObject.translateY( movementY * 0.01 );
		// moveObject.translateZ( movementZ * 0.01 );

		// console.log(movementX, movementY);

		// moveObject.quaternion.multiply( _q1.setFromAxisAngle( axisZ, movementX * 0.002 ) );
		// moveObject.quaternion.multiply( _q1.setFromAxisAngle( axisX, movementY * 0.002 ) );



		// _q1.setFromAxisAngle( axisZ, movementX * 0.002 );
		// moveObject.quaternion.multiplySelf( _q1 );
		// _q1.setFromAxisAngle( axisX, movementY * 0.002 );
		// moveObject.quaternion.multiplySelf( _q1 );

	};

	var onKeyDown = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true; break;

			case 40: // down
			case 83: // s
				moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				moveRight = true;
				break;

			case 32: // space
				if ( canJump === true ) velocity.y += this.jumpSpeed;
				canJump = false;
				break;

		}

	}.bind(this);

	var onKeyUp = function ( event ) {

		switch( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = false;
				break;

			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // a
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;

		}

	};

	document.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );

	this.enabled = false;

	this.getObject = function () {

		return moveObject;

	};

	this.isOnObject = function ( boolean ) {

		isOnObject = boolean;
		canJump = boolean;

	};

	this.update = function ( delta, vrstate ) {

		//if ( scope.enabled === false ) return;

		delta *= 0.1;

		velocity.x += ( - velocity.x ) * 0.08 * delta;
		velocity.z += ( - velocity.z ) * 0.08 * delta;

		velocity.y -= 0.10 * delta;

		if ( moveForward ) velocity.z -= this.moveSpeed * delta;
		if ( moveBackward ) velocity.z += this.moveSpeed * delta;

		if ( moveLeft ) velocity.x -= this.moveSpeed * delta;
		if ( moveRight ) velocity.x += this.moveSpeed * delta;

		if ( isOnObject === true ) {

			velocity.y = Math.max( 0, velocity.y );

		}

		var rotation = new THREE.Quaternion();
		var angles = new THREE.Vector3();
		if (vrstate) {
			rotation.set(
					vrstate.hmd.rotation[0],
					vrstate.hmd.rotation[1],
					vrstate.hmd.rotation[2],
					vrstate.hmd.rotation[3]);
			angles.setEulerFromQuaternion(rotation, 'XYZ');
			angles.z = 0;
			angles.normalize();
			rotation.setFromEuler(angles, 'XYZ');
			rotation.normalize();
			// velocity.applyQuaternion(rotation);
		}

		moveObject.translateX( velocity.x );
		moveObject.translateY( velocity.y );
		moveObject.translateZ( velocity.z );

		if ( moveObject.position.y < 10 ) {

			velocity.y = 0;
			moveObject.position.y = 10;

			canJump = true;

		}

	};

};
