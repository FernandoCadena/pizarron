// obtener el canvas y su contexto
var canvas = document.getElementById('sketch');
var context = canvas.getContext('2d');
// configuramos el tamaño  de nuestro canvas 
canvas.width = $('#sketchContainer').outerWidth();
canvas.height = (canvas.width/700)*400;
$('#sketchContainer').outerHeight(String(canvas.height) + "px", true);
//la funcion escalar necesita saber el ancho y alto
var oWidth = canvas.width;
var oHeight = canvas.height;
var lines = [];
var lastMouse = {
  x: 0,
  y: 0
};

//rellenamos todo el canvas de un color para que se vea como fondo
context.fillStyle = "#b2c3e4";
context.fillRect(0, 0, 1500000, 10000000);

// configuramos nuestro
context.lineWidth = 2;
context.lineJoin = 'round';
context.lineCap = 'round';
context.strokeStyle = '#000';

// atrapa los eventos cuando el mouse se clickea, cuando el mouse se mueve,cuando el mouse se desclicke
canvas.addEventListener('mousedown', function (e) {
  lastMouse = {
    x: e.pageX - this.offsetLeft,
    y: e.pageY - this.offsetTop
  };
  canvas.addEventListener('mousemove', move, false);
}, false);

canvas.addEventListener('mouseout', function () {
  canvas.removeEventListener('mousemove', move, false);
}, false);

canvas.addEventListener('mouseup', function () {
  canvas.removeEventListener('mousemove', move, false);
}, false);

// configura el tamaño del size:
function setSize(size) {
  context.lineWidth = size;
}

// configura el color del pincel:
function setColor(color) {
  context.globalCompositeOperation = 'source-over';
  context.strokeStyle = color;
}

// configura el pincel en modo borrar:
function eraser() {
  context.globalCompositeOperation = 'destination-out';
  context.strokeStyle = 'rgba(0,0,0,1)';
}

// limpia el canvas:
function clear(send) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  lines = [];
  if (send && TogetherJS.running) {
    TogetherJS.send({
      type: 'clear'
    });
  }
}

// Redibuja las lineas:
function reDraw(lines){
  for (var i in lines) {
    draw(lines[i][0], lines[i][1], lines[i][2], lines[i][3], lines[i][4], false);
  }
}
//dibuja las lineas, llama al moverse y pone al TogetherJS a escuchar:
function draw(start, end, color, size, compositeOperation, save) {
  context.save();
  context.lineJoin = 'round'; 
  context.lineCap = 'round';
  //desde que las  cordinadas han estado trasladadas e o largo del canvas, el contexto del canvas necesita ser escalado antes que pueda ser redibujado
  context.scale(canvas.width/1140,canvas.height/400);
  context.strokeStyle = color;
  context.globalCompositeOperation = compositeOperation;
  context.lineWidth = size;
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.closePath();
  context.stroke();
  context.restore();
  if (save) {
    //no sera guardado si la funcion draw() es llamada desde  reDraw()
    lines.push([{x: start.x, y: start.y}, {x: end.x, y: end.y}, color, size, compositeOperation]);
  }
}

//Llamado cada vez que se dispara el evento de movimiento del ratón, llama a la función de draw:
function move(e) {
  var mouse = {
    x: e.pageX - this.offsetLeft,
    y: e.pageY - this.offsetTop
  };
  // traslada las cordinadas del canvas local al tamaño;
  sendMouse = {
    x: (1140/canvas.width)*mouse.x,
    y: (400/canvas.height)*mouse.y
  };
  sendLastMouse = {
    x: (1140/canvas.width)*lastMouse.x,
    y: (400/canvas.height)*lastMouse.y
  };
  draw(sendLastMouse, sendMouse, context.strokeStyle, context.lineWidth, context.globalCompositeOperation, true);
  if (TogetherJS.running) {
    TogetherJS.send({
      type: 'draw',
      start: sendLastMouse,
      end: sendMouse,
      color: context.strokeStyle,
      size: context.lineWidth,
      compositeOperation: context.globalCompositeOperation
    });
  }
  lastMouse = mouse;
}

// escucha escuchar los mensajes, envia la informacion acerca de dibujar las lineas
TogetherJS.hub.on('draw', function (msg) {
  if (!msg.sameUrl) {
      return;
  }
  draw(msg.start, msg.end, msg.color, msg.size, msg.compositeOperation, true);
});

// limpia el canvas cuando algunos alguien aprieta el boton de limpiar
TogetherJS.hub.on('clear', function (msg) {
  if (!msg.sameUrl) {
    return;
  }
  clear(false);
});

// hello es enviado desde cada nueva coneccion al usuario, este metodo va a recibir lo que ha sido dibujado 
TogetherJS.hub.on('togetherjs.hello', function () {
  TogetherJS.send({
    type: 'init',
    lines: lines
  });
});

// inicializa recivir el dibujo:
TogetherJS.hub.on('init', function (msg) {
  reDraw(msg.lines);
  lines = msg.lines;
});

// JQuery para manejar botones y redimensionar eventos, también cambia el cursor a un punto que se asemeja al tamaño del pincel:
$(document).ready(function () {
  //changeMouse crea un lienzo invisible temporal que muestra el cursor, que luego se fija como cursor a través de css:
  function changeMouse() {
    //Asegura que el cursorSize está escalado
    var cursorSize = context.lineWidth*(canvas.width/1140); 
    if (cursorSize < 10){
        cursorSize = 10;
    }
    var cursorColor = context.strokeStyle;
    var cursorGenerator = document.createElement('canvas');
    cursorGenerator.width = cursorSize;
    cursorGenerator.height = cursorSize;
    var ctx = cursorGenerator.getContext('2d');

    var centerX = cursorGenerator.width/2;
    var centerY = cursorGenerator.height/2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, (cursorSize/2)-4, 0, 2 * Math.PI, false);
    ctx.lineWidth = 3;
    ctx.strokeStyle = cursorColor;
    ctx.stroke();
    $('#sketch').css('cursor', 'url(' + cursorGenerator.toDataURL('image/png') + ') ' + cursorSize/2 + ' ' + cursorSize/2 + ',crosshair');
  }
  // iniciar mouse
  changeMouse();

  // Vuelve a dibujar las líneas cada vez que se cambia el tamaño del lienzo:
  $(window).resize(function() {
    if ($('#sketchContainer').width() != oWidth) {
      canvas.width = $('#sketchContainer').width();
      canvas.height = (canvas.width/1140)*400;
      $('#sketchContainer').outerHeight(String(canvas.height)+"px", true);
      var ratio = canvas.width/oWidth;
      oWidth = canvas.width;
      oHeight = canvas.height;
      reDraw(lines);
      changeMouse();
    }
  });

  // limpia el canvas:
  $('.clear').click(function () {
    clear(true);
  });

  // Color-button funcion:
  $('.color-picker').click(function () {
    var $this = $(this);
    console.log($this);
    setColor($this.css("background-color"));
    changeMouse();
  });

  $('.eraser').click(function () {
    eraser();
    changeMouse();
  });
  // TogetherJS usa el color:
  $('.user-color-pick').click(function() {
    setColor(TogetherJS.require('peers').Self.color);
    changeMouse();
  });

  // Increase/decrease brush size:
  //inclementa o decrementa el tamaño del pinsel
  $('.plus-size').click(function() {
    setSize(context.lineWidth+3);
    changeMouse();
  });

  $('.minus-size').click(function() {
    if (context.lineWidth > 3) {
      setSize(context.lineWidth-3);
    }
    changeMouse();
  });          
});
