"use strict";
var game;
var version = 55;
var pcount;
var Game = function(width, height, ballsize, ctx, canvas_overlay, dpratio) {
	this.width = width;
	this.height = height;
	this.ballsize = ballsize;
	this.ctx = ctx;
	this.canvas_overlay = canvas_overlay;
	this.ctx_overlay = canvas_overlay.get()[0].getContext("2d");
	this.dpratio = dpratio;
	this.balls = [];
	this.friction = 0.2;
	this.fps = [];
	this.llimit = 130;
	this.rlimit = width - 130;
	this.ulimit = 130;
	this.dlimit = height - 130;
	this.threshold = 10;
	this.collision_threshold = 5;
	this.e_wall = 0.6;
	this.e_ball = 0.9;
	this.g = 2.5;
	this.sensitivity = 0.5;
	this.lines = [];
	this.colorlist = ['#D32F2F', '#D32F2F', '#FFEB3B', '#FFF8E1'];
	this.canvas_pre = document.createElement('canvas');
	this.canvas_pre.width = this.width;
	this.canvas_pre.height = this.height;
	this.ballpadding = 15;
	this.mousedown = -1;
	this.lastdown = -1;
	this.turn = 0;
	this.score = [0, 0, 0, 0];
	this.collisions = [];
	this.scoreavail = true;

	this.g *= /(iPad|iPhone|iPod)/g.test(navigator.userAgent)?1:-1;
	console.log("Game created - " + width + 'x' + height);
	$('<audio/>', {src: 'collision.mp3', id: 'collision', preload: 'auto'}).appendTo('body');
	//this.audio = new Audio('collision.mp3');
	this.lastcollision = (new Date).getTime();
	this.initialize();
	setTimeout(this.player, 1);
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
				game.lastdown = j;
				if (j != 3 && j != 2) game.status('No score');
				game.lines[touches[i].identifier] = null;
				game.turn = (game.turn + 1) % pcount;
				game.scoreavail = true;
				game.collisions = [];
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
			game.lines[-1000] = {x1: game.balls[game.mousedown].x, y1: game.balls[game.mousedown].y, x2: tX, y2: tY};
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
		game.lastdown = game.mousedown;
		if (game.mousedown != 3 && game.mousedown != 2) game.status('No score');
		game.lines[-1000] = null;
		game.render();
		game.mousedown = -1;
		game.turn = (game.turn + 1) % pcount;
		game.scoreavail = true;
		game.collisions = [];
	}
};

Array.prototype.equals = function (array) {
	if (!array) return false;
	if (this.length != array.length) return false;

	for (var i = 0, l = this.length; i < l; i++) {
		if (this[i] instanceof Array && array[i] instanceof Array) {
			if (!this[i].equals(array[i]))
			return false;       
		}           
		else if (this[i] != array[i]) { 
			return false;   
		}           
	}       
	return true;
}

