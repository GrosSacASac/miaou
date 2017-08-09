// This is a temporary implementation for the Flore GUI
// Hopefully I'll have a prettier rendering

miaou(function(games, locals, ws){

	var	NO_CELL = -2,
		CS = 24, // size of a cell in pixels
		BR = CS/2-2, // radius of a board dot
		colors = ['#ADD8E6', 'red'], // blue, red
		textColors = ['#ADD8E6', '#FA8072'],
		Flore = window.Flore,
		T = Flore.T,
		bg = "#17672b";

	function Panel(m, g, s, availableWidth, abstract){
		this.m = m;
		this.g = g; // game
		this.s = s; // snap thing
		this.u = -1; // user index in the game
		this.colors = ['FloralWhite', 'LightPink'];
		this.grads = colors.map(function(c){ return s.rgrad(0.3, 0.3, 1, c, '#000') });
		this.holeGrad = s.rgrad(0.3, 0.3, 1, 'rgba(0,0,0,0.5)', bg);
		g.players.forEach((p, i)=>{ if (p.id===locals.me.id) this.u=i });
		if (abstract) {
			this.layout = "row";
			this.W = availableWidth;
			this.H = 45;
			this.XB = 0;
			this.RS = this.W - 15; // right of the scores
			this.YB = (this.H - T*CS)/2;
			this.XS = 20;
			this.LHS = 20;
		} else if (availableWidth>400) {
			this.layout = "row";
			this.W = Math.min(700, 400+.3*(availableWidth-400)); // width of the whole drawed area
			this.H = 150; // height of the whole drawed area
			this.XB = (this.W - T*CS); // X of the board
			this.RS = this.XB - 15; // right of the scores
			this.YB = (this.H - T*CS)/2+2;
			this.XS = Math.max(20, this.XB-194);
			this.LHS = 28; // height of a score line
		} else {
			// column layout's reason d'etre is the mobile version of miaou
			this.layout = "column";
			this.W = T*CS;
			this.W += Math.max(4, (availableWidth-this.W)/2);
			this.H = 220;
			this.XB = (this.W - T*CS);
			this.RS = this.W - 15;
			this.YB = 70;
			this.XS = this.XB+15;
			this.LHS = 28; // height of a score line
		}
		this.abstract = abstract;
	}

	Panel.prototype.buildBoard = function(){
		if (this.abstract) return;
		this.holes = [];
		for (var i=0; i<T; i++) this.holes[i] = [];
	}

	Panel.prototype.drawFlower = function(cx, cy, color, radius, hole){
		var r = radius*.6;
		ù('<circle', hole).attr({cx:cx, cy:cy-r, r:r, fill:color});
		ù('<circle', hole).attr({cx:cx+r, cy:cy, r:r, fill:color});
		ù('<circle', hole).attr({cx:cx, cy:cy+r, r:r, fill:color});
		ù('<circle', hole).attr({cx:cx-r, cy:cy, r:r, fill:color});
		ù('<circle', hole).attr({cx:cx, cy:cy, r:r*.6, fill:"#FFD700", strokeWidth:1});
	}

	Panel.prototype.drawCell = function(i, j){
		var cell = this.g.cells[i][j];
		if (cell===NO_CELL) return;
		if (this.holes[i][j]) this.holes[i][j].remove();
		var	panel = this,
			cx = this.XB+i*CS,
			cy = this.YB+j*CS,
			d = CS/2,
			hole = this.holes[i][j] = ù('<svg', this.s).attr({x:cx, y:cy}),
			c = ù('<circle', hole).attr({cx:d, cy:d, r:BR, fill: this.holeGrad}),
			userIsCurrentPlayer = this.g.current!==-1 && this.u===this.g.current;
		if (cell!==-1) {
			this.drawFlower(d, d, this.grads[cell], BR, hole);
			return;
		}
		if (!userIsCurrentPlayer) return;
		if (Flore.canPlay(this.g, i, j)) {
			c.attr({cursor:'pointer'})
			.on('mouseenter', function(){
				c.attr({fill: panel.colors[panel.u]});
			})
			.on('mouseleave click', function(){
				c.attr({fill: panel.holeGrad});
			})
			.on('click', function(){
				ws.emit('ludo.move', {mid:panel.m.id, move:Flore.encodeMove({p:panel.u, x:i, y:j})});
			});
		} else { // hum... je pense que c'est une branche morte avec les règles actuelles, ça...
			c.on('mouseenter', function(){
				c.attr({fill: 'red'})
			})
			.on('mouseleave', function(){
				c.attr({fill: panel.holeGrad})
			})
			.on('click', function(){
				ws.emit('ludo.move', {mid:panel.m.id, move:Flore.encodeMove({p:panel.u, x:i, y:j})});
			});
		}
	}

	Panel.prototype.drawBoard = function(){
		if (this.abstract) return;
		for (var i=0; i<T; i++) {
			for (var j=0; j<T; j++) {
				this.drawCell(i, j);
			}
		}
	}

	Panel.prototype.buildScores = function(){
		var panel = this, s = panel.s, XS = this.XS, RS = this.RS;
		panel.names = panel.g.players.map(function(player, i){
			var name = player.name;
			var text = ù('<text', s)
			.text(name.length>21 ? name.slice(0, 18)+'…' : name)
			.attr({ x:XS, y:panel.LHS*(i+1), fill:textColors[i] });
			return text;
		});
		panel.scores = panel.g.players.map(function(player, i){
			return ù('<text', s).text('0').attr({
				x:RS, y:panel.LHS*(i+1), fill:textColors[i],
				fontWeight:'bold', textAnchor:'end'
			});
		});
	}

	Panel.prototype.drawScores = function(){
		var g = this.g;
		this.scores.forEach(function(s, i){ s.text(g.scores[i]) });
		if (this.currentPlayerMark) this.currentPlayerMark.remove();
		if (this.g.current >= 0) {
			this.currentPlayerMark = ù('<text', this.s).text("►").attr({
				x:this.XS-15, y:this.LHS*(g.current+1),
				fill:this.grads[g.current], fontWeight:'bold'
			});
		} else {
			this.currentPlayerMark = ù('<text', this.s).text("♛").attr({
				x:this.XS-18, y:this.LHS*((g.scores[1]>=g.scores[0])+1),
				fill:"Goldenrod", fontWeight:'bold', fontSize:"140%"
			});
		}
	}

	games.Flore = {
		render: function($c, m, g, abstract){
			Flore.restore(g);
			$c.empty().addClass('wide content-rating-not-serious').css('background', bg)
			.closest('.message').removeClass('edited');
			var	s = ù('<svg', $c),
				p = new Panel(m, g, s, $c.width(), abstract);
			s.width(p.W).height(p.H);
			$c.dat('ludo-panel', p);
			if (g.status !== "ask") m.locked = true;
			p.buildBoard();
			p.drawBoard();
			p.buildScores();
			p.drawScores();
		},
		move: function($c, m, _, move){
			var panel = $c.dat('ludo-panel');
			if (!panel) {
				console.log("Missing ludo-panel for move", m.id, $c);
				return null;
			}
			var	movechar = Tribo.encodeMove(move),
				newmove = panel.g.moves.slice(-1) !== movechar;
			m.locked = true;
			if (newmove) {
				panel.g.moves += movechar;
				Flore.apply(panel.g, move);
			}
			panel.drawBoard();
			panel.drawScores();
			return newmove;
		},
		fillHelp: function($div){
			$div.css({
				background:'#2a4646', color: '#0c0', opacity:0.95
			}).append(
				$('<div>Flore</div>').css({
					textAlign:'center', fontSize:'120%', fontWeight:'bold', margin:'4px'
				})
			).append($('<p>').html(
				'When a flower is surrounded by more than three flowers,'+
				' it dies and the other player gains one point.<br>'+
				`First player with ${Flore.GOAL} points wins.<br>`+
				'To start a new game, just type <i>!!flore&nbsp;@somename</i>'
			));
		}
	}

});