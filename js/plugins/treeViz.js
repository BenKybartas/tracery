/*
	Tree Vizualizer

	Author: Ben Kybartas

*/
var treeViz = function() {

	return {

        current_story: [],

        /*============== Story Tree  ==============*/
        storyTree: function(nodes, edges){
            this.nodes = nodes;
            this.edges = edges;
            this.maxdepth = 0;
            this.roots = [];

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

            this.linkNodesPosition = function(from_node, to_node){

                var from = this.getNodeAtPosition(from_node.plainText, from_node.position);
                var to = this.getNodeAtPosition(to_node.plainText, to_node.position);
                
                this.nodes[from].children.push(to);
                this.nodes[to].parents.push(from);

                this.edges.push({source: from, target: to});
            };

            //We have a special link nodes function to make sure we are ref.
            //a node that is actually stored
            this.linkNodes = function(from_node, to_node){

                var from = this.getNodePosition(from_node.plainText);
                var to = this.getNodePosition(to_node.plainText);

                from_node.children.push(to);
                to_node.parents.push(from);

                this.edges.push({source: from, target: to});
            };
        },

        storyNode: function(node, plainText, position){
            this.node = node;
            this.plainText = plainText;
            this.position = position;
            this.parents = [];
            this.children = [];
        },

        storyEdge: function(from_node, to_node){
            this.from_node = from_node;
            this.to_node = to_node;
        },

        /*===========================================*/

        generateTree: function(traces){

            //basic array to hold stories, these are traces reduced to only plainText Nodes
            var stories = [];

            //our Temporal StoryTree (a directed acyclic graph technically)
            var temp_tree = new this.storyTree([], []);
            
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
                    temp_tree.maxdepth = stories[i].length;
                };

                for (var j = 0; j < stories[i].length; j++){
                    var new_node = new this.storyNode(stories[i][j], stories[i][j].flatten(), j);

                    //Build the Temporal Story Tree
                    if (!temp_tree.existsNodeAtPosition(new_node.plainText, j)){
                        temp_tree.nodes.push(new_node);

                        if (prev_node === null){
                            temp_tree.roots.push(temp_tree.nodes.length - 1);
                        };
                    }

                    //Link the nodes
                    if (!(prev_node === null)){
                        temp_tree.linkNodesPosition(prev_node, new_node);
                    };
                    //Set previous node to new node
                    prev_node = new_node;
                }
            };
            
            //this.consoleLogEdges(temp_tree);
            //this.renderTree(temp_tree, "#tree");
            this.renderFixedTree(temp_tree);
        },
        
        consoleLogEdges: function(s_tree){
            for (var link in s_tree.edges){
                console.log(s_tree.edges[link]);
                console.log(s_tree.nodes[s_tree.edges[link].source].plainText + " " + s_tree.nodes[s_tree.edges[link].target].plainText);
            };
        },

        /*Render a given story tree using our own
        algorithm (WIP)*/
        renderFixedTree: function(s_tree){
            
            var width = 1500;
            var height = 1000;
            var offset = 20;
            var startTextSize = 50;

            //Just slap an svg onto the body (TODO make this nice)
            var svg = d3.select('body').append('svg')
                .attr('width', width)
                .attr('height', height);

            var y_loc = 0;
            var x_loc = 20;
            
            var int_in_array = function(_array, _int){
                for (var i = 0; i < _array.length; i++){
                    if (_array[i] === _int){
                        return true;
                    };
                };
                return false;
            };

            var get_and_render_children = function(node, y_min, y_max, x_pos){
                
                var next_nodes = [];
                var y_inc = (y_max - y_min) / (node.children.length + 1);

                var grouping = {};
                
                /*Group our children for improved rendering*/
                for (var i = 0; i < node.children.length; i++) {
                    
                    var child_node = s_tree.nodes[node.children[i]];

                    for (var j = 0; j < child_node.children.length; j++){
                        if (!grouping.hasOwnProperty("_" + child_node.children[j])){
                            grouping["_" + child_node.children[j]] = [i];
                        } else {
                            grouping["_" + child_node.children[j]].push(i);
                        };
                    };
                };

                /*Now render the children in groups based on their children*/
                for (var group in grouping){
                    for (var group_id in grouping[group]){

                        var child_node = s_tree.nodes[node.children[grouping[group][group_id]]];
                        y_min += y_inc;

                        svg.append('text')
                            .attr("class", child_node.node.parent.symbol)
                            .attr("x", x_pos)
                            .attr("y", y_min)
                            .attr("font-family", "serif")
                            .attr("font-size", startTextSize/node.children.length)
                            .attr("fill", "black")
                            .text(child_node.plainText);

                        var x_diff = 0;

                        svg.selectAll("text").each(function() {
                            x_diff = this.getBBox().width;
                        });                        

                    };
                };
            };

            /*Set up root nodes*/
            for (var i in s_tree.roots){
                
                y_loc += height/(s_tree.roots.length + 1);

                svg.append('text')
                    .attr("class", s_tree.nodes[s_tree.roots[i]].node.parent.symbol)
                    .attr("x", x_loc)
                    .attr("y", y_loc)
                    .attr("font-family", "serif")
                    .attr("font-size", startTextSize)
                    .attr("fill", "black")
                    .text(s_tree.nodes[s_tree.roots[i]].plainText);

                var last_width = 0;
                var last_height = 0;

                svg.selectAll("text").each(function() {
                    last_width = this.getBBox().width;
                    last_height = this.getBBox().height;
                });

                get_and_render_children(s_tree.nodes[s_tree.roots[i]], 0, height, x_loc + last_width);
            };

        },

        /*Render a given story tree (DAG) here we do
        some D3 magic!*/        
        renderTree: function(s_tree, element){

            var width = 1500;
            var height = 1000;
            var animationStep = 400;
            var offset = 20;
            var margin = 200;

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

            force.charge(-500);
            force.linkStrength(0.1);
            force.linkDistance(width/5);
            
            var node = svg.selectAll('.node')
                .data(nodes)
                .enter().append('text')
                .attr('class', 'node')
                .text( function(d) { return d.plainText })
                .attr('x', function(d) { return (d.position * x_inc) + offset});

            var link = svg.selectAll('.link')
                .data(links)
                .enter().append('line')
                .attr('class', 'link')
                .attr('marker-end', "url(#triangle)")
                .attr('x1', function(d) {return (nodes[d.source].position * x_inc) + offset;})
                .attr('x2', function(d) {return (nodes[d.target].position * x_inc) + offset;});

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


        /*
        x_loc = 10;
        var y_loc = parseInt(tree.style("height"), 10) / 2;

        //tree.append("text")
        //    .attr("x", x_loc)
        //    .attr("y", y_loc)
        //    .text(story);

        retrieve(traces[i].root);
        treeViz.generateTree([story_pieces]);

        for (var piece in story_pieces){

            var rot_angle = Math.random() * 20 - 10;
            var colour = treeViz.getRandomColor();

            tree.append("text")
                .attr("class", "piece")
                .attr("id", story_pieces[piece])
                .attr("x", x_loc)
                .attr("y", y_loc)
                .attr("transform", "rotate(" + rot_angle + "," + x_loc + "," + y_loc + ")")
                .attr("font-family", "serif")
                .attr("font-size", "20px")
                .attr("fill", colour)
                .text(story_pieces[piece]);

            var last_width = 0;
            var last_height = 0;
            var last_x = x_loc;
            var last_y = y_loc;

            tree.selectAll(".piece").each(function() {
                last_width = this.getBBox().width;
                last_height = this.getBBox().height;
            });   

            var new_loc = treeViz.rotatePoint(x_loc + last_width, y_loc, rot_angle, x_loc, y_loc);

            /*tree.append("circle")
                .attr("cx", x_loc)
                .attr("cy", y_loc)
                .attr("r", 2);

            tree.append("circle")
                .attr("cx", new_loc[0])
                .attr("cy", new_loc[1])
                .attr("r", 2);

             
            //x_loc += last_width + 5;
            x_loc = new_loc[0] + 5;
            y_loc = new_loc[1];
            
        }*/