Game.prototype.refresh = function() {
	for(var i in game.balls) {
		//if (game.balls[i].touched != -1) continue;
		game.balls[i].oldx = game.balls[i].x;
		game.balls[i].oldy = game.balls[i].y;
		game.balls[i].x += game.balls[i].vx * 0.5;
		game.balls[i].y += game.balls[i].vy * 0.5;
		if (game.balls[i].x > game.rlimit) {
			if ((new Date).getTime() - game.lastcollision > 200) {
				//$('#collision')[0].cloneNode(true).play();
				game.lastcollision = (new Date).getTime();
			}
			if (i == 3) game.collisions.push('wall');
			/*if (Math.abs(game.balls[i].vx) < game.collision_threshold_wall && Math.abs(game.balls[i].vy) < game.collision_threshold_wall) {
				game.balls[i].vx = 0;
				game.balls[i].vy = 0;
			}*/

			game.balls[i].x = game.rlimit - (game.balls[i].x - game.rlimit) * game.e_wall;
			game.balls[i].vx *= -game.e_wall;
			if (Math.abs(game.balls[i].vx) < game.threshold) {
				game.balls[i].x = game.rlimit;
				game.balls[i].vx = 0;
			}
		} else if (game.balls[i].x < game.llimit) {
			if ((new Date).getTime() - game.lastcollision > 200) {
				$('#collision')[0].cloneNode(true).play();
				game.lastcollision = (new Date).getTime();
			}
			if (i == 3) game.collisions.push('wall');
			game.balls[i].x = game.llimit + (game.llimit - game.balls[i].x) * game.e_wall;
			game.balls[i].vx *= -game.e_wall;
			if (Math.abs(game.balls[i].vx) < game.threshold) {
				game.balls[i].x = game.llimit;
				game.balls[i].vx = 0;
			}
		}
		if (game.balls[i].y > game.dlimit) {
			if ((new Date).getTime() - game.lastcollision > 200) {
				$('#collision')[0].cloneNode(true).play();
				game.lastcollision = (new Date).getTime();
			}
			if (i == 3) game.collisions.push('wall');
			game.balls[i].y = game.dlimit - (game.balls[i].y - game.dlimit) * game.e_wall;
			game.balls[i].vy *= -game.e_wall;
			if (Math.abs(game.balls[i].vy) < game.threshold) {
				game.balls[i].y = game.dlimit;
				game.balls[i].vy = 0;
			}
		} else if (game.balls[i].y < game.ulimit) {
			if ((new Date).getTime() - game.lastcollision > 200) {
				$('#collision')[0].cloneNode(true).play();
				game.lastcollision = (new Date).getTime();
			}
			if (i == 3) game.collisions.push('wall');
			game.balls[i].y = game.ulimit + (game.ulimit - game.balls[i].y) * game.e_wall;
			game.balls[i].vy *= -game.e_wall;
			if (Math.abs(game.balls[i].vy) < game.threshold) {
				game.balls[i].y = game.ulimit;
				game.balls[i].vy = 0;
			}
		}

		if (game.balls[i].vx > 0) {
			if (game.balls[i].vx - game.friction > 0) {
				game.balls[i].vx -= game.friction * (Math.random() * 0.2 + 0.9);
			} else {
				game.balls[i].vx = 0;
			}
		} else if (game.balls[i].vx < 0) {
			if (game.balls[i].vx + game.friction < 0) {
				game.balls[i].vx += game.friction * (Math.random() * 0.2 + 0.9);
			} else {
				game.balls[i].vx = 0;
			}
		}
		if (game.balls[i].vy > 0) {
			if (game.balls[i].vy - game.friction > 0) {
				game.balls[i].vy -= game.friction * (Math.random() * 0.2 + 0.9);
			} else {
				game.balls[i].vy = 0;
			}
		} else if (game.balls[i].vy < 0) {
			if (game.balls[i].vy + game.friction < 0) {
				game.balls[i].vy += game.friction * (Math.random() * 0.2 + 0.9);
			} else {
				game.balls[i].vy = 0;
			}
		}
	}

	for(var i in game.balls) {
		for(var j = 1+parseInt(i); j < game.balls.length; j++) {
			if (Math.pow(Math.abs(game.balls[i].x - game.balls[j].x), 2) + Math.pow(Math.abs(game.balls[i].y - game.balls[j].y), 2) < 4*Math.pow(game.ballsize,2)) {
				if ((new Date).getTime() - game.lastcollision > 200) {
					$('#collision')[0].cloneNode(true).play();
					game.lastcollision = (new Date).getTime();
				}
				/*var tmpvx = game.balls[i].vx;
				var tmpvy = game.balls[i].vy;
				game.balls[i].vx = ((game.e_ball + 1) * game.balls[j].vx + tmpvx * (1 - game.e_ball))/2;
				game.balls[j].vx = ((game.e_ball + 1) * tmpvx + game.balls[j].vx * (1 - game.e_ball))/2;
				game.balls[i].vy = ((game.e_ball + 1) * game.balls[j].vy + tmpvy * (1 - game.e_ball))/2;
				game.balls[j].vy = ((game.e_ball + 1) * tmpvy + game.balls[j].vy * (1 - game.e_ball))/2;*/

				/*var Vi_x = game.balls[i].vx - game.balls[j].vx;
				var Vi_y = game.balls[i].vy - game.balls[j].vy;

				var Vi = Math.sqrt(Vi_x * Vi_x + Vi_y * Vi_y);

				var grad_cent = -(game.balls[j].y - game.balls[i].y) / (game.balls[j].x - game.balls[j].y);
				var grad_vi = game.balls[i].vy / game.balls[i].vx;

				var angle = parseFloat(Math.atan(grad_cent | 0)) - parseFloat(Math.atan(grad_vi | 0));
				console.log('gradc: ' + grad_cent + ', gradv: ' + grad_vi);

				var a = Math.tan(Math.PI - 2 * angle);
				var t = 2 * (game.balls[i].vx - game.balls[j].vx + a * (game.balls[i].vy - game.balls[j].vy)) / ((1 + a*a) * (2));
				console.log(a);

				game.balls[j].vx += t;
				game.balls[j].vy += a * t;
				game.balls[i].vx -= t;
				game.balls[i].vy -= a * t;*/

				/*if (i == 0 && j == 1 || i == 1 && j == 0) {
					game.status('KISS');
				}*/
				if (j == 3 && (i == 0 || i == 1)) game.collisions.push([parseInt(i), j]);
				var tmp = game.collisions.length - 1;
				//
				try {
					if (game.collisions[tmp - 3] == 'wall' && game.collisions[tmp - 2] == 'wall' && game.collisions[tmp - 1] == 'wall'){
						if ((game.collisions[tmp - 4].equals([0, 3]) && game.collisions[tmp].equals([1, 3])) || (game.collisions[tmp - 4].equals([1, 3]) && game.collisions[tmp].equals([0, 3]))) {
							if (game.scoreavail) {
								game.score[game.turn]++;
								game.scoreavail = false;
							}
						}
					}

					if (game.collisions[tmp - 4] == 'wall' && game.collisions[tmp - 2] == 'wall' && game.collisions[tmp - 1] == 'wall'){
						if ((game.collisions[tmp - 3].equals([0, 3]) && game.collisions[tmp].equals([1, 3])) || (game.collisions[tmp - 3].equals([1, 3]) && game.collisions[tmp].equals([0, 3]))) {
							if (game.scoreavail) {
								game.score[game.turn]++;
								game.scoreavail = false;
							}
						}
					}

					if (game.collisions[tmp - 4] == 'wall' && game.collisions[tmp - 3] == 'wall' && game.collisions[tmp - 1] == 'wall'){
						if ((game.collisions[tmp - 2].equals([0, 3]) && game.collisions[tmp].equals([1, 3])) || (game.collisions[tmp - 2].equals([1, 3]) && game.collisions[tmp].equals([0, 3]))) {
							if (game.scoreavail) {
								game.score[game.turn]++;
								game.scoreavail = false;
							}
						}
					}

					if (game.collisions[tmp - 4] == 'wall' && game.collisions[tmp - 3] == 'wall' && game.collisions[tmp - 2] == 'wall'){
						if ((game.collisions[tmp - 1].equals([0, 3]) && game.collisions[tmp].equals([1, 3])) || (game.collisions[tmp - 1].equals([1, 3]) && game.collisions[tmp].equals([0, 3]))) {
							if (game.scoreavail) {
								game.score[game.turn]++;
								game.scoreavail = false;
							}
						}
					}
				} catch (e) {

				}
						//game.collisions[2] == 'wall' && game.collisions[3] == 'wall')
				//}
				//console.log(game.collisions);
				game.player();

				var x1 = game.balls[i].x;
				var x2 = game.balls[j].x;
				var y1 = game.balls[i].y;
				var y2 = game.balls[j].y;
				var vx1 = game.balls[i].vx;
				var vx2 = game.balls[j].vx;
				var vy1 = game.balls[i].vy;
				var vy2 = game.balls[j].vy;

				if (Math.abs(vx1) < game.collision_threshold && Math.abs(vx2) < game.collision_threshold && Math.abs(vy1) < game.collision_threshold && Math.abs(vy2) < game.collision_threshold) {
					game.balls[i].vx = 0;
					game.balls[i].vy = 0;
					game.balls[j].vx = 0;
					game.balls[j].vy = 0;
				} else {
					var x21 = x2 - x1;
					var y21 = y2 - y1;
					var vx21 = vx2 - vx1;
					var vy21 = vy2 - vy1;

					var vx_cm = (vx1+vx2) / 2;
					var vy_cm = (vy1+vy2) / 2;   

					var fy21 = 1e-12 * Math.abs(y21);                           
					var sign; 
					if (Math.abs(x21) < fy21) {  
						if (x21<0) {
							sign=-1;
						} else {
							sign=1;
						}  
						x21 = fy21 * sign; 
					} 

					var a = y21/x21;
					var dvx2 = -2*(vx21+a*vy21)/((1+a*a)*(2));
					var e = game.e_ball;
					vx2 = vx2 + dvx2;
					vy2 = vy2 + a*dvx2;
					vx1 = vx1 - dvx2;
					vy1 = vy1 - a*dvx2;

					game.balls[i].vx = (vx1 - vx_cm) * e + vx_cm;
					game.balls[i].vy = (vy1 - vy_cm) * e + vy_cm;
					game.balls[j].vx = (vx2 - vx_cm) * e + vx_cm;
					game.balls[j].vy = (vy2 - vy_cm) * e + vy_cm;
				}
				
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
						game.balls[i].x -= ans_x;// * (1.0 + Math.random() * 5);
						game.balls[i].x += ans_x;// + (Math.random() * 5);
					} else {
						game.balls[i].x += ans_x;// + (Math.random() * 5);
						game.balls[i].x -= ans_x;// + (Math.random() * 5);
					}
					if (game.balls[i].y < game.balls[j].y) {
						game.balls[i].y -= ans_y;// + (Math.random() * 5);
						game.balls[j].y += ans_y;// + (Math.random() * 5);
					} else {
						game.balls[i].y += ans_y;// + (Math.random() * 5);
						game.balls[j].y -= ans_y;// + (Math.random() * 5);
					}
				//}
			}
		}
	}
	game.render();
};

