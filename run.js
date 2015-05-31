"use strict";
var game;
var version = 47;
var Game = function(width, height, ballsize, ctx, canvas_overlay, dpratio) {
	this.width = width;
	this.height = height;
	this.ballsize = ballsize;
	this.ctx = ctx;
	this.canvas_overlay = canvas_overlay;
	this.ctx_overlay = canvas_overlay.get()[0].getContext("2d");
	this.dpratio = dpratio;
	this.balls = [];
	this.friction = 0.6;
	this.fps = [];
	this.llimit = 130;
	this.rlimit = width - 130;
	this.ulimit = 130;
	this.dlimit = height - 130;
	this.threshold = 15;
	this.e_wall = 0.6;
	this.e_ball = 0.8;
	this.g = 2.5;
	this.sensitivity = 0.5;
	this.lines = [];
	this.colorlist = ['#D32F2F', '#D32F2F', '#FFEB3B', '#FFF8E1'];
	this.canvas_pre = document.createElement('canvas');
	this.canvas_pre.width = this.width;
	this.canvas_pre.height = this.height;
	this.ballpadding = 15;
	this.mousedown = -1;

	this.g *= /(iPad|iPhone|iPod)/g.test(navigator.userAgent)?1:-1;
	console.log("Game created - " + width + 'x' + height);
	this.initialize();
};

Game.prototype.initialize = function() {
	for(var i = 0; i < 4; i++) {
		this.addBall(0|Math.random()*(this.rlimit-this.ballsize)+this.llimit+this.ballsize, 0|Math.random()*(this.dlimit-this.ballsize)+this.ulimit+this.ballsize, i);
	}

	this.coldRender();
	//window.requestAnimationFrame(this.refresh);
	setInterval(this.refresh, 30);
	//setInterval(this.render, 10);
	this.canvas_overlay.get()[0].addEventListener("touchstart", this.touchDown, false);
	this.canvas_overlay.get()[0].addEventListener("touchmove", this.touchMove, false);
	this.canvas_overlay.get()[0].addEventListener("touchend", this.touchEnd, false);
	this.canvas_overlay.get()[0].addEventListener("touchcancel", this.touchEnd, false);
	this.canvas_overlay.get()[0].addEventListener("touchleave", this.touchEnd, false);
	this.canvas_overlay.get()[0].addEventListener("mousedown", this.mouseDown, false);
	this.canvas_overlay.get()[0].addEventListener("mousemove", this.mouseMove, false);
	this.canvas_overlay.get()[0].addEventListener("mouseup", this.mouseUp, false);
	this.canvas_overlay.get()[0].addEventListener("mouseout", this.mouseUp, false);
	
	
	if (window.DeviceOrientationEvent) {
		window.addEventListener('devicemotion', this.orientation, false);
		console.log("Accelerometer supported");
	}
	console.log("Game initialized");
};

Game.prototype.touchDown = function(event) {
	event.preventDefault();
	var touches = event.changedTouches;
	for (var i in touches) {
		var tX = touches[i].pageX;
		var tY = touches[i].pageY;
		tX *= game.dpratio;
		tY *= game.dpratio;
		for (var j in game.balls) {
			if (game.balls[j].x - game.ballsize < tX && tX < game.balls[j].x + game.ballsize && game.balls[j].y - game.ballsize < tY && tY < game.balls[j].y + game.ballsize) {
				game.balls[j].touched = touches[i].identifier;
				break;
			}
		}
	}
};

Game.prototype.touchMove = function(event) {
	event.preventDefault();
	var touches = event.changedTouches;
	for (var i in touches) {
		var tX = touches[i].pageX;
		var tY = touches[i].pageY;
		tX *= game.dpratio;
		tY *= game.dpratio;
		for (var j in game.balls) {
			if (game.balls[j].touched == touches[i].identifier) {
				/*if (tX > game.rlimit) tX = game.rlimit;
				else if (tX < game.llimit) tX = game.llimit;
				if (tY > game.dlimit) tY = game.dlimit;
				else if (tY < game.ulimit) tY = game.ulimit;
				game.balls[j].oldx = game.balls[j].x;
				game.balls[j].oldy = game.balls[j].y;
				game.balls[j].x = tX;
				game.balls[j].y = tY;
				var newT = (new Date).getTime();
				game.balls[j].vx = ((game.balls[j].x - game.balls[j].oldx)/(newT - game.balls[j].lastTime)*game.sensitivity) * 0.5;
				game.balls[j].vy = ((game.balls[j].y - game.balls[j].oldy)/(newT - game.balls[j].lastTime)*game.sensitivity) * 0.5;
				game.balls[j].lastTime = newT;
				game.refresh();*/
				//var game.lines[touches[i].identifier];
				game.lines[touches[i].identifier] = {x1: game.balls[j].x, y1: game.balls[j].y, x2: tX, y2: tY};
			}
		}
	}
};

