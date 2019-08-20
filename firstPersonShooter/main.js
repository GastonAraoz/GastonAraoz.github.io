
var map = [ // 1 2 3 4 5 6 7 8 9
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 0
    [1, 1, 0, 0, 0, 0, 0, 1, 1, 1,], // 1
    [1, 1, 0, 0, 2, 0, 0, 0, 0, 1,], // 2
    [1, 0, 0, 0, 0, 2, 0, 0, 0, 1,], // 3
    [1, 0, 0, 2, 0, 0, 2, 0, 0, 1,], // 4
    [1, 0, 0, 0, 2, 0, 0, 0, 1, 1,], // 5
    [1, 1, 1, 0, 0, 0, 0, 1, 1, 1,], // 6
    [1, 1, 1, 0, 0, 1, 0, 0, 1, 1,], // 7
    [1, 1, 1, 1, 1, 1, 0, 0, 1, 1,], // 8
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 9
    ], mapW = map.length, mapH = map[0].length;

    // Semi-constants
const WIDTH = window.innerWidth,
HEIGHT = window.innerHeight,
ASPECT = WIDTH / HEIGHT,
UNITSIZE = 250,
WALLHEIGHT = UNITSIZE / 3,
MOVESPEED = 100,
LOOKSPEED = 0.075,
BULLETMOVESPEED = MOVESPEED * 5,
NUMAI = 5,
PROJECTILEDAMAGE = 20;

// Global vars
var t = THREE, scene, cam, renderer, controls, clock, projector, model, skin;
var runAnim = true, mouse = { x: 0, y: 0 }, kills = 0, health = 100;
var healthCube, lastHealthPickup = 0;
var bullets = [];

$(document).ready(function() {
    $('body').append('<div id="intro">Click to start</div>');
    $('#intro').css({width: WIDTH, height: HEIGHT}).one('click', function(e) {
        e.preventDefault();
        $(this).fadeOut();
        init();
        //setInterval(drawRadar, 1000);
        animate();

    });
});

// Helper function for browser frames
function animate() {
    if (runAnim) {
        requestAnimationFrame(animate);
    }
    render();
}

function init() {
    clock = new t.Clock(); // Used in render() for controls.update()
    projector = new t.Projector(); // Used in bullet projection
    scene = new t.Scene(); // Holds all objects in the canvas
    scene.fog = new t.FogExp2(0xD6F1FF, 0.0005); // color, density
    
    // Set up camera
    cam = new t.PerspectiveCamera(60, ASPECT, 1, 10000); // FOV, aspect, near, far
    cam.position.y = UNITSIZE * .2;
    scene.add(cam);
    
    // Camera moves with mouse, flies around with WASD/arrow keys
    controls = new t.FirstPersonControls(cam);
    controls.movementSpeed = MOVESPEED;
    controls.lookSpeed = LOOKSPEED;
    controls.lookVertical = false; // Temporary solution; play on flat surfaces only
    controls.noFly = true;

    setupScene();

      // Handle drawing as WebGL (faster than Canvas but less supported)
      renderer = new t.WebGLRenderer();
      renderer.setSize(WIDTH, HEIGHT);
      
      // Add the canvas to the document
      renderer.domElement.style.backgroundColor = '#D6F1FF'; // easier to see
      document.body.appendChild(renderer.domElement);
      
      // Track mouse position so we know where to shoot
      document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  
}




// Set up the objects in the world
function setupScene() {
    var UNITSIZE = 250, units = mapW;

    // Geometry: floor
    var floor = new t.Mesh(
            new t.CubeGeometry(units * UNITSIZE, 10, units * UNITSIZE),
            new t.MeshLambertMaterial({color: 0xEDCBA0,/*map: t.ImageUtils.loadTexture('images/floor-1.jpg')*/})
    );
    scene.add(floor);

    
    // Geometry: walls
    var cube = new t.CubeGeometry(UNITSIZE, WALLHEIGHT, UNITSIZE);
    var materials = [
     new t.MeshLambertMaterial({/*color: 0x00CCAA,*/map: t.ImageUtils.loadTexture('Images/wall-1.jpg')}),
     new t.MeshLambertMaterial({/*color: 0xC5EDA0,*/map: t.ImageUtils.loadTexture('Images/wall-2.jpg')}),
     new t.MeshLambertMaterial({color: 0xFBEBCD}),
     ];
    for (var i = 0; i < mapW; i++) {
        for (var j = 0, m = map[i].length; j < m; j++) {
            if (map[i][j]) {
                var wall = new t.Mesh(cube, materials[map[i][j]-1]);
                wall.position.x = (i - units/2) * UNITSIZE;
                wall.position.y = WALLHEIGHT/2;
                wall.position.z = (j - units/2) * UNITSIZE;
                scene.add(wall);
            }
        }
    }
    
    // Health cube
    healthcube = new t.Mesh(
            new t.CubeGeometry(30, 30, 30),
            new t.MeshBasicMaterial({map: t.ImageUtils.loadTexture('images/health.png')})
    );
    healthcube.position.set(-UNITSIZE-15, 35, -UNITSIZE-15);
    scene.add(healthcube);
    
    // Lighting
    var directionalLight1 = new t.DirectionalLight( 0xF7EFBE, 0.7 );
    directionalLight1.position.set( 0.5, 1, 0.5 );
    scene.add( directionalLight1 );
    var directionalLight2 = new t.DirectionalLight( 0xF7EFBE, 0.5 );
    directionalLight2.position.set( -0.5, -1, -0.5 );
    scene.add( directionalLight2 );
}
function animate() {
    if (runAnim) {
        requestAnimationFrame(animate);
    }
    render();
}

    
function onDocumentMouseMove(e) {
    e.preventDefault();
    mouse.x = (e.clientX / WIDTH) * 2 - 1;
    mouse.y = - (e.clientY / HEIGHT) * 2 + 1;

}

