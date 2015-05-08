/*

	Visualization of the Paths taken in a set of stories

	By: Ben Kybartas

*/

var storyPath = function(){

	return {

        inbound_links: {},
        pushpops: [],
        adj: [],

        //Based on http://stackoverflow.com/questions/3689903/how-to-create-a-2d-array-of-zeroes-in-javascript
        zeros: function(dimensions){
            var array = [];

            for (var i = 0; i < dimensions[0]; ++i){
                array.push(dimensions.length == 1 ? 0 : this.zeros(dimensions.slice(1)));
            }

            return array;
        },

		generateStoryPath: function(traces, grammar){
			this.visualizeStories (traces,grammar);
		},

        getMaxInboundLinks: function(){

            var max = 0;

            for (var symbol in this.inbound_links){
                if (symbol !== "end"){
                    var nu = this.getTotalInboundLinks(symbol);
                    if ( nu > max){
                        max = nu; 
                    }
                }
            }

            return max;
        },

        getTotalInboundLinks: function(symbol){

            var i = 0;
            
            for (var inboundLinks in this.inbound_links[symbol]){
                i += this.inbound_links[symbol][inboundLinks];
            }

            return i;
        },

        //Complicated, stupid, poorly implemented recursive function for converting trace to links
        convertTraceToLinks: function(node){
        
            //Get links from children
            for (var j = 0; j < node.children.length; j++) {
                if (node.children[j].type === "symbolExpansion"){
                    
                    //Check for push pops
                    if (node.children[j].type === "symbolExpansion"){
                        if (!(node.children[j].symbol in this.inbound_links)){
                            this.pushpops.push(node.children[j].symbol);
                            this.inbound_links[node.children[j].symbol] = {};
                        }
                    }

                    //Link the parent to children
                    if (node.symbol in this.inbound_links[node.children[j].symbol]){
                        this.inbound_links[node.children[j].symbol][node.symbol] += 1;
                    } else {
                        this.inbound_links[node.children[j].symbol][node.symbol] = 1;
                    }

                    //Recurse
                    this.convertTraceToLinks(node.children[j]);

                } else if (node.children[j].type === "plainText"){

                    //Link the parent to end
                    /*if (node.symbol in this.inbound_links.end){
                        this.inbound_links.end[node.symbol] += 1;
                    } else {
                        this.inbound_links.end[node.symbol] = 1;
                    }*/
                }
            }
        },

        //Highlight a specific path in the visualization
        highlightPath: function(path_id){

        },

        visualizeStories: function(traces, grammar){
            var width = 1500;
            var height = 1000;

            var svg= d3.select('body').append('svg')
                .attr('width', width)
                .attr('height', height);

            //Width of gap between symbols
            var gap_width = 5;

            //Values for Grammar Symbols viz
            var symb_height = 100;
            var symb_width = 800;
            var symb_x_pos = 100;
            var symb_y_pos = 700;

            //Values for PushPop viz
            //Width must be the same as the symbol width
            var pushpop_height = 100;
            var pushpop_width = 800;
            var pushpop_x_pos = 100;
            var pushpop_y_pos = 400;

            var symbols = [];
            var max_intense = 0;

            //Arrowheads
            svg.append('marker')
                .attr('id', "triangle")
                .attr('viewBox', "0 0 10 10")
                .attr('refX', 0)
                .attr('refY', 5)
                .attr('markerUnits', "strokeWidth")
                .attr('markerWidth', 4)
                .attr('markerHeight', 3)
                .attr('orient', "auto")
                .append('svg:path')
                    .attr('d', "M 0 0 L 10 5 L 0 10 z");
            
            /*
            * Get the high-level information regarding symbols and links
            */

            symbols.push("origin");
            this.inbound_links.origin = {};

            //Create the grammar symbols
            for (var symbol in grammar){
                if (symbol != "origin"){
                    symbols.push(symbol);
                    this.inbound_links[symbol] = {};
                }
            }

            //symbols.push("end");
            //this.inbound_links.end = {};

            //Analyse the traces
            for (var trace in traces){
                this.convertTraceToLinks(traces[trace].root);
            }

            max_intense = this.getMaxInboundLinks();

            /*
            * Convert high level data to more specific coordinates for rendering
            */
            var block_width = (symb_width / (2 + symbols.length)) - gap_width;
            var current_x = symb_x_pos;
            var symbol_data = [];

            //Get our symbol data
            for (var symbol in symbols){

                current_x += gap_width;

                symbol_data.push({"name" : symbols[symbol], 
                                    "x" : current_x, 
                                    "y" : symb_y_pos,
                                    "width" : block_width,
                                    "height" : symb_height,
                                    "type": "symbol",
                                    "intensity": this.getTotalInboundLinks(symbols[symbol]) / max_intense});

                current_x += block_width;

            }

            //Get our push pop data
            //We use the same array for rendering purposes
            var pp_gap = (pushpop_width - (block_width * this.pushpops.length)) / (this.pushpops.length + 1);
            var current_x = pushpop_x_pos;

            for (var pp in this.pushpops){
          
                current_x += + pp_gap;

                symbol_data.push({"name" : this.pushpops[pp], 
                    "x" : current_x, 
                    "y" : pushpop_y_pos,
                    "width" : block_width,
                    "height" : pushpop_height,
                    "type": "pushpop"});

                current_x += block_width;
            
            }

            var link_data = [];

            //Get Links data
            for (var to in this.inbound_links){
                for (var from in this.inbound_links[to]){
                    
                    //Create a new path
                    var path = [];

                    //Get the from position
                    for (var i in symbol_data){
                        if (symbol_data[i].name === from){
                            if (symbol_data[i].type === "symbol"){
                                path.push({"x": symbol_data[i].x + (0.5 * symbol_data[i].width),
                                    "y": symbol_data[i].y,
                                    "width": this.inbound_links[to][from]});
                            }
                            else if (symbol_data[i].type === "pushpop"){
                                path.push({"x": symbol_data[i].x + (0.5 * symbol_data[i].width),
                                    "y": symbol_data[i].y + symbol_data[i].height,
                                    "width": this.inbound_links[to][from]});
                            }
                        }
                    }

                    //Get the to position
                    for (var i in symbol_data){
                        if (symbol_data[i].name === to){
                            if (symbol_data[i].type === "symbol"){
                                path.push({"x": symbol_data[i].x + (0.5 * symbol_data[i].width),
                                    "y": symbol_data[i].y,
                                    "width": this.inbound_links[to][from]});
                            }
                            else if (symbol_data[i].type === "pushpop"){
                                path.push({"x": symbol_data[i].x + (0.5 * symbol_data[i].width),
                                    "y": symbol_data[i].y + symbol_data[i].height,
                                    "width": this.inbound_links[to][from]});
                            }
                        }
                    }

                    //Arc some of the lines
                    if (path[1].y - path[0].y === 0){

                        midpoint_x = (path[0].x + path[1].x)/2;
                        midpoint_y = (path[0].y + path[1].y)/2;

                        path.splice(1, 0, {
                            "x": (path[0].x + path[1].x)/2,
                            "y": path[0].y - (0.5 * Math.abs(path[1].x - path[0].x)),
                            "width": this.inbound_links[to][from]
                        });
                    }

                    link_data.push(path);
                }
            }

            /*
            * Render the final visualization
            */

            //Link Rendering
            var line = d3.svg.line()
                .interpolate("basis")
                .x(function(d) {return d.x;})
                .y(function(d) {return d.y;})

            svg.selectAll("path")
                .data(link_data)
                .enter().append("path")
                    .style("stroke-width", function(d) {return d.width})
                    .style("fill", "none")
                    .attr("class", "line_")
                    .attr('marker-end', "url(#triangle)")
                    .attr("d", line);

            //Symbol Rendering
            var symb = svg.selectAll("g")
                .data(symbol_data)
                .enter().append("g");

            symb.append("rect")
                .attr("x", function(d) {return d.x;})
                .attr("y", function(d) {return d.y;})
                .attr("width", function(d) {return d.width;})
                .attr("height", function(d) {return d.height;})
                .attr("class", function(d) {return d.type + '_box ' + d.name;})
                .attr("rx", 10)
                .attr("opacity", function(d) {return 0.2 + (0.8 * d.intensity);})
                .attr("ry", 10);

            /*symb.append("text")
                .attr("x", function(d) {return d.x + (0.5 * d.width);})
                .attr("y", function(d) {return d.y + d.height + 10;})
                .attr("dy", ".35em")
                .attr("text-anchor", "middle")
                .attr("class", function (d) {return d.type + '_name ' + d.name;})
                .text(function(d) {return d.name;});*/
            symb.append("text")
                .attr("transform", function(d) {return "translate(" + (d.x + (0.5 * d.width)) + "," + (d.y + (0.5 * d.height)) + ")rotate(-90)";})
                .attr("dy", ".35em")
                .attr("text-anchor", "middle")
                .attr("class", function (d) {return d.type + '_name ' + d.name;})
                .text(function(d) {return d.name;});

        },

		/*Render a given story tree (DAG) here we do
        some D3 magic!*/        
        renderTree: function(){

            var width = 1500;
            var height = 1000;
            var animationStep = 400;
            var offset = 20;
            var margin = 400;

            var svg = d3.select('body').append('svg')
                .attr('width', width)
                .attr('height', height);

            svg.append('marker')
                .attr('id', "triangle")
                .attr('viewBox', "0 0 10 10")
                .attr('refX', 0)
                .attr('refY', 5)
                .attr('markerUnits', "strokeWidth")
                .attr('markerWidth', 4)
                .attr('markerHeight', 3)
                .attr('orient', "auto")
                .append('svg:path')
                    .attr('d', "M 0 0 L 10 5 L 0 10 z");

            var nodes = this.nodes;
            var links = this.edges;

            var force = d3.layout.force()
                .size([width, height])
                .nodes(nodes)
                .links(links);

            force.charge(-500);
            force.linkStrength(0.1);
            force.linkDistance(width/5);
            
            var node = svg.selectAll('.node')
                .data(nodes)
                .enter().append('text')
                .attr('class', 'node')
                .text( function(d) { 
                	console.log(d);
                	if (d.type === "plainText"){
                		return d.finishedText;
                	} else {
                		return d.type;
                	}

                 })
            
            var link = svg.selectAll('.link')
                .data(links)
                .enter().append('line')
                .attr('class', 'link')
                .attr('marker-end', "url(#triangle)")

            force.on('tick', function(){

                node.transition().ease('linear').duration(animationStep)
                    .attr('x', function(d) { return d.x; })
                    .attr('y', function(d) { return d.y; });

                link.transition().ease('linear').duration(animationStep)
                    .attr('x1', function(d) { return d.source.x; })
                    .attr('y1', function(d) { return d.source.y; })
                    .attr('x2', function(d) { return d.target.x; })
                    .attr('y2', function(d) { return d.target.y; });

            });
            
            force.start();

        },

        /*
        convertTraceToTree: function(node, pos){
            for (var j = 0; j < node.children.length; j++) {
                console.log(node.children[j]);
                this.nodes.push(node.children[j]);
                this.edges.push({source:pos,target:(this.nodes.length - 1)});
                this.convertTraceToTree(node.children[j], this.nodes.length - 1);
            }
        },*/

	};
}();