Game.prototype.touchEnd = function(event) {
	event.preventDefault();
	var touches = event.changedTouches;
	for (var i in touches) {
		for (var j in game.balls) {
			if (game.balls[j].touched == touches[i].identifier) {
				game.balls[j].touched = -1;
				game.balls[j].vx = (game.lines[touches[i].identifier].x1 - game.lines[touches[i].identifier].x2) * game.sensitivity;
				game.balls[j].vy = (game.lines[touches[i].identifier].y1 - game.lines[touches[i].identifier].y2) * game.sensitivity;
				console.log(game.balls[j].vx);
				console.log(game.balls[j].vy);

				game.lines[touches[i].identifier] = null;
			}
		}
	}
};

Game.prototype.mouseDown = function(event) {
	event.preventDefault();
	var tX = event.clientX;
	var tY = event.clientY;
	tX *= game.dpratio;
	tY *= game.dpratio;
	for (var j in game.balls) {
		if (game.balls[j].x - game.ballsize < tX && tX < game.balls[j].x + game.ballsize && game.balls[j].y - game.ballsize < tY && tY < game.balls[j].y + game.ballsize) {
			game.mousedown = j;
			break;
		}
	}
};

Game.prototype.mouseMove = function(event) {
	event.preventDefault();
	if (game.mousedown != -1) {
		var tX = event.clientX;
		var tY = event.clientY;
		tX *= game.dpratio;
		tY *= game.dpratio;
		game.lines[-1000] = {x1: game.balls[game.mousedown].x, y1: game.balls[game.mousedown].y, x2: tX, y2: tY};
	}
};

Game.prototype.mouseUp = function(event) {
	event.preventDefault();
	if (game.mousedown != -1) {
		game.balls[game.mousedown].touched = -1;
		game.balls[game.mousedown].vx = (game.lines[-1000].x1 - game.lines[-1000].x2) * game.sensitivity;
		game.balls[game.mousedown].vy = (game.lines[-1000].y1 - game.lines[-1000].y2) * game.sensitivity;

		game.lines[-1000] = null;
		game.render();
		game.mousedown = -1;
	}
};

