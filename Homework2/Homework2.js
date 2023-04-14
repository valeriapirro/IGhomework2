"use strict";

var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;
var modelView;

var instanceMatrix;
var aspect;
var fovy = 90;  // Field-of-view in Y direction angle (in degrees)

var near = 2;
var far = 1;
var modelViewMatrixLoc;
var modelViewLoc;

var radius = 10.497442586766534//0.2;
var theta2 = -0.18726646259971647 //-0.1;
var phi =  12.18166156499291; //10;
var dr = 5.0 * Math.PI/180.0;

var normal = vec4(0.0, 1.0, 0.0, 0.0);
var tangent = vec3(1.0, 0.0, 0.0);

var viewerPos = vec3(0, 3, -20);
var eye = vec3(radius*Math.sin(theta2)*Math.cos(phi),radius*Math.sin(theta2)*Math.sin(phi), radius*Math.cos(theta2));
var up = vec3(0.0, 4.0, 0.0);
var at = vec3(0, 0, -0.005);
var near = 0.1;
var far = 1000;

var vertices = [

    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];


var torsoId = 0;
var headId  = 1;
var head1Id = 1;
var head2Id = 10;
var leftUpperArmId = 2;
var leftLowerArmId = 3;
var rightUpperArmId = 4;
var rightLowerArmId = 5;
var leftUpperLegId = 6;
var leftLowerLegId = 7;
var rightUpperLegId = 8;
var rightLowerLegId = 9;
var tailId = 11;
var grassId = 12;
var fenceId = 13;

var theta = [0, 0, 180, 0, 180, 0, 180, 0, 180, 0, 0, 0, 0, 90];

var torsoHeight = 1.05;
var torsoWidth = 1.9;
var headHeight = 0.5;
var headWidth = 0.75;

var upperHeight = 0.7;
var lowerHeight = 0.5;
var upperWidth  = 0.25;
var lowerWidth  = 0.15;

var tailWidth = 0.4;
var tailHeight= 0.4;

var grassHeight = 0.1;
var grassWidth = 20;

var fenceHeight = 0.1;
var fenceWidth = 10;
var fenceDepth = 1;

var numNodes = 14;
var numAngles = 15;
var angle = 0;

var numVertices = 24;

var stack = [];

var figure = []; //legamenti della pecora

for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null, null, null);

var vBuffer;
var modelViewLoc;

var pointsArray = [];

var texSize = 256;

// LIGHT
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.8, 0.8, 0.8, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.8, 0.8, 0.8, 1);
var materialDiffuse = vec4(0.8, 0.8, 0.8, 1);
var materialSpecular = vec4(0.8, 0.8, 0.8, 1);
var materialShininess = 99.8;

//------------------------------------BUMP MAP UTILITIES---------------------------------------
// Bump Data
var data = new Array()
    for (var i = 0; i<= texSize; i++)  data[i] = new Array();
    for (var i = 0; i<= texSize; i++) for (var j=0; j<=texSize; j++)
        data[i][j] = Math.random()*255;


// Bump Map Normals
var normalst = new Array()
    for (var i=0; i<texSize; i++)  normalst[i] = new Array();
    for (var i=0; i<texSize; i++) for ( var j = 0; j < texSize; j++)
        normalst[i][j] = new Array();
    for (var i=0; i<texSize; i++) for ( var j = 0; j < texSize; j++) {
        normalst[i][j][0] = data[i][j]-data[i][j+1];
        normalst[i][j][1] = data[i][j]-data[i][j+1];
        normalst[i][j][2] = 1;
    }

// Scale to Texture Coordinates
    for (var i=0; i<texSize; i++) for (var j=0; j<texSize; j++) {
       var d = 0;
       for(k=0;k<3;k++) d+=normalst[i][j][k]*normalst[i][j][k];
       d = Math.sqrt(d);
       for(k=0;k<3;k++) normalst[i][j][k]= 0.5*normalst[i][j][k]/d + 0.5;
    }

// Normal Texture Array

