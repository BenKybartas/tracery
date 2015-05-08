/*
	Visualize the story as a graph using D3

	Author: Ben Kybartas

*/
var storyGraph = function() {

	return {

        current_story: [],

        /*============== Story Tree  ==============*/
        storyTree: function(nodes, edges){
            this.nodes = nodes;
            this.edges = edges;
            this.maxdepth = 0;
            this.root_node = null;

            this.getNodePosition = function(plainText){
                for (var i = 0; i < this.nodes.length; i++){
                    if (this.nodes[i].plainText === plainText){
                        return i;
                    }
                }

                console.log("Error, node position could not be found");
                return -1;
            };

            this.existsNode = function(plainText){
                for (var node in this.nodes){
                    if (this.nodes[node].plainText === plainText){
                        return true;
                    }
                }
                return false;
            };

            this.getNodeAtPosition = function(plainText, position){
                for (var i = 0; i < this.nodes.length; i++){
                    if (this.nodes[i].plainText === plainText && this.nodes[i].position === position){
                        return i;
                    }
                }
                console.log("Error, node position could not be found");
                return -1;
            };

            this.existsNodeAtPosition = function(plainText, position){
                for (var node in this.nodes){
                    if (this.nodes[node].plainText === plainText && this.nodes[node].position === position){
                        return true;
                    }
                }
                return false;
            };

            this.linkNodesPosition = function(from_node, to_node, trace){

                var from = this.getNodeAtPosition(from_node.plainText, from_node.position);
                var to = this.getNodeAtPosition(to_node.plainText, to_node.position);
                
                this.nodes[from].children.push(to);
                this.nodes[to].parents.push(from);

                this.edges.push({source: from, target: to, trace_number: trace});
            };

            //We have a special link nodes function to make sure we are ref.
            //a node that is actually stored
            this.linkNodes = function(from_node, to_node, trace){

                var from = this.getNodePosition(from_node.plainText);
                var to = this.getNodePosition(to_node.plainText);

                from_node.children.push(to);
                to_node.parents.push(from);

                this.edges.push({source: from, target: to, trace_number: trace});
            };
        },

        storyNode: function(node, plainText, position){
            this.node = node;
            this.plainText = plainText;
            this.position = position;
            this.parents = [];
            this.children = [];
        },
        /*
        storyEdge: function(from_node, to_node, trace_number){
            this.from_node = from_node;
            this.to_node = to_node;
            this.tracenumber = trace_number;
        },*/

        /*===========================================*/

        generateGraph: function(traces){

            //basic array to hold stories, these are traces reduced to only plainText Nodes
            var stories = [];

            //our Temporal StoryTree (a directed acyclic graph technically)
            var temp_tree = new this.storyTree([], []);
            
            //Make the root node
            var rootnode = new this.storyNode(null, "", -1);
            temp_tree.root_node = rootnode;
            temp_tree.nodes.push(rootnode);

            //Used for linking trees
            var prev_node = null;

            //Split the trace into arrays of strings
            for (var i = 0; i < traces.length; i++){
                this.splitTraceIntoPlainTextArray(traces[i].root);
                stories.push(this.current_story);
                this.current_story = [];
            };

            //Now analyze the stories and build our story trees
            for (var i = 0; i < stories.length; i++){

                //Reset for each new story!
                prev_node = null;

                if (stories[i].length > temp_tree.maxdepth){
                    temp_tree.maxdepth = stories[i].length - 1;
                };

                for (var j = 0; j < stories[i].length; j++){
                    var new_node = new this.storyNode(stories[i][j], stories[i][j].flatten(), j);

                    //Build the Temporal Story Tree
                    if (!temp_tree.existsNodeAtPosition(new_node.plainText, j)){
                        temp_tree.nodes.push(new_node);

                        if (prev_node === null){
                            temp_tree.linkNodesPosition(temp_tree.root_node, new_node, i);
                        }
                    };

                    //Link the nodes
                    if (!(prev_node === null)){
                        temp_tree.linkNodesPosition(prev_node, new_node, i);
                    };

                    prev_node = new_node;
                };
            };

            this.renderStoryGraph(temp_tree, i);
            
        },
        
        consoleLogEdges: function(s_tree){
            for (var link in s_tree.edges){
                console.log(s_tree.edges[link]);
                console.log(s_tree.nodes[s_tree.edges[link].source].plainText + " " + s_tree.nodes[s_tree.edges[link].target].plainText);
            };
        },

        /*Render a given story tree (DAG) here we do
        some D3 magic!*/        
        renderStoryGraph: function(s_tree, total_traces){

            //Get an array of colours for each edge
            var colours = [];

            for (var i = 0; i < total_traces; i++){
                colours.push(this.getRandomColor());
            }

            var width = 1500;
            var height = 1000;
            var animationStep = 400;
            var offset = 20;
            var margin = 400;

            var x_inc = (width - margin) / (s_tree.maxdepth - 1);
            
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

            var nodes = s_tree.nodes;
            var links = s_tree.edges;

            console.log(nodes);
            console.log(links);
            
            nodes[0].fixed = true;
            nodes[0].x = 20;
            nodes[0].y = height/2;

            /*var force = d3.layout.force()
                .size([width, height])
                .nodes(nodes)
                .links(links);*/

            var force = d3.layout.force()
                .size([width, height])
                .nodes(nodes)
                .links(links);

            //force.charge(-500);
            //force.linkStrength(0.1);
            //force.linkDistance(width/5);
            
            var poswidth = [];

            //for (var i = 0; i < 11; i++){
            //   poswidth.push(0);
            //};

            var addwidth = function(width, position){
                if (position > -1){

                    while (poswidth.length - 1 < position){
                        poswidth.push(0);
                    }

                    if (poswidth[position] < width){
                        poswidth[position] = width;
                    }
                }
            };

            var node = svg.selectAll('.node')
                .data(nodes)
                .enter().append('text')
                .attr('class', 'node')
                .text( function(d) { return d.plainText })
                .attr('x', function(d) {
                    addwidth(this.getBBox().width, d.position);
                    return 0;
                });

            for (var i = 0; i < node.length; i++){
                console.log(node[i]);
                node.x = 20;
            };

            console.log(node);
            /*var node = svg.selectAll('.node')
                .data(nodes)
                .enter().attr('x', function(d) {
                    return 5;
                });*/

            /*var node = svg.selectAll('.node')
                .data(nodes)
                .enter().append('text')
                .attr('class', 'node')
                .text( function(d) { return d.plainText })
                .attr('x', function(d) { 
                    
                    addwidth(this.getBBox().width, d.position)
                    if (d.position > 0){
                        //console.log(d.position + " " + poswidth[d.position-1])
                        return poswidth[d.position-1] + offset;
                    } else if (d.position === 0){
                        return offset;
                    } else {
                        return 0;
                    };
                });*/

            console.log(poswidth);
            /*
                .link {
                stroke: #777;
                stroke-width: 2px;
                }
            */

            var link = svg.selectAll('.link')
                .data(links)
                .enter().append('line')
                .attr('class', 'link')
                .attr('stroke-width', '2px')                
                .attr('marker-end', "url(#triangle)")
                .attr('stroke', function(d) {return colours[d.trace_number];})
                .attr('x1', function(d) {return (nodes[d.source].position * x_inc) + offset;})
                .attr('x2', function(d) {return (nodes[d.target].position * x_inc) + offset;});
            
            /*var link = svg.selectAll('.link')
                .data(links)
                .enter().append('text')
                .attr('class', 'link')
                .text('ben');*/
            /*
            var node = svg.selectAll('.node')
                .data(nodes)
                .enter().append('circle')
                .attr('class', 'node')
                .attr('r', 5);*/

            force.on('tick', function(){

                node.transition().ease('linear').duration(animationStep)
                    //.attr('x', function(d) { return d.x; })
                    .attr('y', function(d) { return d.y; });

                link.transition().ease('linear').duration(animationStep)
                    //.attr('x1', function(d) { return d.source.x; })
                    .attr('y1', function(d) { return d.source.y; })
                    //.attr('x2', function(d) { return d.target.x; })
                    .attr('y2', function(d) { return d.target.y; });


            });
            
            /*
            force.on('end', function(){
                node.attr('r', 5)
                    .attr('cx', function(d) { return d.x; })
                    .attr('cy', function(d) { return d.y; });

                link.attr('x1', function(d) { return d.source.x; })
                    .attr('y1', function(d) { return d.source.y; })
                    .attr('x2', function(d) { return d.target.x; })
                    .attr('y2', function(d) { return d.target.y; });
            });*/

            force.start();

        },

        arrayContainsValue: function(array, value){
            for (var i = 0; i < array.length; i++){
                if (array[i] === value){
                    return true;
                }
            }
            return false;
        },

        splitTraceIntoPlainTextArray: function(node){
            for (var i = 0; i < node.children.length; i++) {
                if (node.children[i].type === "plainText"){
                    if (node.children[i].flatten().length > 1){
                        this.current_story.push(node.children[i]);
                    }
                } else {
                    this.splitTraceIntoPlainTextArray(node.children[i]);
                };
            };
        },

        //Rotate a point by an angle
		rotatePoint : function(x,y,angle,c_x,c_y){

            var s = Math.sin(angle * (Math.PI/180));
            var c = Math.cos(angle * (Math.PI/180));
            
            x -= c_x;
            y -= c_y;

            var x_rot = (x * c) - (y * s);
            var y_rot = (x * s) + (y * c);

            x = c_x + x_rot;
            y = c_y + y_rot;

            return [x, y];
    	},

        //http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
        getRandomColor : function(){
            var letters = '6789ABC'.split('');
            var color = '#';
            for (var i = 0; i < 6; i++ ) {
                color += letters[Math.floor(Math.random() * 7)];
            }
            return color;
        },

	};
    
}();