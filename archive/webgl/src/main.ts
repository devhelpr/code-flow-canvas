import './style.css'

// Get a WebGL context
let canvas = document.getElementById('canvas') as HTMLCanvasElement;


const canvasSize= canvas.getBoundingClientRect();
canvas.width = canvasSize.width;
canvas.height = canvasSize.height;
let gl = canvas.getContext('webgl');
if (!gl) {
    console.error('WebGL not supported');
    throw new Error('WebGL not supported');
}
let vsSource = `
    attribute vec4 aVertexPosition;
    void main() {
        gl_Position = aVertexPosition;
    }
`;

let fsSource = `
    precision mediump float;
    uniform float u_time;
    uniform float u_width;
    uniform float u_height;
    
    
    void main() {
      vec2 resolution = vec2(u_width, u_height);
      vec2 uv = (gl_FragCoord.xy / resolution.xy);
      uv.x *= u_width/u_height;     
      vec2 centeredCoord = uv * 2.0 - 1.0;
      centeredCoord.x += 0.5 * u_width/u_height;

      float dist = length(centeredCoord) ;

      float wave = sin(dist * 10.0 - u_time * 10.0) * 0.5 + 0.5;

      vec3 color = vec3(0.,0., smoothstep(0.6,1.,1.0 - wave * 0.5));

      //vec3 color = vec3(0.5, 0.7, 0.);
      //color *= uv.x + uv.y;
      //color *= smoothstep(0.2,0.3,length(uv-vec2(0.5,0.5)));
      gl_FragColor = vec4(color, 1.0);        
    }
`;

function createShader(gl : WebGLRenderingContext, type : number, source : string) {
    let shader = gl.createShader(type);
    if (!shader) {
        console.error('An error occurred creating the shaders');
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function initShaderProgram(gl: WebGLRenderingContext, vsSource : string, fsSource : string) {
    let vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    let shaderProgram = gl.createProgram();
    if (!shaderProgram) {
        console.error('Unable to create shader program');
        return null;
    }
    if (!vertexShader || !fragmentShader) {
        console.error('Unable to create vertex or fragment shader');
        return null;
    }
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

let shaderProgram = initShaderProgram(gl, vsSource, fsSource);
if (!shaderProgram) {
    throw new Error('Unable to initialize the shader program');
}
let u_timeUniformLocation = gl.getUniformLocation(shaderProgram, "u_time");
let u_CanvasWidthUniformLocation = gl.getUniformLocation(shaderProgram, "u_width");
let u_CanvasHeightUniformLocation = gl.getUniformLocation(shaderProgram, "u_height");

let vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');

let positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

let positions = [
    1.0,  1.0,
   -1.0,  1.0,
    1.0, -1.0,
   -1.0, -1.0,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

function drawScene(gl : WebGLRenderingContext, shaderProgram : WebGLProgram, positionBuffer : WebGLBuffer, time:number) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shaderProgram);
    gl.uniform1f(u_timeUniformLocation, time);
    gl.uniform1f(u_CanvasWidthUniformLocation, canvas.width);
    gl.uniform1f(u_CanvasHeightUniformLocation, canvas.height);

    gl.enableVertexAttribArray(vertexPositionAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    let size = 2;          // 2 components per iteration
    let type = gl.FLOAT;   // the data is 32bit floats
    let normalize = false; // don't normalize the data
    let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    let offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(vertexPositionAttribute, size, type, normalize, stride, offset);

    let primitiveType = gl.TRIANGLE_STRIP;
     offset = 0;
    let count = 4;
    gl.drawArrays(primitiveType, offset, count);
}
if (!positionBuffer) {
    throw new Error('Unable to create buffer');
}

function renderLoop() {
  let time = performance.now() * 0.001; // time in seconds
  drawScene(gl!, shaderProgram!, positionBuffer!, time);
  requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);