var normals = new Uint8Array(3*texSize*texSize);

    for (var i = 0; i < texSize; i++)
        for (var j = 0; j < texSize; j++)
           for(var k =0; k<3; k++)
                normals[3*texSize*i+3*j+k] = 255*normalst[i][j][k];
//--------------------------------------------END OF BUMP UTILITIES-----------------------------

var textureCoordsArray = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var texCoord = [];

var normalsArray = [];
var normal = vec4(0.0, 1.0, 0.0, 0.0);
var tangent = vec3(1.0, 0.0, 0.0);

//-------------------------------------------

function scale4(a, b, c) {
   var result = mat4();
   result[0] = a;
   result[5] = b;
   result[10] = c;
   return result;
}

//--------------------------------------------


function createNode(transform, render, sibling, child){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}

var posHead = [-torsoWidth/2, torsoHeight+0.5*headHeight, 0.0];
var posTorso = [7.5, -0.1, 0];
var axisTorso = vec3(0, 1, 0);
var fencePos = [0, -lowerHeight-0.2, 0];
var rot = -90;
function initNodes(Id) {

    var m = mat4();

    switch(Id) {

    case torsoId:
    
    m = translate(posTorso[0], posTorso[1], posTorso[2]);
    m = mult(m, rotate(theta[torsoId], axisTorso));
    figure[torsoId] = createNode( m, torso, null, headId );
    break;

    case headId:
    case head1Id:
    case head2Id:


    m = translate(posHead[0], posHead[1], posHead[2]);
	m = mult(m, rotate(theta[head1Id], vec3(1, 0, 0)))
	m = mult(m, rotate(theta[head2Id], vec3(0, 1, 0)));
    m = mult(m, translate(0.0, -0.5*headHeight, 0.0));
    figure[headId] = createNode( m, head, leftUpperArmId, null);
    break;


    case leftUpperArmId: 

    m = translate(-((torsoWidth*0.2)+upperWidth), 0.1*upperHeight, (torsoWidth*0.3));
    m = mult(m, rotate(rot,vec3(0, 1, 0)));
	m = mult(m, rotate(theta[leftUpperArmId], vec3(1, 0, 0)));
    figure[leftUpperArmId] = createNode( m, leftUpperArm, rightUpperArmId, leftLowerArmId );
    break;

    case rightUpperArmId: 

    m = translate(-((torsoWidth*0.2)+upperWidth), 0.1*upperHeight, -(torsoWidth*0.3));
    m = mult(m, rotate(rot,vec3(0, 1, 0)));
	m = mult(m, rotate(theta[rightUpperArmId], vec3(1, 0, 0)));
    figure[rightUpperArmId] = createNode( m, rightUpperArm, leftUpperLegId, rightLowerArmId );
    break;

    case leftUpperLegId: 

    m = translate(((torsoWidth*0.2)+upperWidth), (0.1*upperHeight), (torsoWidth*0.3));
    m = mult(m, rotate(rot,vec3(0, 1, 0)));
	m = mult(m , rotate(theta[leftUpperLegId], vec3(1, 0, 0)));
    figure[leftUpperLegId] = createNode( m, leftUpperLeg, rightUpperLegId, leftLowerLegId );
    break;

    case rightUpperLegId: 

    m = translate((torsoWidth*0.2)+upperWidth, 0.1*upperHeight, -(torsoWidth*0.3));
    m = mult(m, rotate(rot,vec3(0, 1, 0)));
	m = mult(m, rotate(theta[rightUpperLegId], vec3(1, 0, 0)));
    figure[rightUpperLegId] = createNode( m, rightUpperLeg, tailId, rightLowerLegId );
    break;

    case leftLowerArmId:

    m = translate(0.0, (upperHeight), 0.0);
    m = mult(m, rotate(90,vec3(0, 1, 0)));
    m = mult(m, rotate(theta[leftLowerArmId], vec3(0, 0, 1)));
    figure[leftLowerArmId] = createNode( m, leftLowerArm, null, null );
    break;

    case rightLowerArmId:

    m = translate(0.0, (upperHeight), 0.0);
    m = mult(m, rotate(theta[rightLowerArmId], vec3(1, 0, 0)));
    figure[rightLowerArmId] = createNode( m, rightLowerArm, null, null );
    break;

    case leftLowerLegId:

    m = translate(0.0, (upperHeight), 0.0);
    m = mult(m, rotate(90,vec3(0, 1, 0)));
    m = mult(m, rotate(theta[leftLowerLegId],vec3(0, 0, 1)));
    figure[leftLowerLegId] = createNode( m, leftLowerLeg, null, null );
    break;

    case rightLowerLegId:

    m = translate(0.0, (upperHeight), 0.0);
    m = mult(m, rotate(theta[rightLowerLegId], vec3(1, 0, 0)));
    figure[rightLowerLegId] = createNode( m, rightLowerLeg, null, null );
    break;

    case tailId:

    m = translate(torsoWidth*0.5, torsoHeight-0.1*headHeight, 0.0);
    m = mult(m, rotate(theta[tailId], vec3(1, 0, 0)));
    m = mult(m, translate(0.0, -0.5*tailHeight, 0.0));
    figure[tailId] = createNode(m, tail, null, null);
      break;

    case grassId:

    m = translate(0, -lowerHeight-0.2, 0);
    m = mult(m, rotate(theta[grassId], vec3(1, 0, 0)));
    m = mult(m, translate(0.0, -lowerHeight-0.2, 0.0));
    figure[grassId] = createNode(m, grass, null, null);
        break;
    
    case fenceId: 
    
    m = translate(fencePos[0], fencePos[1], fencePos[2]);
    m = mult(m, rotate(theta[fenceId], vec3(1, 0, 0)));
    m = mult(m, rotate(theta[fenceId], vec3(0, 0, 1)));
    m = mult(m, translate(0, -lowerHeight-0.2, 0));
    figure[fenceId] = createNode(m, fence, grassId, null);
        break;
    } 
}

