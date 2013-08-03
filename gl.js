// (c) 2013 Tom Najdek under MIT license http://opensource.org/licenses/MIT 
(function() {
	"use strict";

	window.onload = main;

	function main() {
		var image = new Image();
		image.src = "image.jpg";
		image.onload = function() {
			render(image);
		};
	}

	function loadShader(gl, shaderSource, shaderType) {
		var shader = gl.createShader(shaderType);

		// Load the shader source code
		gl.shaderSource(shader, shaderSource);

		// and compile
		gl.compileShader(shader);

		// and check if it worked
		if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			return shader;
		} else {
			console.error("Unable to compile shader " + shader + ": " + gl.getShaderInfoLog(shader));
			return null;
		}

	}

	function setRectangle(gl, x, y, width, height) {
		var x1 = x;
		var x2 = x + width;
		var y1 = y;
		var y2 = y + height;
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			x1, y1,
			x2, y1,
			x1, y2,
			x1, y2,
			x2, y1,
			x2, y2]), gl.STATIC_DRAW);
	}

	function render(image) {
		var canvas = document.createElement('canvas'),
			body = document.getElementsByTagName('body')[0],
			gl, positionLocation, texCoordLocation, texCoordBuffer,
			texture, resolutionLocation, buffer, vertexShader, fragmentShader,
			program, r, g, b, a;
		
		// set canvas size to image size and obtain webGL context
		canvas.width = image.width;
		canvas.height = image.height;

		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

		if (!gl) {
			body.innerHTML = "WebGL disabled or unavailable. <a href=\"http://get.webgl.org/\">Get WebGL</a>";
			return;
		}

		// Obtain shaders source code that we've embedded 
		// inside the HTML using `script` tags and use `loadShader`
		// helper function (see above) to compile these shaders
		vertexShader = loadShader(
			gl,
			document.getElementById("2d-vertex-shader").text,
			gl.VERTEX_SHADER
		);

		fragmentShader = loadShader(
			gl,
			document.getElementById("2d-fragment-shader").text,
			gl.FRAGMENT_SHADER
		);

		// prepare and link WebGL program using shaders we've compiled above
		program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		// check for any problems
		if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error("Unable to link program:"+ gl.getProgramInfoLog (program));
		}

		// tell the browser to use program we've created
		gl.useProgram(program);

		// look up where the vertex data needs to go.
		positionLocation = gl.getAttribLocation(program, "a_position");
		texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

		// provide texture coordinates for the rectangle.
		texCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			0.0,  0.0,
			1.0,  0.0,
			0.0,  1.0,
			0.0,  1.0,
			1.0,  0.0,
			1.0,  1.0]), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(texCoordLocation);
		gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

		// Create a texture.
		texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// Set the parameters so we can render any size image.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

		// Upload the image into the texture.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

		// lookup uniforms
		resolutionLocation = gl.getUniformLocation(program, "u_resolution");

		// set the resolution
		gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

		// Create a buffer for the position of the rectangle corners.
		buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.enableVertexAttribArray(positionLocation);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

		// Set a rectangle the same size as the image.
		setRectangle(gl, 0, 0, image.width, image.height);

		// obtains location that represents specific uniform variable
		// within the program object. In this case we obtain location
		// of "uniform float r", "uniform float g" etc. from the
		// 2d-fragment-shader embedded in HTML in index.html
		r = gl.getUniformLocation(program, "r");
		g = gl.getUniformLocation(program, "g");
		b = gl.getUniformLocation(program, "b");
		a = gl.getUniformLocation(program, "a");

		// set the values for variables of which location we've obtained
		// using `getUniformLocation` call above. We initially set all
		// values to 1 so the picture appears 'as is'.
		gl.uniform1f(r, 1.0);
		gl.uniform1f(g, 1.0);
		gl.uniform1f(b, 1.0);
		gl.uniform1f(a, 1.0);

		// Draw the rectangle.
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// insert canvas as a first body element
		body.insertBefore(canvas, body.firstChild);

		// react to filter values being changed
		body.addEventListener("keyup", function() {
			var intR = parseInt(document.getElementById("red").value, 10),
				intB = parseInt(document.getElementById("blue").value, 10),
				intG = parseInt(document.getElementById("green").value, 10),
				floatR = isNaN(intR) ? 0 : (intR%256)/255,
				floatB = isNaN(intB) ? 0 : (intB%256)/255,
				floatG = isNaN(intG) ? 0 : (intG%256)/255;

			// set values for r, g and b values in the shadder
			gl.uniform1f(r, floatR);
			gl.uniform1f(b, floatB);
			gl.uniform1f(g, floatG);

			// redraw the rectangle with updated values
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		});
	}
}());