Game.prototype.orientation = function(event) {
	for(var i in game.balls) {
		if (Math.abs(event.accelerationIncludingGravity.x) < 3) game.balls[i].vx += event.accelerationIncludingGravity.x * game.g;
		else game.balls[i].vx += 3 * game.g * (event.accelerationIncludingGravity.x / Math.abs(event.accelerationIncludingGravity.x));
		if (Math.abs(event.accelerationIncludingGravity.y) < 3) game.balls[i].vy += event.accelerationIncludingGravity.y * -game.g;
		else game.balls[i].vy += -3 * game.g * (event.accelerationIncludingGravity.y / Math.abs(event.accelerationIncludingGravity.y));
		//if (event.accelerationIncludingGravity.x > 1) game.balls[i].vx *= (0.95 + Math.random() * 0.1);
		//if (event.accelerationIncludingGravity.x > 1) game.balls[i].vy *= (0.95 + Math.random() * 0.1);
	}
	game.refresh();
	//game.render();
};

Game.prototype.status = function(text) {
	$("#status").remove();
	$("<div/>", {id: 'status', html: text, style: 'position: absolute; width: 100%; z-index: 1000; height: 20%; top: 45%; font-family: "Apple SD Gothic Neo", "맑은 고딕"; text-align: center; font-size: 5em; color: white; -webkit-animation: statusf 0.6s normal forwards ease-in-out;'}).appendTo($('body'));
	setTimeout(function(){
		$("#status").remove();
	}, 500);
}

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