function traverse(Id) {

   if(Id == null) return;
   
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
   figure[Id].render();
   if(figure[Id].child != null) traverse(figure[Id].child);
    modelViewMatrix = stack.pop();
   if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function torso() {
    var texture = true;
    gl.uniform1f( gl.getUniformLocation(program, "text"), texture );
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*torsoHeight, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale( torsoWidth, torsoHeight, torsoWidth));
    //var color = vec4(0.7, 0.7, 0.7, 1);
    var color = vec4(1, 1, 1, 1);
    var colorLoc = gl.getUniformLocation(program, "colorSheep");
    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    
}
var texture3;
function head() {
    var facetexflag = false;
    gl.uniform1f( gl.getUniformLocation(program, "facetexflag"), facetexflag );
    var texture = false;
    gl.uniform1f( gl.getUniformLocation(program, "text"), texture );
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale(headWidth, headHeight, headWidth));
    var color = vec4(0.7, 0.7, 0.7, 1);
    var colorLoc = gl.getUniformLocation(program, "colorSheep");
    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i = 0; i<6; i++) {
        if (i == 5){
            //configureFace(face);
            facetexflag = true;
            gl.uniform1f( gl.getUniformLocation(program, "facetexflag"), facetexflag );
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, texture3);
            gl.uniform1i(gl.getUniformLocation(program, "uTexMap2"), 3);
            gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
            facetexflag = false;
            gl.uniform1f( gl.getUniformLocation(program, "facetexflag"), facetexflag );

        }
        else{

            gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
        }
    }

}

