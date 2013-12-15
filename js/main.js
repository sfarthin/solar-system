require(['vsop87d/vsop87d'], function(vsop, dateFunctions) {
	
	Date.prototype.format=function(format){var returnStr='';var replace=Date.replaceChars;for(var i=0;i<format.length;i++){var curChar=format.charAt(i);if(i-1>=0&&format.charAt(i-1)=="\\"){returnStr+=curChar;}else if(replace[curChar]){returnStr+=replace[curChar].call(this);}else if(curChar!="\\"){returnStr+=curChar;}}return returnStr;};Date.replaceChars={shortMonths:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],longMonths:['January','February','March','April','May','June','July','August','September','October','November','December'],shortDays:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],longDays:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],d:function(){return(this.getDate()<10?'0':'')+this.getDate();},D:function(){return Date.replaceChars.shortDays[this.getDay()];},j:function(){return this.getDate();},l:function(){return Date.replaceChars.longDays[this.getDay()];},N:function(){return this.getDay()+1;},S:function(){return(this.getDate()%10==1&&this.getDate()!=11?'st':(this.getDate()%10==2&&this.getDate()!=12?'nd':(this.getDate()%10==3&&this.getDate()!=13?'rd':'th')));},w:function(){return this.getDay();},z:function(){var d=new Date(this.getFullYear(),0,1);return Math.ceil((this-d)/86400000);},W:function(){var d=new Date(this.getFullYear(),0,1);return Math.ceil((((this-d)/86400000)+d.getDay()+1)/7);},F:function(){return Date.replaceChars.longMonths[this.getMonth()];},m:function(){return(this.getMonth()<9?'0':'')+(this.getMonth()+1);},M:function(){return Date.replaceChars.shortMonths[this.getMonth()];},n:function(){return this.getMonth()+1;},t:function(){var d=new Date();return new Date(d.getFullYear(),d.getMonth(),0).getDate()},L:function(){var year=this.getFullYear();return(year%400==0||(year%100!=0&&year%4==0));},o:function(){var d=new Date(this.valueOf());d.setDate(d.getDate()-((this.getDay()+6)%7)+3);return d.getFullYear();},Y:function(){return this.getFullYear();},y:function(){return(''+this.getFullYear()).substr(2);},a:function(){return this.getHours()<12?'am':'pm';},A:function(){return this.getHours()<12?'AM':'PM';},B:function(){return Math.floor((((this.getUTCHours()+1)%24)+this.getUTCMinutes()/60+this.getUTCSeconds()/3600)*1000/24);},g:function(){return this.getHours()%12||12;},G:function(){return this.getHours();},h:function(){return((this.getHours()%12||12)<10?'0':'')+(this.getHours()%12||12);},H:function(){return(this.getHours()<10?'0':'')+this.getHours();},i:function(){return(this.getMinutes()<10?'0':'')+this.getMinutes();},s:function(){return(this.getSeconds()<10?'0':'')+this.getSeconds();},u:function(){var m=this.getMilliseconds();return(m<10?'00':(m<100?'0':''))+m;},e:function(){return"Not Yet Supported";},I:function(){return"Not Yet Supported";},O:function(){return(-this.getTimezoneOffset()<0?'-':'+')+(Math.abs(this.getTimezoneOffset()/60)<10?'0':'')+(Math.abs(this.getTimezoneOffset()/60))+'00';},P:function(){return(-this.getTimezoneOffset()<0?'-':'+')+(Math.abs(this.getTimezoneOffset()/60)<10?'0':'')+(Math.abs(this.getTimezoneOffset()/60))+':00';},T:function(){var m=this.getMonth();this.setMonth(0);var result=this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/,'$1');this.setMonth(m);return result;},Z:function(){return-this.getTimezoneOffset()*60;},c:function(){return this.format("Y-m-d\\TH:i:sP");},r:function(){return this.toString();},U:function(){return this.getTime()/1000;}};
	
	var start_time = new Date(),
		current_time = start_time;
	
	// var addMonth = function(date, num) {
	// 	var new_date = new Date(date.toISOString());
	// 	new_date.setMonth(now.getMonth() + (num ? num : 1));
	// 	return new_date;
	// }
	
	// 
	// var positions = [];
	// 
	// 
	// for(var i = 0; i <= 12; i++) {
	// 	positions.push(vsop.heliocentric_planetary_position(addMonth(now, i), vsop.planets.EARTH).p);
	// }
	// 
	// for(var i = 0; i <= 12; i++) {
	// 	positions.push(vsop.heliocentric_planetary_position(addMonth(now, i), vsop.planets.MARS).p);
	// }

	var webGLStart = function(gl, canvas) {
	
        // New scene with our canvas dimensions and default camera with FOV 80
        var scene = new CubicVR.Scene(canvas.width, canvas.height, 80);

        var material3 = new CubicVR.Material({
            textures: {
                color: "CubicVR.js/samples/images/2576-diffuse.jpg"
            }
        });

        var grass = new CubicVR.Material({
            textures: {
                color: "CubicVR.js/samples/images/grass.jpg"
            }
        });

        var uvcubic = {
            projectionMode: "cubic",
            scale: [0.5, 0.5, 0.5]
        };

        var uvcubic2 = {
            projectionMode: "cubic",
            scale: [0.1, 0.1, 0.1]
        };

        var sphereMesh = new CubicVR.Mesh({
            primitive: {
              type: "sphere",
              radius: 0.00929826069,
              lat: 24,
              lon: 24,
              material: material3,
              uvmapper: uvcubic
            },
            compile: true
        });

        var sphereMesh2 = new CubicVR.Mesh({
            primitive: {
              type: "sphere",
              radius: 0.000085,
              lat: 24,
              lon: 24,
              material: grass,
              uvmapper: uvcubic2
            },
            compile: true
        });
		
        // Add SceneObjects
        scene.bindSceneObject(new CubicVR.SceneObject({mesh:sphereMesh, position:[0,0,0]}));
		
		var earth_position = vsop.heliocentric_planetary_position(current_time, vsop.planets.EARTH).p;
		
		var earth = new CubicVR.SceneObject({
			name: 'earth',
			mesh:sphereMesh2, 
			position:[earth_position.x,earth_position.y,earth_position.z]}
		);
		
		var mars_position = vsop.heliocentric_planetary_position(current_time, vsop.planets.MARS).p;
		
		var mars = new CubicVR.SceneObject({
			name: 'earth',
			mesh:sphereMesh2, 
			position:[mars_position.x,mars_position.y,mars_position.z]}
		);
		
        scene.bindSceneObject(earth);
        scene.bindSceneObject(mars);
		

        // set initial camera position and target
        scene.camera.position = [0.015920932367006712,0.04301943336436981,1.7671717098984963];
        scene.camera.target = [0, 0, 0];

        // Add our scene to the window resize list
        CubicVR.addResizeable(scene);

		window.multiplier = 60*60*60*24;
		
		var scaleElement = document.querySelector(".scale input"),
			positionXElement = document.querySelector(".position .x"),
			positionYElement = document.querySelector(".position .y"),
			positionZElement = document.querySelector(".position .z"),
			epositionXElement = document.querySelector(".e_position .x"),
			epositionYElement = document.querySelector(".e_position .y"),
			epositionZElement = document.querySelector(".e_position .z"),
			timeElement = document.querySelector(".time input"),
			timeElapse = {
				"-3": -60*60*60*24*5, // 5 days a second
				"-2": -60*60*60*24, // 1 day/second		
				"-1": -60*60*60, // 3 hour a second	
				0: 0,
				1: 60*60*60*3, // 3 hour a second
				2: 60*60*60*24, // 1 day/second
				3: 60*60*60*24*5 // 5 days a second 
			},
			timerElement = document.querySelector(".timer input");
		
		document.querySelector(".timer").onclick = function() {
			var date = prompt("Please enter a date in the format of YYYY/MM/DD.");
			current_time = new Date(date);
			timeElement.value = 0;
		};
		
		var camera_p_old = 1;
		
        // Start our main drawing loop, it provides a timer and the gl context as parameters
        CubicVR.MainLoop(function(timer, gl) {
		
			var seconds_elapsed = timer.getLastUpdateSeconds(),
				ms_elapsed = (seconds_elapsed* 1000);
		
			current_time = new Date(current_time.getTime() + (ms_elapsed * timeElapse[timeElement.value]));
			
			timerElement.value = current_time.format("Y/m/d");
			
			positionXElement.innerHTML = scene.camera.position[0].toFixed(4) + " AU";
			positionYElement.innerHTML = scene.camera.position[1].toFixed(4) + " AU";
			positionZElement.innerHTML = scene.camera.position[2].toFixed(4) + " AU";
			
			var earth_position = vsop.heliocentric_planetary_position(current_time, vsop.planets.EARTH).p;
			earth.position = [earth_position.x,earth_position.y,earth_position.z];
			
			epositionXElement.innerHTML = earth_position.x.toFixed(4) + " AU";
			epositionYElement.innerHTML = earth_position.y.toFixed(4) + " AU";
			epositionZElement.innerHTML = earth_position.z.toFixed(4) + " AU";
			
			var mars_position = vsop.heliocentric_planetary_position(current_time, vsop.planets.MARS).p;
			mars.position = [mars_position.x,mars_position.y,mars_position.z];
			
			var camera_p = document.querySelector("[name=camera]:checked").value;
			
			if((camera_p != 4 && camera_p != 1) || camera_p != camera_p_old) {
				if(camera_p == 1) {
					scene.camera.position = [0.015920932367006712,0.04301943336436981,1.7671717098984963];
					scene.camera.target = [0, 0, 0];
				} else if(camera_p == 2) {
					scene.camera.position = [earth_position.x,earth_position.y,earth_position.z];
					scene.camera.target = [0, 0, 0];
				} else if(camera_p == 3) {
					scene.camera.position = [mars_position.x,mars_position.y,mars_position.z];
					scene.camera.target = [0, 0, 0];
				} else if(camera_p == 4) {
					scene.camera.target = [0.015920932367006712,0.04301943336436981,1.7671717098984963];
					scene.camera.position = [0, 0, 0];
				}
				camera_p_old = camera_p;
			}
			
			var scale = scaleElement.value;
			for (var i = 1; i < scene.sceneObjects.length; i++) {
              scene.sceneObjects[i].scale = [scale,scale,scale];
              scene.sceneObjects[i].scale = [scale,scale,scale];
            }
			
            scene.render();
        });

        // initialize a mouse view controller
        mvc = new CubicVR.MouseViewController(canvas, scene.camera);
    }

	CubicVR.start('auto',webGLStart);
	// 
	// console.log(vsop);
});