Game.prototype.refresh = function() {
	for(var i in game.balls) {
		//if (game.balls[i].touched != -1) continue;
		game.balls[i].oldx = game.balls[i].x;
		game.balls[i].oldy = game.balls[i].y;
		game.balls[i].x += game.balls[i].vx * 0.5;
		game.balls[i].y += game.balls[i].vy * 0.5;
		if (game.balls[i].x > game.rlimit) {
			game.balls[i].x = game.rlimit - (game.balls[i].x - game.rlimit) * game.e_wall;
			game.balls[i].vx *= -game.e_wall;
			if (Math.abs(game.balls[i].vx) < game.threshold) {
				game.balls[i].x = game.rlimit;
				game.balls[i].vx = 0;
			}
		} else if (game.balls[i].x < game.llimit) {
			game.balls[i].x = game.llimit + (game.llimit - game.balls[i].x) * game.e_wall;
			game.balls[i].vx *= -game.e_wall;
			if (Math.abs(game.balls[i].vx) < game.threshold) {
				game.balls[i].x = game.llimit;
				game.balls[i].vx = 0;
			}
		}
		if (game.balls[i].y > game.dlimit) {
			game.balls[i].y = game.dlimit - (game.balls[i].y - game.dlimit) * game.e_wall;
			game.balls[i].vy *= -game.e_wall;
			if (Math.abs(game.balls[i].vy) < game.threshold) {
				game.balls[i].y = game.dlimit;
				game.balls[i].vy = 0;
			}
		} else if (game.balls[i].y < game.ulimit) {
			game.balls[i].y = game.ulimit + (game.ulimit - game.balls[i].y) * game.e_wall;
			game.balls[i].vy *= -game.e_wall;
			if (Math.abs(game.balls[i].vy) < game.threshold) {
				game.balls[i].y = game.ulimit;
				game.balls[i].vy = 0;
			}
		}

		if (game.balls[i].vx > 0) {
			if (game.balls[i].vx - game.friction > 0) {
				game.balls[i].vx -= game.friction;
			} else {
				game.balls[i].vx = 0;
			}
		} else if (game.balls[i].vx < 0) {
			if (game.balls[i].vx + game.friction < 0) {
				game.balls[i].vx += game.friction;
			} else {
				game.balls[i].vx = 0;
			}
		}
		if (game.balls[i].vy > 0) {
			if (game.balls[i].vy - game.friction > 0) {
				game.balls[i].vy -= game.friction;
			} else {
				game.balls[i].vy = 0;
			}
		} else if (game.balls[i].vy < 0) {
			if (game.balls[i].vy + game.friction < 0) {
				game.balls[i].vy += game.friction;
			} else {
				game.balls[i].vy = 0;
			}
		}
	}

	for(var i in game.balls) {
		for(var j = 1+parseInt(i); j < game.balls.length; j++) {
			if (Math.pow(Math.abs(game.balls[i].x - game.balls[j].x), 2) + Math.pow(Math.abs(game.balls[i].y - game.balls[j].y), 2) < 4*Math.pow(game.ballsize,2)) {
				var tmpvx = game.balls[i].vx;
				var tmpvy = game.balls[i].vy;
				game.balls[i].vx = ((game.e_ball + 1) * game.balls[j].vx + tmpvx * (1 - game.e_ball))/2;
				game.balls[j].vx = ((game.e_ball + 1) * tmpvx + game.balls[j].vx * (1 - game.e_ball))/2;
				game.balls[i].vy = ((game.e_ball + 1) * game.balls[j].vy + tmpvy * (1 - game.e_ball))/2;
				game.balls[j].vy = ((game.e_ball + 1) * tmpvy + game.balls[j].vy * (1 - game.e_ball))/2;

				//*/
				var mx = game.balls[i].x + game.balls[j].x;
				var my = game.balls[i].y + game.balls[j].y;
				mx /= 2;
				my /= 2;
				var dist_from_mx = Math.sqrt(Math.pow(game.balls[i].x - mx, 2) + Math.pow(game.balls[i].y - my, 2));
				var relative_move = (game.ballsize) / dist_from_mx * dist_from_mx - dist_from_mx;
				relative_move *= relative_move;
				var ratio = my / mx;
				var ans_x = Math.sqrt(relative_move / (1 + ratio * ratio));
				var ans_y = Math.sqrt(relative_move - ans_x * ans_x)
				if (game.balls[i].x < game.balls[j].x) {
					game.balls[i].x -= ans_x * (1.0 + Math.random() * 5);
					game.balls[i].x += ans_x + (Math.random() * 5);
				} else {
					game.balls[i].x += ans_x + (Math.random() * 5);
					game.balls[i].x -= ans_x + (Math.random() * 5);
				}
				if (game.balls[i].y < game.balls[j].y) {
					game.balls[i].y -= ans_y + (Math.random() * 5);
					game.balls[j].y += ans_y + (Math.random() * 5);
				} else {
					game.balls[i].y += ans_y + (Math.random() * 5);
					game.balls[j].y -= ans_y + (Math.random() * 5);
				}
			}
		}
	}
	game.render();
};

Game.prototype.orientation = function(event) {
	for(var i in game.balls) {
		game.balls[i].vx += event.accelerationIncludingGravity.x * game.g;
		game.balls[i].vy += event.accelerationIncludingGravity.y * -game.g;
		game.balls[i].vx *= (0.95 + Math.random() * 0.1);
		game.balls[i].vy *= (0.95 + Math.random() * 0.1);
	}
	game.refresh();
	//game.render();
};

Game.prototype.addBall = function(x, y, color) {
	this.balls.push({x: x, y: y, color: this.colorlist[color], vx: 0, vy: 0, touched: -1});
};

Game.prototype.render = function() {
	//game.ctx_overlay.fillStyle = '#1B5E20';
	for(var i in game.balls) {
		game.ctx_overlay.clearRect(game.balls[i].oldx - game.ballsize - game.ballpadding * 1.5, game.balls[i].oldy - game.ballsize - game.ballpadding * 1.5, game.ballsize * 2 + game.ballpadding * 3, game.ballsize * 2 + game.ballpadding * 3);
	}
	if (game.lines.length || game.mousedown != -1) {
		game.ctx_overlay.clearRect(0, 0, game.width, game.height);
	}
	//game.ctx.fillStyle = '#1B5E20';
	//game.ctx.fill();
	game.drawBall();
	game.drawLine();
	//game.fps.push((new Date).getTime());
	//for(var i in game.fps) {
	//	
	//}
};