function leftUpperArm() {
    var texture = true;
    gl.uniform1f( gl.getUniformLocation(program, "text"), texture );
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(upperWidth, upperHeight, upperWidth));
    //var color = vec4(1, 0, 0, 1);
    var color = vec4(0.7, 0.7, 0.7, 1);
    var colorLoc = gl.getUniformLocation(program, "colorSheep");
    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerArm() {
    var texture = false;
    gl.uniform1f( gl.getUniformLocation(program, "text"), texture );
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(lowerWidth, lowerHeight, lowerWidth) );
    var color = vec4(1, 0.7, 0.7, 1);
    var colorLoc = gl.getUniformLocation(program, "colorSheep");
    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightUpperArm() {
    var texture = true;
    gl.uniform1f( gl.getUniformLocation(program, "text"), texture );
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(upperWidth, upperHeight, upperWidth) );
    //var color = vec4(0, 1, 0, 1);
    var color = vec4(0.7, 0.7, 0.7, 1);
    var colorLoc = gl.getUniformLocation(program, "colorSheep");
    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerArm() {
    var texture = false;
    gl.uniform1f( gl.getUniformLocation(program, "text"), texture );
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(lowerWidth, lowerHeight, lowerWidth) );
    var color = vec4(1, 0.7, 0.7, 1);
    var colorLoc = gl.getUniformLocation(program, "colorSheep");
    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftUpperLeg() {
    var texture = true;
    gl.uniform1f( gl.getUniformLocation(program, "text"), texture );
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(upperWidth, upperHeight, upperWidth) );
    //var color = vec4(0, 0, 1, 1);
    var color = vec4(0.7, 0.7, 0.7, 1);
    var colorLoc = gl.getUniformLocation(program, "colorSheep");
    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerLeg() {
    var texture = false;
    gl.uniform1f( gl.getUniformLocation(program, "text"), texture );
    instanceMatrix = mult(modelViewMatrix, translate( 0.0, 0.5 * lowerHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(lowerWidth, lowerHeight, lowerWidth) );
    var color = vec4(1, 0.7, 0.7, 1);
    var colorLoc = gl.getUniformLocation(program, "colorSheep");
    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightUpperLeg() {
    var texture = true;
    gl.uniform1f( gl.getUniformLocation(program, "text"), texture );
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(upperWidth, upperHeight, upperWidth) );
    //var color = vec4(1, 1, 0, 1);
    var color = vec4(0.7, 0.7, 0.7, 1);
    var colorLoc = gl.getUniformLocation(program, "colorSheep");
    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerLeg() {
    var texture = false;
    gl.uniform1f( gl.getUniformLocation(program, "text"), texture );
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(lowerWidth, lowerHeight, lowerWidth) );
    var color = vec4(1, 0.7, 0.7, 1);
    var colorLoc = gl.getUniformLocation(program, "colorSheep");
    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function tail() {
    var texture = false;
    gl.uniform1f( gl.getUniformLocation(program, "text"), texture );
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale(tailWidth, tailHeight, tailWidth) );
    var color = vec4(1, 0.7, 0.7, 1);
    var colorLoc = gl.getUniformLocation(program, "colorSheep");
    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function grass() {
    var grasstexflag = true;
    var texture = false;
    gl.uniform1f( gl.getUniformLocation(program, "grasstexflag"), grasstexflag );
    gl.uniform1f( gl.getUniformLocation(program, "text"), texture );
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * grassHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale(grassWidth, grassHeight, grassWidth) );
    var color = vec4(0, 0.9, 0.1, 1);
    var colorLoc = gl.getUniformLocation(program, "colorSheep");
    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    grasstexflag = false;
    gl.uniform1f( gl.getUniformLocation(program, "grasstexflag"), grasstexflag );

}
function fence() {
    var woodtexflag = true;
    gl.uniform1f( gl.getUniformLocation(program, "woodtexflag"), woodtexflag );
    var texture = false;
    gl.uniform1f( gl.getUniformLocation(program, "text"), texture );
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * fenceHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale(fenceWidth, fenceHeight, fenceDepth) );
    var color = vec4(0.58, 0.29, 0, 1);
    var colorLoc = gl.getUniformLocation(program, "colorSheep");
    gl.uniform4fv(colorLoc, color);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    woodtexflag = false;
    gl.uniform1f( gl.getUniformLocation(program, "woodtexflag"), woodtexflag );
}

