/*
	Vizualization of a number of stories as a cloud of text, read left to right

	Author: Ben Kybartas

*/
var storyCloud = function() {

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

        generateCloud: function(traces){

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
                            temp_tree.linkNodesPosition(temp_tree.root_node, new_node);
                        }
                    };

                    //Link the nodes
                    if (!(prev_node === null)){
                        temp_tree.linkNodesPosition(prev_node, new_node);
                    };

                    prev_node = new_node;
                };
            };
            console.log(temp_tree);
            this.renderStoryCloud(temp_tree);
            
        },
        
        consoleLogEdges: function(s_tree){
            for (var link in s_tree.edges){
                console.log(s_tree.edges[link]);
                console.log(s_tree.nodes[s_tree.edges[link].source].plainText + " " + s_tree.nodes[s_tree.edges[link].target].plainText);
            };
        },

        /* Render a given story tree using our
        story cloud algorithm */
        renderStoryCloud: function(s_tree){
            
            var width = 1500;
            var height = 500;
            var offset = 5;
            var minTextSize = 20;

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

            var get_nodes_at_position = function(position){

                var nodes = [];
                
                for (var i in s_tree.nodes){
                    if (s_tree.nodes[i].position === position){
                        nodes.push(s_tree.nodes[i]);
                    };
                };

                return nodes;
            };

            /*Get the max breadth*/
            var max_breadth = 0;
            for (var i = 0; i < s_tree.maxdepth + 1; i++){
                var breadth_pos = get_nodes_at_position(i).length;
                if ( breadth_pos > max_breadth){
                    max_breadth = breadth_pos;
                }
            };

            //Set our default text based on the max breadth
            var max_text_size = minTextSize * max_breadth;
            var x_pos = offset;
            var y_pos = height/2;
            
            var furthest_x = 0;
            /*Now render*/
            for (var i = 0; i < s_tree.maxdepth + 1; i++){

                var nodes = get_nodes_at_position(i);
                var cur_breadth = nodes.length;

                var cur_y = y_pos;
                var max_x = 0;

                for (var j in nodes){

                    var new_text = svg.append('text')
                        .attr("class", nodes[j].node.parent.symbol)
                        .attr("x", x_pos)
                        .attr("y", cur_y)
                        .attr("font-family", "serif")
                        .attr("font-size", max_text_size/cur_breadth)
                        //.attr("fill", "black")
                        .text(nodes[j].plainText);

                    var x_diff = 0;
                    var y_diff = 0;

                    new_text.each(function(){
                        x_diff = this.getBBox().width;
                        y_diff = this.getBBox().height;
                    });

                    if (x_diff > max_x){
                        max_x = x_diff;
                    };

                    if (x_diff + x_pos > furthest_x){
                        furthest_x = x_diff + x_pos;
                    }
                    cur_y -= y_diff;

                };

                x_pos = x_pos + max_x + offset;

            };

            //Resize the svg (a bit hacky right now)
            var new_x = 0;
            new_text.each(function(){
                new_x = parseInt(new_text.attr('x')) + this.getBBox().width;
            });

            svg.attr('width', furthest_x);
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
            var get_and_render_children = function(node, y_min, y_max, x_pos, fontsize){
                var next_nodes = [];
                var y_inc = (y_max - y_min) / (node.children.length + 1);
                var y_box_inc = (y_max - y_min) / node.children.length;
                
                var y_min_diff = y_min;

                for (var i = 0; i < node.children.length; i++){
                    
                    var child_node = s_tree.nodes[node.children[i]];
                    
                    
                    //var font_size = fontsize / node.children.length;
                    y_min += y_inc;
                    
                    var new_text = svg.append('text')
                        .attr("class", child_node.node.parent.symbol)
                        .attr("x", x_pos)
                        .attr("y", y_min)
                        .attr("font-family", "serif")
                        .attr("font-size", fontsize)
                        .attr("fill", "black")
                        .text(child_node.plainText);

                    //var x_diff = new_text.getBBox().width;
                    //new_text.attr("font-size", 20);

                    var x_diff = 0;

                    new_text.each(function(){
                        x_diff = this.getBBox().width;
                    });

                    var y_max_diff = y_min_diff + y_box_inc;
                    //console.log(y_max_diff);
                    get_and_render_children(child_node, y_min_diff, y_max_diff, x_pos + x_diff + offset, fontsize);

                    y_min_diff = y_max_diff;
                }

            };

            //get_and_render_children(s_tree.root_node, 0, height, offset, startTextSize);
            */