Game.prototype.drawLine = function() {
	game.ctx_overlay.strokeStyle = '#FFFFFF';
	game.ctx_overlay.lineWidth= '4';

	game.ctx_overlay.beginPath();
	for(var i in game.lines) {
		if (game.lines[i]) {
			game.ctx_overlay.moveTo(game.lines[i].x1, game.lines[i].y1);
			game.ctx_overlay.lineTo(game.lines[i].x2, game.lines[i].y2);
		}
	}
	game.ctx_overlay.stroke();
};

Game.prototype.coldRender = function() {
	//this.ctx.fillStyle = '#1B5E20';
	//this.ctx.fillRect(0, 0, this.width, this.height);
	this.ctx.fillStyle = '#3E2723';
	this.ctx.fillRect(0, 0, this.llimit - this.ballsize - 5, this.height);
	this.ctx.fillRect(0, 0, this.width, this.ulimit - this.ballsize - 5);
	this.ctx.fillRect(0, this.dlimit + this.ballsize + 5, this.width, this.height);
	this.ctx.fillRect(this.rlimit + this.ballsize + 5, 0, this.width, this.height);
	//this.ctx_overlay.fillStyle = '#FFFFFF';
	//this.ctx_overlay.font = "1.5em sans-serif";
	//this.ctx_overlay.fillText("Pocket billiard - v" + this.ver, 15, 35);
};

Game.prototype.drawBall = function() {
	//game.ctx_overlay.fillStyle = '#FFFFFF';
	for (var i in game.balls) {
		//if (game.balls[i].oldx != game.balls[i].x || game.balls[i].oldy != game.balls[i].y) {
			//game.ctx.strokeStyle = game.balls[i].color;
			game.ctx_overlay.fillStyle = game.balls[i].color;
			game.ctx_overlay.beginPath();
			game.ctx_overlay.arc(game.balls[i].x, game.balls[i].y, game.ballsize, 0, 2*Math.PI);
			game.ctx_overlay.fill();
			//game.ctx.stroke();
		//}
	}
};

var load = function() {
	$('body').html('');
	var canvas = $("<canvas/>").appendTo($('body'));
	window.devicePixelRatio = 1 || window.devicePixelRatio || 1;
	canvas.get()[0].width = $(window).width();
	canvas.get()[0].height = $(window).height();
	var cwidth = canvas.get()[0].width;
	var cheight = canvas.get()[0].height;
	canvas.get()[0].width *= window.devicePixelRatio;
	canvas.get()[0].height *= window.devicePixelRatio;
	canvas.get()[0].style.width = cwidth + 'px';
	canvas.get()[0].style.height = cheight + 'px';
	var ctx = canvas.get()[0].getContext("2d");
	canvas.css('position', 'absolute');
	canvas.css('z-index', '0');

	var canvas_overlay = $("<canvas/>").appendTo($('body'));
	canvas_overlay.get()[0].width = $(window).width();
	canvas_overlay.get()[0].height = $(window).height();
	cwidth = canvas_overlay.get()[0].width;
	cheight = canvas_overlay.get()[0].height;
	canvas_overlay.get()[0].width *= window.devicePixelRatio;
	canvas_overlay.get()[0].height *= window.devicePixelRatio;
	canvas_overlay.get()[0].style.width = cwidth + 'px';
	canvas_overlay.get()[0].style.height = cheight + 'px';
	var ctx_overlay = canvas_overlay.get()[0].getContext("2d");
	canvas_overlay.css('position', 'absolute');
	canvas_overlay.css('z-index', '1');

	game = new Game(cwidth * window.devicePixelRatio, cheight * window.devicePixelRatio, 50, ctx, canvas_overlay, window.devicePixelRatio);
	game.render();
}

$(document).ready(function() {
	$("body").css('height', '100%');
	$("body").css('width', '100%');
	$("body").css('position', 'fixed');
	$("body").css('margin', '0');
	var output = 'Loading...<br />Pocket billiard v' + version;
	$("<div/>", {html: output, style: 'position: absolute; width: 100%; height: 100%; font-family: "Apple SD Gothic Neo", "맑은 고딕"; text-align: center; font-size: 5em; color: white;'}).appendTo($('body'));
	setTimeout(load, 500);
});