function configureTexture( image, grassImage, fenceImage, faceImage) {
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, texSize, texSize, 0, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.uniform1i(gl.getUniformLocation(program, "uTexMap"), 0);

    var texture1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, texSize, texSize, 0, gl.RGB, gl.UNSIGNED_BYTE, grassImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "uTexMap0"), 1);

    var texture2 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, texSize, texSize, 0, gl.RGB, gl.UNSIGNED_BYTE, fenceImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "uTexMap1"), 2);

    texture3 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, texture3);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, texSize, texSize, 0, gl.RGB, gl.UNSIGNED_BYTE, faceImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "uTexMap2"), 3);
 
 }

function quad(a, b, c, d) {
    var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal1 = cross(t1, t2);
     normal1 = vec3(normal1);

     pointsArray.push(vertices[a]);
     normalsArray.push(normal1);
     texCoord.push(textureCoordsArray[0]);

     pointsArray.push(vertices[b]);
     normalsArray.push(normal1);
     texCoord.push(textureCoordsArray[1]);

     pointsArray.push(vertices[c]);
     normalsArray.push(normal1);
     texCoord.push(textureCoordsArray[2]);

     pointsArray.push(vertices[d]);
     normalsArray.push(normal1);
     texCoord.push(textureCoordsArray[3]);
}


function cube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

//---------------------------------ANIMATION------------------------------------------------------
var jump = false;
var walk = true;
var w = 0.15;
var angles = [-45, -30];
var right = true;
var count = 5;
var getup = false;
var getdown = false;
var phasetwo = false;
var phasethree = false;
var phasefour = false;
var changed = false;
var initial_legs;
var legs_id = [leftUpperArmId, leftLowerArmId, rightUpperArmId, rightLowerArmId, leftUpperLegId, leftLowerLegId, rightUpperLegId, rightLowerLegId];