Game.prototype.player = function() {
	$('#player').html('Player 1: ' + game.score[0] + (game.turn == 0?' (TURN)':'') + (pcount > 1?'<br />Player 2: ' + game.score[1] + (game.turn == 1?' (TURN)':''):'') + (pcount > 2?'<br />Player 3: ' + game.score[2] + (game.turn == 2?' (TURN)':''):'') + (pcount > 3?'<br />Player 4: ' + game.score[3] + (game.turn == 3?' (TURN)':''):''));
}

var load = function() {
	pcount = $('#pcount').val();
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
	canvas_overlay.css('z-index', '2');

	$("<div/>", {id: 'player', html: '', style: 'position: absolute; width: 100%; z-index: 1; height: 20%; top: 0%; font-family: "Apple SD Gothic Neo", "맑은 고딕"; font-size: 1.5em; color: white;'}).appendTo($('body'));

	game = new Game(cwidth * window.devicePixelRatio, cheight * window.devicePixelRatio, 50, ctx, canvas_overlay, window.devicePixelRatio);
	game.render();
}



$(document).ready(function() {
	$("body").css('height', '100%');
	$("body").css('width', '100%');
	$("body").css('position', 'fixed');
	$("body").css('margin', '0');
	var output = 'Three-cushion billiards v' + version;
	$('#modal').modal('show');
	$("<div/>", {html: output, style: 'position: absolute; width: 100%; height: 100%; font-family: "Apple SD Gothic Neo", "맑은 고딕"; text-align: center; font-size: 5em; color: white;'}).appendTo($('body'));
	//setTimeout(load, 500);
});