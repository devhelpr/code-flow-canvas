https://stackoverflow.com/questions/18655135/divide-bezier-curve-into-two-equal-halves/36434774#36434774


below is an example for quadratic bezier curve splitting into two halves
(what about three parts!???)

for cubic bezier curve:

bezierCurveTo
	2 control points
	endpoint



var w = 800, h = 560;

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var pts = [{x:20, y:20},
           {x:20, y:100},
           {x:200, y:100},
           {x:200,  y:20}];
var t = 0.5;

function lerp(a, b, t)
{
    var s = 1 - t;
    return {x:a.x*s + b.x*t,
            y:a.y*s + b.y*t};
}


function splitcurve()
{
    var p0 = pts[0], p1 = pts[1], p2 = pts[2], p3 = pts[3];
    var p4 = lerp(p0, p1, t);
    var p5 = lerp(p1, p2, t);
    var p6 = lerp(p2, p3, t);
    var p7 = lerp(p4, p5, t);
    var p8 = lerp(p5, p6, t);
    var p9 = lerp(p7, p8, t);

    var firsthalf = [p0, p4, p7, p9];
    var secondhalf =  [p9, p8, p6, p3];

    console.log(firsthalf);
    console.log(secondhalf);

    ctx.beginPath();
    ctx.moveTo(20,20);
    ctx.lineWidth=5;
    ctx.bezierCurveTo(20,100,200,100,200,20);
    ctx.strokeStyle="black";
    ctx.stroke(); 

    ctx.beginPath();
    ctx.moveTo(p0.x,p0.y);
    ctx.lineWidth=5;
    ctx.bezierCurveTo(p4.x,p4.y,p7.x,p7.y,p9.x,p9.y);
    ctx.strokeStyle="blue";
    ctx.stroke(); 

    ctx.beginPath();
    ctx.moveTo(p9.x,p9.y);
    ctx.lineWidth=5;
    ctx.bezierCurveTo(p8.x,p8.y,p6.x,p6.y,p3.x,p3.y);
    ctx.strokeStyle="red";
    ctx.stroke(); 
}

splitcurve();