// Update and display
function render() {
    var delta = clock.getDelta(), speed = delta * BULLETMOVESPEED;
    var aispeed = delta * MOVESPEED;
    controls.update(delta); // Move camera
    
    // Rotate the health cube
    healthcube.rotation.x += 0.004
    healthcube.rotation.y += 0.008;
    // Allow picking it up once per minute
    if (Date.now() > lastHealthPickup + 60000) {
        if (distance(cam.position.x, cam.position.z, healthcube.position.x, healthcube.position.z) < 15 && health != 100) {
            health = Math.min(health + 50, 100);
            $('#health').html(health);
            lastHealthPickup = Date.now();
        }
        healthcube.material.wireframe = false;
    }
    else {
        healthcube.material.wireframe = true;
    }

    // Update bullets. Walk backwards through the list so we can remove items.
    for (var i = bullets.length-1; i >= 0; i--) {
        var b = bullets[i], p = b.position, d = b.ray.direction;
        if (checkWallCollision(p)) {
            bullets.splice(i, 1);
            scene.remove(b);
            continue;
        }
        // Collide with AI
        var hit = false;
        for (var j = ai.length-1; j >= 0; j--) {
            var a = ai[j];
            var v = a.geometry.vertices[0];
            var c = a.position;
            var x = Math.abs(v.x), z = Math.abs(v.z);

            if (p.x < c.x + x && p.x > c.x - x &&
                    p.z < c.z + z && p.z > c.z - z &&
                    b.owner != a) {
                bullets.splice(i, 1);
                scene.remove(b);
                a.health -= PROJECTILEDAMAGE;
                var color = a.material.color, percent = a.health / 100;
                a.material.color.setRGB(
                        percent * color.r,
                        percent * color.g,
                        percent * color.b
                );
                hit = true;
                break;
            }
        }
        // Bullet hits player
        if (distance(p.x, p.z, cam.position.x, cam.position.z) < 25 && b.owner != cam) {
            $('#hurt').fadeIn(75);
            health -= 10;
            if (health < 0) health = 0;
            val = health < 25 ? '<span style="color: darkRed">' + health + '</span>' : health;
            $('#health').html(val);
            bullets.splice(i, 1);
            scene.remove(b);
            $('#hurt').fadeOut(350);
        }
        if (!hit) {
            b.translateX(speed * d.x);
            b.translateZ(speed * d.z);
        }
    }
    


    renderer.render(scene, cam); // Repaint
    
    // Death
    if (health <= 0) {
        runAnim = false;
        $(renderer.domElement).fadeOut();
        $('#radar, #hud, #credits').fadeOut();
        $('#intro').fadeIn();
        $('#intro').html('Ouch! Click to restart...');
        $('#intro').one('click', function() {
            location = location;
        });
    }
}
function render_updateAI(){
        // Update AI.
        for (var i = ai.length-1; i >= 0; i--) {
            var a = ai[i];
            if (a.health <= 0) {
                ai.splice(i, 1);
                scene.remove(a);
                kills++;
                $('#score').html(kills * 100);
                addAI();
            }
            // Move AI
            var r = Math.random();
            if (r > 0.995) {
                a.lastRandomX = Math.random() * 2 - 1;
                a.lastRandomZ = Math.random() * 2 - 1;
            }
            a.translateX(aispeed * a.lastRandomX);
            a.translateZ(aispeed * a.lastRandomZ);
            var c = getMapSector(a.position);
            if (c.x < 0 || c.x >= mapW || c.y < 0 || c.y >= mapH || checkWallCollision(a.position)) {
                a.translateX(-2 * aispeed * a.lastRandomX);
                a.translateZ(-2 * aispeed * a.lastRandomZ);
                a.lastRandomX = Math.random() * 2 - 1;
                a.lastRandomZ = Math.random() * 2 - 1;
            }
            if (c.x < -1 || c.x > mapW || c.z < -1 || c.z > mapH) {
                ai.splice(i, 1);
                scene.remove(a);
                addAI();
            }
            var cc = getMapSector(cam.position);
            if (Date.now() > a.lastShot + 750 && distance(c.x, c.z, cc.x, cc.z) < 2) {
                createBullet(a);
                a.lastShot = Date.now();
            }
        }
}
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));

}

/**
* Check whether a Vector3 overlaps with a wall.
*
* @param v
* A THREE.Vector3 object representing a point in space.
* Passing cam.position is especially useful.
* @returns {Boolean}
* true if the vector is inside a wall; false otherwise.
*/
function checkWallCollision(v) {
    var c = getMapSector(v);
    return map[c.x][c.z] > 0;
    function getMapSector(v) {
        var x = Math.floor((v.x + UNITSIZE / 2) / UNITSIZE + mapW/2);
        var z = Math.floor((v.z + UNITSIZE / 2) / UNITSIZE + mapW/2);
        return {x: x, z: z};
    }
}