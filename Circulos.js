var balls=[];
var ancho = window.innerWidth;
var alto = window.innerHeight;
var lienzo;


function initialize (){
  var canvas = document.getElementById("canvas");

  canvas.addEventListener("click", function(){
    var ball= new Ball (event.clientX,event.clientY);
 balls.push(ball);
    ball.update();
  });

  lienzo = canvas.getContext("2d");
  lienzo.strokeWidth=5;

  canvas.width = ancho;
  canvas.height=alto;
  animate();
}

function Ball(xPos,yPos){
 this.color=generarColor();
 this.radius = Math.random()* 20 + 14;
 this.x = xPos;
 this.y = yPos;
 this.dx=Math.random()*2;
 this.dy=Math.round((Math.random()-0.5)*10);
 

 this.update = function(){
   lienzo.beginPath();
   lienzo.arc(this.x, this.y,
          this.radius, 0 ,
          2 * Math.PI);

    lienzo.fillStyle = this.color;
    lienzo.fill();
  }
  
this.animate=function(){
    this.x=this.x+this.dx;
    this.y=this.y+this.dy;
}

}

window.onload = initialize 

function generarColor(){
var rojo=Math.round(Math.random()* 255);
var verde=Math.round(Math.random()* 255);
var azul=Math.round(Math.random()* 255);
var alpha=Math.random();
var color="rgba("+rojo+","+verde+","+azul+","+alpha+")";
return color;

}

function animate() {
    lienzo.clearRect(0,0,ancho,alto);
    for(i=0;i<balls.length;i++){
        balls[i].animate(); 
        balls[i].update();
    }
    requestAnimationFrame(animate);
}