function animate(){

    right = true;

    if(walk && !jump && theta[leftLowerArmId]<30){
        changed = !changed;
        console.log("if");
        //----simple leg movement to perform walking----------------
        //left arm forward
        theta[legs_id[0]]+= angles[0]/5; //left upper arm
        initNodes(legs_id[0]);
        theta[legs_id[1]] += angles[1]/5; //left lower arm
        initNodes(legs_id[1]); 
        //right leg forward
        theta[legs_id[6]] += angles[1]/5; //right upper leg
        initNodes(legs_id[6]);
        theta[legs_id[7]] += angles[1]/5; //right lower leg
        initNodes(legs_id[7]);
        //left leg backwards
        theta[legs_id[4]] -= angles[0]/5; //left upper leg
        initNodes(legs_id[4]);
        theta[legs_id[5]] -= angles[1]/5; //left lower leg
        initNodes(legs_id[5]);
        //right arm backwards
        theta[legs_id[2]] -= angles[1]/5; //right upper arm
        initNodes(legs_id[2]);
        theta[legs_id[3]] -= angles[1]/5; //right lower arm
        initNodes(legs_id[3]);

        posTorso[0] -= w;
        initNodes(torsoId);
        

        if(posTorso[0]<=1.9000000000000052 && posTorso[0]>fencePos[0]){
            
            initial_legs = [theta[leftUpperArmId], theta[leftLowerArmId], theta[rightUpperArmId], theta[rightLowerArmId], theta[leftUpperLegId], theta[leftLowerLegId], theta[rightUpperLegId], theta[rightLowerLegId]];
            console.log(initial_legs[7]);
            theta[leftUpperArmId] = 180;
            initNodes(leftUpperArmId);

            theta[leftLowerArmId] = 0;
            initNodes(leftLowerArmId);

            theta[rightUpperArmId] = 180;
            initNodes(rightUpperArmId);

            theta[rightLowerArmId] = 0;
            initNodes(rightLowerArmId);

            theta[leftUpperLegId] = 180;
            initNodes(leftUpperLegId);

            theta[leftLowerLegId] = 0;
            initNodes(leftLowerLegId);

            theta[rightUpperLegId] = 180;
            initNodes(rightUpperLegId);

            theta[rightLowerLegId] = 0;
            initNodes(rightUpperLegId);

            console.log(theta[rightLowerLegId]);
            jump = true;
            getup = true;
        } 

        if(theta[leftLowerArmId]==30 || theta[leftLowerArmId]==-30){
            walk = false;
            console.log(theta[legs_id[1]]);
        }
        //----------------------------------------------------------
    }
    else {
        if(!jump && (theta[leftLowerArmId]>0 || theta[leftLowerArmId]<0)){
            console.log("else");
            //----simple leg movement to perform walking----------------
        //this part of else brings the 4 legs in the original positions
        theta[legs_id[0]]-= angles[0]/5; //left upper arm
        initNodes(legs_id[0]);
        theta[legs_id[1]] -= angles[1]/5; //left lower arm
        initNodes(legs_id[1]); 

        theta[legs_id[6]] -= angles[1]/5; //right upper leg
        initNodes(legs_id[6]);
        theta[legs_id[7]] -= angles[1]/5; //right lower leg
        initNodes(legs_id[7]);

        theta[legs_id[4]] += angles[0]/5; //left upper leg
        initNodes(legs_id[4]);
        theta[legs_id[5]] += angles[1]/5; //left lower leg
        initNodes(legs_id[5]);

        theta[legs_id[2]] += angles[1]/5; //right upper arm
        initNodes(legs_id[2]);
        theta[legs_id[3]] += angles[1]/5; //right lower arm
        initNodes(legs_id[3]); 

        posTorso[0] -= w;
        initNodes(torsoId);

        if(posTorso[0]<=Math.floor(-12)){

            posTorso[0] = 12;
            posTorso[1] = -0.1;
            initNodes(torsoId);

            theta[leftUpperArmId] = 180;
            initNodes(leftUpperArmId);

            theta[leftLowerArmId] = 0;
            initNodes(leftLowerArmId);

            theta[rightUpperArmId] = 180;
            initNodes(rightUpperArmId);

            theta[rightLowerArmId] = 0;
            initNodes(rightLowerArmId);

            theta[leftUpperLegId] = 180;
            initNodes(leftUpperLegId);

            theta[leftLowerLegId] = 0;
            initNodes(leftLowerLegId);

            theta[rightUpperLegId] = 180;
            initNodes(rightUpperLegId);

            theta[rightLowerLegId] = 0;
            initNodes(rightUpperLegId);

            right = true;

            /*
left upper arm #2 = 180
left lower arm #3 = 0
right upper arm #4 = 180
right lower arm #5 = 0
left upper leg #6 = 180
left lower leg #7 = 0
right upper leg #8 = 180
right lower leg #9 = 9
*/
        }

        if(theta[leftLowerArmId]==0){
            console.log("inverto gambe");
            console.log(legs_id);
        walk = true;

         
        
        /* if(angles[0] == -45){
             console.log("cambio1");
            angles[0] = 45;
            angles[1] = 30;
        } else {
            console.log("cambio2");
            angles[0] = -45;
            angles[1] = -30;
        }
        */
        //rot = -rot;
        
        //2, 1, 0, 3, 6, 5, 4, 7
        //var legs_id = [leftUpperArmId 0, leftLowerArmId 1, rightUpperArmId 2, rightLowerArmId 3, leftUpperLegId 4, leftLowerLegId 5, rightUpperLegId 6, rightLowerLegId 7];
        //var legs_new = [legs_id[2], legs_id[3], legs_id[0], legs_id[1], legs_id[6], legs_id[7], legs_id[4], legs_id[5]];
        var legs_new = [legs_id[2], legs_id[1], legs_id[0], legs_id[3], legs_id[6], legs_id[5], legs_id[4], legs_id[7]];
        legs_id = [legs_new[0], legs_new[1], legs_new[2], legs_new[3], legs_new[4], legs_new[5], legs_new[6], legs_new[7]];
        console.log(legs_id);
            initNodes(leftUpperArmId);
            initNodes(leftLowerArmId);
            initNodes(rightUpperArmId);
            initNodes(rightLowerArmId);
            initNodes(leftUpperLegId);
            initNodes(leftLowerLegId);
            initNodes(rightUpperLegId);
            initNodes(rightUpperLegId);
        }
        //-----------------------------------------------------------
    }
        }
    
    //jumping
    if(jump && theta[torsoId]<15 && posTorso[0]<=1.9000000000000052 && getup){

        theta[leftUpperLegId] -= 5;
        initNodes(leftUpperLegId);
        theta[rightUpperLegId] -= 5;
        initNodes(rightUpperLegId);

        theta[leftUpperArmId] +=5;
        initNodes(leftUpperArmId);
        theta[leftLowerArmId] +=5;
        initNodes(leftLowerArmId);
        theta[rightUpperArmId] -=5;
        initNodes(rightUpperArmId);
        theta[rightLowerArmId] -=5;
        initNodes(rightLowerArmId);
        axisTorso = vec3(0, 0, 1);

        theta[torsoId] += 5;
        posTorso[1] += 0.06;
        initNodes(torsoId);
        
        console.log("if 1");
        //sheep gets up
        if(theta[torsoId]==15){
            phasetwo = true;
        }
        
    }
    
    if(jump && theta[torsoId]>0 && posTorso[0]<=1.9000000000000052 && phasetwo){
        getup = false;
        theta[leftUpperLegId] += 5;
        initNodes(leftUpperLegId);
        theta[rightUpperLegId] += 5;
        initNodes(rightUpperLegId);

        theta[leftUpperArmId] -=5;
        initNodes(leftUpperArmId);
        theta[leftLowerArmId] -=5;
        initNodes(leftLowerArmId);
        theta[rightUpperArmId] +=5;
        initNodes(rightUpperArmId);
        theta[rightLowerArmId] +=5;
        initNodes(rightLowerArmId);

        theta[torsoId] -= 5;
        initNodes(torsoId);

        posTorso[0] += (fencePos[0]-posTorso[0])/5;
        posTorso[1] += 0.6; 
        initNodes(torsoId);
        //sheep in the air
        
        console.log("if 2");
        if(theta[torsoId]==0){
            theta[rightUpperArmId] = 180;
            initNodes(rightUpperArmId);

            theta[rightLowerArmId] = 0;
            initNodes(rightLowerArmId);
            posTorso[0] = fencePos[0];
            phasetwo = false;
            phasethree = true;
        }
        
    }
    var pos1 = posTorso[1]+0.1;
    if(jump && theta[torsoId]>-15 && posTorso[0]<=fencePos[0] && phasethree){
        console.log("if 3");
        theta[leftUpperArmId] += 5;
        initNodes(leftUpperArmId);
        theta[rightUpperArmId] += 5;
        initNodes(rightUpperArmId);

        axisTorso = vec3(0, 0, 1);
        theta[torsoId] -= 5;
        initNodes(torsoId);

        posTorso[0] += (fencePos[0]-2.7)/3;
        initNodes(torsoId);
        
        posTorso[1] -= (pos1/3); 
        initNodes(torsoId);
        //sheep touches the ground
        
        if(theta[torsoId]==-15){
            initNodes(torsoId);
            phasethree = false;
            phasefour = true;
        }
        
    }
    if(jump && theta[torsoId]<0 && posTorso[0]<=fencePos[0] && phasefour){

        theta[leftUpperArmId] -= 10;
        initNodes(leftUpperArmId);
        theta[rightUpperArmId] -= 10;
        initNodes(rightUpperArmId);

        axisTorso = vec3(0, 0, 1);
        theta[torsoId] += 10;
        posTorso[1] -= 0.6;
        initNodes(torsoId);
        
        //sheep touches the ground
        console.log("if 4");
        if(theta[torsoId]=-5){
        theta[leftUpperArmId] -= 5;
        initNodes(leftUpperArmId);
        theta[rightUpperArmId] -= 5;
        initNodes(rightUpperArmId);

        axisTorso = vec3(0, 0, 1);
        theta[torsoId] += 5;
        posTorso[1] -= 0.06;
        initNodes(torsoId);

        }

        if(theta[torsoId]==0){

            theta[leftUpperArmId] = initial_legs[0];
            initNodes(leftUpperArmId);

            theta[leftLowerArmId] = initial_legs[1];
            initNodes(leftLowerArmId);

            theta[rightUpperArmId] = initial_legs[2];
            initNodes(rightUpperArmId);

            theta[rightLowerArmId] = initial_legs[3];
            initNodes(rightLowerArmId);

            theta[leftUpperLegId] = initial_legs[4];
            initNodes(leftUpperLegId);

            theta[leftLowerLegId] = initial_legs[5];
            initNodes(leftLowerLegId);

            theta[rightUpperLegId] = initial_legs[6];
            initNodes(rightUpperLegId);

            theta[rightLowerLegId] = initial_legs[7];
            initNodes(rightUpperLegId);

            phasefour = false;
            jump = false;
        }
        
    }

}


window.onload = function init() {
    var grass = document.getElementById("grasstex");
    var fence = document.getElementById("woodtex");
    var face = document.getElementById("facetex");

    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.655, 0.92, 0.949, 1.0 );

    gl.enable(gl.DEPTH_TEST);
    
    aspect =  canvas.width/canvas.height;
    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");

    gl.useProgram(program);

    instanceMatrix = mat4();

    projectionMatrix =  perspective(-1, 1, -1, 1, -100, 100);//ortho(-10, 10, -10, 10, -10, 10, -10, 10);
    modelViewMatrix = lookAt(eye, at, up);

    gl.uniformMatrix4fv(gl.getUniformLocation( program, "uModelViewMatrix"), false, flatten(modelViewMatrix)  );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "uProjectionMatrix"), false, flatten(projectionMatrix)  );

    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix")

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),
       ambientProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),
       diffuseProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),
       specularProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"),
       lightPosition );
    gl.uniform1f(gl.getUniformLocation(program, "uShininess"),
       materialShininess );
    gl.uniform4fv( gl.getUniformLocation(program, "uNormal"), normal);
    gl.uniform3fv( gl.getUniformLocation(program, "uObjTangent"), tangent);
    
    var nMatrix = normalMatrix(modelViewMatrix, true);
    gl.uniformMatrix3fv( gl.getUniformLocation(program, "uNormalMatrix"), false, flatten(nMatrix));

    cube();

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW);

    var texCoordLoc = gl.getAttribLocation( program, "aTexCoord");
    gl.vertexAttribPointer( texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( positionLoc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( positionLoc );

    configureTexture(normals, grass, fence, face);

    document.getElementById("IncreasePhi").onclick = function(){
        phi+=dr;
        console.log(phi);
    };
    document.getElementById("DecreasePhi").onclick = function(){
        phi-=dr;
        console.log(phi);
    };
    document.getElementById("DecreaseTheta").onclick = function(){
        theta2-=dr;
        console.log(theta2);
    };
    document.getElementById("IncreaseTheta").onclick = function(){
        theta2+=dr;
        console.log(theta2);
    };
    document.getElementById("zoomout").onclick = function(){
        radius+=dr;
        console.log(radius);};
    document.getElementById("zoomin").onclick = function(){radius-=dr;};

    document.getElementById("start").onclick = function(event) {
        setInterval(function() {animate();}, 150); //200
    };

    document.getElementById("reset").onclick = function(event) {
        window.location.reload();
    };

    for(i=0; i<numNodes; i++) initNodes(i);

    render();
}


var render = function() {

        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        eye = vec3(radius*Math.sin(theta2)*Math.cos(phi),radius*Math.sin(theta2)*Math.sin(phi), radius*Math.cos(theta2));
        modelViewMatrix = lookAt(eye, at, up);
        projectionMatrix = perspective(fovy, aspect, near, far);
        traverse(torsoId);
        traverse(grassId);
        traverse(fenceId);

       
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

        requestAnimationFrame(render);

        
}
